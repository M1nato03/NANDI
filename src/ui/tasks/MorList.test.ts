import { describe, expect, it } from 'vitest';
import type { TaskRow } from '../../data/types';
import { averageLine, listOf, notedLine } from './MorList';

const task = (overrides: Partial<TaskRow>): TaskRow => ({ id: 't', title: 'Revise chapter 4', status: 'planned', dayKey: '2026-10-25', estimateMin: 30, postponeCount: 0, updatedAt: 0, deleted: 0, deviceId: 'd', ...overrides });

describe("Mor's list (spec 27)", () => {
  it('sorts tasks into Today (including days already past), Tomorrow, Later and today\'s Done', () => {
    const today = '2026-10-25';
    expect(listOf(task({ dayKey: '2026-10-25' }), today)).toBe('today');
    expect(listOf(task({ dayKey: '2026-10-22' }), today)).toBe('today');
    expect(listOf(task({ status: 'unplaced', dayKey: '2026-10-25' }), today)).toBe('today');
    expect(listOf(task({ dayKey: '2026-10-26' }), today)).toBe('tomorrow');
    expect(listOf(task({ dayKey: '2026-10-30' }), today)).toBe('later');
    expect(listOf(task({ status: 'someday', dayKey: '2026-10-25' }), today)).toBe('later');
    expect(listOf(task({ status: 'done', doneAt: new Date('2026-10-25T15:00:00').getTime() }), today)).toBe('done');
    expect(listOf(task({ status: 'done', doneAt: new Date('2026-10-24T15:00:00').getTime() }), today)).toBeUndefined();
    expect(listOf(task({ status: 'dropped' }), today)).toBeUndefined();
  });
  it("Mor's line says what it took, adds the set time only when one was set, and never judges", () => {
    expect(notedLine(task({}), 42, true)).toBe("Noted: 'Revise chapter 4' took 42 minutes.");
    expect(notedLine(task({ timeSet: true }), 42, true)).toBe("Noted: 'Revise chapter 4' took 42 minutes. You set 30.");
    expect(notedLine(task({}), 1, false)).toBe("Noted: 1 minute on 'Revise chapter 4' so far.");
    for (const line of [notedLine(task({ timeSet: true }), 90, true), notedLine(task({ timeSet: true }), 5, true)]) expect(line).not.toMatch(/late|over|under|fail/i);
  });
  it('the average line waits for 5 timed tasks', () => {
    const done = (minutes: number, id: string) => task({ id, status: 'done', actualMinutes: minutes });
    expect(averageLine([10, 20, 30, 40].map((m, i) => done(m, `a${i}`)))).toBeUndefined();
    expect(averageLine([10, 20, 30, 40, 50].map((m, i) => done(m, `a${i}`)))).toBe('Your timed tasks so far: about 30 minutes each.');
  });
});
