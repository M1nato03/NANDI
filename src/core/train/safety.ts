import { RULES } from '../rules.config';
import { Routine, TrainSession } from './types';

/**
 * Cut volume by RULES.train.heatMode.volumeCutPct % for the first RULES.train.heatMode.acclimatiseDays
 */
export function applyHeatMode(routine: Routine, heatModeActive: boolean, daysInHeat: number): Routine {
  if (!heatModeActive) return routine;
  if (daysInHeat >= RULES.train.heatMode.acclimatiseDays) return routine;

  const cutPct = RULES.train.heatMode.volumeCutPct;
  const factor = 1 - cutPct / 100;

  return {
    ...routine,
    exercises: routine.exercises.map(ex => ({
      ...ex,
      sets: Math.max(1, Math.round(ex.sets * factor))
    }))
  };
}

export function checkWeeklyVolumeIncrease(currentWeekSets: number, previousWeekSets: number): boolean {
  if (previousWeekSets === 0) return true; // No previous week to compare to, so no warning
  const increasePct = ((currentWeekSets - previousWeekSets) / previousWeekSets) * 100;
  return increasePct <= RULES.train.weeklyHardSetIncreaseMaxPct;
}

export function hasPainFlag(session: TrainSession): boolean {
  return session.exercises.some(ex => ex.painFlag);
}
