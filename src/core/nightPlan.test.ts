import { describe, expect, it } from 'vitest';
import { nightPlanText, nightsBackOnPlan, planLeadsNow } from './nightPlan';
import type { DailyLogRow } from '../data/types';

describe('night plan', () => {
  it('renders the chosen cue and action as an if-then plan', () => {
    expect(nightPlanText({ cue: 'get into bed with my phone', action: 'read 5 pages' })).toBe('If I get into bed with my phone, then I read 5 pages.');
  });

  it('leads Now from 30 minutes before bedtime', () => {
    expect(planLeadsNow(new Date('2026-10-16T22:29:00').getTime(), '23:00')).toBe(false);
    expect(planLeadsNow(new Date('2026-10-16T22:30:00').getTime(), '23:00')).toBe(true);
    expect(planLeadsNow(new Date('2026-10-17T01:00:00').getTime(), '01:30')).toBe(true);
  });

  it('keeps nights back on plan after one missed night', () => {
    const row = (dayKey: string, lightsOutAt?: number): DailyLogRow => ({ dayKey, lightsOutAt, bedtimeTarget: 100, updatedAt: 0, deleted: 0, deviceId: 'test' });
    expect(nightsBackOnPlan([row('a', 90), row('b', 110), row('c', 80)])).toBe(2);
  });
});
