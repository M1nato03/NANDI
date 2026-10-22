// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { CLOSE_PREFIX, closeKey, deriveEconomy } from '../../core/economy/deriveEconomy';
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
