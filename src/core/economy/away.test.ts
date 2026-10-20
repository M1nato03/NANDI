import { describe, expect, it } from 'vitest';
import { AWAY_KEY, awayRanges, isAway, planAway } from './away';
import type { SettingRow } from '../../data/types';

const settings = (value: unknown): SettingRow[] => [{ key: AWAY_KEY, value, updatedAt: 1, deleted: 0, deviceId: 'test' }];

describe('planned days away', () => {
  it('accepts a trip within the bank and reads its inclusive dates', () => {
    const result = planAway([], '2026-10-22', '2026-10-24', '2026-10-20', 4);
    expect(result.ranges).toEqual([{ start: '2026-10-22', end: '2026-10-24' }]);
    expect(isAway(settings(result.ranges), '2026-10-24')).toBe(true);
    expect(isAway(settings(result.ranges), '2026-10-25')).toBe(false);
  });
  it('rejects past, oversized, overlapping, and overdrawn trips', () => {
    const existing = settings([{ start: '2026-10-22', end: '2026-10-24' }]);
    expect(planAway([], '2026-10-19', '2026-10-20', '2026-10-20', 4).error).toBeTruthy();
    expect(planAway([], '2026-10-20', '2026-11-03', '2026-10-20', 20).error).toBeTruthy();
    expect(planAway(existing, '2026-10-24', '2026-10-25', '2026-10-20', 4).error).toBeTruthy();
    expect(planAway(existing, '2026-10-26', '2026-10-27', '2026-10-20', 4).error).toBeTruthy();
    expect(awayRanges(settings([{ start: '2026-02-30', end: '2026-03-01' }]))).toEqual([]);
  });
});
