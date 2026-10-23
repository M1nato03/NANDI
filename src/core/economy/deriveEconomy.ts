import { RULES, RULES_HISTORY, rulesFor, type RulesHistoryEntry } from '../rules.config';
import { calculateTasksDayXp, replayFactShards, replayFactXp } from './awards';
import type { LedgerRow, SettingRow } from '../../data/types';
import { isPlannedDone } from './planned';

const MS_DAY = 86_400_000;
const atUtc = (key: string) => Date.parse(`${key}T12:00:00Z`);
export const addEconomyDays = (key: string, count: number): string => new Date(atUtc(key) + count * MS_DAY).toISOString().slice(0, 10);
export const weekStart = (key: string): string => addEconomyDays(key, -((new Date(atUtc(key)).getUTCDay() + 6) % 7));
export const firstMonday = (year: number, month: number): string => {
  const first = new Date(Date.UTC(year, month - 1, 1));
  return addEconomyDays(first.toISOString().slice(0, 10), (8 - first.getUTCDay()) % 7);
};
export function seasonFor(day: string): { index: number; start: string; end: string; days: number } {
  const year = Number(day.slice(0, 4)), month = Number(day.slice(5, 7));
  let start = firstMonday(year, month);
  let cursor = new Date(Date.UTC(year, month - 1, 1));
  if (day < start) { cursor = new Date(Date.UTC(year, month - 2, 1)); start = firstMonday(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1); }
  const next = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  const nextStart = firstMonday(next.getUTCFullYear(), next.getUTCMonth() + 1);
  return { index: (cursor.getUTCFullYear() - 2026) * 12 + cursor.getUTCMonth() - 10, start, end: addEconomyDays(nextStart, -1), days: Math.round((atUtc(nextStart) - atUtc(start)) / MS_DAY) };
}
/** Season 1 is index zero. The story owner can map index % 4 to an Arc. */
export function seasonIndex(day: string): number { return Math.max(0, seasonFor(day).index); }

export interface EconomyDay {
  dayKey: string; tasks: number; train: number; mind: number; weekly: number; quests: number;
  hatTrick: boolean; lightsOut: number; focus: number; total: number; mark: boolean; body: boolean; mindSlot: boolean;
  /** Spec 15: XP from a soft day's gentle thing, and the fixed gift on the first marked day after a miss. */
  soft: number; welcome: number;
  /** XP kept from the day's close: a later replay may not show less than the day once closed with. */
  held: number;
}
/** A purchase the shop accepted, kept in the close so a restore can never keep the item and lose the spend. */
export interface ClosePurchase { id: string; itemId: string; price: number; dayKey: string }
/**
 * What a finished day showed (economy second opinions 22 and 25). Closes are high-water marks: every reconcile
 * raises them to what the replay now shows, never lowers them, and the replay never shows less than them.
 */
export interface DayClose { total: number; sp: number; streak: number; paused: boolean; shards: number; owned: string[]; purchases: ClosePurchase[] }
export const CLOSE_PREFIX = 'economy.close:';
export const closeKey = (day: string) => `${CLOSE_PREFIX}${day}`;
function num(input: unknown): number { return typeof input === 'number' && Number.isFinite(input) ? input : 0; }
const isDay = (key: string) => /^\d{4}-\d{2}-\d{2}$/.test(key);
function asClose(raw: unknown): DayClose | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const value = raw as Record<string, unknown>;
  const purchases = Array.isArray(value.purchases) ? value.purchases.flatMap(item => {
    const row = (item ?? {}) as Record<string, unknown>;
    return typeof row.id === 'string' && typeof row.itemId === 'string' && typeof row.dayKey === 'string' && isDay(row.dayKey) && num(row.price) > 0
      ? [{ id: row.id, itemId: row.itemId, price: num(row.price), dayKey: row.dayKey }] : [];
  }) : [];
  return { total: num(value.total), sp: num(value.sp), streak: num(value.streak), paused: value.paused === true, shards: num(value.shards),
    owned: Array.isArray(value.owned) ? value.owned.filter((id): id is string => typeof id === 'string') : [], purchases };
}
/** Two closes for one day (an earlier one and a new one, or this phone's and a backup's) keep the higher of each. */
export function mergeClose(a: unknown, b: unknown): DayClose | undefined {
  const x = asClose(a), y = asClose(b);
  if (!x || !y) return x ?? y;
  const onlyIn = (a: DayClose, b: DayClose) => a.purchases.filter(item => !b.purchases.some(other => other.id === item.id));
  const cost = (items: ClosePurchase[]) => items.reduce((sum, item) => sum + item.price, 0);
  const purchases = [...x.purchases.map(item => {
    const other = y.purchases.find(entry => entry.id === item.id);
    return other && other.price > item.price ? other : item;
  }), ...onlyIn(y, x)];
  // The merged close knows every purchase from both, so each balance first pays for the ones only the other knew;
  // otherwise a late purchase's spend would vanish under the older, higher balance (second opinion 26).
  const shards = Math.max(x.shards - cost(onlyIn(y, x)), y.shards - cost(onlyIn(x, y)), 0);
  return { total: Math.max(x.total, y.total), sp: Math.max(x.sp, y.sp), streak: Math.max(x.streak, y.streak),
    paused: x.streak === y.streak ? x.paused && y.paused : (x.streak > y.streak ? x.paused : y.paused),
    shards, owned: [...new Set([...x.owned, ...y.owned])], purchases };
}
/** A side quest you wrote yourself (its row id has no week suffix; newer facts also say so). */
export const isCustomQuestFact = (fact: LedgerRow) => fact.inputs.custom === true || (fact.inputs.custom !== false && !String(fact.refId).includes(':'));
const dayOrder = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
/** One purchase pool for a set of closes: each id once, at the higher price if two closes disagree (bad data only). */
function purchasePool(closes: Iterable<DayClose>): Map<string, ClosePurchase> {
  const pool = new Map<string, ClosePurchase>();
  for (const close of closes) for (const item of close.purchases) if (!(item.price <= (pool.get(item.id)?.price ?? 0))) pool.set(item.id, item);
  return pool;
}
/** Each purchase lives in the close of the earliest closed day on or after its own day. */
function hostPurchases(pool: ReadonlyMap<string, ClosePurchase>, days: readonly string[]): Map<string, ClosePurchase[]> {
  const hosted = new Map<string, ClosePurchase[]>(days.map(day => [day, []]));
  const items = [...pool.values()].sort((a, b) => dayOrder(a.dayKey, b.dayKey) || dayOrder(a.id, b.id));
  let at = 0;
  for (const item of items) {
    while (at < days.length && days[at]! < item.dayKey) at++;
    if (at < days.length) hosted.get(days[at]!)!.push(item);
  }
  return hosted;
}
/**
 * Closes store only the purchases of their own day (economy review 32: a close that kept every purchase to date
 * made closes grow to megabytes and reconcile quadratic). What a close "knew" is the union of its own and every
 * earlier close's purchases. Closes written in the older, cumulative shape read the same way.
 */
export function normalizeCloses(closes: ReadonlyMap<string, DayClose>): Map<string, DayClose> {
  const days = [...closes.keys()].sort(dayOrder);
  const pool = purchasePool(closes.values());
  const hosted = hostPurchases(pool, days);
  // A close knows every purchase hosted on or before its day. If it never listed one of them (only possible
  // in older or merged data), its balance pays for it here, so what a close knows and what it paid always agree.
  const listed = new Set<string>(), unlisted = new Map<string, number>();
  const out = new Map<string, DayClose>();
  for (const day of days) {
    const close = closes.get(day)!;
    for (const item of hosted.get(day)!) if (!listed.has(item.id)) unlisted.set(item.id, item.price);
    for (const item of close.purchases) { listed.add(item.id); unlisted.delete(item.id); }
    const unpaid = [...unlisted.values()].reduce((sum, price) => sum + price, 0);
    out.set(day, { ...close, shards: Math.max(0, close.shards - unpaid), purchases: hosted.get(day)! });
  }
  return out;
}
/**
 * Two sets of closes (this phone's and a backup's, or the stored ones and a fresh replay's) keep the higher of
 * each number per day. A balance first pays for every purchase the other side knew by that day and it did not,
 * so a late purchase is never lost under an older, higher balance (second opinions 26, 32).
 */
export function mergeCloseMaps(a: ReadonlyMap<string, unknown>, b: ReadonlyMap<string, unknown>): Map<string, DayClose> {
  const read = (source: ReadonlyMap<string, unknown>) => normalizeCloses(new Map([...source].flatMap(([day, raw]) => { const close = asClose(raw); return close ? [[day, close] as const] : []; })));
  const x = read(a), y = read(b);
  const days = [...new Set([...x.keys(), ...y.keys()])].sort(dayOrder);
  const pool = purchasePool([...x.values(), ...y.values()]);
  const hosted = hostPurchases(pool, days);
  // After normalising, a side knows by day D exactly its purchases dated on or before D; the merged close knows
  // every purchase of either side dated on or before D, and each balance pays for the ones it did not know.
  const knownX = new Set<string>(), knownY = new Set<string>(), knownAll = new Set<string>();
  const unpaid = (mine: Set<string>) => [...knownAll].filter(id => !mine.has(id)).reduce((sum, id) => sum + (pool.get(id)?.price ?? 0), 0);
  const out = new Map<string, DayClose>();
  for (const day of days) {
    const cx = x.get(day), cy = y.get(day);
    for (const item of cx?.purchases ?? []) knownX.add(item.id);
    for (const item of cy?.purchases ?? []) knownY.add(item.id);
    for (const item of hosted.get(day)!) knownAll.add(item.id);
    const shards = Math.max(cx ? cx.shards - unpaid(knownX) : 0, cy ? cy.shards - unpaid(knownY) : 0, 0);
    const both = [cx, cy].filter((close): close is DayClose => !!close);
    const streak = Math.max(...both.map(close => close.streak));
    const top = both.filter(close => close.streak === streak);
    out.set(day, { total: Math.max(...both.map(close => close.total)), sp: Math.max(...both.map(close => close.sp)), streak,
      paused: top.every(close => close.paused), shards, owned: [...new Set(both.flatMap(close => close.owned))], purchases: hosted.get(day)! });
  }
  return out;
}
/**
 * reconcileGamify's window: a day older than `oldest` that was never closed stays unclosed, and its purchases
 * move to the next kept day, so no purchase ever leaves the closes (Codex pass 4, item 2).
 */
export function keptCandidates(candidates: ReadonlyMap<string, DayClose>, stored: ReadonlyMap<string, unknown>, oldest: string): Map<string, DayClose> {
  const kept = new Map([...candidates].filter(([day]) => day >= oldest || stored.has(day)));
  const keptDays = [...kept.keys()].sort(dayOrder);
  for (const [day, close] of candidates) {
    if (kept.has(day)) continue;
    for (const item of close.purchases) {
      const host = keptDays.find(candidate => candidate >= item.dayKey);
      if (host) kept.set(host, { ...kept.get(host)!, purchases: [...kept.get(host)!.purchases, item] });
    }
  }
  return kept;
}
function readCloses(settings: readonly SettingRow[] | Record<string, unknown>, today: string): Map<string, DayClose> {
  const rows: [string, unknown][] = Array.isArray(settings)
    ? (settings as SettingRow[]).filter(row => !row.deleted && row.key.startsWith(CLOSE_PREFIX)).map(row => [row.key, row.value])
    : Object.entries(settings as Record<string, unknown>).filter(([key]) => key.startsWith(CLOSE_PREFIX));
  const closes = new Map<string, DayClose>();
  for (const [key, raw] of rows) {
    const day = key.slice(CLOSE_PREFIX.length);
    // A close dated today or later came from a clock set ahead: that day has not ended yet.
    const close = asClose(raw);
    if (isDay(day) && day < today && close) closes.set(day, close);
  }
  return normalizeCloses(closes);
}
export interface EconomyView {
  days: EconomyDay[]; totalXp: number; level: number; nextLevelXp: number;
  season: { index: number; start: string; end: string; active: boolean; sp: number; target: number; rank: number; tier: string; seed: number; nextSeed: number; placesThisWeek: number };
  streak: { days: number; restDays: number; restDaysUsed: number; restUsedYesterday: boolean; paused: boolean; gold: boolean; restored: boolean; canRepair: boolean };
  cleanWeek: { count: number; days: boolean[]; complete: boolean; streak: number };
  shards: number; owned: string[];
}
const value = (settings: readonly SettingRow[] | Record<string, unknown>, key: string): unknown => Array.isArray(settings)
  ? (settings as SettingRow[]).find(row => row.key === key && !row.deleted)?.value
  : (settings as Record<string, unknown>)[key];
const valid = (fact: LedgerRow) => !fact.deleted && /^\d{4}-\d{2}-\d{2}$/.test(fact.dayKey);
const beforeBed = (fact: LedgerRow) => fact.inputs.afterBedtime !== true && fact.inputs.beforeBedtime !== false;
const tierFor = (rank: number) => RULES.season.tiers.find(([, low, high]) => rank >= low && rank <= high)?.[0] ?? 'Bench';
const xpToReach = (level: number, stepBase: number) => stepBase * level * (level - 1) / 2;
const purchasePrices: Record<string, number> = {
  freeze: RULES.shards.prices.freeze,
  'cardback:weave': 100, 'cardback:orbit': 150, 'cardback:steps': 150,
  'banner:dawn': 100, 'banner:grove': 150, 'banner:sky': 150,
  'puzzle:paths': 150, 'puzzle:patterns': 250, 'sound:soft': 300,
  'theme:linen': 400, 'theme:lagoon': 800,
};

interface DaySnapshot { streak: number; paused: boolean; earned: number; balance: number; owned: string[]; purchases: ClosePurchase[] }
interface Replay { view: EconomyView; daily: Map<string, DaySnapshot>; accepted: ClosePurchase[] }

/** Purchases kept in closes join the ledger (a restore may have dropped them) and count as accepted once. */
function withClosedPurchases(facts: readonly LedgerRow[], closes: ReadonlyMap<string, DayClose>): LedgerRow[] {
  const kept = new Map<string, ClosePurchase>();
  for (const close of closes.values()) for (const item of close.purchases) if (!(item.price <= (kept.get(item.id)?.price ?? 0))) kept.set(item.id, item);
  if (!kept.size) return [...facts];
  const present = new Set<string>();
  const out = facts.map(fact => {
    if (!kept.has(fact.id) || fact.deleted) return fact;
    present.add(fact.id);
    return { ...fact, inputs: { ...fact.inputs, price: Math.max(num(fact.inputs.price), kept.get(fact.id)!.price), accepted: true } };
  });
  for (const item of kept.values()) if (!present.has(item.id)) out.push({ id: item.id, mode: 'economy', kind: 'purchase', refId: item.id,
    dayKey: item.dayKey, inputs: { itemId: item.itemId, price: item.price, accepted: true }, updatedAt: 0, deleted: 0, deviceId: 'close' });
  return out;
}

/**
 * Shards never below a close's balance, plus what was earned since, minus every spend that close did not know.
 * For a close on day D and a later day U that is earned(U) - spent(<= U) + [shards(D) - earned(D) + known spend(D)],
 * so one pass over the days keeps the best bracket so far (economy review 32: this was closes x days).
 */
function shardFloors(closes: ReadonlyMap<string, DayClose>, replay: Replay, days: readonly string[]): Map<string, number> {
  const closeDays = [...closes.keys()].sort(dayOrder);
  const price = new Map(replay.accepted.map(item => [item.id, item.price]));
  const spends = [...replay.accepted].sort((a, b) => dayOrder(a.dayKey, b.dayKey));
  const known = new Set<string>();
  let atClose = 0, atSpend = 0, spent = 0, knownSpent = 0, best = -Infinity;
  const out = new Map<string, number>();
  for (const day of [...days].sort(dayOrder)) {
    while (atClose < closeDays.length && closeDays[atClose]! < day) {
      const closeDay = closeDays[atClose++]!, close = closes.get(closeDay)!;
      for (const item of close.purchases) if (!known.has(item.id)) { known.add(item.id); knownSpent += price.get(item.id) ?? 0; }
      const earnedThen = replay.daily.get(closeDay)?.earned;
      if (earnedThen !== undefined) best = Math.max(best, close.shards - earnedThen + knownSpent);
    }
    while (atSpend < spends.length && spends[atSpend]!.dayKey <= day) spent += spends[atSpend++]!.price;
    const earnedAt = replay.daily.get(day)?.earned;
    out.set(day, earnedAt === undefined || best === -Infinity ? 0 : Math.max(0, earnedAt - spent + best));
  }
  return out;
}

function replayWithCloses(facts: readonly LedgerRow[], history: readonly RulesHistoryEntry[], settings: readonly SettingRow[] | Record<string, unknown>, today: string): { replay: Replay; closes: Map<string, DayClose> } {
  const closes = readCloses(settings, today);
  return { replay: replayEconomy(withClosedPurchases(facts, closes), history, settings, today, closes), closes };
}

/**
 * The economy as the ledger replays it, never below what a finished day showed. Each finished day keeps its
 * numbers in settings `economy.close:<day>` (reconcileGamify raises them, never lowers them), so a later sync,
 * import, restore, setting change or rule fix can raise a past day but never lower it.
 */
export function deriveEconomy(
  facts: readonly LedgerRow[], history: readonly RulesHistoryEntry[] = RULES_HISTORY,
  settings: readonly SettingRow[] | Record<string, unknown> = [], today: string,
): EconomyView {
  const view = withPeak(viewUpTo(facts, history, settings, today), settings, history, today);
  // A phone clock that ran ahead and was set back leaves facts dated after today. Days, streak, quests and
  // Hat-tricks stay on the real today, but the totals also count those facts, so XP and level never drop
  // (cj2 test gaps 3.5). The look-ahead stops at 120 days, so a stray far-future fact costs little.
  const latest = facts.reduce((max, fact) => !fact.deleted && fact.dayKey > max ? fact.dayKey : max, today);
  if (latest <= today) return view;
  const ahead = viewUpTo(facts, history, settings, latest <= addEconomyDays(today, 120) ? latest : addEconomyDays(today, 120));
  const top = ahead.totalXp > view.totalXp ? ahead : view;
  // Shards shown and spendable come from the look-ahead alone: it also charges purchases dated ahead, so the
  // same Shards can never buy twice (item 38). Owned items keep both.
  return { ...view, totalXp: top.totalXp, level: Math.max(view.level, ahead.level), nextLevelXp: top.nextLevelXp,
    shards: ahead.shards, owned: [...new Set([...view.owned, ...ahead.owned])] };
}

/** The highest XP and level this phone has shown (written by reconcile); a floor for anything a replay cannot see. */
export const PEAK_KEY = 'economy.peak';
export function readPeak(settings: readonly SettingRow[] | Record<string, unknown>): { totalXp: number; level: number } {
  const stored = value(settings, PEAK_KEY);
  const peak = stored && typeof stored === 'object' ? stored as { totalXp?: unknown; level?: unknown } : {};
  return { totalXp: typeof peak.totalXp === 'number' && Number.isFinite(peak.totalXp) ? peak.totalXp : 0, level: typeof peak.level === 'number' && Number.isFinite(peak.level) ? peak.level : 1 };
}
function withPeak(view: EconomyView, settings: readonly SettingRow[] | Record<string, unknown>, history: readonly RulesHistoryEntry[], today: string): EconomyView {
  const peak = readPeak(settings);
  if (peak.totalXp <= view.totalXp && peak.level <= view.level) return view;
  const level = Math.max(view.level, peak.level);
  return { ...view, totalXp: Math.max(view.totalXp, peak.totalXp), level, nextLevelXp: level > view.level ? xpToReach(level + 1, (rulesFor(today, history)?.rules ?? RULES).level.stepBase) : view.nextLevelXp };
}

function viewUpTo(facts: readonly LedgerRow[], history: readonly RulesHistoryEntry[], settings: readonly SettingRow[] | Record<string, unknown>, end: string): EconomyView {
  const { replay, closes } = replayWithCloses(facts, history, settings, end);
  if (!closes.size) return replay.view;
  const owned = [...new Set([...replay.view.owned, ...[...closes.values()].flatMap(close => close.owned)])];
  return { ...replay.view, shards: Math.max(replay.view.shards, shardFloors(closes, replay, [end]).get(end) ?? 0), owned };
}

/** What each finished day (before `today`) shows now, in one replay: the candidates reconcileGamify merges into the closes. */
export function closesFor(facts: readonly LedgerRow[], settings: readonly SettingRow[] | Record<string, unknown>, today: string, history: readonly RulesHistoryEntry[] = RULES_HISTORY): Map<string, DayClose> {
  const { replay, closes } = replayWithCloses(facts, history, settings, today);
  const out = new Map<string, DayClose>();
  const finished = replay.view.days.filter(day => day.dayKey < today);
  const floors = shardFloors(closes, replay, finished.map(day => day.dayKey));
  const closeDays = [...closes.keys()].sort(dayOrder);
  const ownedBefore = new Set<string>();
  let atClose = 0;
  for (const day of finished) {
    while (atClose < closeDays.length && closeDays[atClose]! <= day.dayKey) for (const id of closes.get(closeDays[atClose++]!)!.owned) ownedBefore.add(id);
    const snap = replay.daily.get(day.dayKey)!;
    const sp = Math.max(0, Math.min(day.total - day.held - day.soft - day.welcome, RULES.season.spDailyCap), closes.get(day.dayKey)?.sp ?? 0);
    out.set(day.dayKey, { total: day.total, sp, streak: snap.streak, paused: snap.paused, shards: Math.max(snap.balance, floors.get(day.dayKey) ?? 0),
      owned: [...new Set([...snap.owned, ...ownedBefore])], purchases: snap.purchases });
  }
  return out;
}

function replayEconomy(
  facts: readonly LedgerRow[], history: readonly RulesHistoryEntry[], settings: readonly SettingRow[] | Record<string, unknown>,
  today: string, closes: ReadonlyMap<string, DayClose>,
): Replay {
  const seen = new Set<string>();
  const ordered = [...facts].filter(fact => valid(fact) && fact.dayKey <= today).sort((a, b) => a.dayKey.localeCompare(b.dayKey) || a.updatedAt - b.updatedAt || a.id.localeCompare(b.id)).filter(fact => {
    if (seen.has(fact.id)) return false;
    seen.add(fact.id); return true;
  });
  const byDay = new Map<string, LedgerRow[]>();
  for (const fact of ordered) byDay.set(fact.dayKey, [...(byDay.get(fact.dayKey) ?? []), fact]);
  // Economy fixes of 22 Oct apply from the day this build first ran, so earlier days keep the XP they showed.
  const v2Stored = value(settings, 'economy.v2From');
  // A missing cutoff means the old rules: reconcile writes it on first run and a restore keeps this phone's.
  const v2From = typeof v2Stored === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v2Stored) ? v2Stored : '9999-12-31';
  const v2 = (key: string) => key >= v2From;
  // The 23 Oct fixes (economy review 32) count from the day this build first runs, so earlier days keep what they showed.
  const v3Stored = value(settings, 'economy.v3From');
  const v3From = typeof v3Stored === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v3Stored) ? v3Stored : '9999-12-31';
  const v3 = (key: string) => key >= v3From;
  // Only the shop of this build marks a purchase paid, so an older build's sale on the upgrade day still counts (Codex #2).
  const paidOnly = (key: string) => key > v3From;
  // The 24 Oct quest cap (item 45) counts from the day this build first runs, like the cutoffs above.
  const v4Stored = value(settings, 'economy.v4From');
  const v4From = typeof v4Stored === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v4Stored) ? v4Stored : '9999-12-31';
  // Your own side quests: only the first few done in a quest week pay XP (in the order they were done).
  const unpaidQuests = new Set<string>();
  const customDone = new Map<string, number>();
  for (const row of ordered) {
    if (row.mode !== 'quests' || row.kind !== 'quest' || row.dayKey < v4From || !isCustomQuestFact(row)) continue;
    const week = /\d{4}-W\d{2}$/.exec(row.id)?.[0] ?? row.dayKey;
    const count = (customDone.get(week) ?? 0) + 1;
    customDone.set(week, count);
    if (count > (rulesFor(row.dayKey, history)?.rules ?? RULES).quests.paidCustomPerWeek) unpaidQuests.add(row.id);
  }
  // The rest weekday for a week: that week's own pick, else the standing pick from the week it was made on (B6).
  const restWeekdayFor = (key: string): number | undefined => {
    const week = weekStart(key);
    const own = value(settings, `economy.restWeekday:${week}`);
    if (typeof own === 'number') return own;
    const standing = value(settings, 'economy.restWeekday');
    if (typeof standing === 'number') return standing;
    const pick = standing && typeof standing === 'object' ? standing as { weekday?: unknown; from?: unknown } : undefined;
    return pick && typeof pick.weekday === 'number' && typeof pick.from === 'string' && week >= pick.from ? pick.weekday : undefined;
  };
  const visibleFrom = value(settings, 'economyVisibleFrom');
  const firstDay = typeof visibleFrom === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(visibleFrom) && !Number.isNaN(Date.parse(`${visibleFrom}T12:00:00Z`)) && new Date(`${visibleFrom}T12:00:00Z`).toISOString().slice(0, 10) === visibleFrom && visibleFrom <= today ? visibleFrom : today;
  const start = ordered[0]?.dayKey && ordered[0].dayKey < firstDay ? ordered[0].dayKey : firstDay;
  const days: EconomyDay[] = [];
  for (let key = start; key <= today; key = addEconomyDays(key, 1)) {
    const rows = byDay.get(key) ?? [];
    const rules = rulesFor(key, history)?.rules ?? RULES;
    const tasks = calculateTasksDayXp(rows.filter(row => row.kind === 'done'), RULES, history);
    const sessions = rows.filter(row => row.mode === 'train' && row.kind === 'session').map(row => replayFactXp(row, history));
    const bestSession = Math.max(0, ...sessions);
    const restXp = Math.max(0, ...rows.filter(row => row.mode === 'train' && row.kind === 'rest').map(row => replayFactXp(row, history)));
    const rest = bestSession ? 0 : restXp;
    const prs = rows.filter(row => row.mode === 'train' && row.kind === 'pr').slice(0, rules.train.prMaxPerDay).reduce((sum, row) => sum + replayFactXp(row, history), 0);
    // A short session after a walk check keeps the better of the two, never less (economy review 32, A1).
    const train = Math.min(rules.train.dailyCapExclWeekly, (v3(key) ? Math.max(bestSession, restXp) : bestSession + rest) + prs);
    const weekly = rows.filter(row => row.mode === 'train' && row.kind === 'weekly').reduce((sum, row) => sum + replayFactXp(row, history), 0);
    const mindRows = rows.filter(row => row.mode === 'mind' && beforeBed(row));
    const paid = new Set<string>();
    const count = (kind: string, limit: number, amount: number) => mindRows.filter(row => row.kind === kind).slice(0, limit).reduce((sum, row) => {
      const id = kind === 'board' ? `${row.kind}:${row.inputs.daily === false ? row.refId : key}` : `${kind}:${row.refId}`;
      if (paid.has(id)) return sum; paid.add(id); return sum + amount;
    }, 0);
    const caseSolved = mindRows.some(row => row.kind === 'mystery' && row.inputs.result !== 'revealed');
    const dailyBoard = mindRows.some(row => row.kind === 'board' && row.inputs.daily !== false);
    const cards = mindRows.filter(row => row.kind === 'card');
    const learnAnswers = new Set(mindRows.filter(row => row.kind === 'learn-answer' && row.inputs.dropId === `drop:daily:${key}`).map(row => row.refId));
    // A teach-first drop can end after a few scored answers, or after the lesson alone (spec 16 §5, a new
    // learner with nothing earlier to practise), so a finished daily drop counts too, as long as one of
    // its answers or its lesson came before bedtime.
    const lessonDone = rows.some(row => row.kind === 'learn-lesson' && !row.deleted && row.inputs.dropId === `drop:daily:${key}` && beforeBed(row));
    const dropFinished = rows.some(row => row.mode === 'gamify' && row.kind === 'learn-drop' && row.refId === key) && (learnAnswers.size > 0 || lessonDone);
    const learnDrop = mindRows.some(row => row.kind === 'learn-drop') || learnAnswers.size >= 5 || dropFinished;
    // Mind earns nothing after bedtime, so a perfect drop pays only when every one of its answers came before it (audit 16.3).
    const dropAnswers = rows.filter(row => row.mode === 'mind' && row.kind === 'learn-answer' && row.inputs.dropId === `drop:daily:${key}`);
    const perfectBeforeBed = !v2(key) || (dropAnswers.length > 0 && dropAnswers.every(beforeBed));
    const mind = Math.min(rules.mind.dailyCap,
      (caseSolved ? rules.mind.mysteryXp : 0) + (dailyBoard ? rules.mind.dropBoardXp : 0) +
      count('lesson', rules.mind.lessonsPaidPerDay, rules.mind.lessonXp) +
      Math.min(cards.length, rules.mind.cardsMaxPerDay) * rules.mind.cardXp +
      mindRows.filter(row => row.kind === 'board' && row.inputs.daily === false).slice(0, rules.mind.sideBoardsMaxPerDay).length * rules.mind.sideBoardXp +
      (learnDrop ? rules.mind.learnDropXp : 0) + (perfectBeforeBed ? rows.filter(row => row.mode === 'gamify' && row.kind === 'perfect-drop').reduce((sum, row) => sum + replayFactXp(row, history), 0) : 0));
    const mindSlot = learnDrop || caseSolved || dailyBoard || cards.length >= rules.streak.minDueCardsForMark;
    const plannedTask = rows.some(isPlannedDone);
    const body = bestSession > 0 || rest > 0;
    const hatTrick = plannedTask && body && mindSlot;
    const lightsOut = rows.some(row => row.kind === 'lightsout' && row.inputs.metTarget === true && row.inputs.backfill !== true) ? rules.bonuses.lightsOutXp : 0;
    const quests = rows.filter(row => row.mode === 'quests' && row.kind === 'quest' && !unpaidQuests.has(row.id)).reduce((sum, row) => sum + replayFactXp(row, history), 0);
    const boost = rows.find(row => row.kind === 'focus-boost');
    // Focus doubles what the boosted half hour really earned: each area's boost is capped at that area's
    // capped day total, so caps and the eighth-task halving still hold (audit 16.4).
    const earnedBy: Record<string, number> = { tasks, train: train + weekly, mind, quests };
    const area = (row: LedgerRow) => row.mode === 'gamify' ? 'mind' : row.mode;
    const boosted: Record<string, number> = {};
    if (boost) for (const row of rows.filter(row => row.updatedAt > boost.updatedAt && row.updatedAt <= boost.updatedAt + rules.gamify.focusMinutes * 60_000 && row.kind !== 'focus-boost')) {
      let award = replayFactXp(row, history);
      if (row.mode === 'mind' && row.kind === 'learn-answer' && row.inputs.dropId === `drop:daily:${key}` && beforeBed(row)) {
        const before = rows.slice(0, rows.indexOf(row) + 1).filter(candidate => candidate.mode === 'mind' && candidate.kind === 'learn-answer' && candidate.inputs.dropId === `drop:daily:${key}` && beforeBed(candidate));
        if (before.length === 5) award = rules.mind.learnDropXp;
      }
      if (row.mode === 'gamify' && row.kind === 'perfect-drop' && !perfectBeforeBed) award = 0;
      boosted[area(row)] = (boosted[area(row)] ?? 0) + award;
    }
    const focus = Object.entries(boosted).reduce((sum, [name, amount]) => sum + (v2(key) ? Math.min(amount, earnedBy[name] ?? 0) : amount), 0) * (rules.gamify.focusMultiplier - 1);
    // Spec 15: one gentle thing on a tired or low day keeps the day. It is never a Hat-trick slot.
    const soft = rows.some(row => row.kind === 'soft') ? rules.soft.dayXp : 0;
    days.push({ dayKey: key, tasks, train, mind, weekly, quests, focus, hatTrick, lightsOut, soft, welcome: 0, held: 0,
      total: tasks + train + mind + weekly + quests + focus + (hatTrick ? rules.bonuses.hatTrickXp : 0) + lightsOut + soft,
      mark: plannedTask || body || mindSlot || soft > 0, body, mindSlot });
  }
  // Spec 15 D: the first marked day after an unmarked one gets a fixed, announced gift. Chosen weekly rest days
  // are not misses, so walk back over them: a gap that is only the rest day gets nothing, a longer one does.
  const isRestDay = (key: string) => restWeekdayFor(key) === new Date(atUtc(key)).getUTCDay();
  let everMarked = false;
  for (let i = 0; i < days.length; i++) {
    const day = days[i]!;
    const rules = rulesFor(day.dayKey, history)?.rules ?? RULES;
    // A gift once recorded stays, even if a missed day before it later gains a fact from a sync or an
    // import (forward-only; economy second opinion 1). The recorded fact is written by reconcileGamify.
    const recorded = (byDay.get(day.dayKey) ?? []).some(row => row.mode === 'gamify' && row.kind === 'welcome-back');
    if (recorded && day.dayKey >= rules.soft.from) { day.welcome = rules.soft.welcomeBackXp; day.total += day.welcome; }
    else if (day.mark && everMarked && day.dayKey >= rules.soft.from) {
      let j = i - 1;
      while (j >= 0 && !days[j]!.mark && isRestDay(days[j]!.dayKey)) j--;
      if (j >= 0 && !days[j]!.mark) { day.welcome = rules.soft.welcomeBackXp; day.total += day.welcome; }
    }
    if (day.mark) everMarked = true;
  }
  for (const day of days) {
    const close = closes.get(day.dayKey);
    if (close && close.total > day.total) { day.held = close.total - day.total; day.total = close.total; }
  }
  let totalXp = 0, level = 1, earnedFromXp = 0, levelShardBonus = 0;
  // Shards earned by the end of each day, before any purchase (for closes and the Shards floor).
  const earnedXpBy: number[] = [];
  for (const day of days) {
    const rules = rulesFor(day.dayKey, history)?.rules ?? RULES;
    totalXp += day.total;
    earnedFromXp += day.total * rules.shards.perXp;
    const candidate = Math.floor((1 + Math.sqrt(1 + 8 * totalXp / rules.level.stepBase)) / 2);
    if (candidate > level) { levelShardBonus += (candidate - level) * rules.shards.levelUpBonus; level = candidate; }
    earnedXpBy.push(Math.floor(earnedFromXp) + levelShardBonus);
  }
  const current = seasonFor(today < '2026-11-02' ? '2026-11-02' : today);
  const active = today >= '2026-11-02';
  // Spec 15 B: the Season counts the real slots only, so soft-day and welcome-back XP stay out of SP.
  const daySp = (day: { dayKey: string; total: number; soft: number; welcome: number; held: number } | undefined) => day
    ? Math.max(Math.min(day.total - day.held - day.soft - day.welcome, RULES.season.spDailyCap), closes.get(day.dayKey)?.sp ?? 0) : 0;
  const seasonSp = (season: ReturnType<typeof seasonFor>) => days.filter(day => day.dayKey >= season.start && day.dayKey <= season.end).reduce((sum, day) => sum + daySp(day), 0);
  const targetFor = (season: ReturnType<typeof seasonFor>) => {
    if (season.index <= 0) return RULES.season.targetPerDay * season.days;
    const prior = seasonFor(addEconomyDays(season.start, -1));
    const values = Array.from({ length: prior.days }, (_, index) => {
      const key = addEconomyDays(prior.start, index);
      return daySp(days.find(day => day.dayKey === key));
    }).sort((a, b) => a - b);
    const middle = (values[Math.floor((values.length - 1) / 2)]! + values[Math.floor(values.length / 2)]!) / 2;
    if (!middle) return RULES.season.targetPerDay * season.days;
    const fractionAt50 = ((RULES.season.seats - 50) / (RULES.season.seats - 1)) ** (1 / RULES.season.exponent);
    return Math.max(1, Math.round(middle * season.days / fractionAt50));
  };
  const rankFor = (sp: number, target: number) => RULES.season.seats - Math.floor((RULES.season.seats - 1) * Math.min(1, sp / target) ** RULES.season.exponent);
  const target = targetFor(current);
  const seedFor = (season: ReturnType<typeof seasonFor>) => season.index > 0
    ? Math.min(seasonSp(seasonFor(addEconomyDays(season.start, -1))), targetFor(season)) * RULES.season.seedPct / 100 : 0;
  const seed = seedFor(current);
  const sp = active ? seed + seasonSp(current) : 0;
  const rank = rankFor(sp, target);
  const beforeWeek = days.filter(day => day.dayKey < weekStart(today) && day.dayKey >= current.start).reduce((sum, day) => sum + daySp(day), 0) + seed;
  const placesThisWeek = active ? Math.max(0, rankFor(beforeWeek, target) - rank) : 0;
  const nextSeason = seasonFor(addEconomyDays(current.end, 1));
  const nextSeed = Math.min(sp, targetFor(nextSeason)) * RULES.season.seedPct / 100;
  let restDays = 0, restDaysUsed = 0, restUsedYesterday = false, streakDays = 0, paused = false, restored = false, gold = false;
  let breakAt = -1, repair = 0, markedDays = 0, restShift = 0;
  const streakBy: { streak: number; paused: boolean }[] = [];
  for (let i = 0; i < days.length; i++) {
    const day = days[i]!;
    if (i === 0 || day.dayKey.slice(0, 7) !== days[i - 1]!.dayKey.slice(0, 7))
      restDays = Math.min(RULES.streak.restBankMax, restDays + RULES.streak.restBankMonthly);
    const weekday = new Date(atUtc(day.dayKey)).getUTCDay();
    const restWeekday = restWeekdayFor(day.dayKey);
    const isRest = typeof restWeekday === 'number' && restWeekday === weekday;
    // A2: from the 23 Oct fixes only a paid (accepted) rest-day purchase adds to the bank.
    const purchases = byDay.get(day.dayKey)?.filter(row => row.kind === 'purchase' && row.inputs.itemId === 'freeze' && num(row.inputs.price) > 0 && (!paidOnly(day.dayKey) || row.inputs.accepted === true)).length ?? 0;
    restDays = Math.min(RULES.streak.restBankMax, restDays + purchases);
    if (day.mark) {
      if (paused && breakAt >= 0 && i - breakAt - restShift <= 2) {
        if (day.hatTrick) repair++;
        // The missed day is held, not counted: only the repair days themselves add to the streak (audit 16.11).
        if (repair >= RULES.streak.repairHatTricks) { paused = false; restored = true; streakDays += i - breakAt + (v2(day.dayKey) ? 0 : 1); if (v2(day.dayKey)) markedDays = i - breakAt - restShift; repair = 0; breakAt = -1; restShift = 0; }
      } else if (paused) {
        // The 48 h earn-back window has passed: a marked day starts a fresh streak.
        paused = false; restored = false; streakDays = 1; markedDays = 1; repair = 0; breakAt = -1; restShift = 0;
      } else {
        streakDays++; markedDays++;
        if (markedDays >= RULES.streak.goldAfterDays) gold = true;
      }
    } else if (isRest) { if (!paused) streakDays++; else if (breakAt >= 0 && v3(day.dayKey)) restShift++; }  // B4: a rest day does not use up the 48 h repair window
    else if (i < days.length - 1) {
      if (!paused && restDays > 0) { restDays--; restDaysUsed++; restUsedYesterday = i === days.length - 2; markedDays = 0; gold = false; }
      // A break resets the Gold count like a spent rest day does, so Gold needs a fresh run (audit 16.12).
      else if (!paused) { paused = true; breakAt = i; repair = 0; restShift = 0; gold = false; if (v2(day.dayKey)) markedDays = 0; }
      else if (breakAt >= 0 && i - breakAt - restShift > 2) { streakDays = 0; breakAt = -1; repair = 0; restShift = 0; }
    }
    // A finished day never shows a shorter streak than it once closed with: the run picks up from there, and
    // only a miss after that day can pause it. A close taken while paused keeps the pause.
    const close = closes.get(day.dayKey);
    if (close && close.streak >= streakDays) {
      if (!close.paused && (paused || close.streak > streakDays)) { streakDays = close.streak; paused = false; breakAt = -1; repair = 0; restShift = 0; }
      else if (close.paused && paused) streakDays = close.streak;
    }
    streakBy.push({ streak: streakDays, paused });
  }
  const monday = weekStart(today);
  const thisWeek = Array.from({ length: 7 }, (_, index) => days.find(day => day.dayKey === addEconomyDays(monday, index))?.hatTrick ?? false);
  const count = thisWeek.filter(Boolean).length;
  let cleanStreak = 0;
  for (let key = addEconomyDays(monday, -7); key >= start; key = addEconomyDays(key, -7)) {
    if (days.filter(day => day.dayKey >= key && day.dayKey <= addEconomyDays(key, 6) && day.hatTrick).length < RULES.streak.cleanWeekHatTricks) break;
    cleanStreak++;
  }
  if (count >= RULES.streak.cleanWeekHatTricks) cleanStreak++;
  let seasonAward = 0;
  // Season-end Shards arrive the day after the season ends.
  const awardOn = new Map<string, number>();
  for (let seasonStart = '2026-11-02'; seasonStart < current.start; seasonStart = addEconomyDays(seasonFor(seasonStart).end, 1)) {
    const season = seasonFor(seasonStart);
    if (season.end >= today) break;
    // A fresh install has no cutoff until its first reconcile; for this skip only that reads as today, so the
    // award never shows on the first frame and then vanishes (econ-32 re-review, item 37).
    if (season.end < start && start >= (typeof v3Stored === 'string' ? v3From : today)) continue;
    const finalRank = rankFor(seasonSp(season) + seedFor(season), targetFor(season));
    const awardRules = rulesFor(season.end, history)?.rules ?? RULES;
    const amount = awardRules.shards.seasonEnd[tierFor(finalRank) as keyof typeof RULES.shards.seasonEnd];
    seasonAward += amount;
    const on = addEconomyDays(season.end, 1);
    awardOn.set(on, (awardOn.get(on) ?? 0) + amount);
  }
  const factShardsOn = new Map<string, number>();
  for (const row of ordered) { const amount = replayFactShards(row, history); if (amount) factShardsOn.set(row.dayKey, (factShardsOn.get(row.dayKey) ?? 0) + amount); }
  let balance = Math.floor(earnedFromXp) + levelShardBonus + seasonAward;
  balance += [...factShardsOn.values()].reduce((sum, amount) => sum + amount, 0);
  const owned: string[] = [];
  const accepted: ClosePurchase[] = [];
  for (const row of ordered.filter(row => row.kind === 'purchase')) {
    const price = Number(row.inputs.price);
    const id = row.inputs.itemId;
    // The shop writes a purchase only when it is affordable, so from the 22 Oct fixes on (and whenever a close
    // has kept it) it is accepted once, as an outcome: a re-count of earlier earnings cannot skip it now and
    // apply it later (49 -> 0).
    // A purchase keeps the price it was bought at: a later change to the price table never makes an owned item
    // free, or drops it while a close still keeps it owned (second opinion 28).
    if (typeof id !== 'string' || purchasePrices[id] === undefined || !(price > 0) || (row.inputs.accepted !== true && (paidOnly(row.dayKey) || (!v2(row.dayKey) && price > balance)))) continue;
    if (id !== 'freeze' && owned.includes(id)) continue;
    balance -= price; if (id !== 'freeze') owned.push(id);
    accepted.push({ id: row.id, itemId: id, price, dayKey: row.dayKey });
  }
  // End-of-day snapshots for the closes.
  const daily = new Map<string, DaySnapshot>();
  let earnedExtra = 0, spentSoFar = 0, atBuy = 0;
  const buys = [...accepted].sort((a, b) => dayOrder(a.dayKey, b.dayKey));
  const ownedSoFar = new Set<string>();
  for (let i = 0; i < days.length; i++) {
    const key = days[i]!.dayKey;
    earnedExtra += (awardOn.get(key) ?? 0) + (factShardsOn.get(key) ?? 0);
    const earned = earnedXpBy[i]! + earnedExtra;
    const ofDay: ClosePurchase[] = [];
    while (atBuy < buys.length && buys[atBuy]!.dayKey <= key) {
      const item = buys[atBuy++]!;
      spentSoFar += item.price;
      if (item.itemId !== 'freeze') ownedSoFar.add(item.itemId);
      if (item.dayKey === key) ofDay.push(item);
    }
    daily.set(key, { streak: streakBy[i]!.streak, paused: streakBy[i]!.paused, earned, balance: Math.max(0, earned - spentSoFar), owned: [...ownedSoFar], purchases: ofDay });
  }
  return { daily, accepted, view: { days, totalXp, level, nextLevelXp: xpToReach(level + 1, (rulesFor(today, history)?.rules ?? RULES).level.stepBase), season: { index: current.index, start: current.start, end: current.end, active, sp, target, rank, tier: tierFor(rank), seed, nextSeed, placesThisWeek }, streak: { days: streakDays, restDays, restDaysUsed, restUsedYesterday, paused, gold, restored, canRepair: paused && breakAt >= 0 && breakAt + 2 + restShift - (days.length - 1) + 1 - (days.at(-1)?.hatTrick ? 1 : 0) >= RULES.streak.repairHatTricks - repair }, cleanWeek: { count, days: thisWeek, complete: count >= RULES.streak.cleanWeekHatTricks, streak: cleanStreak }, shards: Math.max(0, balance), owned } };
}
