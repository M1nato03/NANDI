import { RULES } from '../rules.config';
import PZ, { type PuzzleBoard, type PuzzleDifficulty, type PuzzleType } from './index';
import type { Challenge } from './challenge';
import { shelfBoard } from './shelf';

/** Intro is extra; it never changes the shared date seed or the daily slot. */
export function needsIntro(type: PuzzleType, runs: readonly { type: string; result?: string; deleted?: number }[]): boolean {
  return !runs.some(run => run.type === type && run.result === 'solved' && !run.deleted);
}

export function featuredSpec(day: string): { type: PuzzleType; diff: PuzzleDifficulty } {
  const weekday = new Date(`${day}T12:00:00`).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const [featured, diff] = RULES.mind.featuredByWeekday[weekday];
  if (featured !== 'BOSS') return { type: featured, diff };
  const date = new Date(`${day}T12:00:00`);
  const thursday = new Date(date);
  thursday.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const week = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { type: RULES.mind.bossRotation[week % RULES.mind.bossRotation.length]!, diff };
}

export function dailyBoard(day: string): PuzzleBoard | null {
  const { type, diff } = featuredSpec(day);
  const seed = PZ.hash(`daily:${day}:${type}:${diff}`);
  for (let attempt = 0; attempt < 6; attempt++) {
    const board = PZ.generate(type, { seed: (seed + attempt * 7919) >>> 0, diff });
    if (board) return board;
  }
  return null;
}

const utcDay = (key: string) => Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)));

/**
 * Spec 19 B: the daily board's public number, whole days since the epoch + 1, read from the day key's parts with
 * Date.UTC, so it never depends on the phone's time zone. The day key itself is local and rolls at 04:00.
 * Days before the epoch give 0 or less; callers show no number then.
 */
export function boardNumber(day: string, epoch: string = RULES.mind.boardNumberEpoch): number {
  return Math.round((utcDay(day) - utcDay(epoch)) / 86_400_000) + 1;
}

/** The daily board's eyebrow: "Daily board #12 · Thu 5 Nov" (no number before the epoch). */
export function dailyBoardLabel(day: string, formatted: string): string {
  const number = boardNumber(day);
  return number >= 1 ? `Daily board #${number} · ${formatted}` : `Daily board · ${formatted}`;
}

/**
 * Spec 19 D: a friend's link opens as today's daily board only when it names today's planning day AND its seed
 * is the seed of the board dailyBoard() really generated (after any retries). Old links without a day, other
 * days and other seeds open the same board as practice. A link can be written by hand, but it still has to be solved.
 */
export function friendBoard(link: Challenge, today: string): { board: PuzzleBoard | null; daily: boolean } {
  // Spec 29: every type has a daily board per level, seeded `daily:<day>:<type>:<diff>` (the featured one included).
  if (link.day === today) {
    const board = shelfBoard(link.type, link.diff, `daily:${today}:${link.type}:${link.diff}`);
    if (board && Number(board.seed) === link.seed) return { board, daily: true };
  }
  return { board: PZ.generate(link.type, { seed: link.seed, diff: link.diff }), daily: false };
}
