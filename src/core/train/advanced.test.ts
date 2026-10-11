import { describe, expect, it } from 'vitest';
import { calculatePlates, calculateWarmupRamp, detectSetPrs, needsWeeklyVolumeConfirmation, heatAdvice, remainingRestMs, evaluateBodyweightPlacement, isRetestWeek, applyRetestVolume, applyHeatMode, PROGRAMS, calculateTrainDailyXp } from './index';
import { getSmallestIncrement } from './progression';

describe('Train safety and logging rules', () => {
  it('uses each exercise equipment rather than dumbbells for barbell progression', () => {
    const equipment = { gymAccess: true, dumbbells: true, barbell: 20 as const, smallestPlate: 2.5, resistanceBand: false, pullUpBar: false, sturdyAnchor: false };
    expect(getSmallestIncrement(equipment, 'barbell-squat')).toBe(5);
    expect(getSmallestIncrement(equipment, 'db-bench')).toBe(2.5);
    expect(getSmallestIncrement(equipment, 'goblet-squat')).toBe(2.5);
  });
  it('ignores warm-ups and pain, and asks before a large load jump', () => {
    const best = { load: 40, repsAtLoad: 8, e1rm: 51 };
    expect(detectSetPrs({ load: 45, reps: 9, type: 'warmup' }, best)).toEqual([]);
    expect(detectSetPrs({ load: 45, reps: 9, painFlag: true }, best)).toEqual([]);
    expect(detectSetPrs({ load: 65, reps: 9 }, best).every(pr => pr.needsConfirmation)).toBe(true);
    expect(detectSetPrs({ load: 45, reps: 9 }, best).map(pr => pr.kind)).toEqual(['load', 'repsAtLoad', 'e1rm']);
  });

  it('uses paired plate inventory and rejects loads below the bar', () => {
    expect(calculatePlates(15, 20, [5])).toBeNull();
    expect(calculatePlates(40, 20, [5])).toBeNull();
    expect(calculatePlates(40, 20, [5, 5])).toEqual([5, 5]);
    expect(calculateWarmupRamp(60, 2.5)).toEqual([{ load: 30, reps: 8 }, { load: 45, reps: 4 }]);
    expect(calculateWarmupRamp(30, 5, 20)).toEqual([{ load: 20, reps: 8 }, { load: 25, reps: 4 }]);
  });

  it('requires confirmation over 20 percent and gives plain heat advice', () => {
    expect(needsWeeklyVolumeConfirmation(13, 10)).toBe(true);
    expect(needsWeeklyVolumeConfirmation(12, 10)).toBe(false);
    expect(heatAdvice({ hotMode: true, humid: true, celsius: 28, dizzy: true }).join(' ')).toContain('Stop and seek help');
    expect(remainingRestMs(1000, 182000)).toBe(0);
  });
  it('places timed holds in the 20 to 60 second range', () => {
    expect(evaluateBodyweightPlacement('core-anti-ext', [{ stepRank: 2, reps: 30 }])).toEqual({ finalStepRank: 2, complete: true });
    expect(evaluateBodyweightPlacement('core-anti-ext', [{ stepRank: 2, reps: 15 }])).toEqual({ finalStepRank: 1, complete: false });
  });
  it('schedules a lighter re-test from program start', () => {
    const start = 1_700_000_000_000;
    expect(isRetestWeek(start, start + 8 * 7 * 86_400_000)).toBe(true);
    expect(isRetestWeek(start, start + 7 * 7 * 86_400_000)).toBe(false);
    expect(applyRetestVolume(PROGRAMS['hostel-bodyweight']!, true).exercises[0]?.sets).toBe(2);
  });
  it('cuts hot-day volume close to 25 percent across the whole plan', () => {
    const original = PROGRAMS['hostel-bodyweight']!.exercises.reduce((sum, ex) => sum + ex.sets, 0);
    const reduced = applyHeatMode(PROGRAMS['hostel-bodyweight']!, true, 0).exercises.reduce((sum, ex) => sum + ex.sets, 0);
    expect((original - reduced) / original).toBeGreaterThanOrEqual(0.2);
    expect((original - reduced) / original).toBeLessThanOrEqual(0.3);
  });
  it('counts the better session and only two PRs within the daily cap', () => {
    expect(calculateTrainDailyXp([40, 60], 3, false)).toBe(90);
    expect(calculateTrainDailyXp([40, 60], 10, false)).toBe(90);
    expect(calculateTrainDailyXp([], 0, true)).toBe(10);
  });
});
