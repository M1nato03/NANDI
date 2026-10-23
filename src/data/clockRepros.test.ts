// @vitest-environment jsdom
// The clock-fuzz findings of cloud batch 3 (idea engine item 42), each as its shortest hand repro, asserting the
// fixed outcome. The repros are the report's Appendix C (cj3-clock-fuzz.md), as measured on ship-32.
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createDb, type NandiDb } from './db';
import { reconcileGamify } from './repos/gamify';
import { createTaskRepos } from './repos/tasks';
import { createTrainRepos } from './repos/train';
import { purchaseShopItem } from './repos/economy';
import { exportBackup, importBackup } from './backup';
import { getOrCreateDeviceId } from './device';
import { deriveEconomy } from '../core/economy/deriveEconomy';
import { dayKey } from '../core/time';

// process is not typed for app files; the zone is read per call, so setting TZ moves dayKey().
const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;
let db: NandiDb, n = 0, now = 0;
const zone = env.TZ;
beforeEach(() => { env.TZ = 'Asia/Kolkata'; vi.useFakeTimers({ toFake: ['Date'] }); db = createDb(`clock-repro-${++n}`); });
afterEach(async () => { vi.useRealTimers(); env.TZ = zone; await db.delete(); });
/** Local time in Asia/Kolkata. */
const set = (iso: string) => { now = new Date(iso).getTime(); vi.setSystemTime(now); };
const shown = async () => deriveEconomy(await db.ledger.toArray(), undefined, await db.settings.toArray(), dayKey(now));
const repos = async () => { const id = await getOrCreateDeviceId(db, now); return { tasks: createTaskRepos(db, id), train: createTrainRepos(db, id) }; };
let t = 0;
const task = async (reconcile = true) => {
  const { tasks } = await repos(); const id = `r-${++t}`;
  await tasks.createTask({ id, title: 'x', size: 'S', estimateMin: 15, plannedSize: 'S', dayKey: dayKey(now), scheduledStart: now, mustOrCould: 'could' }, now);
  await tasks.completeTask(id, now);
  if (reconcile) await reconcileGamify(db, now);
};
const total = (view: Awaited<ReturnType<typeof shown>>, day: string) => view.days.find(item => item.dayKey === day)?.total ?? 0;

it('A: a clock set back across a season end keeps the season-end Shards', async () => {
  set('2026-11-23T12:00:00'); await task();
  set('2026-12-07T13:00:00'); await reconcileGamify(db, now);
  const ahead = await shown();
  expect(ahead.shards).toBe(65);
  set('2026-12-06T23:00:00');
  expect((await shown()).shards).toBe(65);
  await reconcileGamify(db, now);
  expect((await shown()).shards).toBe(65);
});

it('A-tz: flying Kolkata to New York the morning a season ends keeps its Shards', async () => {
  set('2026-11-23T12:00:00'); await task();
  set('2026-12-07T08:00:00'); await reconcileGamify(db, now);
  expect((await shown()).shards).toBe(65);
  env.TZ = 'America/New_York';
  expect(dayKey(now)).toBe('2026-12-06');
  expect((await shown()).shards).toBe(65);
  await reconcileGamify(db, now);
  expect((await shown()).shards).toBe(65);
});

it('B: a purchase made while the clock is behind never mints Shards and never takes them back', async () => {
  const { train } = await repos();
  set('2026-10-21T04:23:00'); await train.restDayCheck(now, 20); await reconcileGamify(db, now);
  set('2026-10-22T03:48:00'); await task();
  set('2026-10-22T05:14:00'); await train.restDayCheck(now, 20); await reconcileGamify(db, now);
  set('2026-10-21T07:00:00'); await reconcileGamify(db, now);
  expect((await shown()).shards).toBe(51);
  set('2026-10-21T07:47:00');
  expect((await purchaseShopItem(db, 'freeze', now)).ok).toBe(true);
  await reconcileGamify(db, now);
  expect((await shown()).shards).toBe(1);
  set('2026-10-22T17:59:00'); await reconcileGamify(db, now);
  expect((await shown()).shards).toBe(1);
  set('2026-10-21T06:00:00');
  expect((await shown()).shards).toBe(1);
  await reconcileGamify(db, now);
  expect((await shown()).shards).toBe(1);
});

it('C1: a restore replaces today, including an item bought after the backup (Jenil, 24 Oct)', async () => {
  const { train } = await repos();
  for (let day = 2; day <= 30; day++) { set(`2026-11-${String(day).padStart(2, '0')}T10:00:00`); await task(); await task(); await train.restDayCheck(now, 20); }
  set('2026-12-07T09:00:00'); await task();
  const backup = await exportBackup(db, now);
  set('2026-12-07T15:00:00');
  expect((await purchaseShopItem(db, 'banner:grove', now)).ok).toBe(true);
  await reconcileGamify(db, now);
  await importBackup(db, backup); await reconcileGamify(db, now);
  expect((await shown()).owned).not.toContain('banner:grove');
});

it('C2: closes before the first restored fact still hold their days and Shards', async () => {
  set('2026-10-20T09:00:00'); await reconcileGamify(db, now);
  const backup = await exportBackup(db, now);
  await task(); set('2026-10-21T09:00:00'); await task(); set('2026-10-22T09:00:00'); await reconcileGamify(db, now);
  const before = await shown();
  expect([total(before, '2026-10-20'), total(before, '2026-10-21'), before.shards]).toEqual([5, 5, 29]);
  await importBackup(db, backup); await reconcileGamify(db, now);
  const after = await shown();
  expect([total(after, '2026-10-20'), total(after, '2026-10-21'), after.shards]).toEqual([5, 5, 29]);
});

it('C3: after a restore, a clock set back does not delete the close that holds a lost day', async () => {
  set('2026-10-20T09:00:00'); await task();
  const backup = await exportBackup(db, now);
  set('2026-10-25T09:00:00'); await task(); set('2026-10-26T09:00:00'); await reconcileGamify(db, now);
  await importBackup(db, backup); await reconcileGamify(db, now);
  const kept = total(await shown(), '2026-10-25');
  expect(kept).toBe(20);
  set('2026-10-24T09:00:00'); await reconcileGamify(db, now);
  set('2026-10-26T09:00:00'); await reconcileGamify(db, now);
  expect(total(await shown(), '2026-10-25')).toBe(kept);
});

it('C4: XP not yet reconciled when a restore runs is kept by the peak', async () => {
  set('2026-10-20T09:00:00'); await reconcileGamify(db, now);
  const backup = await exportBackup(db, now);
  await task(false);
  expect((await shown()).totalXp).toBe(5);
  await importBackup(db, backup); await reconcileGamify(db, now);
  expect((await shown()).totalXp).toBe(5);
});

it('D: filling a gap day while the clock is behind keeps a later day\'s welcome gift and its level-up Shards', async () => {
  set('2026-11-10T10:00:00'); for (let i = 0; i < 9; i++) await task();
  set('2026-11-08T10:00:00'); await task();
  set('2026-11-09T10:00:00'); await reconcileGamify(db, now);
  const day9 = await shown();
  expect(day9.shards).toBe(60);
  await task(false);
  expect((await shown()).shards).toBeGreaterThanOrEqual(60);
  await reconcileGamify(db, now);
  const after = await shown();
  expect(after.shards).toBeGreaterThanOrEqual(60);
  // The 9 Nov task adds its own 5 XP on top; the 10 Nov gift stays.
  expect(after.totalXp).toBe(day9.totalXp + 5);
  expect(after.level).toBe(day9.level);
});

it('E: a phone that lost its date keeps its Shards and owned items', async () => {
  const { train } = await repos();
  for (let day = 2; day <= 30; day++) { set(`2026-11-${String(day).padStart(2, '0')}T10:00:00`); await task(); await task(); await train.restDayCheck(now, 20); }
  set('2026-12-07T15:00:00'); await reconcileGamify(db, now);
  expect((await purchaseShopItem(db, 'banner:grove', now)).ok).toBe(true);
  await reconcileGamify(db, now);
  const before = await shown();
  expect(before.shards).toBe(188);
  set('2026-01-01T10:00:00');
  for (const view of [await shown(), (await reconcileGamify(db, now), await shown())]) {
    expect(view.owned).toContain('banner:grove');
    expect(view.shards).toBe(188);
    expect([view.totalXp, view.level]).toEqual([before.totalXp, before.level]);
  }
});

it('cj2 3.5 still holds: clock ahead, earn, clock corrected back, XP stays', async () => {
  set('2026-10-20T10:00:00'); await task();
  set('2026-10-23T10:00:00'); await task(); const ahead = await shown();
  set('2026-10-20T18:00:00'); await reconcileGamify(db, now);
  expect((await shown()).totalXp).toBe(ahead.totalXp);
});

it('C1b: a restore replaces a purchase charged to closes dated ahead (Codex review, item 44)', async () => {
  const { train } = await repos();
  for (let day = 2; day <= 30; day++) { set(`2026-11-${String(day).padStart(2, '0')}T10:00:00`); await task(); await task(); await train.restDayCheck(now, 20); }
  set('2026-12-10T10:00:00'); await reconcileGamify(db, now);
  set('2026-12-07T10:00:00'); await reconcileGamify(db, now);
  const backup = await exportBackup(db, now);
  const before = await shown();
  expect((await purchaseShopItem(db, 'banner:grove', now)).ok).toBe(true);
  await reconcileGamify(db, now);
  expect((await shown()).owned).toContain('banner:grove');
  await importBackup(db, backup); await reconcileGamify(db, now);
  const after = await shown();
  expect(after.owned).not.toContain('banner:grove');
  expect(after.shards).toBe(before.shards);
});

it('a purchase never lands inside a restore (Codex review, item 44)', async () => {
  const { train } = await repos();
  for (let day = 2; day <= 30; day++) { set(`2026-11-${String(day).padStart(2, '0')}T10:00:00`); await task(); await train.restDayCheck(now, 20); }
  set('2026-12-07T10:00:00'); await reconcileGamify(db, now);
  const backup = await exportBackup(db, now);
  const restoring = importBackup(db, backup);
  const bought = await purchaseShopItem(db, 'banner:grove', now);
  await restoring;
  // Either refused while the restore runs, or made after it on the restored data; never made and then wiped.
  expect(bought.ok ? (await shown()).owned.includes('banner:grove') : true).toBe(true);
});
