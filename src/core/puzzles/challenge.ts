import type { PuzzleDifficulty, PuzzleType } from '.';

/**
 * Challenge a friend without accounts (audit 10-21): the link carries the board's seed, so the friend's
 * phone builds the identical board. The shared text (share.ts resultText) gives time and hints only, never the answer.
 */
export const WEB_APP = 'https://nandi.nandi11.workers.dev';
const TYPES: readonly PuzzleType[] = ['sudoku', 'crowns', 'sunmoon', 'path', 'calc'];
const DIFFS: readonly PuzzleDifficulty[] = ['easy', 'medium', 'hard'];
export interface Challenge { type: PuzzleType; diff: PuzzleDifficulty; seed: number }

export const challengeRoute = ({ type, diff, seed }: Challenge) => `mind/challenge/${type}/${diff}/${seed >>> 0}`;
export const challengeUrl = (challenge: Challenge, base = WEB_APP) => `${base}/#${challengeRoute(challenge)}`;

/** Reads `challenge/<type>/<diff>/<seed>` (the part after `mind/`); anything else is not a challenge. */
export function parseChallenge(entry: string | undefined): Challenge | null {
  const [head, type, diff, seed] = (entry ?? '').split('/');
  if (head !== 'challenge' || !TYPES.includes(type as PuzzleType) || !DIFFS.includes(diff as PuzzleDifficulty) || !/^\d{1,10}$/.test(seed ?? '')) return null;
  const value = Number(seed);
  return value <= 0xffffffff ? { type: type as PuzzleType, diff: diff as PuzzleDifficulty, seed: value } : null;
}
