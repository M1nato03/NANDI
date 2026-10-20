import { describe, expect, it } from 'vitest';
import { adaptiveNight, boundedSuggestion, busyShiftMinutes, plannedMinutes, readInterests, shiftClock, shiftOffKey, BUSY_SHIFT_KEY, INTERESTS_KEY } from './day';
import type { SettingRow, TaskRow } from '../../data/types';

const setting = (key: string, value: unknown): SettingRow => ({ key, value, updatedAt: 1, deleted: 0, deviceId: 'd' });
const task = (estimateMin: number | undefined, size = 'M', status = 'planned'): TaskRow => ({ id: `t${Math.random()}`, title: 'x', status, dayKey: '2026-10-20', size, estimateMin, updatedAt: 1, deleted: 0, deviceId: 'd' } as unknown as TaskRow);

describe('adaptive day', () => {
  it('adds up planned minutes, using size when there is no estimate', () => {
    expect(plannedMinutes([task(120), task(undefined, 'L'), task(60, 'M', 'dropped')], '2026-10-20')).toBe(120 + 68);
  });
  it('moves the night 30 min from 4 h and 60 min from 6 h', () => {
    expect([busyShiftMinutes(200), busyShiftMinutes(240), busyShiftMinutes(359), busyShiftMinutes(360)]).toEqual([0, 30, 30, 60]);
    expect(shiftClock('01:30', 30)).toBe('02:00');
    expect(shiftClock('23:45', 30)).toBe('00:15');
  });
  it('shifts the bedtime on a busy day unless switched off or undone for today', () => {
    const tasks = [task(150), task(150)];
    const base = [setting('planner.bedtime', '23:30')];
    expect(adaptiveNight(base, tasks, '2026-10-20')).toMatchObject({ shift: 30, bedtime: '00:00', plannedMinutes: 300 });
    expect(adaptiveNight([...base, setting(shiftOffKey('2026-10-20'), true)], tasks, '2026-10-20')).toMatchObject({ shift: 0, bedtime: '23:30', undone: true });
    expect(adaptiveNight([...base, setting(BUSY_SHIFT_KEY, false)], tasks, '2026-10-20').shift).toBe(0);
  });
  it('suggests a bounded idea from chosen interests, night-friendly ones at night', () => {
    const interests = readInterests([setting(INTERESTS_KEY, ['anime', 'reading', 'nonsense'])]);
    expect(interests).toEqual(['anime', 'reading']);
    expect(['Watch one episode, then stop', 'Read one chapter']).toContain(boundedSuggestion(interests, '2026-10-20', false));
    expect(boundedSuggestion(interests, '2026-10-20', true)).toBe('Read one chapter');
    expect(boundedSuggestion([], '2026-10-20', false)).toBeNull();
  });
});
