import { RULES } from '../rules.config';
import { addDays } from './learn';

export interface ReviewRamp {
  step: number;
  lastDay?: string;
  emptySince?: string;
  oneMoreDay?: string;
}

export function readReviewRamp(value: unknown): ReviewRamp {
  if (!value || typeof value !== 'object') return { step: 0 };
  const row = value as Record<string, unknown>;
  return {
    step: typeof row.step === 'number' && Number.isInteger(row.step) ? Math.max(0, Math.min(2, row.step)) : 0,
    lastDay: typeof row.lastDay === 'string' ? row.lastDay : undefined,
    emptySince: typeof row.emptySince === 'string' ? row.emptySince : undefined,
    oneMoreDay: typeof row.oneMoreDay === 'string' ? row.oneMoreDay : undefined,
  };
}

export function reviewAllowance(due: number, today: string, state: ReviewRamp): number {
  if (due <= 0 || state.lastDay === today) return 0;
  const reset = state.emptySince && addDays(state.emptySince, RULES.mind.reviewSession.resetAfterDays) <= today;
  const step = reset ? 0 : state.step;
  return Math.min(due, due > RULES.mind.reviewSession.bigPile
    ? RULES.mind.reviewSession.ramp[step]!
    : RULES.mind.reviewSession.ramp[2]);
}

export function oneMoreAllowance(due: number, today: string, state: ReviewRamp): number {
  return state.lastDay === today && state.oneMoreDay !== today
    ? Math.min(due, RULES.mind.reviewSession.ramp[2]) : 0;
}

export function finishReviewRamp(state: ReviewRamp, today: string, remaining: number, oneMore = false): ReviewRamp {
  const reset = state.emptySince && addDays(state.emptySince, RULES.mind.reviewSession.resetAfterDays) <= today;
  return {
    step: oneMore || state.lastDay === today ? state.step : Math.min((reset ? 0 : state.step) + 1, 2),
    lastDay: today,
    emptySince: remaining === 0 ? today : undefined,
    oneMoreDay: oneMore ? today : state.oneMoreDay,
  };
}

/** Only called at the stopping screen. Oldest waiting cards retain the earliest slots. */
export function spreadReviewBacklog<T extends { id: string; due: string }>(
  waiting: T[], today: string, sessionStartDue: number, nextStep = 2,
): { id: string; due: string }[] {
  if (sessionStartDue <= RULES.mind.reviewSession.spreadAbove) return [];
  const firstDay = RULES.mind.reviewSession.ramp[nextStep] ?? RULES.mind.reviewSession.ramp[2];
  return [...waiting].filter(row => row.due <= today)
    .sort((a, b) => a.due.localeCompare(b.due) || a.id.localeCompare(b.id))
    .map((row, index) => ({ id: row.id, due: addDays(today, index < firstDay ? 1 : 2 + Math.floor((index - firstDay) / RULES.mind.reviewSession.spreadPerDay)) }));
}
