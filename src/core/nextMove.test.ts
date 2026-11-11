import { describe, expect, it } from 'vitest';
import { moveLine, nextMove, type NextMove, type NextMoveInput } from './nextMove';
import { GOALS, type Goal } from './welcome';

const TODAY = '2026-10-28'; // a Wednesday
const READING = { topicId: 'psychology', moduleId: 'psychology-ch2', book: 'Why We Do What We Do', chapter: 2 };
const base: NextMoveInput = { focus: null, bookCheck: null, trainToday: false, tasks: [], today: TODAY, softDay: false, goals: GOALS.map(goal => goal.id), size: 'all', afterBedtime: false, reading: READING, train: 'rest' };
type Task = NextMoveInput['tasks'][number];
const task = (title: string, extra: Partial<Task> = {}): Task => ({ title, status: 'planned', dayKey: TODAY, deleted: 0 as const, ...extra });
const picked = (goals: Goal[], extra: Partial<NextMoveInput> = {}) => nextMove({ ...base, goals, size: goals.length > 2 ? 'more' : 'two', ...extra });

/**
 * Spec 45b's nextMove exactly as it shipped (main adb2552), frozen here before it was deleted: the golden for size 'all'.
 * Its one route that changes on purpose is the Read sitting (the Read tab before, the chapter itself now).
 */
type LegacyInput = Pick<NextMoveInput, 'focus' | 'bookCheck' | 'trainToday' | 'tasks' | 'today' | 'softDay'>;
function legacyNextMove(input: LegacyInput) {
  const OPEN = new Set(['planned', 'unplaced']);
  if (input.focus) return { kind: 'focus', title: input.focus.title, running: input.focus.running, route: 'plan' };
  if (input.bookCheck) return { kind: 'book-check', route: `read/check/${input.bookCheck.topicId}/${input.bookCheck.moduleId}` };
  if (!input.softDay) {
    if (input.trainToday) return { kind: 'train', route: 'yatra/train' };
    const open = input.tasks.filter(task => !task.deleted && !task.parentId && task.dayKey === input.today && OPEN.has(task.status));
    const rank = (task: (typeof open)[number]) => [task.scheduledStart ?? Infinity, task.mustOrCould === 'must' ? 0 : 1] as const;
    const task = [...open].sort((a, b) => { const [x1, y1] = rank(a), [x2, y2] = rank(b); return x1 - x2 || y1 - y2; })[0];
    if (task) return { kind: 'task', title: task.title, ...(task.scheduledStart != null ? { at: task.scheduledStart } : {}), route: 'plan' };
  }
  return { kind: 'read', route: 'read' };
}

const TASK_SETS: Task[][] = [
  [], [task('Untimed')], [task('At four', { scheduledStart: 16 }), task('At two', { scheduledStart: 14 })],
  [task('Could do'), task('Must do', { mustOrCould: 'must' })], [task('Tomorrow', { dayKey: '2026-10-29' })],
  [task('Gone', { deleted: 1 })], [task('Step', { parentId: 'p' })], [task('Done', { status: 'done' }), task('Unplaced', { status: 'unplaced' })],
  [task('Dropped', { status: 'dropped' }), task('Must later', { mustOrCould: 'must', scheduledStart: 20 }), task('Could early', { scheduledStart: 9 })],
];
// A small seeded generator, so the random lists are the same on every run.
function lists(count: number): Task[][] {
  let seed = 52;
  const next = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed; };
  const statuses = ['planned', 'unplaced', 'done', 'dropped', 'someday'];
  return Array.from({ length: count }, (_, n) => Array.from({ length: next() % 6 }, (_, i) => task(`R${n}-${i}`, {
    status: statuses[next() % statuses.length]!, dayKey: next() % 4 ? TODAY : '2026-10-27', deleted: (next() % 7 ? 0 : 1) as 0 | 1,
    ...(next() % 5 ? {} : { parentId: 'p' }), ...(next() % 2 ? { scheduledStart: next() % 24 } : {}), ...(next() % 3 ? {} : { mustOrCould: 'must' as const }),
  })));
}

describe('spec 52: size all is spec 45b\'s order, unchanged (golden)', () => {
  const grid: LegacyInput[] = [];
  for (const focus of [null, { title: 'Write', running: true }, { title: 'Write', running: false }])
    for (const bookCheck of [null, { topicId: 'babylon', moduleId: 'ch1' }])
      for (const trainToday of [false, true])
        for (const softDay of [false, true])
          for (const tasks of [...TASK_SETS, ...lists(300)]) grid.push({ focus, bookCheck, trainToday, tasks, today: TODAY, softDay });
  it(`matches the frozen function on kind, title and time for all ${3 * 2 * 2 * 2 * (TASK_SETS.length + 300)} inputs`, () => {
    for (const input of grid) {
      const now = nextMove({ ...base, ...input }) as NextMove & { title?: string; at?: number };
      const then = legacyNextMove(input) as { kind: string; title?: string; at?: number; route: string };
      expect({ kind: now.kind, title: now.title, at: now.at }).toEqual({ kind: then.kind, title: then.title, at: then.at });
      // The one intended change for existing installs: a Read sitting opens the chapter itself, not the Read tab.
      expect(now.route).toBe(then.kind === 'read' ? 'read/chapter/psychology/psychology-ch2' : then.route);
    }
  });
  it('the Read sitting falls back to the Read tab when every book is finished, and after bedtime (no new chapters then)', () => {
    expect(nextMove({ ...base, reading: null })).toEqual({ kind: 'read', route: 'read' });
    expect(nextMove({ ...base, afterBedtime: true })).toEqual({ kind: 'read', route: 'read' });
  });
});

describe('spec 52: the next move follows the picks', () => {
  const day = { trainToday: true, tasks: [task('Call home')] };
  it('each area alone gets its own move, never another area\'s', () => {
    expect(picked(['learn'], day)).toEqual({ kind: 'read', route: 'read/chapter/psychology/psychology-ch2', book: READING.book, chapter: 2 });
    expect(picked(['mind'], day)).toEqual({ kind: 'board', route: 'yatra/mind/board/daily' });
    expect(picked(['train'], day)).toEqual({ kind: 'train', route: 'yatra/train' });
    expect(picked(['plan'], day)).toMatchObject({ kind: 'task', title: 'Call home' });
    expect(picked(['sleep'], day)).toEqual({ kind: 'tonight', route: 'you/tonight' });
  });
  it('an area with nothing due today offers its own way in', () => {
    expect(picked(['train'], { train: 'easy' })).toEqual({ kind: 'train-easy', route: 'yatra/train/easy' });
    expect(picked(['train'], { train: 'rest' })).toEqual({ kind: 'walk', route: 'yatra/train/rest' });
    expect(picked(['plan'])).toEqual({ kind: 'plan-day', route: 'plan/morning' });
    expect(picked(['train', 'mind'], { train: 'done' }).kind).toBe('board');
    expect(picked(['train'], { train: 'done' }).kind).toBe('walk');
  });
  it('two-goal pairs: Train and tasks only when picked, then the first pick\'s own move', () => {
    expect(picked(['learn', 'mind'], day).kind).toBe('read');
    expect(picked(['mind', 'learn'], day).kind).toBe('board');
    expect(picked(['plan', 'train'], day).kind).toBe('train');
    expect(picked(['plan', 'train'], { tasks: [task('Call home')] }).kind).toBe('task');
    expect(picked(['plan', 'train'], { train: 'rest' })).toEqual({ kind: 'plan-day', route: 'plan/morning' });
    expect(picked(['sleep', 'learn'], day).kind).toBe('tonight');
  });
  it('more, with four picks', () => {
    expect(picked(['sleep', 'mind', 'learn', 'plan'], day)).toMatchObject({ kind: 'task', title: 'Call home' });
    expect(picked(['sleep', 'mind', 'learn', 'plan'], { tasks: [] }).kind).toBe('tonight');
  });
  it('an open focus and a due Book check come first whatever was picked', () => {
    expect(picked(['mind'], { focus: { title: 'Write', running: true } }).kind).toBe('focus');
    expect(picked(['sleep'], { bookCheck: { topicId: 'babylon', moduleId: 'ch1' } }).kind).toBe('book-check');
  });
  it('a soft day skips Train and tasks; its fallback is the first pick that is neither, else the gentle thing', () => {
    expect(picked(['train', 'plan'], { ...day, softDay: true })).toEqual({ kind: 'soft', route: 'plan' });
    expect(picked(['plan', 'mind'], { ...day, softDay: true }).kind).toBe('board');
    expect(picked(['learn'], { ...day, softDay: true }).kind).toBe('read');
    expect(nextMove({ ...base, ...day, softDay: true }).kind).toBe('read');
  });
  it('after bedtime: sleep offers the night routine, and reading opens the Read tab, not a chapter', () => {
    expect(picked(['sleep'], { afterBedtime: true })).toEqual({ kind: 'night', route: 'night' });
    expect(picked(['learn'], { afterBedtime: true })).toEqual({ kind: 'read', route: 'read' });
    expect(picked(['sleep', 'mind'], { afterBedtime: true, softDay: true }).kind).toBe('night');
  });
  it('every single pick and pair, on every kind of day, lands on a route', () => {
    const singles = GOALS.map(goal => [goal.id]);
    const pairs = [['learn', 'mind'], ['train', 'plan'], ['sleep', 'learn']] as Goal[][];
    for (const goals of [...singles, ...pairs, ['sleep', 'mind', 'learn', 'plan'] as Goal[]])
      for (const softDay of [false, true]) for (const afterBedtime of [false, true]) for (const train of ['easy', 'rest', 'done'] as const)
        expect(picked(goals, { softDay, afterBedtime, train }).route).toMatch(/^[a-z]/);
  });
});

describe('spec 52 D: the Pause card names the move', () => {
  it('names the chapter, the task, the board; a time only where measured', () => {
    expect(moveLine(picked(['learn']))).toBe('Read on: Why We Do What We Do, ch. 2');
    expect(moveLine(picked(['plan'], { tasks: [task('Email Riya')] }))).toBe('Start: Email Riya');
    expect(moveLine(picked(['mind']))).toBe('Today\'s puzzle board');
    expect(moveLine(picked(['mind']), { boardMedianMs: 4.4 * 60_000 })).toBe('Today\'s puzzle board · about 4\u00a0min');
    expect(moveLine(picked(['sleep']))).toBe('Plan tonight');
    expect(moveLine(nextMove({ ...base, focus: { title: 'Write', running: true } }))).toBe('Back to: Write');
  });
});
