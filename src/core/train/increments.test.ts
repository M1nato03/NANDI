import { describe, expect, it } from 'vitest';
import { PROGRAMS } from './programs';
import { getSmallestIncrement, incrementSource } from './progression';
import type { EquipmentSetting } from './types';

const gym: EquipmentSetting = { gymAccess: true, dumbbells: false, barbell: null, smallestPlate: null, resistanceBand: false, pullUpBar: false, sturdyAnchor: false };
const home: EquipmentSetting = { ...gym, gymAccess: false };

describe('gym load steps', () => {
  it('gives every Gym Foundations lift a real step, or progresses holds by time', () => {
    const gymExercises = Object.values(PROGRAMS).filter(routine => routine.track === 'gym').flatMap(routine => routine.exercises);
    for (const exercise of gymExercises) {
      if (exercise.isHold) expect(incrementSource(gym, exercise.exerciseId), exercise.exerciseId).toBe('time');
      else expect(getSmallestIncrement(gym, exercise.exerciseId), exercise.exerciseId).toBeGreaterThan(0);
    }
  });

  it('uses the machine and cable steps from his equipment when set', () => {
    expect(getSmallestIncrement(gym, 'seated-cable-row')).toBe(2.5);
    expect(getSmallestIncrement({ ...gym, cableStep: 5 }, 'lat-pulldown')).toBe(5);
    expect(getSmallestIncrement(gym, 'hip-thrust')).toBe(5);
    expect(getSmallestIncrement({ ...gym, machineStep: 7.5 }, 'hip-thrust')).toBe(7.5);
  });

  it('loads a hip thrust on the barbell when he has one with small plates', () => {
    expect(getSmallestIncrement({ ...gym, barbell: 20, smallestPlate: 1.25 }, 'hip-thrust')).toBe(2.5);
  });

  it('gives no load step for machines or cables without gym access', () => {
    expect(getSmallestIncrement(home, 'seated-cable-row')).toBe(0);
    expect(getSmallestIncrement(home, 'hip-thrust')).toBe(0);
    expect(incrementSource(home, 'split-squat')).toBe('bodyweight');
    expect(getSmallestIncrement({ ...home, dumbbells: true }, 'split-squat')).toBe(2.5);
  });
});
