import { describe, expect, it } from 'vitest';
import { NIGHT_PLAN_KEY, nightPlanText, nightsBackOnPlan, planLeadsNow, readNightPlan } from './nightPlan';
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

it('reads plans saved with the old cue wording as a correct sentence', () => {
  const row = { key: NIGHT_PLAN_KEY, value: { cue: 'reaching for one more scroll', action: 'put the phone on the charger outside the bed' }, updatedAt: 1, deleted: 0 as const, deviceId: 'd' };
  const plan = readNightPlan([row]);
  expect(plan && nightPlanText(plan)).toBe('If I reach for one more scroll, then I put the phone on the charger outside the bed.');
});
