import type { FocusRow, LedgerRow, SessionRow, TaskRow } from '../../data/types';
import { weekStart } from '../economy/deriveEconomy';
import { focusElapsedMs } from '../tasks/focus';
import { dayKey } from '../time/dayKey';

/**
 * Spec 45b: Home shows exactly one next move. It is read from existing rows, in a fixed order: an open focus first,
 * then the next-day Book check, then a Train day, then a task planned for today, and otherwise a Read sitting.
 * A soft day skips Train and tasks, so the card never pushes on a tired or low day.
 * Spec 42's track practice joins this order (second when no Book check is due) once it ships; there is no second card.
 */
export type NextMove =
  | { kind: 'focus'; title: string; running: boolean; route: 'plan' }
  | { kind: 'book-check'; route: string }
  | { kind: 'train'; route: 'yatra/train' }
  | { kind: 'task'; title: string; at?: number; route: 'plan' }
  | { kind: 'read'; route: 'read' };

export type NextMoveInput = {
  focus: { title: string; running: boolean } | null;
  bookCheck: { topicId: string; moduleId: string } | null;
  /** Today is one of the Train days and no session has filled it yet. */
  trainToday: boolean;
  /** Today's open tasks, as the Plan tab holds them. */
  tasks: readonly Pick<TaskRow, 'title' | 'status' | 'dayKey' | 'scheduledStart' | 'mustOrCould' | 'deleted' | 'parentId'>[];
  today: string;
  softDay: boolean;
};

const OPEN = new Set(['planned', 'unplaced']);

export function nextMove(input: NextMoveInput): NextMove {
  if (input.focus) return { kind: 'focus', title: input.focus.title, running: input.focus.running, route: 'plan' };
  if (input.bookCheck) return { kind: 'book-check', route: `read/check/${input.bookCheck.topicId}/${input.bookCheck.moduleId}` };
  if (!input.softDay) {
    if (input.trainToday) return { kind: 'train', route: 'yatra/train' };
    // A timed task first (earliest), then a must, then the rest in the order they came.
    const open = input.tasks.filter(task => !task.deleted && !task.parentId && task.dayKey === input.today && OPEN.has(task.status));
    const rank = (task: (typeof open)[number]) => [task.scheduledStart ?? Infinity, task.mustOrCould === 'must' ? 0 : 1] as const;
    const task = [...open].sort((a, b) => { const [x1, y1] = rank(a), [x2, y2] = rank(b); return x1 - x2 || y1 - y2; })[0];
    if (task) return { kind: 'task', title: task.title, ...(task.scheduledStart != null ? { at: task.scheduledStart } : {}), route: 'plan' };
  }
  return { kind: 'read', route: 'read' };
}

/** A session left open by mistake cannot fill the week: one session counts at most this long. */
export const SESSION_CAP_MS = 3 * 60 * 60_000;
const COUNTED = new Set<SessionRow['status']>(['completed', 'minimum', 'partial', 'safety']);

export type RecordedWeek = { minutes: number; focus: number; train: number; calm: number; ideas: number };

/**
 * Spec 45b (jenil-87 decision 1): Home's top line is this week's RECORDED time, never an estimate of time won back.
 * Only clocks the app ran count: focus timers (less their pauses), Train sessions from start to end, and minutes sat
 * in Calm. Book sittings keep no clock, so they are counted as ideas read, not minutes. The week starts on Monday.
 */
export function recordedWeek(input: { focus: readonly FocusRow[]; sessions: readonly SessionRow[]; ledger: readonly LedgerRow[]; today: string; now: number }): RecordedWeek {
  const from = weekStart(input.today);
  const inWeek = (key: string) => key >= from && key <= input.today;
  // A row with a broken time is skipped, never a reason for Home to fail.
  const focusMs = input.focus.filter(row => !row.deleted && Number.isFinite(row.startedAt) && inWeek(dayKey(row.startedAt)))
    .reduce((sum, row) => sum + Math.max(0, focusElapsedMs(row, input.now)), 0);
  const trainMs = input.sessions.filter(row => !row.deleted && COUNTED.has(row.status) && Number.isFinite(row.startedAt) && Number.isFinite(row.endedAt) && inWeek(dayKey(row.startedAt!)))
    .reduce((sum, row) => sum + Math.min(SESSION_CAP_MS, Math.max(0, row.endedAt! - row.startedAt!)), 0);
  const live = input.ledger.filter(row => !row.deleted && inWeek(row.dayKey));
  const calm = live.filter(row => row.mode === 'calm' && row.kind === 'session')
    .reduce((sum, row) => sum + (Number(row.inputs.minutes) > 0 ? Math.floor(Number(row.inputs.minutes)) : 0), 0);
  const ideas = live.filter(row => row.mode === 'read' && row.kind === 'idea').length;
  const focus = Math.floor(focusMs / 60_000), train = Math.floor(trainMs / 60_000);
  return { minutes: focus + train + calm, focus, train, calm, ideas };
}

/** "2 h 10 m", "45 m". */
export function hoursMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return h ? `${h} h ${m} m` : `${m} m`;
}

/** What filled the week, in plain words: "focus, moving, breathing", only the parts that have minutes. */
export function weekParts(week: RecordedWeek): string {
  return [week.focus && 'focus', week.train && 'moving', week.calm && 'breathing'].filter(Boolean).join(', ');
}
