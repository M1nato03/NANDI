import { describe, expect, it } from 'vitest';
import { nextMove, type NextMoveInput } from './nextMove';

const TODAY = '2026-10-28'; // a Wednesday
const base: NextMoveInput = { focus: null, bookCheck: null, trainToday: false, tasks: [], today: TODAY, softDay: false };
const task = (title: string, extra: Partial<NextMoveInput['tasks'][number]> = {}) => ({ title, status: 'planned', dayKey: TODAY, deleted: 0 as const, ...extra });

describe('spec 45b: one next move', () => {
  it('an open focus comes first, over everything else', () => {
    const move = nextMove({ ...base, focus: { title: 'Write the report', running: true }, bookCheck: { topicId: 't', moduleId: 'm' }, trainToday: true, tasks: [task('Call home')] });
    expect(move).toEqual({ kind: 'focus', title: 'Write the report', running: true, route: 'plan' });
  });
  it('then the next-day Book check', () => {
    expect(nextMove({ ...base, bookCheck: { topicId: 'babylon', moduleId: 'ch1' }, trainToday: true, tasks: [task('Call home')] })).toEqual({ kind: 'book-check', route: 'read/check/babylon/ch1' });
  });
  it('then a Train day', () => {
    expect(nextMove({ ...base, trainToday: true, tasks: [task('Call home')] })).toEqual({ kind: 'train', route: 'yatra/train' });
  });
  it('then a task for today: the earliest timed one, then a must', () => {
    const tasks = [task('Could do'), task('Must do', { mustOrCould: 'must' }), task('At four', { scheduledStart: 16 }), task('At two', { scheduledStart: 14 })];
    expect(nextMove({ ...base, tasks })).toEqual({ kind: 'task', title: 'At two', at: 14, route: 'plan' });
    expect(nextMove({ ...base, tasks: tasks.slice(0, 2) })).toMatchObject({ kind: 'task', title: 'Must do' });
  });
  it('skips done, dropped, deleted, tomorrow\'s and checkpoint tasks', () => {
    const tasks = [task('Done', { status: 'done' }), task('Dropped', { status: 'dropped' }), task('Gone', { deleted: 1 }), task('Tomorrow', { dayKey: '2026-10-29' }), task('Step', { parentId: 'p' })];
    expect(nextMove({ ...base, tasks })).toEqual({ kind: 'read', route: 'read' });
  });
  it('with nothing at all, a Read sitting', () => {
    expect(nextMove(base)).toEqual({ kind: 'read', route: 'read' });
  });
  it('a soft day skips Train and tasks, but keeps a focus and the Book check', () => {
    expect(nextMove({ ...base, softDay: true, trainToday: true, tasks: [task('Call home')] })).toEqual({ kind: 'read', route: 'read' });
    expect(nextMove({ ...base, softDay: true, bookCheck: { topicId: 't', moduleId: 'm' } }).kind).toBe('book-check');
    expect(nextMove({ ...base, softDay: true, focus: { title: 'A', running: false } }).kind).toBe('focus');
  });
});
