import { GOALS, type Goal, type Picks } from './welcome';

/**
 * Spec 52 C: after ten useful days, Home asks once whether to add one more thing. It names one area: the one the
 * person used most without picking it, else the next one in GOALS order; at four picks it offers Everything. "Not now"
 * is final; adding stays possible in You. No count, no badge, no reminder. At size 'all' there is nothing to offer.
 */
export const MORE_OFFER_KEY = 'profile.moreOffer';
export const MORE_OFFER_DAYS = 10;
export type MoreOffer = { add: Goal } | { add: 'all' };

/** Which area a ledger fact belongs to; facts that belong to none (XP, quests, purchases, Calm, pause) are left out. */
const AREA_OF: Record<string, Goal> = {
  'learn-lesson': 'learn', chapter: 'learn', 'chapter-check': 'learn', idea: 'learn', 'learn-answer': 'learn', chiku: 'learn', lesson: 'learn', card: 'learn', matka: 'learn',
  board: 'mind', mystery: 'mind',
  done: 'plan', 'focus-time': 'plan',
  lightsout: 'sleep', kolam: 'sleep',
};
const TRAIN_KINDS = new Set(['session', 'rest', 'pr']);
export function areaOfFact(fact: { mode: string; kind: string }): Goal | undefined {
  if (fact.mode === 'train' && TRAIN_KINDS.has(fact.kind)) return 'train';
  return fact.mode === 'calm' ? undefined : AREA_OF[fact.kind];
}

export function moreOffer(input: { picks: Picks; answered: boolean; usefulDays: number; facts: readonly { mode: string; kind: string; deleted: number }[] }): MoreOffer | null {
  const { picks } = input;
  if (picks.size === 'all' || input.answered || input.usefulDays < MORE_OFFER_DAYS) return null;
  if (picks.goals.length >= 4) return { add: 'all' };
  const used = new Map<Goal, number>();
  for (const fact of input.facts) {
    const area = !fact.deleted ? areaOfFact(fact) : undefined;
    if (area && !picks.goals.includes(area)) used.set(area, (used.get(area) ?? 0) + 1);
  }
  const unpicked = GOALS.map(goal => goal.id).filter(goal => !picks.goals.includes(goal));
  // The most used first; a tie (or nothing used) keeps GOALS order.
  const most = [...unpicked].sort((a, b) => (used.get(b) ?? 0) - (used.get(a) ?? 0))[0]!;
  return { add: most };
}
