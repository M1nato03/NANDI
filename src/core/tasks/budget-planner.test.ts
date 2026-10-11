import { describe, expect, it } from 'vitest';
import { baselineBudget, nextBudget, postponeWeekKey } from './budget';

describe('baseline and ongoing postpone budget', () => {
  it('keeps Monday before 04:00 in the previous budget week', () => {
    expect(postponeWeekKey(new Date(2026, 9, 12, 2).getTime())).toBe('2026-10-05');
    expect(postponeWeekKey(new Date(2026, 9, 12, 4).getTime())).toBe('2026-10-12');
  });
  it('rounds and clamps the measured baseline', () => {
    expect(baselineBudget(0)).toBe(5);
    expect(baselineBudget(9)).toBe(6);
    expect(baselineBudget(13)).toBe(9);
    expect(baselineBudget(30)).toBe(12);
  });
  it('raises after three overruns in four completed weeks and restarts lookback', () => {
    expect(nextBudget(5, [6, 5, 7, 8])).toEqual({ budget: 7, countsSinceRaise: [], raised: true });
    expect(nextBudget(7, [8, 8, 8])).toEqual({ budget: 7, countsSinceRaise: [8, 8, 8], raised: false });
    expect(nextBudget(11, [12, 13, 11, 12])).toEqual({ budget: 12, countsSinceRaise: [], raised: true });
    expect(nextBudget(5, [6, 5, 7, 5]).raised).toBe(false);
  });
});
