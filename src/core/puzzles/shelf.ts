import PZ, { type PuzzleBoard, type PuzzleDifficulty, type PuzzleType } from './index';
import { featuredSpec } from './daily';

/**
 * Spec 29 (amended 25 Oct): Kapi's shelf holds the boards Mind already has, one daily board per type, the same for
 * everyone, plus up to two more a day. The weekday's featured board stays the shared daily board (board number,
 * friend links); the other types get their own date-seeded board.
 */
export const SHELF: { type: PuzzleType; line: string }[] = [
  { type: 'crowns', line: 'One crown in every row, column and colour.' },
  { type: 'sudoku', line: 'Each row, column and box holds 1 to 6 once.' },
  { type: 'sunmoon', line: 'Fill each square with a sun or a moon.' },
  { type: 'calc', line: 'Like Sudoku, and each outlined group makes its number.' },
  { type: 'path', line: 'One line through every square, visiting the numbers in order.' },
];

/** The daily board plus two more: then Kapi naps (spec 29 Play). */
export const SHELF_PER_DAY = 3;
/** Practice attempts from the shelf use their own range, so they never meet the More boards practice runs. */
export const SHELF_ATTEMPT = 100;
/** The first boards of a type stay easy, so the first real board after the tutorial is always the smallest. */
export const SHELF_EASY_SOLVES = 3;

type RunLike = { type: string; dayKey?: string; result?: string; deleted?: number; daily?: boolean; shelf?: boolean; diff?: string; practiceAttempt?: number };

/** The shelf level of a type for a day, from the solves before that day (so it never changes mid-day). */
export function shelfLevel(type: PuzzleType, runs: readonly RunLike[], day: string): PuzzleDifficulty {
  // The ramp comes first (Codex B item 105): under 3 earlier solves of a type, its shelf board is easy whatever the weekday.
  const earlier = runs.filter(run => run.type === type && run.result === 'solved' && !run.deleted && (run.dayKey ?? '') < day).length;
  if (earlier < SHELF_EASY_SOLVES) return 'easy';
  const featured = featuredSpec(day);
  if (featured.type === type) return featured.diff;
  return type === 'sunmoon' ? 'hard' : 'medium';
}

/** Solved shelf boards of a type today: its daily board and the shelf's extra boards. */
export function shelfSolvedToday(type: PuzzleType, runs: readonly RunLike[], day: string): number {
  return runs.filter(run => run.type === type && run.dayKey === day && run.result === 'solved' && !run.deleted && (run.daily || run.shelf)).length;
}

/** The seed text of a shelf board: index 0 is the type's daily board, 1 and 2 are the extras. */
export function shelfSeedText(day: string, type: PuzzleType, diff: PuzzleDifficulty, index: number): string {
  return index === 0 ? `daily:${day}:${type}:${diff}` : `shelf:${day}:${type}:${diff}:${index}`;
}

/** Builds a shelf board from its seed text, retrying the way the daily board does when a seed gives nothing. */
export function shelfBoard(type: PuzzleType, diff: PuzzleDifficulty, seedText: string): PuzzleBoard | null {
  const seed = PZ.hash(seedText);
  for (let attempt = 0; attempt < 6; attempt++) {
    const board = PZ.generate(type, { seed: (seed + attempt * 7919) >>> 0, diff });
    if (board) return board;
  }
  return null;
}

/** Today's board is done once any daily board of the weekday's featured type is solved (one daily per type, any level). */
export function featuredDailyDone(runs: readonly RunLike[], day: string): boolean {
  const featured = featuredSpec(day);
  return runs.some(run => run.type === featured.type && run.daily && run.dayKey === day && run.result === 'solved' && !run.deleted);
}
