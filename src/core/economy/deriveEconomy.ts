import { RULES, RULES_HISTORY, rulesFor, type RulesHistoryEntry } from '../rules.config';
import { calculateTasksDayXp, replayFactShards, replayFactXp } from './awards';
import { boardPay, calmDayXp, chapterPay, chhuttiXp, focusDayXp, trainSessionPay } from './effort';

/** The tasks cap before spec 36 (26 Oct rules); a day before economy.v6From keeps it. */
const PRE_EFFORT_TASKS_CAP = 200;
/** The Train and Mind caps before spec 36 v2 (28 Oct rules); a day before economy.v7From keeps them. */
const PRE_V2_TRAIN_CAP = 100;
const PRE_V2_MIND_CAP = 80;
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
  /** Spec 24 #1: a kept Phone ki chhutti, paid once a day at most. It is not a Hat-trick slot and marks no day. */
  chhutti: number;
  /** Spec 36: minutes sat in Calm, from economy.v6From. Not a Hat-trick slot; marks no day. */
  calm: number;
  /** XP kept from the day's close: a later replay may not show less than the day once closed with. */
  held: number;
}
/** A purchase the shop accepted, kept in the close so a restore can never keep the item and lose the spend. */
export interface ClosePurchase { id: string; itemId: string; price: number; dayKey: string }
/**
 * What a finished day showed (economy second opinions 22 and 25). Closes are high-water marks: every reconcile
 * raises them to what the replay now shows, never lowers them, and the replay never shows less than them.
 */
/**
 * `bonus` is the level-up Shards the close's balance already held (absent in closes written before 24 Oct). A late
 * fact on an earlier day can move a level-up to before a close; the floor then adds back only the bonuses that close
 * did not hold, so it neither drops nor pays one twice (cj3 fuzz seeds 2016, 2128).
 */
export interface DayClose { total: number; sp: number; streak: number; paused: boolean; shards: number; bonus?: number; owned: string[]; purchases: ClosePurchase[] }
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
  const bonus = typeof value.bonus === 'number' && Number.isFinite(value.bonus) ? { bonus: value.bonus } : {};
  return { total: num(value.total), sp: num(value.sp), streak: num(value.streak), paused: value.paused === true, shards: num(value.shards), ...bonus,
    owned: Array.isArray(value.owned) ? value.owned.filter((id): id is string => typeof id === 'string') : [], purchases };
}
/**
 * A purchase made while closes dated on or after its day already exist (a clock set back, cj3 fuzz seed 1000): those
 * closes were written before it, so each one pays for it now and lists it. Otherwise a later close would read as
 * already net of it and mint its price back on the next day.
 */
export function chargeClose(raw: unknown, purchase: ClosePurchase): DayClose | undefined {
  const close = asClose(raw);
  if (!close || close.purchases.some(item => item.id === purchase.id)) return close;
  return { ...close, shards: close.shards - purchase.price, purchases: [...close.purchases, purchase] };
}
/** The reverse of chargeClose for the purchases `drop` picks: they leave the close and their price comes back. */
export function unchargeClose(raw: unknown, drop: (item: ClosePurchase) => boolean): unknown {
  const close = asClose(raw);
  if (!close || !close.purchases.some(drop)) return raw;
  const gone = close.purchases.filter(drop);
  return { ...close, shards: close.shards + gone.reduce((sum, item) => sum + item.price, 0), purchases: close.purchases.filter(item => !drop(item)) };
}
/**
 * A restore replaces today (Jenil, 24 Oct): every purchase `replaced` picks is taken out of this phone's closes. Each
 * close that knew it (by the normalised knowledge: every close from its host day on) gets its price back and stops
 * owning the item, not only the close that still lists it (Codex review of round 5, item 48).
 */
/** A phone purchase the restored ledger also has: the same id, item and price (Codex review of round 5, item 48). */
export function restoredPurchase(restored: readonly LedgerRow[]): (item: ClosePurchase) => boolean {
  const kept = new Map(restored.filter(row => !row.deleted && row.kind === 'purchase').map(row => [row.id, `${String(row.inputs.itemId)}:${Number(row.inputs.price)}`] as const));
  return item => kept.get(item.id) === `${item.itemId}:${item.price}`;
}
export function refundReplaced(closes: ReadonlyMap<string, unknown>, replaced: (item: ClosePurchase) => boolean): Map<string, DayClose> {
  const normal = normalizeCloses(new Map([...closes].flatMap(([day, raw]) => { const close = asClose(raw); return close ? [[day, close] as const] : []; })));
  const gone = [...purchasePool(normal.values()).values()].filter(replaced);
  return new Map([...normal].map(([day, close]) => {
    const here = gone.filter(item => item.dayKey <= day);
    if (!here.length) return [day, close] as const;
    const ids = new Set(here.map(item => item.id)), items = new Set(here.filter(item => item.itemId !== 'freeze').map(item => item.itemId));
    return [day, { ...close, shards: close.shards + here.reduce((sum, item) => sum + item.price, 0),
      purchases: close.purchases.filter(item => !ids.has(item.id)), owned: close.owned.filter(id => !items.has(id)) }] as const;
  }));
}
/** Two closes for one day (an earlier one and a new one, or this phone's and a backup's) keep the higher of each. */
export function mergeClose(a: unknown, b: unknown): DayClose | undefined {
  const x = asClose(a), y = asClose(b);
  if (!x || !y) return x ?? y;
  // One close that says its level bonus and one that does not have no order-free merge: fill first (fillHeldBonus).
  if ((x.bonus === undefined) !== (y.bonus === undefined)) throw new Error('mergeClose: fill the level bonus of older closes first');
  const onlyIn = (a: DayClose, b: DayClose) => a.purchases.filter(item => !b.purchases.some(other => other.id === item.id));
  const cost = (items: ClosePurchase[]) => items.reduce((sum, item) => sum + item.price, 0);
  const purchases = [...x.purchases.map(item => {
    const other = y.purchases.find(entry => entry.id === item.id);
    return other && other.price > item.price ? other : item;
  }), ...onlyIn(y, x)];
  // The merged close knows every purchase from both, so each balance first pays for the ones only the other knew;
  // otherwise a late purchase's spend would vanish under the older, higher balance (second opinion 26).
  // Signed: a close may hold a debt from a purchase made with look-ahead Shards, and a 0 here would mint them (cj3 B).
  const sx = x.shards - cost(onlyIn(y, x)), sy = y.shards - cost(onlyIn(x, y));
  return { total: Math.max(x.total, y.total), sp: Math.max(x.sp, y.sp), streak: Math.max(x.streak, y.streak),
    paused: x.streak === y.streak ? x.paused && y.paused : (x.streak > y.streak ? x.paused : y.paused),
    ...combine([[sx, x], [sy, y]]), owned: [...new Set([...x.owned, ...y.owned])], purchases };
}
/**
 * Your own side quests: only the first few done in a quest week pay XP, in the order they were done, from the day
 * this build first ran (`economy.v4From`). `paid` counts the paying ones per quest week, for the Side quests card.
 */
export function customQuestPay(facts: readonly LedgerRow[], v4From: string, history: readonly RulesHistoryEntry[] = RULES_HISTORY, today = '9999-12-31'): { unpaid: Set<string>; paid: Map<string, number> } {
  const unpaid = new Set<string>(), paid = new Map<string, number>(), seen = new Set<string>();
  // The same facts scoring replays: valid ones dated up to today (a clock set back hides later ones; Codex item 48).
  const rows = facts.filter(row => valid(row) && row.dayKey <= today && row.mode === 'quests' && row.kind === 'quest' && row.dayKey >= v4From && isCustomQuestFact(row))
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey) || a.updatedAt - b.updatedAt || a.id.localeCompare(b.id));
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    const week = /\d{4}-W\d{2}$/.exec(row.id)?.[0] ?? row.dayKey;
    const cap = (rulesFor(row.dayKey, history)?.rules ?? RULES).quests.paidCustomPerWeek;
    if ((paid.get(week) ?? 0) >= cap) unpaid.add(row.id);
    else paid.set(week, (paid.get(week) ?? 0) + 1);
  }
  return { unpaid, paid };
}
/** The cutoff day of the 24 Oct quest cap; none yet means the old rules. */
export function questCapFrom(settings: readonly SettingRow[] | Record<string, unknown>): string {
  const stored = value(settings, 'economy.v4From');
  return typeof stored === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(stored) ? stored : '9999-12-31';
}
/** A side quest you wrote yourself (its row id has no week suffix; newer facts also say so). */
export const isCustomQuestFact = (fact: LedgerRow) => fact.inputs.custom === true || (fact.inputs.custom !== false && !String(fact.refId).includes(':'));
const dayOrder = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
/**
 * Two balances for one day, each with the level bonus it held. When both say what they held, the one that held less
 * is lifted to the higher bonus first: the other close shows that bonus was paid by that day, and without the lift a
 * merge could swap a close for one with a higher balance but a lower "balance before bonuses" (cj3 fuzz seed 2020).
 * A close from before 24 Oct (no bonus) keeps the plain higher balance, and the bonus of that side (higher on a tie).
 */
function combine(sides: readonly (readonly [number, DayClose | undefined])[]): { shards: number; bonus?: number } {
  const present = sides.filter((side): side is readonly [number, DayClose] => !!side[1]);
  if (present.every(([, close]) => close.bonus !== undefined)) {
    const top = Math.max(...present.map(([, close]) => close.bonus!));
    return { shards: Math.max(...present.map(([shards, close]) => shards + top - close.bonus!)), bonus: top };
  }
  const shards = Math.max(...present.map(([value]) => value));
  const bonuses = present.filter(([value]) => value === shards).map(([, close]) => close.bonus);
  return bonuses.some(bonus => bonus === undefined) ? { shards } : { shards, bonus: Math.max(...bonuses as number[]) };
}
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
    out.set(day, { ...close, shards: close.shards - unpaid, purchases: hosted.get(day)! });
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
    const sx = cx ? cx.shards - unpaid(knownX) : -Infinity, sy = cy ? cy.shards - unpaid(knownY) : -Infinity;
    const both = [cx, cy].filter((close): close is DayClose => !!close);
    const streak = Math.max(...both.map(close => close.streak));
    const top = both.filter(close => close.streak === streak);
    out.set(day, { total: Math.max(...both.map(close => close.total)), sp: Math.max(...both.map(close => close.sp)), streak,
      paused: top.every(close => close.paused), ...combine([[sx, cx], [sy, cy]]), owned: [...new Set(both.flatMap(close => close.owned))], purchases: hosted.get(day)! });
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
const purchasePrices: Record<string, number> = RULES.shards.prices;

interface DaySnapshot { streak: number; paused: boolean; earned: number; bonus: number; balance: number; owned: string[]; purchases: ClosePurchase[] }
/** `balance` is the signed end balance; `view.shards` is it clamped at 0 for the screen. */
interface Replay { view: EconomyView; daily: Map<string, DaySnapshot>; accepted: ClosePurchase[]; balance: number }

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
function shardFloors(closes: ReadonlyMap<string, DayClose>, replay: Replay, days: readonly string[]): Map<string, { shards: number; bonus: number }> {
  const closeDays = [...closes.keys()].sort(dayOrder);
  const price = new Map(replay.accepted.map(item => [item.id, item.price]));
  const spends = [...replay.accepted].sort((a, b) => dayOrder(a.dayKey, b.dayKey));
  const known = new Set<string>();
  // For each close: base = its balance above the replay's bonus-free earnings by then (plus what it knew it spent);
  // `held` = the level bonus that balance held. A floor adds back the replay's bonuses past `held`, or keeps `held`
  // when the replay now reaches fewer levels: max over closes of base - held + max(bonus now, held), kept as two
  // running maxima. A close written before 24 Oct holds the replay's own bonus for its day (the earlier rule).
  let atClose = 0, atSpend = 0, spent = 0, knownSpent = 0, bestFree = -Infinity, bestHeld = -Infinity, topHeld = -Infinity;
  const out = new Map<string, { shards: number; bonus: number }>();
  for (const day of [...days].sort(dayOrder)) {
    while (atClose < closeDays.length && closeDays[atClose]! < day) {
      const closeDay = closeDays[atClose++]!, close = closes.get(closeDay)!;
      for (const item of close.purchases) if (!known.has(item.id)) { known.add(item.id); knownSpent += price.get(item.id) ?? 0; }
      const then = replay.daily.get(closeDay);
      if (!then) continue;
      const held = close.bonus ?? then.bonus, base = close.shards - (then.earned - then.bonus) + knownSpent;
      bestFree = Math.max(bestFree, base - held); bestHeld = Math.max(bestHeld, base); topHeld = Math.max(topHeld, held);
    }
    while (atSpend < spends.length && spends[atSpend]!.dayKey <= day) spent += spends[atSpend++]!.price;
    const at = replay.daily.get(day);
    // Signed, and -Infinity with no close to floor it: only the shown number is clamped (cj3 B).
    if (!at || bestFree === -Infinity) { out.set(day, { shards: -Infinity, bonus: at?.bonus ?? 0 }); continue; }
    const free = bestFree + at.bonus, held = bestHeld;
    out.set(day, { shards: at.earned - at.bonus - spent + Math.max(free, held), bonus: free >= held ? at.bonus : Math.max(at.bonus, topHeld) });
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
  // A phone clock that ran ahead and was set back, a time zone to the west, or a restore leaves facts or closes
  // dated after today, or days this phone has already shown. Days, streak, quests and Hat-tricks stay on the real
  // today, but the totals look ahead to all of them, so XP, level, Shards and owned items never drop (cj2 3.5,
  // cj3 clock fuzz A, C3, E).
  const horizon = economyHorizon(facts, settings, today);
  if (horizon <= today) return view;
  const ahead = withPeak(viewUpTo(facts, history, settings, horizon), settings, history, horizon);
  const top = ahead.totalXp > view.totalXp ? ahead : view;
  // Shards shown and spendable come from the look-ahead alone: it also charges purchases dated ahead, so the
  // same Shards can never buy twice (item 38). Owned items keep both.
  return { ...view, totalXp: top.totalXp, level: Math.max(view.level, ahead.level), nextLevelXp: top.nextLevelXp,
    shards: ahead.shards, owned: [...new Set([...view.owned, ...ahead.owned])] };
}

/** The highest day this phone's reconcile has run on (never lowered; raised by reconcile, kept by a restore). */
export const SEEN_KEY = 'economy.seenUpTo';
export function readSeenUpTo(settings: readonly SettingRow[] | Record<string, unknown>): string | undefined {
  const stored = value(settings, SEEN_KEY);
  return typeof stored === 'string' && isDay(stored) ? stored : undefined;
}
/**
 * How far the look-ahead runs: the latest fact, the day after the latest close, and the highest day reconcile has
 * seen (cj3 clock fuzz A, Codex A review). A season-end award is no fact, so only `seenUpTo` keeps it after the
 * clock goes back; that part is capped at 42 days past the latest activity (one season), so a clock set far ahead
 * once can add at most one season's award, and never decades of empty days. Facts and closes are never capped:
 * a phone that lost its date still shows all of them (E).
 */
export function economyHorizon(facts: readonly LedgerRow[], settings: readonly SettingRow[] | Record<string, unknown>, today: string): string {
  let activity = facts.reduce((max, fact) => valid(fact) && fact.dayKey > max ? fact.dayKey : max, '');
  for (const day of closeDays(settings)) { const after = addEconomyDays(day, 1); if (after > activity) activity = after; }
  const seen = readSeenUpTo(settings);
  const seenCap = activity ? addEconomyDays(activity, 42) : today;
  const bySeen = seen ? (seen < seenCap ? seen : seenCap) : '';
  return [today, activity, bySeen].reduce((max, day) => day > max ? day : max, today);
}
function closeDays(settings: readonly SettingRow[] | Record<string, unknown>): string[] {
  const keys = Array.isArray(settings)
    ? (settings as SettingRow[]).filter(row => !row.deleted && row.key.startsWith(CLOSE_PREFIX)).map(row => row.key)
    : Object.keys(settings as Record<string, unknown>).filter(key => key.startsWith(CLOSE_PREFIX));
  return keys.map(key => key.slice(CLOSE_PREFIX.length)).filter(isDay);
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
  // A level the peak keeps but the replay no longer reaches keeps the Shards it paid: only the unpaid difference,
  // added before the floor, so a close that already holds that bonus never pays it twice (cj3 D, Codex review).
  const unpaidLevels = Math.max(0, readPeak(settings).level - replay.view.level);
  const balance = replay.balance + unpaidLevels * (rulesFor(end, history)?.rules ?? RULES).shards.levelUpBonus;
  if (!closes.size) return { ...replay.view, shards: Math.max(0, balance) };
  const owned = [...new Set([...replay.view.owned, ...[...closes.values()].flatMap(close => close.owned)])];
  return { ...replay.view, shards: Math.max(0, balance, Math.floor(shardFloors(closes, replay, [end]).get(end)?.shards ?? -Infinity)), owned };
}

/** What each finished day (before `today`) shows now, in one replay: the candidates reconcileGamify merges into the closes. */
export function closesFor(facts: readonly LedgerRow[], settings: readonly SettingRow[] | Record<string, unknown>, today: string, history: readonly RulesHistoryEntry[] = RULES_HISTORY, bonusOut?: Map<string, number>): Map<string, DayClose> {
  const { replay, closes } = replayWithCloses(facts, history, settings, today);
  if (bonusOut) for (const [day, snap] of replay.daily) bonusOut.set(day, snap.bonus);
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
    const floor = floors.get(day.dayKey), floorShards = Math.floor(floor?.shards ?? -Infinity);
    // The bonus goes with whichever balance the close keeps (the higher one on a tie, so none is paid twice).
    const bonus = floorShards > snap.balance ? floor!.bonus : floorShards === snap.balance ? Math.max(snap.bonus, floor!.bonus) : snap.bonus;
    out.set(day.dayKey, { total: day.total, sp, streak: snap.streak, paused: snap.paused, shards: Math.max(snap.balance, floorShards), bonus,
      owned: [...new Set([...snap.owned, ...ownedBefore])], purchases: snap.purchases });
  }
  return out;
}

/** The level bonus the replay has paid by the end of each day up to `end` (for closes from before 24 Oct). */
export function replayBonus(facts: readonly LedgerRow[], settings: readonly SettingRow[] | Record<string, unknown>, end: string, history: readonly RulesHistoryEntry[] = RULES_HISTORY): Map<string, number> {
  const { replay } = replayWithCloses(facts, history, settings, end);
  return new Map([...replay.daily].map(([day, snap]) => [day, snap.bonus] as const));
}
/**
 * A close written before 24 Oct does not say which level bonus it held. Before any merge it is given the bonus
 * the replay paid by its day (the same reading the Shards floor uses), so every merge sees two closes that say
 * what they held, and merging stays the same in any order (Codex review of cj3 round 4, item 47).
 */
export function fillHeldBonus(closes: ReadonlyMap<string, unknown>, bonus: ReadonlyMap<string, number>): Map<string, unknown> {
  return new Map([...closes].map(([day, raw]) => {
    const close = asClose(raw), held = bonus.get(day);
    return [day, close && close.bonus === undefined && held !== undefined ? { ...close, bonus: held } : raw] as const;
  }));
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
  const v4From = questCapFrom(settings);
  // Spec 36 (effort pays) counts from the day this build first runs, so no day shown before it is rescored.
  const v6Stored = value(settings, 'economy.v6From');
  const v6From = typeof v6Stored === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v6Stored) ? v6Stored : '9999-12-31';
  const v6 = (key: string) => key >= v6From;
  // Spec 36 v2 (Train sets, board difficulty, chapter depth) counts from the day its build first runs, the same way.
  const v7Stored = value(settings, 'economy.v7From');
  const v7From = typeof v7Stored === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v7Stored) ? v7Stored : '9999-12-31';
  const v7 = (key: string) => key >= v7From;
  const unpaidQuests = customQuestPay(ordered, v4From, history).unpaid;
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
  const firstFact = ordered[0]?.dayKey && ordered[0].dayKey < firstDay ? ordered[0].dayKey : firstDay;
  // A close before the first fact (a restore of an older backup) still holds its day, its XP and its Shards (cj3 C2).
  const firstClose = [...closes.keys()].reduce((min, day) => day < min ? day : min, firstFact);
  // A reset clock can set the visibility start decades back: never replay more than a year of empty days before
  // the first activity (Codex review of cj3 E). Rest days bank at most 3 months, so nothing shown changes.
  const firstActivity = [ordered[0]?.dayKey, ...closes.keys()].filter((day): day is string => !!day).sort()[0];
  const start = firstActivity && firstClose < addEconomyDays(firstActivity, -366) ? addEconomyDays(firstActivity, -366) : firstClose;
  const days: EconomyDay[] = [];
  for (let key = start; key <= today; key = addEconomyDays(key, 1)) {
    const rows = byDay.get(key) ?? [];
    const rules = rulesFor(key, history)?.rules ?? RULES;
    // Spec 36: the guard-watched focus minutes of each task pay on top of finishing it, inside the tasks cap.
    // Before economy.v6From the tasks cap stays at the 26 Oct 200, so no day shown before the build is rescored.
    const doneXp = calculateTasksDayXp(rows.filter(row => row.kind === 'done'), RULES, history);
    const tasks = v6(key) ? Math.min(rules.tasks.dailyCap, doneXp + focusDayXp(rows, rules)) : Math.min(PRE_EFFORT_TASKS_CAP, doneXp);
    // Spec 36 v2: a session written with its paid sets pays per set; an older fact keeps its own award.
    const sessions = rows.filter(row => row.mode === 'train' && row.kind === 'session').map(row => (v7(key) ? trainSessionPay(row.inputs, rules) : null) ?? replayFactXp(row, history));
    const bestSession = Math.max(0, ...sessions);
    const restXp = Math.max(0, ...rows.filter(row => row.mode === 'train' && row.kind === 'rest').map(row => replayFactXp(row, history)));
    const rest = bestSession ? 0 : restXp;
    const prs = rows.filter(row => row.mode === 'train' && row.kind === 'pr').slice(0, rules.train.prMaxPerDay).reduce((sum, row) => sum + replayFactXp(row, history), 0);
    // A short session after a walk check keeps the better of the two, never less (economy review 32, A1).
    const train = Math.min(v7(key) ? rules.train.dailyCapExclWeekly : Math.min(PRE_V2_TRAIN_CAP, rules.train.dailyCapExclWeekly), (v3(key) ? Math.max(bestSession, restXp) : bestSession + rest) + prs);
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
    // Spec 36 v2: a solved board pays by difficulty less its hints, and a new chapter pays for what it taught and what was
    // answered right, up to 3 a day, instead of the day's drop 15 when it was read as the drop. Older days pay as before.
    const board = (row: LedgerRow | undefined, flat: number) => row ? (v7(key) ? boardPay(row.inputs, rules) : null) ?? flat : 0;
    const chapters = v7(key) ? rows.filter(row => row.mode === 'read' && row.kind === 'chapter' && !row.deleted && beforeBed(row) && typeof row.inputs.newSteps === 'number') : [];
    const chapterXp = 'chapterPay' in rules.mind ? chapters.slice(0, rules.mind.chapterPay.paidPerDay).reduce((sum, row) => sum + (chapterPay(row.inputs, rules) ?? 0), 0) : 0;
    // The drop was a chapter's reading: its finished chapter says so, and so does the drop fact from the moment the
    // reading ends (so the drop never pays its 15 first and then gives it back when the chapter is done).
    const dropWasChapter = v7(key) && rows.some(row => !row.deleted && ((row.mode === 'read' && row.kind === 'chapter' && Array.isArray(row.inputs.readDrops) && row.inputs.readDrops.includes(`drop:daily:${key}`))
      || (row.mode === 'gamify' && row.kind === 'learn-drop' && row.refId === key && row.inputs.chapter === true)));
    const mind = Math.min(v7(key) ? rules.mind.dailyCap : Math.min(PRE_V2_MIND_CAP, rules.mind.dailyCap),
      (caseSolved ? rules.mind.mysteryXp : 0) + board(mindRows.find(row => row.kind === 'board' && row.inputs.daily !== false), rules.mind.dropBoardXp) + chapterXp +
      count('lesson', rules.mind.lessonsPaidPerDay, rules.mind.lessonXp) +
      // Spec 30: one Chiku fact per idea, ever; none exist before the build that writes them.
      count('chiku', Number.MAX_SAFE_INTEGER, rules.mind.chikuXp ?? 0) +
      Math.min(cards.length, rules.mind.cardsMaxPerDay) * rules.mind.cardXp +
      mindRows.filter(row => row.kind === 'board' && row.inputs.daily === false).slice(0, rules.mind.sideBoardsMaxPerDay).reduce((sum, row) => sum + board(row, rules.mind.sideBoardXp), 0) +
      (learnDrop && !dropWasChapter ? rules.mind.learnDropXp : 0) + (perfectBeforeBed ? rows.filter(row => row.mode === 'gamify' && row.kind === 'perfect-drop').reduce((sum, row) => sum + replayFactXp(row, history), 0) : 0));
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
    // A boost written since batch 5 says when it ends (`until`, never past shutdown), so it doubles nothing after
    // shutdown or bedtime; an older boost fact keeps its full window, so past days keep what they showed (item 51).
    const boostEnd = boost ? Math.min(boost.updatedAt + rules.gamify.focusMinutes * 60_000, typeof boost.inputs.until === 'number' ? boost.inputs.until : Infinity) : 0;
    // A chhutti is paid for time away from the phone, not for a boosted half hour, so Focus never doubles it (Codex A
    // item 66). Chhutti facts exist only from the build that writes them, so no past day changes.
    // Spec 36: focus minutes and Calm minutes pay for time already measured, so the boost never doubles them either.
    if (boost) for (const row of rows.filter(row => row.updatedAt > boost.updatedAt && row.updatedAt <= boostEnd && row.kind !== 'focus-boost' && row.kind !== 'chhutti' && row.kind !== 'focus-time' && row.mode !== 'calm')) {
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
    // Spec 24 #1: chhutti facts exist only from the build that writes them, so no past day is rescored. Only a window
    // the phone's usage log measured pays; a self-reported one still grows the courtyard (self-report inflates).
    const kept = rows.filter(row => row.mode === 'tasks' && row.kind === 'chhutti' && row.inputs.kept === true && row.inputs.source === 'usage');
    // Spec 36: a longer kept window pays more (10 for the first 30 minutes, 2 per further 10).
    const chhutti = v6(key) ? kept.slice(0, rules.plan.chhutti.paidPerDay).reduce((sum, row) => sum + chhuttiXp(row, rules), 0)
      : Math.min(rules.plan.chhutti.paidPerDay, kept.length) * rules.plan.chhutti.xp;
    const calm = v6(key) ? calmDayXp(rows, rules) : 0;
    days.push({ dayKey: key, tasks, train, mind, weekly, quests, focus, hatTrick, lightsOut, soft, chhutti, calm, welcome: 0, held: 0,
      total: tasks + train + mind + weekly + quests + focus + (hatTrick ? rules.bonuses.hatTrickXp : 0) + lightsOut + soft + chhutti + calm,
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
  const earnedXpBy: number[] = [], bonusBy: number[] = [];
  for (const day of days) {
    const rules = rulesFor(day.dayKey, history)?.rules ?? RULES;
    totalXp += day.total;
    earnedFromXp += day.total * rules.shards.perXp;
    const candidate = Math.floor((1 + Math.sqrt(1 + 8 * totalXp / rules.level.stepBase)) / 2);
    if (candidate > level) { levelShardBonus += (candidate - level) * rules.shards.levelUpBonus; level = candidate; }
    // Exact, not rounded down: a late fact on an earlier day then moves a close's earnings and the end's by the same
    // amount, so the Shards floor never loses a rounding Shard (cj3 fuzz seeds 2099, 2117). Only shown numbers round.
    earnedXpBy.push(earnedFromXp + levelShardBonus); bonusBy.push(levelShardBonus);
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
    // Signed: a day that spent look-ahead Shards ends below zero, and its close must say so (cj3 B).
    daily.set(key, { streak: streakBy[i]!.streak, paused: streakBy[i]!.paused, earned, bonus: bonusBy[i]!, balance: Math.floor(earned) - spentSoFar, owned: [...ownedSoFar], purchases: ofDay });
  }
  return { daily, accepted, balance, view: { days, totalXp, level, nextLevelXp: xpToReach(level + 1, (rulesFor(today, history)?.rules ?? RULES).level.stepBase), season: { index: current.index, start: current.start, end: current.end, active, sp, target, rank, tier: tierFor(rank), seed, nextSeed, placesThisWeek }, streak: { days: streakDays, restDays, restDaysUsed, restUsedYesterday, paused, gold, restored, canRepair: paused && breakAt >= 0 && breakAt + 2 + restShift - (days.length - 1) + 1 - (days.at(-1)?.hatTrick ? 1 : 0) >= RULES.streak.repairHatTricks - repair }, cleanWeek: { count, days: thisWeek, complete: count >= RULES.streak.cleanWeekHatTricks, streak: cleanStreak }, shards: Math.max(0, balance), owned } };
}
