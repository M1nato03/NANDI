import type { LedgerRow } from '../data/types';

/**
 * Spec 54: the optional "why" after "Open anyway". Private to the person: counted only in a small line in You, never
 * shared, never scored, no XP, nothing spent, and no word judges a reason.
 */
export const PAUSE_REASONS = [
  { id: 'quick-check', label: 'Quick check', plural: 'quick checks', one: 'quick check' },
  { id: 'reply', label: 'Reply to someone', plural: 'replies', one: 'reply' },
  { id: 'posting', label: 'Posting', plural: 'posts', one: 'post' },
  { id: 'scrolling', label: 'Just scrolling', plural: 'just scrolling', one: 'just scrolling' },
] as const;
export type PauseReason = typeof PAUSE_REASONS[number]['id'];

/** "Your reasons this week: 6 quick checks, 2 just scrolling", counts only, in a fixed order; null when there are none. */
export function reasonsLine(facts: readonly LedgerRow[], from: string, to: string): string | null {
  const counts = PAUSE_REASONS.map(reason => ({ reason, count: facts.filter(row => !row.deleted && row.mode === 'pause' && row.kind === 'reason' && row.inputs.why === reason.id && row.dayKey >= from && row.dayKey < to).length }))
    .filter(row => row.count > 0);
  if (!counts.length) return null;
  return `Your reasons this week: ${counts.map(({ reason, count }) => `${count} ${count === 1 ? reason.one : reason.plural}`).join(', ')}`;
}
