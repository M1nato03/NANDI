import type { PuzzleDifficulty, PuzzleType } from '.';
import { decodePace, encodePace } from './pace';

/**
 * Challenge a friend without accounts (audit 10-21): the link carries the board's seed, so the friend's
 * phone builds the identical board. The shared text (share.ts resultText) gives time and hints only, never the answer.
 * Spec 19 D: new links also carry the planning day, `challenge/<YYYYMMDD>/<type>/<diff>/<seed>`, written
 * without dashes because a route segment allows only letters and digits. Old links without a day still open.
 * Spec 24 pace line: a link may end with one more segment, `p<marks>`, the sender's pace on this board. Older app
 * versions read only `<type>/<diff>/<seed>` and ignore it.
 */
export const WEB_APP = 'https://nandi.nandi11.workers.dev';
const TYPES: readonly PuzzleType[] = ['sudoku', 'crowns', 'sunmoon', 'path', 'calc'];
const DIFFS: readonly PuzzleDifficulty[] = ['easy', 'medium', 'hard'];
export interface Challenge { type: PuzzleType; diff: PuzzleDifficulty; seed: number; /** The planning day (`YYYY-MM-DD`) the board was shared for. */ day?: string; /** The sender's pace marks (spec 24). */ pace?: number[] }

export const challengeRoute = ({ type, diff, seed, day, pace }: Challenge) => {
  const segment = encodePace(pace);
  return `mind/challenge/${day ? `${day.replaceAll('-', '')}/` : ''}${type}/${diff}/${seed >>> 0}${segment ? `/${segment}` : ''}`;
};
export const challengeUrl = (challenge: Challenge, base = WEB_APP) => `${base}/#${challengeRoute(challenge)}`;

/** `20261105` → `2026-11-05`, only for a real calendar date. */
function readDay(compact: string): string | null {
  if (!/^\d{8}$/.test(compact)) return null;
  const [year, month, date] = [Number(compact.slice(0, 4)), Number(compact.slice(4, 6)), Number(compact.slice(6))];
  const check = new Date(Date.UTC(year, month - 1, date));
  if (year < 2000 || check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== date) return null;
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6)}`;
}

/** Reads `challenge/[<YYYYMMDD>/]<type>/<diff>/<seed>` (the part after `mind/`); anything else is not a challenge. */
export function parseChallenge(entry: string | undefined): Challenge | null {
  const [head, ...rest] = (entry ?? '').split('/');
  if (head !== 'challenge') return null;
  let day: string | undefined;
  if (rest.length >= 4 && /^\d{8}$/.test(rest[0]!)) {
    const read = readDay(rest.shift()!);
    if (!read) return null;
    day = read;
  }
  const [type, diff, seed, paceSegment] = rest;
  if (!TYPES.includes(type as PuzzleType) || !DIFFS.includes(diff as PuzzleDifficulty) || !/^\d{1,10}$/.test(seed ?? '')) return null;
  const value = Number(seed);
  // A broken pace segment is dropped, never a reason to refuse the board.
  const pace = decodePace(paceSegment);
  return value <= 0xffffffff ? { type: type as PuzzleType, diff: diff as PuzzleDifficulty, seed: value, ...(day ? { day } : {}), ...(pace ? { pace } : {}) } : null;
}
