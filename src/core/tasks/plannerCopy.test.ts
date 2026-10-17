import { describe, expect, it } from 'vitest';
import { weekInWordsSummary } from './plannerCopy';

describe('weekly review sentence', () => {
  it('uses a gentle empty state', () => {
    expect(weekInWordsSummary(0, 0, 0)).toBe("A quiet week. That's data, not a verdict.");
  });
  it('skips missing facts and handles singular counts', () => {
    expect(weekInWordsSummary(1, 0, 1)).toBe('You finished 1 task and kept 1 night on plan.');
  });
  it('joins all three facts without losing counts', () => {
    expect(weekInWordsSummary(6, 3, 4)).toBe('You finished 6 tasks, trained 3 times and kept 4 nights on plan.');
  });
});
