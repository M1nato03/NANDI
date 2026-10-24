// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { exportBackup, importBackup } from '../backup';
import { saveCaseProof } from './mysteries';
import type { PuzzleRunRow } from '../types';

// Spec 24: the pace marks and a case proof are plain optional fields on a run (not indexed, no Dexie bump).
let serial = 0;
const opened: NandiDb[] = [];
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const fresh = () => { const db = createDb(`pace-proof-${++serial}`); opened.push(db); return db; };
const stamp = { updatedAt: 10, deleted: 0 as const, deviceId: 'device-a' };
const pace = [10_000, 20_000, 30_000, 40_000, 50_000, 60_000, 70_000, 80_000, 90_000, 100_000];

it('pace marks and a proof survive a backup round trip', async () => {
  const db = fresh();
  await db.settings.put({ key: 'deviceId', value: 'device-a', ...stamp });
  const board: PuzzleRunRow = { id: 'daily:2026-11-02:crowns:medium', type: 'crowns', diff: 'medium', dayKey: '2026-11-02', daily: true, result: 'solved', solveMs: 100_000, pace, ...stamp };
  const mystery: PuzzleRunRow = { id: 'daily:2026-11-02:mystery', type: 'mystery', diff: 'easy', dayKey: '2026-11-02', daily: true, result: 'solved', proof: [0, 3], ...stamp };
  await db.puzzleRuns.bulkPut([board, mystery]);
  const envelope = await exportBackup(db, new Date(2026, 10, 2, 12));
  await Promise.all(db.tables.map(table => table.clear()));
  await importBackup(db, envelope);
  expect(await db.puzzleRuns.get(board.id)).toEqual(board);
  expect(await db.puzzleRuns.get(mystery.id)).toEqual(mystery);
});

it('a proof is kept only on a solved case, the first one stays, and nothing else changes', async () => {
  const db = fresh();
  const solved: PuzzleRunRow = { id: 'daily:2026-11-02:mystery', type: 'mystery', diff: 'easy', dayKey: '2026-11-02', daily: true, result: 'solved', hintsUsed: 1, ...stamp };
  const open: PuzzleRunRow = { ...solved, id: 'daily:2026-11-03:mystery', dayKey: '2026-11-03', result: undefined };
  await db.puzzleRuns.bulkPut([solved, open]);
  const ledgerBefore = await db.ledger.count();
  expect((await saveCaseProof(db, solved.id, [4, 1], 20))?.proof).toEqual([1, 4]);
  expect((await saveCaseProof(db, solved.id, [2], 30))?.proof).toEqual([1, 4]);
  expect(await db.puzzleRuns.get(solved.id)).toEqual({ ...solved, proof: [1, 4], updatedAt: 20 });
  expect((await saveCaseProof(db, open.id, [1], 20))?.proof).toBeUndefined();
  expect(await db.ledger.count()).toBe(ledgerBefore);
  expect(await db.ratings.count()).toBe(0);
});
