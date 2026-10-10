import '../test-setup';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { loadPortedGenerator } from '../../core/ported-test-loader.js';
import { accrueActive, openPuzzleRun, savePuzzleRun } from './puzzleRuns';

const stores: NandiDb[] = [];
const PZ = loadPortedGenerator(new URL('../../core/puzzles/puzzles.js', import.meta.url), 'PZ') as typeof import('../../core/puzzles/puzzles.js').default;
afterEach(async () => { for (const store of stores.splice(0)) await store.delete(); });

describe('puzzle runs', () => {
  it('resumes the exact grid, notes, hints, and capped active timer', async () => {
    const store = createDb(`mind-test-${crypto.randomUUID()}`); stores.push(store);
    const board = PZ.generate('sudoku', { seed: 17, diff: 'easy' })!;
    const initial = await openPuzzleRun(store, board, '2026-10-11', true, 1000);
    const cell = initial.grid!.findIndex(value => value === 0);
    const grid = initial.grid!.slice(); grid[cell] = board.solution[cell]!;
    await savePuzzleRun(store, { ...accrueActive(initial, 71_000), grid, notes: Array(36).fill(2), hintsUsed: 1 }, 71_000);
    store.close();
    const reopened = createDb(store.name); stores.push(reopened);
    const resumed = await openPuzzleRun(reopened, board, '2026-10-11', true, 80_000);
    expect(resumed).toMatchObject({ id: initial.id, grid, hintsUsed: 1, activeMs: 60_000 });
    expect(resumed.notes?.[0]).toBe(2);
    expect(await reopened.puzzleRuns.count()).toBe(1);
  });

  it('keeps one solved daily fact even after another save', async () => {
    const store = createDb(`mind-test-${crypto.randomUUID()}`); stores.push(store);
    const board = PZ.generate('crowns', { seed: 19, diff: 'easy' })!;
    const row = await openPuzzleRun(store, board, '2026-10-11', true, 1000);
    const solved = await savePuzzleRun(store, { ...row, result: 'solved', solveMs: 5000, finishedAt: 6000 }, 6000);
    const again = await savePuzzleRun(store, { ...row, result: 'solved', solveMs: 9000 }, 10_000);
    expect(again).toMatchObject({ id: solved.id, solveMs: 5000, finishedAt: 6000 });
    expect(await store.puzzleRuns.count()).toBe(1);
  });
});
