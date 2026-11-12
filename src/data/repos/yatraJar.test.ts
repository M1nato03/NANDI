// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { createDb } from '../db';
import { exportBackup, importBackup } from '../backup';
import { clearJarPlan, ensureFocusRateFrom, ensureJarFrom, JAR_PLAN_KEY, planReached, readJarPlan, saveJarPlan } from './yatra';
import { FOCUS_RATE_FROM_KEY, JAR_FROM_KEY } from '../../core/yatra/jar';

const opened: ReturnType<typeof createDb>[] = [];
const fresh = () => { const db = createDb(`yatra-jar-${opened.length}-${Date.now()}`); opened.push(db); return db; };
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const at = (text: string) => new Date(text).getTime();

it('spec 54: jarFrom is written once, on the first run, and a second run never moves it', async () => {
  const db = fresh();
  expect(await ensureJarFrom(db, at('2026-11-05T09:00:00'))).toBe('2026-11-05');
  expect(await ensureJarFrom(db, at('2026-11-09T09:00:00'))).toBe('2026-11-05');
  expect((await db.settings.get(JAR_FROM_KEY))?.value).toBe('2026-11-05');
});

it('spec 571 E1: focusRateFrom is written once on its own first run, never moves, and leaves jarFrom alone', async () => {
  const db = fresh();
  await ensureJarFrom(db, at('2026-11-05T09:00:00'));
  expect(await ensureFocusRateFrom(db, at('2026-11-08T09:00:00'))).toBe('2026-11-08');
  expect(await ensureFocusRateFrom(db, at('2026-11-12T09:00:00'))).toBe('2026-11-08');
  expect((await db.settings.get(FOCUS_RATE_FROM_KEY))?.value).toBe('2026-11-08');
  expect((await db.settings.get(JAR_FROM_KEY))?.value).toBe('2026-11-05');
  // Before 04:00 the run belongs to the planning day before.
  const early = fresh();
  expect(await ensureFocusRateFrom(early, at('2026-11-09T02:00:00'))).toBe('2026-11-08');
  // A restore keeps the backup's day.
  const backup = await exportBackup(db, at('2026-11-12T10:00:00'));
  await db.settings.put({ key: FOCUS_RATE_FROM_KEY, value: '2026-11-11', updatedAt: 1, deleted: 0, deviceId: 'other' });
  await importBackup(db, backup);
  expect((await db.settings.get(FOCUS_RATE_FROM_KEY))?.value).toBe('2026-11-08');
});

it('spec 54: a restore keeps the backup\'s jarFrom; a backup from before the jar gets the first run after the restore', async () => {
  const db = fresh();
  await ensureJarFrom(db, at('2026-11-05T09:00:00'));
  const backup = await exportBackup(db, at('2026-11-06T09:00:00'));
  await db.settings.put({ key: JAR_FROM_KEY, value: '2026-11-08', updatedAt: 1, deleted: 0, deviceId: 'other' });
  await importBackup(db, backup);
  expect((await db.settings.get(JAR_FROM_KEY))?.value).toBe('2026-11-05');
  // A backup made before spec 54 has no jarFrom: the walk starts again from the first run after its restore.
  const older = structuredClone(backup);
  const dump = (older.dexie as { data: { tables: { name: string; rowCount: number }[]; data: { tableName: string; rows: { key?: string }[] }[] } }).data;
  const table = dump.data.find(row => row.tableName === 'settings')!;
  table.rows = table.rows.filter(row => row.key !== JAR_FROM_KEY);
  dump.tables.find(row => row.name === 'settings')!.rowCount = table.rows.length;
  await importBackup(db, older);
  expect(await db.settings.get(JAR_FROM_KEY)).toBeUndefined();
  expect(await ensureJarFrom(db, at('2026-11-10T09:00:00'))).toBe('2026-11-10');
});

it('spec 54: one plan, its line kept to 60 characters, deleted without losing anything else', async () => {
  const db = fresh();
  const now = at('2026-11-05T09:00:00');
  await saveJarPlan(db, { line: `  ${'x'.repeat(80)}  `, camp: 4, setAt: now, needMinutes: 300, trailId: 'hampta-pass' }, now);
  const plan = readJarPlan((await db.settings.get(JAR_PLAN_KEY))?.value);
  expect(plan).toEqual({ line: 'x'.repeat(60), camp: 4, setAt: now, needMinutes: 300, trailId: 'hampta-pass' });
  await clearJarPlan(db, now + 1);
  expect((await db.settings.get(JAR_PLAN_KEY))?.deleted).toBe(1);
});

it('spec 575: a plan on the last camp of a trail pays out once the walk switches to the next; old plans keep their meaning', () => {
  const trails = [{ id: 'hampta-pass' }, { id: 'tarsar-marsar' }, { id: 'sandakphu' }];
  // A plan saved before 575 has no trail: it is read as Hampta's, at the same camp (no rescoring).
  const old = readJarPlan({ line: 'new book', camp: 5, setAt: 1, needMinutes: 150 })!;
  expect(old).toEqual({ line: 'new book', camp: 5, setAt: 1, needMinutes: 150, trailId: 'hampta-pass' });
  expect(planReached(old, { trails, index: 0 }, 4)).toBe(false);
  // Chatru (camp 5) is Hampta's last: reaching it puts the group at Tarsar's start, and the plan is reached there.
  expect(planReached(old, { trails, index: 1 }, 0)).toBe(true);
  expect(planReached(old, { trails, index: 2 }, 3)).toBe(true);
  // A plan on Tarsar's camp 2 is not reached by Hampta's camp 2, only by Tarsar's.
  const tarsar = { ...old, camp: 2, trailId: 'tarsar-marsar' };
  expect(planReached(tarsar, { trails, index: 0 }, 5)).toBe(false);
  expect(planReached(tarsar, { trails, index: 1 }, 1)).toBe(false);
  expect(planReached(tarsar, { trails, index: 1 }, 2)).toBe(true);
  // An unknown trail id pays once rather than never (no loss states); shipped ids are frozen (trails.test.ts).
  expect(planReached({ ...old, trailId: 'gone' }, { trails, index: 0 }, 0)).toBe(true);
});
