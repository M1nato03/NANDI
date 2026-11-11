import type { TaskRow } from '../data/types';
import type { Goal, PickSize } from './welcome';

/**
 * Spec 45b, spec 52: the one next move. Home's card and the Pause card's in-app choice both read it, so they never
 * disagree. It is read from existing rows, in a fixed order: an open focus first, then the next-day Book check, then a
 * Train day, then a task planned for today, and otherwise the first picked area's own move.
 * - At size 'all' (every install from before spec 52) the order is the spec 45b order, unchanged.
 * - At 'two' or 'more', Train and tasks come only when they are picked, and the last step is the first picked area's.
 * - A soft day skips Train and tasks, so the card never pushes on a tired or low day.
 * Every route lands in the thing itself (the chapter at its next idea, today's board, the workout), not on a tab's
 * front page. Spec 42's track practice joins this order once it ships; there is no second card.
 */
export type NextMove =
  | { kind: 'focus'; title: string; running: boolean; route: 'plan' }
  | { kind: 'book-check'; route: string }
  | { kind: 'train'; route: 'yatra/train' }
  | { kind: 'task'; title: string; at?: number; route: 'plan' }
  /** A chapter at its next idea, or the Read tab when every book is finished or it is after bedtime (no new chapters). */
  | { kind: 'read'; route: string; book?: string; chapter?: number }
  | { kind: 'board'; route: 'yatra/mind/board/daily' }
  | { kind: 'train-easy'; route: 'yatra/train/easy' }
  /** A rest beat: the Train page opened on its rest-day check. */
  | { kind: 'walk'; route: 'yatra/train/rest' }
  | { kind: 'plan-day'; route: 'plan/morning' }
  | { kind: 'tonight'; route: 'you/tonight' }
  | { kind: 'night'; route: 'night' }
  /** A soft day whose picks are only Train and Plan: the soft day's own gentle thing (Plan shows it on a soft day). */
  | { kind: 'soft'; route: 'plan' };

export type NextMoveInput = {
  focus: { title: string; running: boolean } | null;
  bookCheck: { topicId: string; moduleId: string } | null;
  /** Today is one of the Train days and no session has filled it yet. */
  trainToday: boolean;
  /** Today's open tasks, as the Plan tab holds them. */
  tasks: readonly Pick<TaskRow, 'title' | 'status' | 'dayKey' | 'scheduledStart' | 'mustOrCould' | 'deleted' | 'parentId'>[];
  today: string;
  softDay: boolean;
  /** The person's picks in tap order, and how many things NANDI offers (spec 52). */
  goals: readonly Goal[];
  size: PickSize;
  afterBedtime: boolean;
  /** The book Read's Continue offers and its open chapter (1-based), or null when every book is finished. */
  reading: { topicId: string; moduleId: string; book: string; chapter: number } | null;
  /** Train's own move when today is not a Train day to fill: no program yet, a rest beat, or today already trained. */
  train: 'easy' | 'rest' | 'done';
};

const OPEN = new Set(['planned', 'unplaced']);

function todaysTask(input: NextMoveInput): NextMove | undefined {
  // A timed task first (earliest), then a must, then the rest in the order they came.
  const open = input.tasks.filter(task => !task.deleted && !task.parentId && task.dayKey === input.today && OPEN.has(task.status));
  const rank = (task: (typeof open)[number]) => [task.scheduledStart ?? Infinity, task.mustOrCould === 'must' ? 0 : 1] as const;
  const task = [...open].sort((a, b) => { const [x1, y1] = rank(a), [x2, y2] = rank(b); return x1 - x2 || y1 - y2; })[0];
  return task && { kind: 'task', title: task.title, ...(task.scheduledStart != null ? { at: task.scheduledStart } : {}), route: 'plan' };
}

function readMove(input: NextMoveInput): NextMove {
  const at = input.reading;
  if (!at || input.afterBedtime) return { kind: 'read', route: 'read' };
  return { kind: 'read', route: `read/chapter/${at.topicId}/${at.moduleId}`, book: at.book, chapter: at.chapter };
}

/** One picked area's own move; undefined when that area has nothing to offer today (Train already done). */
function areaMove(area: Goal, input: NextMoveInput): NextMove | undefined {
  switch (area) {
    case 'learn': return readMove(input);
    case 'mind': return { kind: 'board', route: 'yatra/mind/board/daily' };
    case 'train': return input.train === 'easy' ? { kind: 'train-easy', route: 'yatra/train/easy' } : input.train === 'rest' ? { kind: 'walk', route: 'yatra/train/rest' } : undefined;
    case 'plan': return { kind: 'plan-day', route: 'plan/morning' };
    case 'sleep': return input.afterBedtime ? { kind: 'night', route: 'night' } : { kind: 'tonight', route: 'you/tonight' };
  }
}

export function nextMove(input: NextMoveInput): NextMove {
  if (input.focus) return { kind: 'focus', title: input.focus.title, running: input.focus.running, route: 'plan' };
  if (input.bookCheck) return { kind: 'book-check', route: `read/check/${input.bookCheck.topicId}/${input.bookCheck.moduleId}` };
  const all = input.size === 'all';
  const picked = (area: Goal) => all || input.goals.includes(area);
  if (!input.softDay) {
    if (input.trainToday && picked('train')) return { kind: 'train', route: 'yatra/train' };
    const task = picked('plan') ? todaysTask(input) : undefined;
    if (task) return task;
  }
  if (all) return readMove(input);
  const areas = input.softDay ? input.goals.filter(area => area !== 'train' && area !== 'plan') : input.goals;
  for (const area of areas) { const move = areaMove(area, input); if (move) return move; }
  if (input.softDay) return { kind: 'soft', route: 'plan' };
  // Only Train is picked and today's session is done: the Train page, where the week's beats show it.
  return { kind: 'walk', route: 'yatra/train/rest' };
}

/** Home's card: a title and one detail line per move. The words for spec 45b's moves are unchanged. */
export function moveWords(move: NextMove): { title: string; detail: string } {
  switch (move.kind) {
    case 'focus': return { title: `${move.running ? 'Working on' : 'Paused'} '${move.title}'`, detail: '' };
    case 'book-check': return { title: 'Book check', detail: 'Three questions on yesterday\'s chapter' };
    case 'train': return { title: 'Today\'s session with Nandi', detail: 'A Train day' };
    case 'task': return { title: move.title, detail: move.at != null ? `Planned for ${new Date(move.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Planned for today' };
    case 'read': return { title: 'Read one idea', detail: 'A short sitting with Chiku' };
    case 'board': return { title: 'Today\'s puzzle board', detail: 'One board with Kapi' };
    case 'train-easy': return { title: 'An easy first workout', detail: 'The easiest step of each move' };
    case 'walk': return { title: 'A 10-minute walk', detail: 'A rest day with Nandi' };
    case 'plan-day': return { title: 'Plan today', detail: 'A few minutes with Mor' };
    case 'tonight': return { title: 'Plan tonight', detail: 'How the evening winds down' };
    case 'night': return { title: 'Start my night routine', detail: 'Calm cards, then phone down' };
    case 'soft': return { title: 'One gentle thing', detail: 'Enough for a low day' };
  }
}

/**
 * The Pause card's in-app choice names the move it opens (spec 52 D). A time is added only where it is measured: the
 * person's own median time on the daily board. Reading keeps no time per idea, so it shows none.
 */
export function moveLine(move: NextMove, measured: { boardMedianMs?: number } = {}): string {
  switch (move.kind) {
    case 'focus': return `Back to: ${move.title}`;
    case 'task': return `Start: ${move.title}`;
    case 'read': return move.book && move.chapter ? `Read on: ${move.book}, ch. ${move.chapter}` : 'Read one idea';
    case 'board': return measured.boardMedianMs ? `Today's puzzle board · about ${Math.max(1, Math.round(measured.boardMedianMs / 60_000))}\u00a0min` : 'Today\'s puzzle board';
    default: return moveWords(move).title;
  }
}
