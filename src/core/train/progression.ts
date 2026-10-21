import { RULES } from '../rules.config';
import { LADDERS } from './library';
import { EquipmentSetting, LadderPattern, SessionExercise } from './types';

export type IncrementSource = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'time';

/** Where each gym exercise's load step comes from. Holds progress by time, not load. */
export const INCREMENT_SOURCE: Record<string, IncrementSource> = {
  'goblet-squat': 'dumbbell', 'db-bench': 'dumbbell', 'db-rdl': 'dumbbell', 'seated-db-press': 'dumbbell',
  'seated-cable-row': 'cable', 'lat-pulldown': 'cable', 'pallof-press': 'time', 'plank': 'time', 'side-plank': 'time',
  'split-squat': 'dumbbell', 'hip-thrust': 'machine',
};

export function incrementSource(equipment: EquipmentSetting, exerciseId: string): IncrementSource {
  const mapped = INCREMENT_SOURCE[exerciseId];
  if (mapped === 'machine' && equipment.barbell && equipment.smallestPlate) return 'barbell';
  if (mapped === 'dumbbell' && exerciseId === 'split-squat' && !equipment.dumbbells && !equipment.gymAccess) return 'bodyweight';
  if (mapped) return mapped;
  if (/^(barbell-|bb-)/.test(exerciseId)) return 'barbell';
  if (/(^db-|-db-|dumbbell)/.test(exerciseId)) return 'dumbbell';
  return 'bodyweight';
}

export function getSmallestIncrement(equipment: EquipmentSetting, exerciseId: string): number {
  const steps = RULES.train.increments;
  switch (incrementSource(equipment, exerciseId)) {
    case 'barbell': return equipment.barbell && equipment.smallestPlate ? equipment.smallestPlate * 2 : 0;
    case 'dumbbell': return equipment.dumbbells || equipment.gymAccess ? steps.dumbbell : 0;
    case 'machine': return equipment.gymAccess ? equipment.machineStep ?? steps.machine : 0;
    case 'cable': return equipment.gymAccess ? equipment.cableStep ?? steps.cable : 0;
    default: return 0;
  }
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
  
  if (exercise.sets.length === 0) return { ...state };
  const allSetsSuccess = exercise.sets.every(set => set.reps >= repMax);
  const anySetFail = exercise.sets.some(set => set.reps < repMin);

  if (allSetsSuccess && exercise.effort !== 'near') {
    const newSuccessStreak = state.successStreak + 1;
    if (newSuccessStreak >= RULES.train.progression.confirmSessions) {
      if (increment <= 0) return { ...state, successStreak: newSuccessStreak, failStreak: 0 };
      // check if we can increase this week
      if (state.weeksSinceStart <= RULES.train.progression.earlyWeeks && 
          state.increasesThisWeek >= RULES.train.progression.maxIncreasesPerWeekEarly) {
        return { ...state, successStreak: newSuccessStreak, failStreak: 0 }; // Wait until next week to increase
      }
      
      return {
        ...state,
        load: state.load + increment,
        successStreak: 0,
        failStreak: 0,
        increasesThisWeek: state.increasesThisWeek + 1,
      };
    }
    return { ...state, successStreak: newSuccessStreak, failStreak: 0 };
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
    return { ...state, failStreak: 0 };
  }
  
  return { ...state, successStreak: 0, failStreak: 0 };
}

export type BodyweightProgressionState = {
  pattern: LadderPattern;
  stepRank: number;
};

export function evaluateBodyweightLadder(
  exercise: SessionExercise,
  state: BodyweightProgressionState,
  /** The person confirmed a band, a secure ankle hold and that they have learned the move (Nordic curls). */
  options: { nordicReady?: boolean } = {},
): BodyweightProgressionState {
  if (exercise.painFlag) {
    return { ...state };
  }

  const ladder = LADDERS[state.pattern];
  if (!ladder) return state;

  const isHold = exercise.sets[0]?.isHold;
  if (exercise.sets.length === 0) return state;
  const anyFail = exercise.sets.some(set => set.reps < (isHold ? RULES.train.ladder.holdMinS : RULES.train.ladder.repMin));
  if (anyFail && state.stepRank > 1) return { ...state, stepRank: state.stepRank - 1 };
  if (exercise.sets.length < RULES.train.ladder.sets) return state;
  
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

  // A gated next step (Nordic curls) waits until the person has said they are set up for it.
  const nextGated = !!ladder[state.stepRank]?.gate && !options.nordicReady;
  if (allSuccess && state.stepRank < ladder.length && !nextGated) {
    return { ...state, stepRank: state.stepRank + 1 };
  }

  return state;
}

export function calculateWarmupRamp(workingLoad: number, increment: number, barWeight = 0): { load: number, reps: number }[] {
  const ramp1Load = Math.max(barWeight, roundToEquipment(workingLoad * 0.5, increment));
  const ramp2Load = Math.max(barWeight, roundToEquipment(workingLoad * 0.75, increment));
  return [
    { load: ramp1Load, reps: 8 },
    { load: ramp2Load, reps: 4 }
  ];
}

export function calculatePlates(load: number, barWeight: number, availablePlates: number[]): number[] | null {
  if (!Number.isFinite(load) || load < barWeight || barWeight <= 0) return null;
  const target = Math.round((load - barWeight) * 50); // centi-kg per side
  const plates = availablePlates.filter(p => p > 0 && Number.isFinite(p)).sort((a, b) => b - a);
  const search = (index: number, left: number): number[] | null => {
    if (left === 0) return [];
    if (index >= plates.length || left < 0) return null;
    const plate = plates[index]!;
    const withPlate = search(index + 1, left - Math.round(plate * 100));
    return withPlate ? [plate, ...withPlate] : search(index + 1, left);
  };
  return search(0, target);
}
