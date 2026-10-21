import PZ, { type PuzzleBoard } from './index';
import type { PuzzleState } from './rules';
import { checkRules } from './rules';

export type PuzzleHint = { state: PuzzleState; message: string; changed: boolean };

/** Each type's logic solver (never the stored solution) provides the next safe step. */
export function nextHint(board: PuzzleBoard, state: PuzzleState): PuzzleHint {
  if (board.type === 'path') {
    // Keep the longest part of the player's line the logic solver accepts, then let logic carry it to the next number.
    let keep = state.path.length;
    let logic = PZ._test.pathLogic(board.R, board.C, board.waypoints, 2, state.path.slice(0, keep));
    while (keep > 0 && (logic.broken || checkRules(board, { ...state, path: state.path.slice(0, keep) }).conflicts.length)) logic = PZ._test.pathLogic(board.R, board.C, board.waypoints, 2, state.path.slice(0, --keep));
    if (logic.broken) return { state, message: 'Check the open rows and groups.', changed: false };
    const target = logic.path.findIndex((cell, index) => index >= Math.max(keep, 1) && board.waypoints.includes(cell));
    const path = target >= 0 ? logic.path.slice(0, target + 1) : logic.path;
    const changed = path.length !== state.path.length || keep !== state.path.length;
    const number = board.waypoints.indexOf(path.at(-1)!) + 1;
    return { state: { ...state, path }, message: number ? `Line extended to number ${number}.` : 'Line extended.', changed };
  }
  const conflict = checkRules(board, state).conflicts[0];
  if (conflict !== undefined) return { state, message: `Check row ${Math.floor(conflict / (board.type === 'sunmoon' ? 6 : board.N)) + 1}. The marked cells break a rule.`, changed: true };
  if (board.type === 'crowns') {
    const result = PZ._test.crownLogic(board.N, board.region, board.diff === 'easy' ? 1 : board.diff === 'medium' ? 2 : 3);
    const target = Array.from(result.st).findIndex((value, i) => value === 1 && state.grid[i] !== 2);
    if (result.solved && target >= 0) { const grid = state.grid.slice(); grid[target] = 2; return { state: { ...state, grid }, message: `A crown belongs in row ${Math.floor(target / board.N) + 1}.`, changed: true }; }
  } else {
    const solved = board.type === 'sudoku'
      ? PZ._test.latinLogic(board.givens, board.N, PZ._test.latinUnits(), board.diff === 'hard' ? 2 : 1)
      : board.type === 'sunmoon'
        ? PZ._test.binLogic({ given: board.given, hs: board.hs, vs: board.vs }, board.diff === 'easy' ? 1 : 2)
        : PZ._test.calcLogic(board.N, board.cages.map(cage => ({ ...cage, tuples: PZ._test.cageTuples(cage, board.N) })), board.diff === 'easy' ? 1 : 2);
    const target = solved.grid.findIndex((value, i) => value !== state.grid[i]);
    if (solved.solved && target >= 0) {
      const grid = state.grid.slice(); grid[target] = solved.grid[target]!;
      return { state: { ...state, grid }, message: `One move in row ${Math.floor(target / (board.type === 'sunmoon' ? 6 : board.N)) + 1}.`, changed: true };
    }
  }
  return { state, message: 'Check the open rows and groups.', changed: false };
}
