import { RULES } from '../rules.config';
import { Routine, TrainSession } from '../train/types';
import { calculateSessionXp, calculateWeeklyBonus } from '../train';

// Economy hooks for Train module.
// In the ledger, facts only are logged. These functions calculate the XP that these facts represent.

export function awardTrainSession(session: TrainSession, routine: Routine): number {
  return calculateSessionXp(session, routine);
}

export function awardRestDayCheck(): number {
  return RULES.train.restDayCheckXp;
}

export function awardPr(): number {
  return RULES.train.prXp;
}

export function awardWeeklyTargetMet(sessionsCompleted: number, target: number): number {
  return calculateWeeklyBonus(sessionsCompleted, target);
}
