import { dayKey } from './time/dayKey';
import { sessionCounts } from './train/counts';
import { nightsBackOnPlan } from './nightPlan';
import { focusElapsedMs } from './tasks/focus';
import type { DailyLogRow, FocusRow, LearnConceptRow, LedgerRow, QuestRow, SessionRow, TaskRow } from '../data/types';

export type RecapSources = { tasks: TaskRow[]; focus: FocusRow[]; sessions: SessionRow[]; quests: QuestRow[]; concepts: LearnConceptRow[]; logs: DailyLogRow[]; ledger: LedgerRow[] };
export type WeeklyRecapData = { from: string; to: string; tasks: number; focusMinutes: number; longestFocusMinutes: number; workouts: number; sideQuests: number; concepts: number; nights: number; chapters: number; realMs: number };
export type RecapWindow = { from: string; to: string; start: number; end: number };

function localKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** The latest complete week starts on the previous Monday at 04:00 local time. */
export function recapWindow(now: number): RecapWindow {
  const planningDay = new Date(`${dayKey(now)}T12:00:00`);
  planningDay.setDate(planningDay.getDate() - ((planningDay.getDay() + 6) % 7));
  const currentMonday = localKey(planningDay);
  planningDay.setDate(planningDay.getDate() - 7);
  const previousMonday = localKey(planningDay);
  return { from: previousMonday, to: currentMonday, start: new Date(`${previousMonday}T04:00:00`).getTime(), end: new Date(`${currentMonday}T04:00:00`).getTime() };
}

const live = (row: { deleted: number }) => !row.deleted;

/** Each focus's paid time inside the week, clipped at both edges. */
function focusSpans(week: RecapWindow, focus: FocusRow[]): number[] {
  return focus.filter(live).map(row => {
    const until = row.endedAt ?? week.start;
    if (until <= week.start || row.startedAt >= week.end) return 0;
    const running = { ...row, endedAt: undefined };
    return Math.max(0, focusElapsedMs(running, Math.min(week.end, until)) - focusElapsedMs(running, Math.max(week.start, row.startedAt)));
  });
}

/** Train sessions that count (the one session count used everywhere), by when they ended. */
const countedSessions = (week: RecapWindow, sessions: SessionRow[]) => sessions.filter(row => live(row) && sessionCounts(row) && row.endedAt != null && row.endedAt >= week.start && row.endedAt < week.end);

const SESSION_CAP_MS = 3 * 3_600_000;

/**
 * Spec 53: REAL THINGS is measured time only: focus (clipped to the week), Train sessions that count with both stamps
 * (each capped at 3 h) and the minutes sat in Calm. Reading, self-reported acts and anything from phone usage never
 * count. Every source uses the same week, Monday 04:00 to Monday 04:00: a Calm row's dayKey is that planning day.
 */
export function realThingsMs(week: RecapWindow, source: Pick<RecapSources, 'focus' | 'sessions' | 'ledger'>): number {
  const focus = focusSpans(week, source.focus).reduce((total, ms) => total + ms, 0);
  const train = countedSessions(week, source.sessions).reduce((total, row) => row.startedAt == null || row.endedAt == null || row.endedAt <= row.startedAt ? total : total + Math.min(SESSION_CAP_MS, row.endedAt - row.startedAt), 0);
  const calm = source.ledger.filter(row => live(row) && row.mode === 'calm' && row.kind === 'session' && row.dayKey >= week.from && row.dayKey < week.to)
    .reduce((total, row) => total + Math.max(0, Number(row.inputs.minutes) || 0) * 60_000, 0);
  return focus + train + calm;
}

export function buildRecap(now: number, source: RecapSources): WeeklyRecapData {
  const week = recapWindow(now);
  const { from, to, start, end } = week;
  const inside = (at?: number) => at != null && at >= start && at < end;
  const spans = focusSpans(week, source.focus);
  return {
    from, to,
    tasks: source.tasks.filter(row => live(row) && inside(row.doneAt)).length,
    focusMinutes: Math.floor(spans.reduce((total, ms) => total + ms, 0) / 60_000),
    longestFocusMinutes: Math.floor(Math.max(0, ...spans) / 60_000),
    workouts: countedSessions(week, source.sessions).length,
    sideQuests: source.quests.filter(row => live(row) && row.status === 'done' && inside(row.updatedAt)).length,
    concepts: source.concepts.filter(row => live(row) && inside(row.firstLearnedAt)).length,
    nights: nightsBackOnPlan(source.logs.filter(row => row.dayKey >= from && row.dayKey < to)),
    // One ledger row per finished chapter (saveChapterDone); a re-read writes nothing.
    chapters: source.ledger.filter(row => live(row) && row.mode === 'read' && row.kind === 'chapter' && row.dayKey >= from && row.dayKey < to).length,
    realMs: realThingsMs(week, source),
  };
}

/** The receipt's subline: "week of 2–8 Nov", with " · so far" while the week is still open. */
export const receiptWeek = (content: ReceiptContent) => `week of ${content.dates}${content.soFar ? ' · so far' : ''}`;

/** "4 h 10 m", or "45 m" under an hour. */
export function receiptDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  return hours ? `${hours} h ${rest} m` : `${rest} m`;
}

export type ReceiptLine = { label: string; value: string };
/** Spec 53: the footer slots the crew and Baithak specs fill later; empty until then. */
export type ReceiptSlots = { crew?: string; baithak?: string };
/** `soFar`: before Sunday 18:00 the week is still open (You's card mid-week), so the receipt never reads as a closed week. */
/** `heading` and `subline` let another card (spec 54's payout) use the same paper; the receipt leaves them unset. */
export type ReceiptContent = { dates: string; soFar: boolean; lines: ReceiptLine[]; total?: string; highlight?: string; slots: ReceiptSlots; heading?: string; subline?: string };

export const RECEIPT_MAX_LINES = 6;
export const RECEIPT_TOTAL_MIN_MS = 30 * 60_000;

/**
 * The receipt holds only aggregate counts and durations: no task, book or topic title, no app name, no time of day.
 * Nonzero lines in a fixed order, at most six; the total shows from 30 min, rounded down to 10 min. No filler line.
 */
export function receiptContent(recap: WeeklyRecapData, now = Number.POSITIVE_INFINITY): ReceiptContent {
  const candidates: [number, ReceiptLine][] = [
    [recap.chapters, { label: 'Chapters read', value: String(recap.chapters) }],
    [recap.concepts, { label: 'Ideas learned', value: String(recap.concepts) }],
    [recap.workouts, { label: 'Workouts', value: String(recap.workouts) }],
    [recap.focusMinutes, { label: 'Focus', value: receiptDuration(recap.focusMinutes) }],
    [recap.tasks, { label: 'Tasks done', value: String(recap.tasks) }],
    [recap.nights, { label: 'Nights back on plan', value: String(recap.nights) }],
    [recap.sideQuests, { label: 'Side quests', value: String(recap.sideQuests) }],
  ];
  const end = new Date(`${recap.to}T12:00:00`);
  end.setDate(end.getDate() - 1);
  const from = new Date(`${recap.from}T12:00:00`);
  const month = new Intl.DateTimeFormat('en', { month: 'short' });
  const dates = from.getMonth() === end.getMonth()
    ? `${from.getDate()}–${end.getDate()} ${month.format(end)}`
    : `${from.getDate()} ${month.format(from)}–${end.getDate()} ${month.format(end)}`;
  return {
    dates,
    // From Sunday 18:00 it is the week's receipt (the Sunday link says so), even if a late act still lands before Monday 04:00.
    soFar: now < new Date(`${recap.to}T04:00:00`).getTime() - 10 * 3_600_000,
    lines: candidates.filter(([count]) => count > 0).slice(0, RECEIPT_MAX_LINES).map(([, line]) => line),
    total: recap.realMs >= RECEIPT_TOTAL_MIN_MS ? receiptDuration(Math.floor(recap.realMs / 600_000) * 10) : undefined,
    highlight: recap.longestFocusMinutes > 0 ? `Longest focus: ${recap.longestFocusMinutes} min` : undefined,
    slots: {},
  };
}

/** The share text carries the same lines as the image, and nothing else. */
export function receiptShareLines(content: ReceiptContent): string[] {
  return [...content.lines.map(line => `${line.label} ${line.value}`), ...(content.total ? [`Real things ${content.total}`] : [])];
}

/** You's "This week in words": up to four nonzero numbers, each label singular at 1 ("1 task finished", "1 workout"). */
export function youWeekNumbers(recap: WeeklyRecapData): { value: number; label: string }[] {
  const hours = Math.round(recap.focusMinutes / 6) / 10;
  return [
    { value: recap.tasks, label: recap.tasks === 1 ? 'task finished' : 'tasks finished' },
    { value: recap.workouts, label: recap.workouts === 1 ? 'workout' : 'workouts' },
    { value: recap.concepts, label: recap.concepts === 1 ? 'idea learned' : 'ideas learned' },
    { value: hours, label: hours === 1 ? 'focus hour' : 'focus hours' },
    { value: recap.nights, label: recap.nights === 1 ? 'night back on plan' : 'nights back on plan' },
    { value: recap.sideQuests, label: recap.sideQuests === 1 ? 'side quest completed' : 'side quests completed' },
  ].filter(item => item.value > 0).slice(0, 4);
}
