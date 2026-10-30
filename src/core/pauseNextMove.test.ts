import { describe, expect, it } from 'vitest';
import { pauseNextMove } from './pauseNextMove';
import type { FocusRow, ProgramRow, SessionRow, TaskRow } from '../data/types';

const today = '2026-11-04'; // a Wednesday
const weekday = 3;
const row = { updatedAt: 1, deleted: 0 as const, deviceId: 't' };
const focus = (endedAt?: number) => ({ ...row, id: 'f', taskId: 't', startedAt: 1, endedAt }) as FocusRow;
const task = (status: string, dayKey = today) => ({ ...row, id: `t-${status}`, title: 'Email Riya', status, dayKey }) as TaskRow;
const program = (days: number[]) => ({ ...row, id: 'p', days }) as ProgramRow;
const session = (status: SessionRow['status']) => ({ ...row, id: 's', dayKey: today, status }) as SessionRow;
const move = (input: Partial<Parameters<typeof pauseNextMove>[0]>) => pauseNextMove({ focus: [], tasks: [], programs: [], sessions: [], today, weekday, ...input });

describe('spec 39b "Do it in NANDI": the first match wins', () => {
  it('a running focus first, then a Train day with no session, then a task for today, else the Read drop', () => {
    expect(move({ focus: [focus()], programs: [program([3])], tasks: [task('planned')] })).toEqual({ route: 'plan/focus', why: 'focus' });
    expect(move({ focus: [focus(5)], programs: [program([3])], tasks: [task('planned')] })).toEqual({ route: 'yatra/train', why: 'train' });
    expect(move({ programs: [program([1, 5])], tasks: [task('planned')] })).toEqual({ route: 'plan/focus', why: 'task' });
    expect(move({ programs: [program([3])], sessions: [session('completed')], tasks: [task('done')] })).toEqual({ route: 'read/drop', why: 'read' });
  });
  it('a skipped session still leaves the Train day open; a task from another day or a someday task does not count', () => {
    expect(move({ programs: [program([3])], sessions: [session('skipped')] }).why).toBe('train');
    expect(move({ tasks: [task('planned', '2026-11-05'), task('someday')] }).why).toBe('read');
  });
});
