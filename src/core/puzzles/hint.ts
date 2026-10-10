import PZ, { type PuzzleBoard } from './index';
import type { PuzzleState } from './rules';
import { checkRules } from './rules';

export type PuzzleHint = { state: PuzzleState; message: string; changed: boolean };

/** The four available generator logic solvers provide a safe completed grid. */
export function nextHint(board: PuzzleBoard, state: PuzzleState): PuzzleHint {
  if (board.type === 'path') {
    const correct = board.solution;
    let prefix = 0;
    while (prefix < state.path.length && state.path[prefix] === correct[prefix]) prefix++;
    const waypointPositions = board.waypoints.map(cell => correct.indexOf(cell));
    const target = waypointPositions.find(index => index >= Math.max(prefix, 1)) ?? correct.length - 1;
    const path = correct.slice(0, target + 1);
    return { state: { ...state, path }, message: `Line extended to number ${board.waypoints.indexOf(path.at(-1)!) + 1}.`, changed: path.length !== state.path.length || prefix !== state.path.length };
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
