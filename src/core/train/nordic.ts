import { RULES } from '../rules.config';
import { EXERCISE_LIBRARY, LADDERS } from './library';
import type { RoutineExercise, SessionExercise } from './types';

/**
 * Spec 17, the Nordic ready card. Lives on the program row, so a backup carries it.
 * SL-RDL 3x8 with the Nordic step still closed turns on slow SL-RDL (a variant of rank 2, not a new rank);
 * slow SL-RDL 3x8 brings the ready card; "I'm ready" opens the Nordic step with a small 2x3 first session.
 */
export type NordicState = {
  /** Slow SL-RDL is on (3-second lowering, 1-second pause). */
  slow?: boolean;
  /** The last day slow SL-RDL 3x8 was met. */
  slowMetDay?: string;
  /** The day the person tapped "Not now" on the card. */
  notNowDay?: string;
  /** `nordicReady`. Unset until the person answers the card; false once they turn Nordic curls off in Train settings. */
  ready?: boolean;
  /** The small first Nordic session has run. */
  introDone?: boolean;
};

const hinge = LADDERS.hinge!;
/** The single-leg RDL step, and the first Nordic step after it. */
export const SLOW_RANK = hinge.find(step => step.exerciseId === 'sl-rdl')!.rank;
export const NORDIC_RANK = hinge.find(step => step.gate === 'nordic-setup')!.rank;
export const SLOW_NAME = 'Slow single-leg RDL';
/** The name a planned slot shows: slow SL-RDL keeps the SL-RDL step but has its own name. */
export const slotName = (ex: Pick<RoutineExercise, 'exerciseId' | 'variant'>): string => ex.variant === 'slow' ? SLOW_NAME : EXERCISE_LIBRARY[ex.exerciseId]?.name ?? ex.exerciseId;
export const NORDIC_STOP_LINE = 'Stop if you feel a sharp pull at the back of the thigh or pain behind the knee.';

const addDays = (key: string, count: number) => new Date(Date.parse(`${key}T12:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10);

/**
 * People placed on a Nordic step before the gate existed (d037b36) never saw the card. They keep exactly what they had:
 * read as ready and past the first session, so the switch shows on and nothing moves. Anyone placed since then cannot
 * reach rank 3 without answering, so an unanswered state at rank 3 or 4 can only be one of them.
 */
export function nordicState(stored: NordicState | undefined, hingeRank: number | undefined): NordicState {
  if (stored?.ready !== undefined || (hingeRank ?? 0) < NORDIC_RANK) return stored ?? {};
  return { ...stored, ready: true, introDone: true };
}

/** The hinge slot for today's plan: slow SL-RDL while the Nordic step is closed, and the small first Nordic session once it opens. */
export function hingeSlot(ex: RoutineExercise, rank: number, state: NordicState): RoutineExercise {
  if (rank === SLOW_RANK && state.slow && !state.ready) return { ...ex, variant: 'slow' };
  if (rank === NORDIC_RANK && state.ready && !state.introDone) {
    return { ...ex, sets: RULES.nordic.introSets, repMin: RULES.nordic.introReps, repMax: RULES.nordic.introReps, variant: 'nordic-intro' };
  }
  return ex;
}

/** What a finished hinge session (no pain flag) changes. The caller skips the ladder for the first Nordic session. */
export function afterHingeSession(state: NordicState, exercise: SessionExercise, input: { rank: number; variant?: RoutineExercise['variant']; day: string }): NordicState {
  if (input.variant === 'nordic-intro') return exercise.sets.length > 0 ? { ...state, introDone: true } : state;
  const met = exercise.sets.length >= RULES.train.ladder.sets && exercise.sets.every(set => set.reps >= RULES.train.ladder.repMax);
  if (!met || input.rank !== SLOW_RANK || state.ready) return state;
  return input.variant === 'slow' ? { ...state, slow: true, slowMetDay: input.day } : { ...state, slow: true };
}

/** The ready card shows after slow SL-RDL 3x8; after "Not now" only once slow 3x8 is met again at least 14 days later. */
export function nordicCardDue(state: NordicState, input: { rank: number; today: string; softDay: boolean; afterBedtime: boolean; heatMode: boolean }): boolean {
  if (input.softDay || input.afterBedtime || input.heatMode) return false;
  if (state.ready !== undefined || !state.slow || !state.slowMetDay || input.rank !== SLOW_RANK || state.slowMetDay > input.today) return false;
  return !state.notNowDay || state.slowMetDay >= addDays(state.notNowDay, RULES.nordic.notNowDays);
}

/** The Train settings switch appears once the person has answered the card (or was placed on a Nordic step before the gate). */
export const nordicSwitchShown = (state: NordicState): boolean => state.ready !== undefined;
