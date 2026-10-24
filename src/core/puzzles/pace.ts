import type { PuzzleBoard } from '.';
import type { PuzzleState } from './rules';
import type { PuzzleRunRow } from '../../data/types';

/**
 * Spec 24 pace line (cj5-mind §7.1). A run keeps 10 marks: the active time at which 10%, 20% … 100% of the board was
 * filled. Marks only ever rise (a cleared cell never removes one), so the line never moves back and never shows a loss.
 * The marks are a pace to glance at, never a race: no countdown, no XP, and nothing happens when the other dot is ahead.
 */
export const PACE_MARKS = 10;
const WIDTH = 3; // base-36 digits per mark: up to 46,655 s
const MAX_SECONDS = 36 ** WIDTH - 1;

/** How much of the board is filled, 0 to 1. Givens never count; a wrong entry counts, so the line gives nothing away. */
export function fillFraction(board: PuzzleBoard, state: PuzzleState): number {
  const ratio = (done: number, total: number) => total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
  if (board.type === 'path') return ratio(state.path.length, board.solution.length);
  if (board.type === 'crowns') return ratio(state.grid.filter(value => value === 2).length, board.N);
  if (board.type === 'calc') return ratio(state.grid.filter(value => value !== 0).length, board.N * board.N);
  // Sudoku marks an empty cell 0; Sun and moon marks it -1 (0 is a sun).
  const [givens, empty] = board.type === 'sudoku' ? [board.givens, 0] : [board.given, -1];
  const open = givens.map((value, index) => value === empty ? index : -1).filter(index => index >= 0);
  return ratio(open.filter(index => (state.grid[index] ?? empty) !== empty).length, open.length);
}

/** Adds a mark for every tenth newly reached; a solved board fills the rest with the solve time. */
export function nextPace(marks: readonly number[] | undefined, fraction: number, activeMs: number, solved = false): number[] {
  const out = [...(marks ?? [])].slice(0, PACE_MARKS);
  const reached = solved ? PACE_MARKS : Math.min(PACE_MARKS, Math.floor(fraction * PACE_MARKS + 1e-9));
  const at = Math.max(Math.round(activeMs), out.at(-1) ?? 0);
  while (out.length < reached) out.push(at);
  return out;
}

export const completePace = (marks: readonly number[] | undefined): marks is number[] =>
  !!marks && marks.length === PACE_MARKS && marks.every((value, index) => Number.isFinite(value) && value >= 0 && (index === 0 || value >= marks[index - 1]!));

/** How far a run with these marks had got after `ms` of active time, 0 to 1, read straight between marks. */
export function paceAt(marks: readonly number[], ms: number): number {
  if (!completePace(marks) || ms <= 0) return 0;
  let before = 0;
  for (let index = 0; index < PACE_MARKS; index++) {
    const mark = marks[index]!;
    if (ms < mark) return (index + (mark > before ? (ms - before) / (mark - before) : 1)) / PACE_MARKS;
    before = mark;
  }
  return 1;
}

/** The link segment: `p` and 10 marks of 3 base-36 digits each (whole seconds), so a route segment stays a-z0-9. */
export function encodePace(marks: readonly number[] | undefined): string | undefined {
  if (!completePace(marks)) return undefined;
  return `p${marks.map(ms => Math.min(MAX_SECONDS, Math.round(ms / 1000)).toString(36).padStart(WIDTH, '0')).join('')}`;
}
export function decodePace(segment: string | undefined): number[] | undefined {
  if (!segment || !new RegExp(`^p[0-9a-z]{${PACE_MARKS * WIDTH}}$`).test(segment)) return undefined;
  const marks = Array.from({ length: PACE_MARKS }, (_, index) => parseInt(segment.slice(1 + index * WIDTH, 1 + (index + 1) * WIDTH), 36) * 1000);
  return completePace(marks) ? marks : undefined;
}

/** Your best run's marks for this type and difficulty (a different board, so only a rough guide). */
export function bestPace(runs: readonly PuzzleRunRow[], type: PuzzleBoard['type'], diff: string, excludeId?: string): { marks: number[]; solveMs: number } | undefined {
  let best: { marks: number[]; solveMs: number } | undefined;
  for (const row of runs) {
    if (row.deleted || row.id === excludeId || row.type !== type || row.diff !== diff || row.result !== 'solved' || row.solveMs === undefined || !completePace(row.pace)) continue;
    if (!best || row.solveMs < best.solveMs) best = { marks: row.pace, solveMs: row.solveMs };
  }
  return best;
}
