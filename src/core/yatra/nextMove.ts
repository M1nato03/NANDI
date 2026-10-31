import type { TaskRow } from '../../data/types';

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
