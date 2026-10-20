import { describe, expect, it } from 'vitest';
import { RULES } from '../../core/rules.config';
import { finishLines, pickFinishLine, shouldShowDoneForToday } from './finish';

describe('finish lines', () => {
  it('uses a small distinct pool for each activity', () => {
    expect(Object.keys(finishLines)).toEqual(['task', 'learn', 'puzzle', 'case', 'train', 'night']);
    for (const [activity, pool] of Object.entries(finishLines)) {
      expect(pool.length, activity).toBeGreaterThanOrEqual(8);
      expect(pool.length, activity).toBeLessThanOrEqual(12);
      expect(new Set(pool).size, activity).toBe(pool.length);
    }
  });

  it('does not repeat the previous line', () => {
    for (const activity of Object.keys(finishLines) as (keyof typeof finishLines)[]) {
      for (const previous of finishLines[activity]) {
        expect(pickFinishLine(activity, previous, () => 0)).not.toBe(previous);
      }
      expect(finishLines[activity]).toContain(pickFinishLine(activity, undefined, () => 0));
    }
  });
});

describe('done for today', () => {
  const ready = { wasComplete: false, isComplete: true, seen: false, afterBedtime: false, macroCount: 0 };
  it('appears only on the daytime transition to all four dots', () => {
    expect(shouldShowDoneForToday(ready)).toBe(true);
    expect(shouldShowDoneForToday({ ...ready, wasComplete: true })).toBe(false);
    expect(shouldShowDoneForToday({ ...ready, isComplete: false })).toBe(false);
    expect(shouldShowDoneForToday({ ...ready, afterBedtime: true })).toBe(false);
  });
  it('respects persistent seen state and the shared macro budget', () => {
    expect(shouldShowDoneForToday({ ...ready, seen: true })).toBe(false);
    expect(shouldShowDoneForToday({ ...ready, macroCount: RULES.juice.macroPerDayMax })).toBe(false);
  });
});
