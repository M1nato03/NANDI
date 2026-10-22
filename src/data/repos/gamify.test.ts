// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { CLOSE_PREFIX, closeKey, deriveEconomy, mergeClose } from '../../core/economy/deriveEconomy';
import { exportBackup, importBackup } from '../backup';
import { asReconcile, duringRestore } from '../restoreLock';
import { reconcileGamify } from './gamify';

let serial = 0;
const opened: NandiDb[] = [];
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const at = (day: string, time = '12:00') => new Date(`${day}T${time}:00`).getTime();

it('closes each finished day once, from the first day with activity, and the view never shows less', async () => {
  const db = createDb(`gamify-close-${++serial}`); opened.push(db);
  for (const day of ['2026-11-02', '2026-11-03']) await db.ledger.add({ id: `done:${day}`, mode: 'tasks', kind: 'done', refId: day, dayKey: day,
    inputs: { plannedSize: 'M', isFirstDay: true, wasPlanned: true, postpones: 0 }, updatedAt: at(day), deleted: 0, deviceId: 'test' });
  await reconcileGamify(db, at('2026-11-05'));
  const keys = () => db.settings.toArray().then(rows => rows.filter(row => row.key.startsWith(CLOSE_PREFIX)).map(row => row.key).sort());
  expect(await keys()).toEqual(['2026-11-02', '2026-11-03', '2026-11-04'].map(closeKey));
  const first = (await db.settings.get(closeKey('2026-11-03')))!.value;
  // A second open the same day adds nothing and rewrites nothing; the next day adds only that day.
  await reconcileGamify(db, at('2026-11-05', '18:00'));
  expect((await db.settings.get(closeKey('2026-11-03')))!.value).toEqual(first);
  await reconcileGamify(db, at('2026-11-06'));
  expect(await keys()).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'].map(closeKey));
  const view = deriveEconomy(await db.ledger.toArray(), undefined, await db.settings.toArray(), '2026-11-06');
  expect(view.totalXp).toBeGreaterThan(0);
  // Closes are settings, not ledger facts, so they never count as activity on a day.
  expect((await db.ledger.toArray()).some(row => row.kind.includes('close'))).toBe(false);
});

it('writes no close on a fresh install with nothing done yet', async () => {
  const db = createDb(`gamify-close-${++serial}`); opened.push(db);
  await reconcileGamify(db, at('2026-11-05'));
  expect((await db.settings.toArray()).some(row => row.key.startsWith(CLOSE_PREFIX))).toBe(false);
});

const done = (day: string) => ({ id: `done:${day}`, mode: 'tasks', kind: 'done', refId: day, dayKey: day,
  inputs: { plannedSize: 'M', isFirstDay: true, wasPlanned: true, postpones: 0 }, updatedAt: at(day), deleted: 0 as const, deviceId: 'test' });

it('drops closes dated today or later (a clock set ahead, then back) and keeps closing the real days', async () => {
  const db = createDb(`gamify-close-${++serial}`); opened.push(db);
  await db.ledger.add(done('2026-11-02'));
  await db.settings.put({ key: closeKey('2026-11-09'), value: { total: 999, sp: 0, streak: 9, shards: 0, owned: [] }, updatedAt: 1, deleted: 0, deviceId: 'test' });
  await reconcileGamify(db, at('2026-11-05'));
  const keys = (await db.settings.toArray()).filter(row => row.key.startsWith(CLOSE_PREFIX)).map(row => row.key).sort();
  expect(keys).toEqual(['2026-11-02', '2026-11-03', '2026-11-04'].map(closeKey));
});

it('waits while a restore runs, then closes once it has finished', async () => {
  const db = createDb(`gamify-close-${++serial}`); opened.push(db);
  await db.ledger.add(done('2026-11-02'));
  await duringRestore(() => reconcileGamify(db, at('2026-11-05')));
  expect((await db.settings.toArray()).some(row => row.key.startsWith(CLOSE_PREFIX))).toBe(false);
  await reconcileGamify(db, at('2026-11-05'));
  expect(await db.settings.get(closeKey('2026-11-02'))).toBeDefined();
});

it('a restore keeps the higher close for each day, field by field', async () => {
  const db = createDb(`gamify-close-${++serial}`); opened.push(db);
  await db.ledger.add(done('2026-11-02'));
  await db.settings.put({ key: closeKey('2026-11-02'), value: { total: 40, sp: 40, streak: 1, shards: 2, owned: ['banner:dawn'] }, updatedAt: 1, deleted: 0, deviceId: 'test' });
  const backup = await exportBackup(db, at('2026-11-03'));
  // This phone later shows more for that day than the backup holds.
  await db.settings.put({ key: closeKey('2026-11-02'), value: { total: 90, sp: 30, streak: 3, shards: 1, owned: ['theme:linen'] }, updatedAt: 2, deleted: 0, deviceId: 'test' });
  await importBackup(db, backup);
  expect((await db.settings.get(closeKey('2026-11-02')))!.value).toMatchObject({ total: 90, sp: 40, streak: 3, shards: 2, owned: ['banner:dawn', 'theme:linen'] });
});

it('merges two closes for one day by keeping the higher of each number', () => {
  expect(mergeClose({ total: 5, sp: 9, streak: 1, shards: 0, owned: ['a'] }, { total: 7, sp: 2, streak: 4, shards: 3, owned: ['b', 'a'] }))
    .toMatchObject({ total: 7, sp: 9, streak: 4, shards: 3, owned: ['a', 'b'] });
  expect(mergeClose(undefined, { total: 1 })).toMatchObject({ total: 1, purchases: [] });
  // The pause belongs to whichever close has the longer streak; purchases are a union by id.
  expect(mergeClose({ streak: 5, paused: true, purchases: [{ id: 'p1', itemId: 'freeze', price: 50, dayKey: '2026-11-02' }] },
    { streak: 3, paused: false, purchases: [{ id: 'p2', itemId: 'banner:dawn', price: 100, dayKey: '2026-11-03' }] }))
    .toMatchObject({ streak: 5, paused: true, purchases: [{ id: 'p1' }, { id: 'p2' }] });
});

it('raises a close when a late fact lifts the day, and keeps it when a later fact would revoke it (high-water)', async () => {
  const db = createDb(`gamify-close-${++serial}`); opened.push(db);
  const day = '2026-11-03';
  await db.ledger.add(done(day));
  await reconcileGamify(db, at('2026-11-04'));
  const first = (await db.settings.get(closeKey(day)))!.value as { total: number };
  // A sync brings a workout for that day: the close rises with it.
  await db.ledger.add({ id: 'session:late', mode: 'train', kind: 'session', refId: 'late', dayKey: day,
    inputs: { plannedExercises: 2, touchedExercises: 2, plannedSets: 6, workingSets: 6 }, updatedAt: at(day, '20:00'), deleted: 0, deviceId: 'test' });
  await reconcileGamify(db, at('2026-11-05'));
  const raised = (await db.settings.get(closeKey(day)))!.value as { total: number };
  expect(raised.total).toBeGreaterThan(first.total);
  // Taking that workout away again (a revoking fact) cannot pull the day back down.
  await db.ledger.update('session:late', { deleted: 1 });
  await reconcileGamify(db, at('2026-11-06'));
  expect(((await db.settings.get(closeKey(day)))!.value as { total: number }).total).toBe(raised.total);
  const view = deriveEconomy(await db.ledger.toArray(), undefined, await db.settings.toArray(), '2026-11-06');
  expect(view.days.find(item => item.dayKey === day)!.total).toBe(raised.total);
});

it('a restore that drops a purchase keeps both the item and its spend', async () => {
  const db = createDb(`gamify-close-${++serial}`); opened.push(db);
  const day = '2026-11-03';
  await db.settings.put({ key: 'economy.v2From', value: '2026-10-01', updatedAt: 1, deleted: 0, deviceId: 'test' });
  for (let index = 0; index < 30; index++) await db.ledger.add({ id: `badge:${index}`, mode: 'gamify', kind: 'badge-tier', refId: `b${index}`, dayKey: day, inputs: {}, updatedAt: at(day), deleted: 0, deviceId: 'test' });
  await db.ledger.add({ id: 'purchase:banner', mode: 'economy', kind: 'purchase', refId: 'banner', dayKey: day, inputs: { itemId: 'banner:dawn', price: 100 }, updatedAt: at(day, '13:00'), deleted: 0, deviceId: 'test' });
  await reconcileGamify(db, at('2026-11-04'));
  const before = deriveEconomy(await db.ledger.toArray(), undefined, await db.settings.toArray(), '2026-11-04');
  // The restored ledger lost the purchase fact; the close still knows it.
  await db.ledger.delete('purchase:banner');
  const after = deriveEconomy(await db.ledger.toArray(), undefined, await db.settings.toArray(), '2026-11-04');
  expect(after.owned).toContain('banner:dawn');
  expect(after.shards).toBe(before.shards);
});

it('a late purchase dated on a closed day is still charged after reconcile raises the close', async () => {
  const db = createDb(`gamify-close-${++serial}`); opened.push(db);
  const day = '2026-11-03';
  await db.settings.put({ key: 'economy.v2From', value: '2026-10-01', updatedAt: 1, deleted: 0, deviceId: 'test' });
  for (let index = 0; index < 30; index++) await db.ledger.add({ id: `badge:${index}`, mode: 'gamify', kind: 'badge-tier', refId: `b${index}`, dayKey: day, inputs: {}, updatedAt: at(day), deleted: 0, deviceId: 'test' });
  await reconcileGamify(db, at('2026-11-04'));
  const before = deriveEconomy(await db.ledger.toArray(), undefined, await db.settings.toArray(), '2026-11-05').shards;
  // A synced purchase dated on the closed day arrives, then the next reconcile merges it into the close.
  await db.ledger.add({ id: 'purchase:late', mode: 'economy', kind: 'purchase', refId: 'late', dayKey: day, inputs: { itemId: 'banner:dawn', price: 100 }, updatedAt: at(day, '23:00'), deleted: 0, deviceId: 'test' });
  await reconcileGamify(db, at('2026-11-05'));
  const after = deriveEconomy(await db.ledger.toArray(), undefined, await db.settings.toArray(), '2026-11-05');
  expect(after.owned).toContain('banner:dawn');
  expect(after.shards).toBe(before - 100);
});

it('a restore waits for a reconcile that is already running', async () => {
  let release!: () => void;
  const work = asReconcile(() => new Promise<void>(resolve => { release = resolve; }));
  let restored = false;
  const restore = duringRestore(async () => { restored = true; });
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(restored).toBe(false);
  release();
  await Promise.all([work, restore]);
  expect(restored).toBe(true);
});

it('a burst of writes runs one reconcile now and one more after it, with the latest clock (review 32)', async () => {
  const db = createDb(`gamify-burst-${++serial}`); opened.push(db);
  await db.ledger.add({ id: 'done:2026-11-02', mode: 'tasks', kind: 'done', refId: '2026-11-02', dayKey: '2026-11-02',
    inputs: { plannedSize: 'M', isFirstDay: true, wasPlanned: true, postpones: 0 }, updatedAt: at('2026-11-02'), deleted: 0, deviceId: 'test' });
  const original = db.transaction.bind(db);
  let runs = 0;
  // Count the reconcile's own five-table transaction only (the device id has its own small one).
  (db as unknown as { transaction: unknown }).transaction = (...args: unknown[]) => { if (Array.isArray(args[1]) && args[1].length === 5) runs++; return (original as (...rest: unknown[]) => unknown)(...args); };
  await Promise.all([1, 2, 3, 4, 5].map(hour => reconcileGamify(db, at('2026-11-05', `0${hour}:00`))));
  expect(runs).toBe(2);
  // The trailing run used the latest clock, so the day before the 5th is closed.
  expect(await db.settings.get(closeKey('2026-11-04'))).toBeTruthy();
});

it('a drop finished after bedtime fills no Learn quest (Codex review of econ-32 #1)', async () => {
  const { questPool } = await import('../../core/economy/gamify');
  for (const late of [true, false]) {
    const db = createDb(`gamify-late-drop-${++serial}`); opened.push(db);
    const day = '2026-11-05', dropId = `drop:daily:${day}`;
    await db.learnDrops.put({ id: dropId, drop: { id: dropId, cursor: 3, ending: { kind: 'stopping-screen' },
      items: [1, 2, 3].map(n => ({ itemId: `i${n}`, conceptId: 'c', optionOrder: [], mode: 'review' as const })) }, updatedAt: at(day), deleted: 0, deviceId: 'test' });
    for (const n of [1, 2, 3]) await db.ledger.add({ id: `learn-answer:${late}:${n}`, mode: 'mind', kind: 'learn-answer', refId: `${late}:${n}`, dayKey: day,
      inputs: { dropId, correct: true, afterBedtime: late }, updatedAt: at(day), deleted: 0, deviceId: 'test' });
    await reconcileGamify(db, at(day, '23:00'));
    const facts = await db.ledger.toArray();
    const drop = facts.find(fact => fact.kind === 'learn-drop')!;
    expect(drop.inputs.afterBedtime === true).toBe(late);
    expect(questPool.find(quest => quest.id === 'drop')!.count(facts, day)).toBe(late ? 0 : 1);
    expect(questPool.find(quest => quest.id === 'learn-perfect')!.count(facts, day)).toBe(late ? 0 : 1);
  }
});

it('a restore keeps this phone\'s economy cutoffs, else the backup\'s (Codex review of econ-32 #3)', async () => {
  const source = createDb(`gamify-cutoff-src-${++serial}`); opened.push(source);
  await source.settings.put({ key: 'economy.v3From', value: '2026-11-01', updatedAt: 1, deleted: 0, deviceId: 'old' });
  const backup = await exportBackup(source, at('2026-11-02'));
  // This phone upgraded later: its own cutoff stands, so no day here changes rules after the restore.
  const phone = createDb(`gamify-cutoff-phone-${++serial}`); opened.push(phone);
  await phone.settings.put({ key: 'economy.v3From', value: '2026-11-04', updatedAt: 1, deleted: 0, deviceId: 'phone' });
  await importBackup(phone, backup);
  expect((await phone.settings.get('economy.v3From'))?.value).toBe('2026-11-04');
  // A phone with no cutoff yet keeps the backup's.
  const fresh = createDb(`gamify-cutoff-fresh-${++serial}`); opened.push(fresh);
  await importBackup(fresh, backup);
  expect((await fresh.settings.get('economy.v3From'))?.value).toBe('2026-11-01');
  // A backup without one restored onto a phone without one leaves it missing, which reads as the old rules.
  const bare = await exportBackup(createDb(`gamify-cutoff-bare-${++serial}`), at('2026-11-02'));
  const empty = createDb(`gamify-cutoff-empty-${++serial}`); opened.push(empty);
  await importBackup(empty, bare);
  expect(await empty.settings.get('economy.v3From')).toBeUndefined();
});

it('a drop counts as late by the fact that finished it, retention checks included (econ-32 re-review, item 37)', async () => {
  const { questPool } = await import('../../core/economy/gamify');
  const cases: { name: string; kinds: string[]; late: boolean[]; flagged: boolean }[] = [
    { name: 'started before bedtime, finished after', kinds: ['learn-answer', 'learn-answer', 'learn-answer'], late: [false, false, true], flagged: true },
    { name: 'started after bedtime, finished before (clock oddity)', kinds: ['learn-answer', 'learn-answer', 'learn-answer'], late: [true, true, false], flagged: false },
    { name: 'retention checks only, after bedtime', kinds: ['learn-retention', 'learn-retention', 'learn-retention'], late: [true, true, true], flagged: true },
  ];
  for (const entry of cases) {
    const db = createDb(`gamify-late-by-last-${++serial}`); opened.push(db);
    const day = '2026-11-05', dropId = `drop:daily:${day}`;
    await db.learnDrops.put({ id: dropId, drop: { id: dropId, cursor: 3, ending: { kind: 'stopping-screen' },
      items: [1, 2, 3].map(n => ({ itemId: `i${n}`, conceptId: 'c', optionOrder: [], mode: 'review' as const })) }, updatedAt: at(day), deleted: 0, deviceId: 'test' });
    for (const [n, kind] of entry.kinds.entries()) await db.ledger.add({ id: `${kind}:${n}`, mode: 'mind', kind, refId: String(n), dayKey: day,
      inputs: { dropId, correct: true, afterBedtime: entry.late[n] }, updatedAt: at(day, `2${n}:00`), deleted: 0, deviceId: 'test' });
    await reconcileGamify(db, at(day, '23:30'));
    const facts = await db.ledger.toArray();
    expect(facts.find(fact => fact.kind === 'learn-drop')!.inputs.afterBedtime === true, entry.name).toBe(entry.flagged);
    expect(questPool.find(quest => quest.id === 'drop')!.count(facts, day), entry.name).toBe(entry.flagged ? 0 : 1);
  }
});

it('reconcile raises the XP and level peak, and a restore keeps the higher peak (item 38)', async () => {
  const { PEAK_KEY } = await import('../../core/economy/deriveEconomy');
  const db = createDb(`gamify-peak-${++serial}`); opened.push(db);
  await db.ledger.add({ id: 'done:a', mode: 'tasks', kind: 'done', refId: 'a', dayKey: '2026-11-03',
    inputs: { plannedSize: 'M', isFirstDay: true, wasPlanned: true, postpones: 0 }, updatedAt: at('2026-11-03'), deleted: 0, deviceId: 'test' });
  await reconcileGamify(db, at('2026-11-03', '18:00'));
  const first = (await db.settings.get(PEAK_KEY))!.value as { totalXp: number; level: number };
  expect(first.totalXp).toBeGreaterThan(0);
  // An older backup with a lower peak does not lower this phone's.
  const older = createDb(`gamify-peak-old-${++serial}`); opened.push(older);
  await older.settings.put({ key: PEAK_KEY, value: { totalXp: 1, level: 1 }, updatedAt: 1, deleted: 0, deviceId: 'old' });
  await importBackup(db, await exportBackup(older, at('2026-11-01')));
  expect((await db.settings.get(PEAK_KEY))!.value).toEqual(first);
});
