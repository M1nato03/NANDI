import { describe, expect, it } from 'vitest';
import type { FocusRow, LedgerRow, SessionRow } from '../../data/types';
import { hoursMinutes, nextMove, recordedWeek, SESSION_CAP_MS, weekParts, type NextMoveInput } from './nextMove';

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

const at = (key: string, hour: number) => new Date(`${key}T${String(hour).padStart(2, '0')}:00:00`).getTime();
const meta = { updatedAt: 1, deleted: 0 as const, deviceId: 'd' };
const focusRow = (key: string, minutes: number, extra: Partial<FocusRow> = {}): FocusRow => ({ id: `f${key}${minutes}`, taskId: 't', startedAt: at(key, 10), endedAt: at(key, 10) + minutes * 60_000, ...meta, ...extra });
const session = (key: string, minutes: number, status: SessionRow['status'] = 'completed'): SessionRow => ({ id: `s${key}${minutes}`, dayKey: key, status, startedAt: at(key, 18), endedAt: at(key, 18) + minutes * 60_000, ...meta });
const fact = (mode: string, kind: string, key: string, inputs: Record<string, unknown> = {}): LedgerRow => ({ id: `${mode}${kind}${key}${JSON.stringify(inputs)}`, mode, kind, refId: 'r', dayKey: key, inputs, ...meta } as LedgerRow);

describe('spec 45b: the week\'s recorded time', () => {
  const now = at(TODAY, 20);
  it('adds focus (less pauses), counted Train sessions and Calm minutes from Monday on; ideas are counted, not timed', () => {
    const week = recordedWeek({
      focus: [focusRow('2026-10-26', 50, { pauses: [{ at: at('2026-10-26', 10) + 10 * 60_000, resumeAt: at('2026-10-26', 10) + 20 * 60_000 }] }), focusRow('2026-10-25', 90)],
      sessions: [session('2026-10-27', 40), session('2026-10-27', 30, 'skipped'), session('2026-10-20', 60)],
      ledger: [fact('calm', 'session', '2026-10-28', { minutes: 12 }), fact('calm', 'session', '2026-10-24', { minutes: 20 }), fact('read', 'idea', '2026-10-27'), fact('read', 'idea', '2026-10-28'), fact('read', 'idea', '2026-10-19')],
      today: TODAY, now,
    });
    expect(week).toEqual({ minutes: 40 + 40 + 12, focus: 40, train: 40, calm: 12, ideas: 2 });
  });
  it('a running focus counts up to now; an open session never counts', () => {
    const open = { ...focusRow(TODAY, 0), startedAt: now - 25 * 60_000, endedAt: undefined };
    const active = { ...session(TODAY, 0, 'active'), endedAt: undefined };
    expect(recordedWeek({ focus: [open], sessions: [active], ledger: [], today: TODAY, now }).minutes).toBe(25);
  });
  it('one session counts at most three hours, and deleted rows never count', () => {
    const long = session('2026-10-27', 10 * 60);
    const gone = { ...session('2026-10-27', 30), deleted: 1 as const };
    expect(recordedWeek({ focus: [], sessions: [long, gone], ledger: [], today: TODAY, now }).train).toBe(SESSION_CAP_MS / 60_000);
  });
  it('a row with a broken time is skipped', () => {
    expect(recordedWeek({ focus: [{ ...focusRow(TODAY, 10), startedAt: Number.NaN }], sessions: [{ ...session(TODAY, 10), endedAt: Number.NaN }], ledger: [], today: TODAY, now }).minutes).toBe(0);
  });
  it('an empty week is zero, with no parts', () => {
    const week = recordedWeek({ focus: [], sessions: [], ledger: [], today: TODAY, now });
    expect(week.minutes).toBe(0);
    expect(weekParts(week)).toBe('');
  });
  it('reads as hours and minutes, and names only the parts with time', () => {
    expect(hoursMinutes(130)).toBe('2 h 10 m');
    expect(hoursMinutes(45)).toBe('45 m');
    expect(weekParts({ minutes: 50, focus: 0, train: 30, calm: 20, ideas: 0 })).toBe('moving, breathing');
  });
});
