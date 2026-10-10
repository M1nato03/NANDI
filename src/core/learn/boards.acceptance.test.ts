import { expect, it, vi } from 'vitest';
import { loadPortedGenerator } from '../ported-test-loader.js';
import type { PuzzleBoard } from '../puzzles';
import { nextHint } from '../puzzles/hint';
import { dailyBoard, featuredSpec, needsIntro } from '../puzzles/daily';
import { checkRules, type PuzzleState } from '../puzzles/rules';

vi.mock('../puzzles/index', async () => {
  const { loadPortedGenerator } = await import('../ported-test-loader.js');
  return { default: loadPortedGenerator(new URL('../puzzles/puzzles.js', import.meta.url), 'PZ') };
});
const PZ = loadPortedGenerator(new URL('../puzzles/puzzles.js', import.meta.url), 'PZ') as typeof import('../puzzles/puzzles.js').default;

it('04 §7 test 2: shared date seeds, weekday rotation, and first-type intro leave the daily board unchanged', () => {
  const day = '2026-10-12';
  const spec = featuredSpec(day);
  expect(spec).toEqual({ type: 'sudoku', diff: 'easy' });
  expect(dailyBoard(day)).toEqual(dailyBoard(day));
  expect(needsIntro(spec.type, [])).toBe(true);
  expect(needsIntro(spec.type, [{ type: spec.type, result: 'solved' }])).toBe(false);
  expect(needsIntro(spec.type, [{ type: spec.type, result: 'solved', deleted: 1 }])).toBe(true);
  expect(dailyBoard(day)).toEqual(dailyBoard(day));
  const sundays = ['2026-10-11', '2026-10-18', '2026-10-25', '2026-11-01', '2026-11-08'];
  expect(new Set(sundays.map(value => featuredSpec(value).type)).size).toBe(5);
  expect(sundays.every(value => featuredSpec(value).diff === 'hard')).toBe(true);
});

function startingState(board: PuzzleBoard): PuzzleState {
  if (board.type === 'path') return { grid: [], path: [] };
  if (board.type === 'sudoku') return { grid: board.givens.slice(), path: [] };
  if (board.type === 'sunmoon') return { grid: board.given.slice(), path: [] };
  return { grid: Array(board.N * board.N).fill(0), path: [] };
}

it('04 §7 test 4: a hint keeps the board consistent with its unique solution', () => {
  for (const type of ['sudoku', 'crowns', 'sunmoon', 'path', 'calc'] as const) {
    const board = PZ.generate(type, { seed: PZ.hash(`hint:${type}`), diff: 'easy' });
    expect(board).not.toBeNull();
    const hint = nextHint(board!, startingState(board!));
    expect(hint.changed).toBe(true);
    if (board!.type === 'path') expect(hint.state.path).toEqual(board!.solution.slice(0, hint.state.path.length));
    else if (board!.type === 'crowns') {
      for (let i = 0; i < hint.state.grid.length; i++) if (hint.state.grid[i] === 2) expect(board!.solution[Math.floor(i / board!.N)]).toBe(i % board!.N);
    } else for (let i = 0; i < hint.state.grid.length; i++) if (hint.state.grid[i] !== startingState(board!).grid[i]) expect(hint.state.grid[i]).toBe(board!.solution[i]);
    expect(checkRules(board!, hint.state).conflicts).toEqual([]);
  }
});

it('04 §7 test 5: rule checks accept a hand-made valid grid even when stored solution differs', () => {
  const generated = PZ.generate('sudoku', { seed: 11, diff: 'easy' })!;
  const grid = Array.from({ length: 36 }, (_, i) => ((Math.floor(i / 6) * 3 + Math.floor(Math.floor(i / 6) / 2) + i % 6) % 6) + 1);
  const board = { ...generated, givens: Array(36).fill(0), solution: Array(36).fill(0) } as PuzzleBoard;
  expect(checkRules(board, { grid, path: [] }).solved).toBe(true);
});
