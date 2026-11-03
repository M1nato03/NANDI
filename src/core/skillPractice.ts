/**
 * Spec 43 (starter): the practice engine. Every lesson runs one loop: a worked example, change one part, a fresh case,
 * specific feedback, then the answer is saved and a retry is set for a later day. Narrow checks (pick, order, fill a
 * phrase) are machine-checked against the pack's accepted answers; anything open is the learner's own words and is only
 * ever a self-check, never a grade. Pure functions only: the repos write, the screen shows.
 *
 * XP is deferred to the slice that ships the first real pack, as a forward-only RULES_HISTORY entry with its own
 * economy cutoff. When it comes, ONLY a machine-checked fresh answer (choice, order, phrase) that checks 'right' can
 * pay: a self-check, anything written in the learner's own words, a near miss, a retry, a revision or a saved page
 * pays 0 (Jenil: "a written line does not earn xp"; jenil-94, 3 Nov).
 */
import { dayKey } from './time';

export type CheckResult = 'right' | 'near' | 'wrong';

interface Feedback { right: string; wrong: string }
export type NarrowCheck =
  | { kind: 'choice'; options: string[]; accepted: string[]; nearMisses?: { answer: string; feedback: string }[]; feedback: Feedback; tests?: { accept: string[]; reject: string[] } }
  | { kind: 'phrase'; accepted: string[]; nearMisses?: { answer: string; feedback: string }[]; feedback: Feedback; tests?: { accept: string[]; reject: string[] } }
  | { kind: 'order'; parts: string[]; nearMisses?: { answer: string[]; feedback: string }[]; feedback: Feedback; tests?: { accept: string[][]; reject: string[][] } };
export type Answer = string | string[];

/**
 * The same text in a kinder form for comparing: Unicode NFC first (so a composed and a decomposed "é" match), then
 * runs of space folded, case folded, and punctuation trimmed from the two ends only. Nothing inside changes meaning.
 */
export function normalize(value: string): string {
  return value.normalize('NFC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('en-IN')
    .replace(/^[\s.,;:!?'"‘’“”()-]+|[\s.,;:!?'"‘’“”()-]+$/g, '');
}

const same = (a: string, b: string) => normalize(a) === normalize(b);
const sameOrder = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((part, i) => same(part, b[i]!));

/** Checks one answer: right, a named near miss with its own feedback, or wrong with the check's general feedback. */
export function checkAnswer(check: NarrowCheck, answer: Answer): { result: CheckResult; feedback: string } {
  if (check.kind === 'order') {
    const parts = Array.isArray(answer) ? answer : [answer];
    if (sameOrder(parts, check.parts)) return { result: 'right', feedback: check.feedback.right };
    const near = check.nearMisses?.find(miss => sameOrder(parts, miss.answer));
    return near ? { result: 'near', feedback: near.feedback } : { result: 'wrong', feedback: check.feedback.wrong };
  }
  const text = Array.isArray(answer) ? answer.join(' ') : answer;
  if (check.accepted.some(accepted => same(text, accepted))) return { result: 'right', feedback: check.feedback.right };
  const near = check.nearMisses?.find(miss => same(text, miss.answer));
  return near ? { result: 'near', feedback: near.feedback } : { result: 'wrong', feedback: check.feedback.wrong };
}

/** The loop's stages, in order. A real stop: nothing moves on by itself. */
export const STAGES = ['worked', 'change', 'fresh', 'feedback', 'saved'] as const;
export type Stage = typeof STAGES[number];

export interface LoopState {
  stage: Stage;
  /** The change-one-part answer and its check; required before the fresh case. */
  change?: { answer: Answer; result: CheckResult };
  /** The fresh case's answer: checked, or the learner's own words for a self-check. */
  fresh?: { answer: Answer; result: CheckResult | 'self' };
}

export type LoopEvent =
  | { type: 'next' }
  | { type: 'change'; answer: Answer; result: CheckResult }
  | { type: 'fresh'; answer: Answer; result: CheckResult | 'self' }
  | { type: 'revise' }
  | { type: 'saved' };

/**
 * Moves the loop one step. The worked example moves on by "next"; the change-one-part stage needs a checked answer
 * (any result: the feedback teaches); the fresh case needs an answer; feedback can go back to revise the fresh answer
 * or be saved. No event skips a stage, and an event that does not fit the stage leaves it unchanged.
 */
export function stepLoop(state: LoopState, event: LoopEvent): LoopState {
  switch (state.stage) {
    case 'worked': return event.type === 'next' ? { ...state, stage: 'change' } : state;
    case 'change': return event.type === 'change' ? { ...state, change: { answer: event.answer, result: event.result } }
      : event.type === 'next' && state.change ? { ...state, stage: 'fresh' } : state;
    case 'fresh': return event.type === 'fresh' && answered(event.answer) ? { ...state, stage: 'feedback', fresh: { answer: event.answer, result: event.result } } : state;
    case 'feedback': return event.type === 'revise' ? { ...state, stage: 'fresh' } : event.type === 'saved' ? { ...state, stage: 'saved' } : state;
    case 'saved': return state;
  }
}
const answered = (answer: Answer) => Array.isArray(answer) ? answer.length > 0 : answer.trim().length > 0;

/** Retry gaps in days after a right fresh answer: 3, then 7, then 14, then no more. A wrong or near one comes back next day. */
export const RETRY_GAPS = [3, 7, 14] as const;

/** Adds whole calendar days to a dayKey (YYYY-MM-DD), by the calendar, never by 24-hour steps. */
export function addDays(day: string, days: number): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

/**
 * When this lesson comes back, from the day it was finished (04:00 dayKey). `rightsSoFar` is how many right retries
 * in a row came before this one. A self-check (no machine check) follows the right path: it is the learner's say-so.
 */
export function nextRetry(finishedAt: number, result: CheckResult | 'self', rightsSoFar: number): { due: string | null; rights: number } {
  const day = dayKey(finishedAt);
  if (result === 'wrong' || result === 'near') return { due: addDays(day, 1), rights: 0 };
  const gap = RETRY_GAPS[rightsSoFar];
  return gap === undefined ? { due: null, rights: rightsSoFar + 1 } : { due: addDays(day, gap), rights: rightsSoFar + 1 };
}
