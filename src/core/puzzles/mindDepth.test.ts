import { describe, expect, it } from 'vitest';
import type { PuzzleBoard } from './index';
import { availableDeductions, nudgeFor, usedTechnique } from './deduction';
import { parMs, noHintClear } from './mastery';
import { shareText } from './share';
import type { PuzzleRunRow } from '../../data/types';

const state = (grid: number[], path: number[] = []) => ({ grid, path });
const base = { diff: 'easy' as const, seed: 1, solution: [] };

describe('deductions from current marks', () => {
  it('finds a Sudoku naked single and points to an error first', () => {
    const board: PuzzleBoard = { ...base, type: 'sudoku', N: 4, br: 2, bc: 2, givens: Array(16).fill(0) };
    const grid = [1, 2, 3, 0, ...Array(12).fill(0)];
    expect(availableDeductions(board, state(grid))).toContainEqual(expect.objectContaining({ technique: 'Naked single', cell: 3, value: 4 }));
    const wrong = [1, 1, ...Array(14).fill(0)];
    expect(nudgeFor(board, state(wrong))).toMatchObject({ conflict: true, cells: [0, 1] });
    expect(availableDeductions(board, state(wrong))).toEqual([]);
  });
  it('finds a Crowns one-cell region', () => {
    const board: PuzzleBoard = { ...base, type: 'crowns', N: 4, region: Array.from({ length: 16 }, (_, i) => Math.floor(i / 4)) };
    const grid = [1, 1, 1, 0, ...Array(12).fill(0)];
    expect(availableDeductions(board, state(grid))).toContainEqual(expect.objectContaining({ technique: 'One-cell region', cell: 3, value: 2 }));
  });
  it('finds Sun and Moon balance', () => {
    const board: PuzzleBoard = { ...base, type: 'sunmoon', given: Array(36).fill(-1), hs: Array(30).fill(0), vs: Array(30).fill(0) };
    const grid = [1, -1, 1, -1, 1, -1, ...Array(30).fill(-1)];
    expect(availableDeductions(board, state(grid))).toContainEqual(expect.objectContaining({ technique: 'Balance', cell: 1, value: 0 }));
  });
  it('finds a Number Path forced move', () => {
    const board: PuzzleBoard = { ...base, type: 'path', R: 3, C: 3, waypoints: [0, 4, 8] };
    expect(availableDeductions(board, state([], [0, 1, 2]))).toContainEqual(expect.objectContaining({ technique: 'Forced move', cell: 5 }));
    expect(usedTechnique(availableDeductions(board, state([], [0, 1, 2])), state([], [0, 1, 2]), state([], [0, 1, 2, 5]))).toBe('Forced move');
  });
  it('finds Calcudoku cage arithmetic and detects a matching move', () => {
    const board: PuzzleBoard = { ...base, type: 'calc', N: 4, cages: [{ cells: [0], op: '', target: 3 }] };
    const before = state(Array(16).fill(0));
    const deductions = availableDeductions(board, before);
    expect(deductions).toContainEqual(expect.objectContaining({ technique: 'Single-cell cage', cell: 0, value: 3 }));
    expect(usedTechnique(deductions, before, state([3, ...Array(15).fill(0)]))).toBe('Single-cell cage');
    expect(usedTechnique(deductions, before, state([2, ...Array(15).fill(0)]))).toBeUndefined();
  });
});

it('computes par from the latest ten solves and a no-hint stamp', () => {
  const runs = Array.from({ length: 12 }, (_, i) => ({ id: String(i), type: 'sudoku', diff: 'easy', result: 'solved', solveMs: (i + 1) * 10_000, finishedAt: i, updatedAt: i, deleted: 0, deviceId: 'test' })) as PuzzleRunRow[];
  expect(parMs(runs, 'sudoku', 'easy')).toBe(75_000);
  expect(parMs(runs.slice(0, 4), 'sudoku', 'easy')).toBeUndefined();
  expect(noHintClear({ result: 'solved', hintsUsed: 0 })).toBe(true);
  expect(noHintClear({ result: 'solved', hintsUsed: 1 })).toBe(false);
});

it('shares only the type, difficulty, time and hint count', () => {
  expect(shareText({ type: 'crowns', diff: 'hard', solveMs: 107_000, hintsUsed: 0 }, 'Crowns')).toBe('NANDI · Crowns (Hard) · 1:47 · no hints');
});
