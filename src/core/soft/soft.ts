import type { LedgerRow } from '../../data/types';
import { RULES } from '../rules.config';

/**
 * Spec 15, soft days. On a tired or low day one gentle thing keeps the day. Two ledger kinds:
 * `soft-start` { state } (one row per tap, the latest wins; 'okay' switches back) and `soft` { choice } (the gentle thing done).
 */
export type SoftState = 'tired' | 'low';
export type SoftChoice = 'breathe' | 'stretch' | 'tiny-task' | 'outside' | 'kind-word' | 'good-thing';
export interface SoftOption { id: SoftChoice; label: string; minutes?: number }

export const SOFT_LINES: Record<SoftState, string> = {
  tired: 'Slow is still moving. Pick one small thing.',
  low: 'Low days happen. Pick one kind thing.',
};
/** Fixed per state: never random, never more than three. */
export const SOFT_OPTIONS: Record<SoftState, readonly SoftOption[]> = {
  tired: [
    { id: 'breathe', label: 'Breathe with Kachhua', minutes: 1 },
    { id: 'stretch', label: 'Stretch in bed', minutes: 2 },
    { id: 'tiny-task', label: 'Do one tiny task' },
  ],
  low: [
    { id: 'outside', label: 'Step outside', minutes: 5 },
    { id: 'kind-word', label: 'Send someone a kind word' },
    { id: 'good-thing', label: 'One good thing from today' },
  ],
};
/** Starter lines for the kind-word card (spec 15 E). The person can write their own instead. */
export const KIND_WORDS = [
  'Thinking of you today.',
  'Hope today is gentle with you.',
  'No reply needed. Just sending a little warmth.',
  'You make things better. Just saying.',
  "Drink some water and take a breath. You've got this.",
] as const;

const live = (fact: LedgerRow) => !fact.deleted && /^\d{4}-\d{2}-\d{2}$/.test(fact.dayKey);
// Ties (two taps in one millisecond) fall back to the id, which is monotonic within a day.
const latest = (facts: readonly LedgerRow[]) => [...facts].sort((a, b) => a.updatedAt - b.updatedAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).at(-1);

export interface SoftToday { state: SoftState | null; done: LedgerRow | null }
/** Today's soft state: the latest soft-start (unless switched back to okay) and the gentle thing, if done. */
export function softToday(facts: readonly LedgerRow[], today: string): SoftToday {
  const day = facts.filter(fact => live(fact) && fact.dayKey === today);
  const start = latest(day.filter(fact => fact.kind === 'soft-start'));
  const state = start?.inputs.state === 'tired' || start?.inputs.state === 'low' ? start.inputs.state : null;
  return { state, done: latest(day.filter(fact => fact.kind === 'soft')) ?? null };
}

const addDays = (key: string, count: number) => new Date(Date.parse(`${key}T12:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10);
/** Days that lit a lantern (a gentle thing was done). Lanterns never go away. */
export function lanternDays(facts: readonly LedgerRow[], upTo?: string): string[] {
  return [...new Set(facts.filter(fact => live(fact) && fact.kind === 'soft' && (!upTo || fact.dayKey <= upTo)).map(fact => fact.dayKey))].sort();
}
/** The morning after a soft day opens with one line about it. */
export function yesterdayWasSoft(facts: readonly LedgerRow[], today: string): boolean {
  return lanternDays(facts, today).includes(addDays(today, -1));
}

/** Spec 15 F: "Feeling low" on 4+ of the last 14 days → the care card, shown once, then at most every 14 days. */
export function careCardDue(facts: readonly LedgerRow[], today: string, lastShown: unknown): boolean {
  const from = addDays(today, -(RULES.soft.careWindowDays - 1));
  const lowDays = new Set(facts.filter(fact => live(fact) && fact.kind === 'soft-start' && fact.inputs.state === 'low' && fact.dayKey >= from && fact.dayKey <= today).map(fact => fact.dayKey));
  if (lowDays.size < RULES.soft.careLowDays) return false;
  return typeof lastShown !== 'string' || lastShown <= addDays(today, -RULES.soft.careWindowDays);
}

/** A kept good thing shows in the storybook only when the person allowed it. */
export function storyGoodThings(facts: readonly LedgerRow[], from: string, to: string): string[] {
  return facts.filter(fact => live(fact) && fact.kind === 'soft' && fact.inputs.choice === 'good-thing' && fact.inputs.inStory === true
    && fact.dayKey >= from && fact.dayKey <= to && typeof fact.inputs.text === 'string' && fact.inputs.text.trim())
    .map(fact => String(fact.inputs.text).trim());
}

const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
};
export interface SoftNumbers { started: number; finished: number; finishRate: number | null; medianMinutes: number | null; returnAfterSoft: number | null; returnAfterMiss: number | null }
/**
 * Spec 15 §6 kill test, for the owner panel: finish rate, median minutes from start to the gentle thing,
 * and next-day return after a soft day versus after a day with no activity at all.
 */
export function softNumbers(facts: readonly LedgerRow[], today: string): SoftNumbers {
  const live2 = facts.filter(live);
  const startDays = [...new Set(live2.filter(fact => fact.kind === 'soft-start' && (fact.inputs.state === 'tired' || fact.inputs.state === 'low')).map(fact => fact.dayKey))];
  const soft = new Set(lanternDays(live2));
  const finished = startDays.filter(day => soft.has(day)).length;
  const minutes = startDays.flatMap(day => {
    const start = live2.filter(fact => fact.dayKey === day && fact.kind === 'soft-start' && fact.inputs.state !== 'okay').sort((a, b) => a.updatedAt - b.updatedAt)[0];
    const done = live2.filter(fact => fact.dayKey === day && fact.kind === 'soft').sort((a, b) => a.updatedAt - b.updatedAt)[0];
    return start && done && done.updatedAt >= start.updatedAt ? [(done.updatedAt - start.updatedAt) / 60_000] : [];
  });
  const active = new Set(live2.map(fact => fact.dayKey));
  const first = [...active].sort()[0];
  const rate = (days: string[]) => {
    const judged = days.filter(day => addDays(day, 1) < today);
    return judged.length ? judged.filter(day => active.has(addDays(day, 1))).length / judged.length : null;
  };
  const misses: string[] = [];
  if (first) for (let day = first; day < today; day = addDays(day, 1)) if (!active.has(day)) misses.push(day);
  return { started: startDays.length, finished, finishRate: startDays.length ? finished / startDays.length : null,
    medianMinutes: median(minutes), returnAfterSoft: rate([...soft]), returnAfterMiss: rate(misses) };
}
