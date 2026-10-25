// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { chikuPlayed, saveChikuPlayed } from './learn-engine';
import { exportBackup, importBackup } from '../backup';

const stores: NandiDb[] = [];
afterEach(async () => { for (const store of stores.splice(0)) await store.delete(); });

it('spec 30: once played, Chiku is played after a replay and after a backup restore; one fact, whichever card (Codex B item 110)', async () => {
  const db = createDb(`chiku-${crypto.randomUUID()}`); stores.push(db);
  const now = new Date('2026-11-03T12:00:00').getTime();
  expect(await chikuPlayed(db, 'habits')).toBe(false);
  await saveChikuPlayed(db, { conceptId: 'habits', card: 1, matched: false, deviceId: 'd', now });
  await saveChikuPlayed(db, { conceptId: 'habits', card: 0, matched: true, deviceId: 'd', now: now + 1000 });
  expect(await chikuPlayed(db, 'habits')).toBe(true);
  expect((await db.ledger.toArray()).filter(row => row.kind === 'chiku')).toHaveLength(1);
  const envelope = await exportBackup(db, new Date(now));
  await Promise.all(db.tables.map(table => table.clear()));
  expect(await chikuPlayed(db, 'habits')).toBe(false);
  await importBackup(db, envelope);
  expect(await chikuPlayed(db, 'habits')).toBe(true);
});
