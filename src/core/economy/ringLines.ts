import type { BodyMark, MindAct } from './daySlots';

/**
 * Spec 571 §0.20 §marks: the one line a ring says when tapped; its aria-label uses the same line. Built from one
 * template and the noun table, so the 15 Mind pairings never drift (the list in the spec is the test fixture).
 */
export const MIND_NOUN: Record<MindAct, string> = {
  drop: "today's idea", chapter: 'a chapter', calm: 'a Calm sit', case: 'a solved case', board: "Kapi's board", cards: 'your cards',
};
export const RINGS_NIGHT_LINE = 'Rings rest for the night.';
export const PROMISE_TITLE_MAX = 28;

/** A promise's title kept to 28 characters, with an ellipsis when cut. */
export function promiseTitle(title: string): string {
  const clean = title.trim().replace(/\s+/g, ' ');
  return clean.length <= PROMISE_TITLE_MAX ? clean : `${clean.slice(0, PROMISE_TITLE_MAX - 1).trimEnd()}…`;
}

export function yatraLine(promise: string | null | undefined): string {
  if (promise == null) return 'Yatra: keep one promise.';
  const title = promiseTitle(promise);
  return title ? `Yatra: you kept a promise, ${title}.` : 'Yatra: you kept a promise.';
}

export function bodyLine(body: BodyMark | null): string {
  return body === 'workout' ? 'Body: a workout.' : body === 'walk' ? 'Body: a rest walk.' : 'Body: one real move.';
}

/** Unlit, half (one act), or closed: the first two different acts, named in the order done. */
export function mindLine(acts: readonly MindAct[]): string {
  const [first, second] = acts;
  if (!first) return 'Mind: any two.';
  if (!second) return `Mind: ${MIND_NOUN[first]}. One more, a different one, closes it.`;
  return `Mind: ${MIND_NOUN[first]} and ${MIND_NOUN[second]}.`;
}
