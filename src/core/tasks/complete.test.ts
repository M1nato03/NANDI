import { describe, expect, it } from 'vitest';
import type { FocusRow, TaskRow } from '../../data/types';
import { calibration, calibratedMinutes, chooseNowTask, needsFreshStart, proposeCheckpoints, respaceCheckpoints, steadyLine, validReward } from './complete';

const at = (date: string) => new Date(date).getTime();
const task = (id: string, date: string, overrides: Partial<TaskRow> = {}): TaskRow => ({ id, title: id, status: 'planned', dayKey: date.slice(0, 10), scheduledStart: at(date), firstScheduledDayKey: date.slice(0, 10), size: 'M', plannedSize: 'M', estimateMin: 30, postponeCount: 0, updatedAt: at(date), deleted: 0, deviceId: 'test', ...overrides });
const focus = (id: string, start: string, minutes: number, overrides: Partial<FocusRow> = {}): FocusRow => ({ id, taskId: id, startedAt: at(start), endedAt: at(start) + minutes * 60_000, updatedAt: at(start), deleted: 0, deviceId: 'test', ...overrides });

describe('planner completion helpers', () => {
  it('offers a fresh start only for a planned yesterday without a done task or shutdown', () => {
    const row = task('a', '2026-10-18T10:00:00');
    expect(needsFreshStart([row], [], '2026-10-19')).toBe(true);
    expect(needsFreshStart([{ ...row, dayKey: '2026-10-19', firstScheduledDayKey: '2026-10-15', lastPlannedDayKey: '2026-10-18', status: 'unplaced' }], [], '2026-10-19')).toBe(true);
    expect(needsFreshStart([{ ...row, status: 'done', doneAt: at('2026-10-18T12:00:00') }], [], '2026-10-19')).toBe(false);
    expect(needsFreshStart([row], [{ dayKey: '2026-10-18', shutdownDone: true, updatedAt: 0, deleted: 0, deviceId: 'test' }], '2026-10-19')).toBe(false);
  });
  it('chooses active focus, then the first scheduled block, then a Must', () => {
    const now = at('2026-10-19T09:00:00');
    const a = task('a', '2026-10-19T10:00:00'); const b = task('b', '2026-10-19T11:00:00');
    expect(chooseNowTask([b, a], [], now)?.id).toBe('a');
    expect(chooseNowTask([a, b], [focus('b', '2026-10-19T08:00:00', 10, { endedAt: undefined })], now)?.id).toBe('b');
    expect(chooseNowTask([{ ...a, status: 'unplaced', mustOrCould: 'must' }], [], now)?.id).toBe('a');
  });
  it('calibrates only after five finished timed tasks in a category', () => {
    const rows = Array.from({ length: 5 }, (_, i) => task(String(i), '2026-10-19T10:00:00', { status: 'done', category: 'study' }));
    const timed = rows.map(row => focus(row.id, '2026-10-19T10:00:00', 42));
    expect(calibration(rows.slice(0, 4), timed, 'study')).toBeNull();
    expect(calibration(rows, timed, 'study')).toEqual({ ratio: 1.4, samples: 5 });
    expect(calibratedMinutes(30, 1.4)).toBe(42);
  });
  it('keeps rewards away from feeds', () => {
    expect(validReward('chai and a walk')).toBe(true);
    for (const value of ['Instagram', 'YouTube shorts', 'x.com', 'TikTok']) expect(validReward(value)).toBe(false);
    expect(validReward(' ')).toBe(false);
  });
  it('proposes spaced checkpoints and respaces remaining ones after a move', () => {
    const now = at('2026-10-19T09:00:00');
    expect(proposeCheckpoints(task('a', '2026-10-21T12:00:00'), now)).toEqual([]);
    const proposed = proposeCheckpoints(task('a', '2026-10-25T12:00:00'), now);
    expect(proposed).toHaveLength(3);
    expect(proposed.every((row, i) => row.scheduledStart > now && (i === 0 || row.scheduledStart > proposed[i - 1]!.scheduledStart))).toBe(true);
    const spaced = respaceCheckpoints([task('c', '2026-10-24T12:00:00'), task('b', '2026-10-23T12:00:00')], now, at('2026-10-25T12:00:00'));
    expect(spaced.map(row => row.id)).toEqual(['b', 'c']);
    expect(spaced[0]!.scheduledStart).toBeLessThan(spaced[1]!.scheduledStart);
  });
  it('shows a seven-day planned count and this week’s timed minutes', () => {
    expect(steadyLine([task('a', '2026-10-19T10:00:00'), task('b', '2026-10-18T10:00:00')], [focus('a', '2026-10-19T10:00:00', 25)], '2026-10-19')).toBe('Planned 2 of the last 7 days · 25 focus min this week');
  });
});
