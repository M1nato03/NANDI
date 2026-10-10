import { RULES } from '../rules.config';
import { LADDERS } from './library';
import { EquipmentSetting, LadderPattern, SessionExercise } from './types';

export function getSmallestIncrement(equipment: EquipmentSetting): number {
  if (equipment.dumbbells) {
    // Usually fixed DB increments are 2.5kg per hand -> 5kg total for bilateral, or 2.5kg for unilateral
    // To simplify and not over-engineer, we'll return 2.5 as baseline if dumbbells are true. 
    return 2.5; 
  }
  if (equipment.barbell) {
    if (equipment.smallestPlate) {
      return equipment.smallestPlate * 2; // plates go on both sides
    }
    return 5; // default bar jump if no micro plates
  }
  return 2.5; // fallback
}

export function roundToEquipment(load: number, smallestIncrement: number): number {
  if (smallestIncrement <= 0) return load;
  return Math.round(load / smallestIncrement) * smallestIncrement;
}

export type GymProgressionState = {
  load: number;
  successStreak: number;
  failStreak: number;
  increasesThisWeek: number;
  weeksSinceStart: number;
};

export function evaluateGymLift(
  exercise: SessionExercise,
  state: GymProgressionState,
  increment: number
): GymProgressionState {
  if (exercise.painFlag) {
    return { ...state }; // No increase, streak doesn't advance
  }

  // A working set is one that targets repMin - repMax
  // We assume all sets in the session are working sets for this calculation (warm-ups are excluded in logging)
  const repMin = exercise.targetRepMin;
  const repMax = exercise.targetRepMax;
  
  const allSetsSuccess = exercise.sets.every(set => set.reps >= repMax);
  const anySetFail = exercise.sets.some(set => set.reps < repMin);

  if (allSetsSuccess && exercise.effort !== 'near') {
    const newSuccessStreak = state.successStreak + 1;
    if (newSuccessStreak >= RULES.train.progression.confirmSessions) {
      // check if we can increase this week
      if (state.weeksSinceStart <= RULES.train.progression.earlyWeeks && 
          state.increasesThisWeek >= RULES.train.progression.maxIncreasesPerWeekEarly) {
        return { ...state, successStreak: newSuccessStreak }; // Wait until next week to increase
      }
      
      return {
        ...state,
        load: state.load + increment,
        successStreak: 0,
        increasesThisWeek: state.increasesThisWeek + 1,
      };
    }
    return { ...state, successStreak: newSuccessStreak };
  }

  if (anySetFail) {
    const newFailStreak = state.failStreak + 1;
    if (newFailStreak >= RULES.train.progression.failDeloadAt) {
      const deloadLoad = state.load * (1 - RULES.train.progression.deloadPct / 100);
      return {
        ...state,
        load: roundToEquipment(deloadLoad, increment),
        failStreak: 0,
        successStreak: 0
      };
    }
    return { ...state, failStreak: newFailStreak, successStreak: 0 };
  }

  // Neither success nor fail (e.g. hit repMin but not repMax), or success with 'near' effort
  // If it was full success but near effort, we don't advance the streak but we don't reset it either
  if (allSetsSuccess) {
    return { ...state };
  }
  
  return { ...state, successStreak: 0 }; // reset success streak, fail streak stays
}

export type BodyweightProgressionState = {
  pattern: LadderPattern;
  stepRank: number;
};

export function evaluateBodyweightLadder(
  exercise: SessionExercise,
  state: BodyweightProgressionState
): BodyweightProgressionState {
  if (exercise.painFlag) {
    return { ...state };
  }

  const ladder = LADDERS[state.pattern];
  if (!ladder) return state;

  const isHold = exercise.sets[0]?.isHold;
  
  if (isHold) {
    // HOLDS: 3x60s to advance
    const allSuccess = exercise.sets.every(set => set.reps >= RULES.train.ladder.holdMaxS);
    if (allSuccess && state.stepRank < ladder.length) {
      return { ...state, stepRank: state.stepRank + 1 };
    }
    return state;
  }

  // LADDER: 3x8 clean to advance
  const allSuccess = exercise.sets.every(set => set.reps >= RULES.train.ladder.repMax);
  const anyFail = exercise.sets.some(set => set.reps < RULES.train.ladder.repMin);

  if (anyFail && state.stepRank > 1) {
    return { ...state, stepRank: state.stepRank - 1 };
  }

  if (allSuccess && state.stepRank < ladder.length) {
    return { ...state, stepRank: state.stepRank + 1 };
  }

  return state;
}

export function calculateWarmupRamp(workingLoad: number, increment: number): { load: number, reps: number }[] {
  const ramp1Load = roundToEquipment(workingLoad * 0.5, increment);
  const ramp2Load = roundToEquipment(workingLoad * 0.75, increment);
  return [
    { load: ramp1Load, reps: 8 },
    { load: ramp2Load, reps: 4 }
  ];
}

export function calculatePlates(load: number, barWeight: number, availablePlates: number[]): number[] | null {
  let remainingWeight = (load - barWeight) / 2;
  if (remainingWeight <= 0) return []; // Just bar
  
  const platesToUse: number[] = [];
  const sortedPlates = [...availablePlates].sort((a, b) => b - a);

  for (const plate of sortedPlates) {
    while (remainingWeight >= plate) {
      platesToUse.push(plate);
      remainingWeight -= plate;
    }
  }

  // If we can't make the exact load due to plate limits, we might need a more complex knapsack or just fail.
  // The spec says "achievable loads only". So if remainingWeight > 0.001, we failed.
  if (remainingWeight > 0.001) return null;

  return platesToUse;
}
