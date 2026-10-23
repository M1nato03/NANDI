import '../test-setup';
import { afterEach, expect, it } from 'vitest';
import CaseGen from '../../core/mysteries';
import { createDb, type NandiDb } from '../db';
import { openDailyCase, saveDailyCase } from './mysteries';
import { replayFactXp } from '../../core/economy/awards';

const stores: NandiDb[] = [];
afterEach(async () => { for (const db of stores.splice(0)) await db.delete(); });
function fresh() { const db = createDb(`case-atomic-${crypto.randomUUID()}`); stores.push(db); return db; }

it('saves progress and one completion fact with the daily run', async () => {
  const db = fresh(), mystery = CaseGen.daily('2026-10-11', 'easy')!;
  const opened = await openDailyCase(db, mystery, '2026-10-11', 1000);
  const progress = await saveDailyCase(db, { ...opened, caseGrid: { ...opened.caseGrid!, struck: [1] } }, 2000);
  expect((await openDailyCase(db, mystery, '2026-10-11', 3000)).caseGrid?.struck).toEqual([1]);
  const solved = await saveDailyCase(db, { ...progress, result: 'solved', finishedAt: 4000 }, 4000);
  await saveDailyCase(db, { ...progress, result: 'solved', finishedAt: 5000 }, 5000);
  expect((await db.puzzleRuns.get(solved.id))?.finishedAt).toBe(4000);
  expect(await db.ledger.where('id').equals(`mystery:${solved.id}`).count()).toBe(1);
});

it('rolls back the completion if the ledger write fails', async () => {
  const db = fresh(), mystery = CaseGen.daily('2026-10-11', 'easy')!;
  const opened = await openDailyCase(db, mystery, '2026-10-11', 1000);
  db.ledger.hook('creating', () => { throw new Error('ledger failed'); });
  await expect(saveDailyCase(db, { ...opened, result: 'solved' }, 2000)).rejects.toThrow('ledger failed');
  expect((await db.puzzleRuns.get(opened.id))?.result).toBeUndefined();
});

it('records a revealed case once without awarding a solve', async () => {
  const db = fresh(), mystery = CaseGen.daily('2026-10-11', 'easy')!;
  const opened = await openDailyCase(db, mystery, '2026-10-11', 1000);
  await saveDailyCase(db, { ...opened, result: 'revealed' }, 2000);
  await saveDailyCase(db, { ...opened, result: 'solved' }, 3000);
  expect((await db.puzzleRuns.get(opened.id))?.result).toBe('revealed');
  expect((await db.ledger.get(`mystery:${opened.id}`))?.inputs.result).toBe('revealed');
  expect(replayFactXp((await db.ledger.get(`mystery:${opened.id}`))!)).toBe(0);
});

it('the daily case moves the detective rating once: up for a clean solve, less with hints, down for a reveal (spec 04, batch 5)', async () => {
  const rated = async (run: { result: 'solved' | 'revealed'; hintsUsed?: number }, day = '2026-10-11') => {
    const db = fresh(), mystery = CaseGen.daily(day, 'easy')!;
    const opened = await openDailyCase(db, mystery, day, 1000);
    await saveDailyCase(db, { ...opened, ...run }, 2000);
    await saveDailyCase(db, { ...opened, ...run }, 3000);
    return db.ratings.get('detective');
  };
  const clean = await rated({ result: 'solved' }), hinted = await rated({ result: 'solved', hintsUsed: 1 }), revealed = await rated({ result: 'revealed' });
  expect(clean?.n).toBe(1);
  expect(clean!.value!).toBeGreaterThan(hinted!.value!);
  expect(hinted!.value!).toBeGreaterThan(1000);
  expect(revealed!.value!).toBeLessThan(1000);
});
