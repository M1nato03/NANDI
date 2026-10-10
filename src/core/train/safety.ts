import { RULES } from '../rules.config';
import { Routine, TrainSession } from './types';

/**
 * Cut volume by RULES.train.heatMode.volumeCutPct % for the first RULES.train.heatMode.acclimatiseDays
 */
export function applyHeatMode(routine: Routine, heatModeActive: boolean, daysInHeat: number): Routine {
  if (!heatModeActive) return routine;
  if (daysInHeat >= RULES.train.heatMode.acclimatiseDays) return routine;
  return cutVolume(routine, RULES.train.heatMode.volumeCutPct);
}

function cutVolume(routine: Routine, pct: number): Routine {
  const exercises = routine.exercises.map(ex => ({ ...ex }));
  const total = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const target = Math.max(exercises.length, Math.round(total * (1 - pct / 100)));
  let remaining = total - target;
  let cursor = 0;
  while (remaining > 0) {
    const next = exercises[cursor % exercises.length]!;
    if (next.sets > 1) { next.sets--; remaining--; }
    cursor++;
  }
  return { ...routine, exercises };
}

export function checkWeeklyVolumeIncrease(currentWeekSets: number, previousWeekSets: number): boolean {
  if (previousWeekSets === 0) return true; // No previous week to compare to, so no warning
  const increasePct = ((currentWeekSets - previousWeekSets) / previousWeekSets) * 100;
  return increasePct <= RULES.train.weeklyHardSetIncreaseMaxPct;
}

export function needsWeeklyVolumeConfirmation(plannedSets: number, previousSets: number): boolean {
  return !checkWeeklyVolumeIncrease(plannedSets, previousSets);
}

export function isRetestWeek(startedAt: number, now: number): boolean {
  const elapsedWeeks = Math.floor((now - startedAt) / (7 * 86_400_000));
  return elapsedWeeks > 0 && elapsedWeeks % RULES.train.retestEveryWeeks === 0;
}

export function applyRetestVolume(routine: Routine, due: boolean): Routine {
  if (!due) return routine;
  return cutVolume(routine, RULES.train.retestVolumeCutPct);
}

export function heatAdvice(input: { hotMode: boolean; celsius?: number; humid?: boolean; dizzy?: boolean }): string[] {
  if (input.dizzy) return ['Stop and seek help if dizzy or confused.'];
  if (!input.hotMode) return [];
  const lines = ['Choose a late-evening or indoor session. Keep the first 10–14 days lighter.', 'Watch for dizziness, confusion, headache, nausea or unusual weakness. Stop if these appear.'];
  if (input.celsius != null && input.celsius > RULES.train.heatIndoorCelsius && input.humid) lines.push('Move indoors in this heat and humidity.');
  return lines;
}

export function remainingRestMs(endAt: number, now: number): number {
  return Math.max(0, endAt - now);
}

export function hasPainFlag(session: TrainSession): boolean {
  return session.exercises.some(ex => ex.painFlag);
}
