import { RULES } from '../rules.config';
import { Routine, TrainSession } from './types';
import { hasPainFlag } from './safety';

export function calculateSessionXp(session: TrainSession, routine: Routine): number {
  if (session.exercises.length === 0) return 0; // Unplanned extra sets earn 0 (if an empty session is somehow logged)

  const plannedExercises = routine.exercises.length;
  if (plannedExercises === 0) return 0; // Guard against empty routine

  // If safety stop (pain flag)
  if (hasPainFlag(session)) {
    return RULES.train.minimumOrSafetyXp;
  }

  // We should check if they did 1 set of each, but not the full amount.
  // Actually, let's calculate based on working sets done.
  let plannedSets = 0;
  for (const ex of routine.exercises) {
    plannedSets += ex.sets;
  }

  let doneSets = 0;
  let exercisesTouched = 0;
  for (const ex of session.exercises) {
    const routineEx = routine.exercises.find(r => r.exerciseId === ex.exerciseId);
    if (routineEx) {
      doneSets += Math.min(ex.sets.length, routineEx.sets); // Cap at planned sets
      if (ex.sets.length > 0) exercisesTouched++;
    }
  }

  if (exercisesTouched === 0) return 0;

  // Minimum session check according to the rules: "1 set of each"
  if (exercisesTouched === plannedExercises && doneSets === plannedExercises && plannedSets > plannedExercises) {
    return RULES.train.minimumOrSafetyXp;
  }

  const shareOfSets = doneSets / plannedSets;

  if (exercisesTouched === plannedExercises) {
    if (shareOfSets >= 1) {
      return RULES.train.sessionFullXp;
    }
    return Math.max(RULES.train.sessionPartialFloorXp, Math.round(RULES.train.sessionFullXp * shareOfSets));
  } else {
    return Math.round(RULES.train.sessionFullXp * shareOfSets);
  }
}

export function calculateWeeklyBonus(sessionsCompleted: number, target: number): number {
  if (sessionsCompleted >= target) {
    return RULES.train.weeklyBonus.targetMet;
  }
  if (target === 3 && sessionsCompleted === 2) {
    return RULES.train.weeklyBonus.oneShort;
  }
  return 0;
}

export function capDailyXp(xp: number): number {
  return Math.min(xp, RULES.train.dailyCapExclWeekly);
}

export function calculateBestSessionXpForDay(sessionsWithXp: number[]): number {
  if (sessionsWithXp.length === 0) return 0;
  return Math.max(...sessionsWithXp);
}

/** Derive the day award from immutable facts; the weekly bonus is added separately. */
export function calculateTrainDailyXp(sessionXps: number[], prCount: number, restCheck: boolean): number {
  const session = calculateBestSessionXpForDay(sessionXps);
  const prs = Math.min(RULES.train.prMaxPerDay, Math.max(0, prCount)) * RULES.train.prXp;
  const rest = restCheck && session === 0 ? RULES.train.restDayCheckXp : 0;
  return capDailyXp(session + prs + rest);
}
