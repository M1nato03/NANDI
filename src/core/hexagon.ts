import { RULES } from './rules.config';
import { addEconomyDays, deriveEconomy } from './economy/deriveEconomy';
import type { DayKey, LearnDropRow, LedgerRow, PlanRow, ProgramRow, PuzzleRunRow, SettingRow, TaskEventRow, TaskRow } from '../data/types';

/** Spec 05 §8: six stats over the last 28 days, 0–100 each. A stat with nothing to measure yet is null. */
export type HexKey = 'drive' | 'body' | 'mind' | 'recall' | 'wisdom' | 'discipline';
export type HexStat = { key: HexKey; label: string; value: number | null; about: string };
export type HexSources = {
  ledger: LedgerRow[]; tasks: TaskRow[]; events: TaskEventRow[]; puzzleRuns: PuzzleRunRow[];
  plans: PlanRow[]; programs: ProgramRow[]; drops: LearnDropRow[]; settings: SettingRow[];
};
export const HEX_WINDOW_DAYS = 28;
export const HEX_SHOW_AFTER_DAYS = 7;

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
/** Weighted parts; a part with no data drops out and the others share its weight. */
function blend(parts: [weight: number, share: number | null][]): number | null {
  const known = parts.filter((part): part is [number, number] => part[1] !== null);
  const weight = known.reduce((sum, [w]) => sum + w, 0);
  return weight ? clamp(known.reduce((sum, [w, share]) => sum + w * share, 0) / weight * 100) : null;
}
const share = (part: number, total: number) => total ? part / total : null;
const dayStart = (key: DayKey) => new Date(`${key}T04:00:00`).getTime();

export function hexagon(today: DayKey, source: HexSources): { days: number; stats: HexStat[] } {
  const ledger = source.ledger.filter(row => !row.deleted);
  const firstUse = ledger.reduce<DayKey | undefined>((first, row) => !first || row.dayKey < first ? row.dayKey : first, undefined);
  const windowStart = addEconomyDays(today, 1 - HEX_WINDOW_DAYS);
  const start = firstUse && firstUse > windowStart ? firstUse : windowStart;
  const days = firstUse && firstUse <= today ? Math.round((dayStart(today) - dayStart(start)) / 86_400_000) + 1 : 0;
  const inDay = (key: DayKey | undefined) => key !== undefined && key >= start && key <= today;
  const startAt = dayStart(start), endAt = dayStart(addEconomyDays(today, 1));
  const inTime = (at: number | undefined) => at !== undefined && at >= startAt && at < endAt;
  const facts = ledger.filter(row => inDay(row.dayKey));
  const dayCount = (rows: LedgerRow[]) => new Set(rows.map(row => row.dayKey)).size;

  // Drive: planned tasks done on their first day, and timed tasks started near their time.
  const tasks = source.tasks.filter(row => !row.deleted);
  const due = tasks.filter(row => row.status !== 'someday' && inDay(row.firstScheduledDayKey) && (row.firstScheduledDayKey! < today || row.doneAt !== undefined));
  const dueIds = new Set(due.map(row => row.id));
  const firstDay = facts.filter(row => row.mode === 'tasks' && row.kind === 'done' && row.inputs.isFirstDay === true && dueIds.has(row.refId)).length;
  const byId = new Map(tasks.map(row => [row.id, row]));
  const started = new Set<string>();
  let adherent = 0;
  for (const event of source.events.filter(row => !row.deleted && row.kind === 'started' && inTime(row.at)).sort((a, b) => a.at - b.at)) {
    const task = byId.get(event.taskId);
    if (!task?.scheduledStart || started.has(task.id)) continue;
    started.add(task.id);
    if (Math.abs(event.at - task.scheduledStart) <= RULES.tasks.startAdherenceWindowMin * 60_000) adherent++;
  }
  const drive = blend([[50, share(firstDay, due.length)], [50, share(adherent, started.size)]]);

  // Body: sessions against the weekly target for the days counted, plus up to +10 for new bests.
  const target = source.programs.find(row => !row.deleted)?.weeklyTarget ?? RULES.train.weeklyTarget;
  const sessions = new Set(facts.filter(row => row.mode === 'train' && row.kind === 'session').map(row => row.refId)).size;
  const bests = facts.filter(row => row.mode === 'train' && row.kind === 'pr').length;
  const expected = target * days / 7;
  const body = days && expected ? clamp(100 * Math.min(1, sessions / expected) + Math.min(10, bests * 2.5)) : null;

  // Mind: days with the featured board solved, a no-hint clear counting in full and a hinted one at three quarters.
  const activeDays = dayCount(facts);
  const boardDays = new Map<DayKey, number>();
  for (const run of source.puzzleRuns) if (!run.deleted && run.daily && run.type !== 'mystery' && run.result === 'solved' && inDay(run.dayKey))
    boardDays.set(run.dayKey!, Math.max(boardDays.get(run.dayKey!) ?? 0, (run.hintsUsed ?? 0) ? 0.75 : 1));
  const mind = activeDays ? clamp(100 * [...boardDays.values()].reduce((sum, weight) => sum + weight, 0) / activeDays) : null;

  // Recall: due reviews done × how often they were remembered.
  const drops = source.drops.filter(row => !row.deleted && row.drop.id.startsWith('drop:daily:') && inDay(row.drop.id.slice('drop:daily:'.length)));
  const reviewMode = new Map<string, Set<string>>();
  let offered = 0, answered = 0;
  for (const { drop } of drops) {
    const reviews = drop.items.map((item, index) => ({ item, index })).filter(({ item }) => item.mode !== 'new' && !item.lesson);
    reviewMode.set(drop.id, new Set(reviews.map(({ item }) => item.itemId)));
    offered += reviews.length;
    answered += reviews.filter(({ index }) => index < drop.cursor).length;
  }
  const recalls = facts.filter(row => row.mode === 'mind' && typeof row.inputs.correct === 'boolean' && (row.kind === 'learn-retention' || row.kind === 'card'
    || row.kind === 'learn-answer' && reviewMode.get(String(row.inputs.dropId))?.has(String(row.inputs.itemId))));
  const rate = share(recalls.filter(row => row.inputs.correct === true).length, recalls.length);
  const recall = rate === null ? null : clamp(100 * (share(answered, offered) ?? 1) * rate);

  // Wisdom: days with a lesson, and if-then plans that fired (yes or partly).
  const lessonDays = dayCount(facts.filter(row => row.mode === 'mind' && (row.kind === 'learn-lesson' || row.kind === 'lesson' || row.kind === 'learn-drop' || row.kind === 'learn-answer' && String(row.inputs.dropId).startsWith('drop:daily:'))));
  const fired = source.plans.filter(row => !row.deleted && inTime(row.updatedAt) && (row.fired === 'yes' || row.fired === 'partly' || row.fired === 'no'));
  const wisdom = blend([[50, share(lessonDays, days)], [50, share(fired.filter(row => row.fired !== 'no').length, fired.length)]]);

  // Discipline: nights with lights-out on target, and Clean Weeks in each full week counted.
  const nights = dayCount(facts.filter(row => row.kind === 'lightsout' && row.inputs.metTarget === true && row.inputs.backfill !== true));
  const weeks = Math.floor(days / 7);
  let clean = 0;
  if (weeks) {
    const hatTricks = new Set(deriveEconomy(source.ledger, undefined, source.settings, today).days.filter(day => day.hatTrick).map(day => day.dayKey));
    for (let week = 0; week < weeks; week++) {
      const last = addEconomyDays(today, -7 * week);
      if (Array.from({ length: 7 }, (_, index) => addEconomyDays(last, -index)).filter(key => hatTricks.has(key)).length >= RULES.streak.cleanWeekHatTricks) clean++;
    }
  }
  const discipline = blend([[70, share(nights, days)], [30, share(clean, weeks)]]);

  return { days, stats: [
    { key: 'drive', label: 'Drive', value: drive, about: 'Planned tasks done on their day, and started on time' },
    { key: 'body', label: 'Body', value: body, about: 'Workouts against your weekly target, plus new bests' },
    { key: 'mind', label: 'Mind', value: mind, about: 'Days with the daily board solved; no-hint clears count most' },
    { key: 'recall', label: 'Recall', value: recall, about: 'Reviews done, times how often you remembered' },
    { key: 'wisdom', label: 'Wisdom', value: wisdom, about: 'Days with a lesson, and if-then plans that worked' },
    { key: 'discipline', label: 'Discipline', value: discipline, about: 'Nights with lights out on time, and Clean Weeks' },
  ] };
}
