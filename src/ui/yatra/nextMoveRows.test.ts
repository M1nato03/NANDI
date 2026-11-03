import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb } from '../../data/db';
import type { SettingRow, TaskRow } from '../../data/types';
import { readNextMove } from './nextMoveRows';

const opened: ReturnType<typeof createDb>[] = [];
function fresh() { const db = createDb(`next-move-${opened.length}-${Date.now()}`); opened.push(db); return db; }
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });

const NOON = new Date('2026-11-04T12:00:00').getTime(); // a Wednesday
const meta = { updatedAt: NOON, deleted: 0 as const, deviceId: 't' };
const setting = (key: string, value: unknown): SettingRow => ({ ...meta, key, value } as SettingRow);
const task = { ...meta, id: 't1', title: 'Email Riya', status: 'planned', dayKey: '2026-11-04' } as TaskRow;

describe('spec 52 gate 2: one source for Home and the Pause card', () => {
  it('the same rows give the same move: picks decide, and an install without a size keeps today\'s order', async () => {
    const db = fresh();
    await db.tasks.put(task);
    await db.programs.put({ ...meta, id: 'train-program', days: [3] } as never);
    expect((await readNextMove(NOON, db)).move.kind).toBe('train');
    await db.settings.bulkPut([setting('profile.goals', ['mind', 'learn']), setting('profile.size', 'two')]);
    const picked = await readNextMove(NOON, db);
    expect(picked.picks).toEqual({ goals: ['mind', 'learn'], size: 'two' });
    expect(picked.move).toEqual({ kind: 'board', route: 'yatra/mind/board/daily' });
    await db.settings.put(setting('profile.goals', ['learn', 'mind']));
    expect((await readNextMove(NOON, db)).move).toMatchObject({ kind: 'read', route: 'read/chapter/psychology/psychology-ch1', chapter: 1 });
    await db.settings.put(setting('profile.goals', ['plan']));
    expect((await readNextMove(NOON, db)).move).toMatchObject({ kind: 'task', title: 'Email Riya' });
  });
  it('the board time is the median of the person\'s own solved daily boards, from three on', async () => {
    const db = fresh();
    const run = (id: string, solveMs: number) => ({ ...meta, id, type: 'sudoku', daily: true, result: 'solved', solveMs, dayKey: '2026-11-01' }) as never;
    await db.puzzleRuns.bulkPut([run('a', 120_000), run('b', 300_000)]);
    expect((await readNextMove(NOON, db)).boardMedianMs).toBeUndefined();
    await db.puzzleRuns.put(run('c', 200_000));
    expect((await readNextMove(NOON, db)).boardMedianMs).toBe(200_000);
  });
});
