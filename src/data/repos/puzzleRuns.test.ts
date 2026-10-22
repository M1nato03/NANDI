import '../test-setup';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { loadPortedGenerator } from '../../core/ported-test-loader.js';
import { accrueActive, openPuzzleRun, reconcileSolvedBoards, savePuzzleRun } from './puzzleRuns';

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

  it('a friend who already solved today opens the shared link as the same run, with no second XP (spec 19 D)', async () => {
    const { dailyBoard, friendBoard } = await import('../../core/puzzles/daily');
    const store = createDb(`mind-test-${crypto.randomUUID()}`); stores.push(store);
    const day = '2026-11-05';
    const board = dailyBoard(day)!;
    const row = await openPuzzleRun(store, board, day, true, 1000);
    await savePuzzleRun(store, { ...row, result: 'solved', solveMs: 5000, finishedAt: 6000 }, 6000);
    const facts = () => store.ledger.where('kind').equals('board').count();
    const before = await facts();
    const link = friendBoard({ day, type: board.type, diff: board.diff, seed: Number(board.seed) }, day);
    expect(link.daily).toBe(true);
    const resumed = await openPuzzleRun(store, link.board!, day, link.daily, 9000);
    expect(resumed).toMatchObject({ id: row.id, result: 'solved', solveMs: 5000 });
    await savePuzzleRun(store, { ...resumed, result: 'solved', solveMs: 3000 }, 9500);
    expect(await facts()).toBe(before);
    expect(await store.puzzleRuns.count()).toBe(1);
  });
});

const opened: NandiDb[] = [];
function fresh() { const db = createDb(`puzzle-atomic-${opened.length}-${Date.now()}`); opened.push(db); return db; }
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const solved = { id: 'daily:2026-10-11:sudoku:easy', type: 'sudoku' as const, dayKey: '2026-10-11', daily: true, result: 'solved' as const, diff: 'easy', updatedAt: 1, deleted: 0 as const, deviceId: 'test' };

it('rolls back a solved board if its ledger fact cannot be saved', async () => {
  const db = fresh();
  db.ledger.hook('creating', () => { throw new Error('ledger failed'); });
  await expect(savePuzzleRun(db, solved, 2, false)).rejects.toThrow('ledger failed');
  expect(await db.puzzleRuns.get(solved.id)).toBeUndefined();
});

it('reconciles old solved boards once at startup', async () => {
  const db = fresh();
  await db.puzzleRuns.add(solved);
  await reconcileSolvedBoards(db);
  await reconcileSolvedBoards(db);
  expect(await db.ledger.where('id').equals(`board:${solved.id}`).count()).toBe(1);
  expect((await db.ledger.get(`board:${solved.id}`))?.inputs).toMatchObject({ type: 'sudoku', diff: 'easy' });
});
