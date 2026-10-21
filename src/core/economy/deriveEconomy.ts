import { RULES, RULES_HISTORY, rulesFor, type RulesHistoryEntry } from '../rules.config';
import { calculateTasksDayXp, replayFactShards, replayFactXp } from './awards';
import type { LedgerRow, SettingRow } from '../../data/types';

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
}
export interface EconomyView {
  days: EconomyDay[]; totalXp: number; level: number; nextLevelXp: number;
  season: { index: number; start: string; end: string; active: boolean; sp: number; target: number; rank: number; tier: string; seed: number; nextSeed: number; placesThisWeek: number };
  streak: { days: number; restDays: number; restDaysUsed: number; restUsedYesterday: boolean; paused: boolean; gold: boolean; restored: boolean };
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

export function deriveEconomy(
  facts: readonly LedgerRow[], history: readonly RulesHistoryEntry[] = RULES_HISTORY,
  settings: readonly SettingRow[] | Record<string, unknown> = [], today: string,
): EconomyView {
  const seen = new Set<string>();
  const ordered = [...facts].filter(fact => valid(fact) && fact.dayKey <= today).sort((a, b) => a.dayKey.localeCompare(b.dayKey) || a.updatedAt - b.updatedAt || a.id.localeCompare(b.id)).filter(fact => {
    if (seen.has(fact.id)) return false;
    seen.add(fact.id); return true;
  });
  const byDay = new Map<string, LedgerRow[]>();
  for (const fact of ordered) byDay.set(fact.dayKey, [...(byDay.get(fact.dayKey) ?? []), fact]);
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
    const rest = bestSession ? 0 : Math.max(0, ...rows.filter(row => row.mode === 'train' && row.kind === 'rest').map(row => replayFactXp(row, history)));
    const prs = rows.filter(row => row.mode === 'train' && row.kind === 'pr').slice(0, rules.train.prMaxPerDay).reduce((sum, row) => sum + replayFactXp(row, history), 0);
    const train = Math.min(rules.train.dailyCapExclWeekly, bestSession + rest + prs);
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
    const learnDrop = mindRows.some(row => row.kind === 'learn-drop') || learnAnswers.size >= 5;
    const mind = Math.min(rules.mind.dailyCap,
      (caseSolved ? rules.mind.mysteryXp : 0) + (dailyBoard ? rules.mind.dropBoardXp : 0) +
      count('lesson', rules.mind.lessonsPaidPerDay, rules.mind.lessonXp) +
      Math.min(cards.length, rules.mind.cardsMaxPerDay) * rules.mind.cardXp +
      mindRows.filter(row => row.kind === 'board' && row.inputs.daily === false).slice(0, rules.mind.sideBoardsMaxPerDay).length * rules.mind.sideBoardXp +
      (learnDrop ? rules.mind.learnDropXp : 0) + rows.filter(row => row.mode === 'gamify' && row.kind === 'perfect-drop').reduce((sum, row) => sum + replayFactXp(row, history), 0));
    const mindSlot = learnDrop || caseSolved || dailyBoard || cards.length >= rules.streak.minDueCardsForMark;
    const plannedTask = rows.some(row => row.mode === 'tasks' && row.kind === 'done' && (row.inputs.planned === true || row.inputs.wasPlanned === true || row.inputs.hadTimeSlot === true || row.inputs.must === true || row.inputs.isFirstDay === true || row.inputs.scheduledStart != null));
    const body = bestSession > 0 || rest > 0;
    const hatTrick = plannedTask && body && mindSlot;
    const lightsOut = rows.some(row => row.kind === 'lightsout' && row.inputs.metTarget === true && row.inputs.backfill !== true) ? rules.bonuses.lightsOutXp : 0;
    const quests = rows.filter(row => row.mode === 'quests' && row.kind === 'quest').reduce((sum, row) => sum + replayFactXp(row, history), 0);
    const boost = rows.find(row => row.kind === 'focus-boost');
    const focus = boost ? rows.filter(row => row.updatedAt > boost.updatedAt && row.updatedAt <= boost.updatedAt + rules.gamify.focusMinutes * 60_000 && row.kind !== 'focus-boost')
      .reduce((sum, row) => {
        let award = replayFactXp(row, history);
        if (row.mode === 'mind' && row.kind === 'learn-answer' && row.inputs.dropId === `drop:daily:${key}` && beforeBed(row)) {
          const before = rows.slice(0, rows.indexOf(row) + 1).filter(candidate => candidate.mode === 'mind' && candidate.kind === 'learn-answer' && candidate.inputs.dropId === `drop:daily:${key}` && beforeBed(candidate));
          if (before.length === 5) award = rules.mind.learnDropXp;
        }
        return sum + award * (rules.gamify.focusMultiplier - 1);
      }, 0) : 0;
    // Spec 15: one gentle thing on a tired or low day keeps the day. It is never a Hat-trick slot.
    const soft = rows.some(row => row.kind === 'soft') ? rules.soft.dayXp : 0;
    days.push({ dayKey: key, tasks, train, mind, weekly, quests, focus, hatTrick, lightsOut, soft, welcome: 0,
      total: tasks + train + mind + weekly + quests + focus + (hatTrick ? rules.bonuses.hatTrickXp : 0) + lightsOut + soft,
      mark: plannedTask || body || mindSlot || soft > 0, body, mindSlot });
  }
  // Spec 15 D: the first marked day after an unmarked one gets a fixed, announced gift. Chosen weekly rest days
  // are not misses, so walk back over them: a gap that is only the rest day gets nothing, a longer one does.
  const isRestDay = (key: string) => (value(settings, `economy.restWeekday:${weekStart(key)}`) ?? value(settings, 'economy.restWeekday')) === new Date(atUtc(key)).getUTCDay();
  let everMarked = false;
  for (let i = 0; i < days.length; i++) {
    const day = days[i]!;
    const rules = rulesFor(day.dayKey, history)?.rules ?? RULES;
    if (day.mark && everMarked && day.dayKey >= rules.soft.from) {
      let j = i - 1;
      while (j >= 0 && !days[j]!.mark && isRestDay(days[j]!.dayKey)) j--;
      if (j >= 0 && !days[j]!.mark) { day.welcome = rules.soft.welcomeBackXp; day.total += day.welcome; }
    }
    if (day.mark) everMarked = true;
  }
  let totalXp = 0, level = 1, earnedFromXp = 0, levelShardBonus = 0;
  for (const day of days) {
    const rules = rulesFor(day.dayKey, history)?.rules ?? RULES;
    totalXp += day.total;
    earnedFromXp += day.total * rules.shards.perXp;
    const candidate = Math.floor((1 + Math.sqrt(1 + 8 * totalXp / rules.level.stepBase)) / 2);
    if (candidate > level) { levelShardBonus += (candidate - level) * rules.shards.levelUpBonus; level = candidate; }
  }
  const current = seasonFor(today < '2026-11-02' ? '2026-11-02' : today);
  const active = today >= '2026-11-02';
  // Spec 15 B: the Season counts the real slots only, so soft-day and welcome-back XP stay out of SP.
  const daySp = (day: { total: number; soft: number; welcome: number } | undefined) => day ? Math.min(day.total - day.soft - day.welcome, RULES.season.spDailyCap) : 0;
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
  let breakAt = -1, repair = 0, markedDays = 0;
  for (let i = 0; i < days.length; i++) {
    const day = days[i]!;
    if (i === 0 || day.dayKey.slice(0, 7) !== days[i - 1]!.dayKey.slice(0, 7))
      restDays = Math.min(RULES.streak.restBankMax, restDays + RULES.streak.restBankMonthly);
    const weekday = new Date(atUtc(day.dayKey)).getUTCDay();
    const restWeekday = value(settings, `economy.restWeekday:${weekStart(day.dayKey)}`) ?? value(settings, 'economy.restWeekday');
    const isRest = typeof restWeekday === 'number' && restWeekday === weekday;
    const purchases = byDay.get(day.dayKey)?.filter(row => row.kind === 'purchase' && row.inputs.itemId === 'freeze' && row.inputs.price === purchasePrices.freeze).length ?? 0;
    restDays = Math.min(RULES.streak.restBankMax, restDays + purchases);
    if (day.mark) {
      if (paused && breakAt >= 0 && i - breakAt <= 2) {
        if (day.hatTrick) repair++;
        if (repair >= RULES.streak.repairHatTricks) { paused = false; restored = true; streakDays += i - breakAt + 1; repair = 0; breakAt = -1; }
      } else if (paused) {
        // The 48 h earn-back window has passed: a marked day starts a fresh streak.
        paused = false; restored = false; streakDays = 1; markedDays = 1; repair = 0; breakAt = -1;
      } else {
        streakDays++; markedDays++;
        if (markedDays >= RULES.streak.goldAfterDays) gold = true;
      }
    } else if (isRest) { if (!paused) streakDays++; }
    else if (i < days.length - 1) {
      if (!paused && restDays > 0) { restDays--; restDaysUsed++; restUsedYesterday = i === days.length - 2; markedDays = 0; gold = false; }
      else if (!paused) { paused = true; breakAt = i; repair = 0; gold = false; }
      else if (breakAt >= 0 && i - breakAt > 2) { streakDays = 0; breakAt = -1; repair = 0; }
    }
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
  for (let seasonStart = '2026-11-02'; seasonStart < current.start; seasonStart = addEconomyDays(seasonFor(seasonStart).end, 1)) {
    const season = seasonFor(seasonStart);
    if (season.end >= today) break;
    const finalRank = rankFor(seasonSp(season) + seedFor(season), targetFor(season));
    const awardRules = rulesFor(season.end, history)?.rules ?? RULES;
    seasonAward += awardRules.shards.seasonEnd[tierFor(finalRank) as keyof typeof RULES.shards.seasonEnd];
  }
  let balance = Math.floor(earnedFromXp) + levelShardBonus + seasonAward;
  balance += ordered.reduce((sum, row) => sum + replayFactShards(row, history), 0);
  const owned: string[] = [];
  for (const row of ordered.filter(row => row.kind === 'purchase')) {
    const price = Number(row.inputs.price);
    const id = row.inputs.itemId;
    if (typeof id !== 'string' || price !== purchasePrices[id] || price > balance) continue;
    if (id !== 'freeze' && owned.includes(id)) continue;
    balance -= price; if (id !== 'freeze') owned.push(id);
  }
  return { days, totalXp, level, nextLevelXp: xpToReach(level + 1, (rulesFor(today, history)?.rules ?? RULES).level.stepBase), season: { index: current.index, start: current.start, end: current.end, active, sp, target, rank, tier: tierFor(rank), seed, nextSeed, placesThisWeek }, streak: { days: streakDays, restDays, restDaysUsed, restUsedYesterday, paused, gold, restored }, cleanWeek: { count, days: thisWeek, complete: count >= RULES.streak.cleanWeekHatTricks, streak: cleanStreak }, shards: Math.max(0, balance), owned };
}
