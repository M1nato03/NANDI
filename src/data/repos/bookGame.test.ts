// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { exportBackup, importBackup, validateBackup } from '../backup';
import { loadGame, playedMonths, playMove, saveDraft, startMonth } from './bookGame';
import { deriveEconomy } from '../../core/economy/deriveEconomy';
import { phrases } from '../../core/bookGame/arkad';

let serial = 0;
const opened: NandiDb[] = [];
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const freshDb = () => { const db = createDb(`book-game-${++serial}`); opened.push(db); return db; };
const BOOK = 'richest-man-in-babylon';
const NOON = new Date('2026-11-12T12:00:00').getTime();

/** Plays Jan through `last` the careful way, marking every phrase in the sign months. */
async function playTo(db: NandiDb, last: number) {
  for (let m = 0; m <= last; m++) {
    let state = await startMonth(db, BOOK, m, NOON + m);
    if ([2, 3, 5, 6].includes(m)) { state = { ...state, found: Object.fromEntries(phrases(m).map((_, i) => [i, true])) }; await saveDraft(db, BOOK, state, NOON + m); }
    const action = m === 0 || m === 10 ? 'split-commit' : m === 1 ? 'feb-commit' : m === 4 ? 'invest' : m === 7 ? 'repair' : m === 8 ? 'course' : m === 9 ? 'festival-commit' : m === 11 ? 'dec-commit' : m === 5 ? 'yes' : 'no';
    await playMove(db, BOOK, action, NOON + m);
  }
}

describe('spec 40: the saved year, no loss, and the XP flag (off by default)', () => {
  it('flag off (default): the four sign months write no book-game fact and pay nothing', async () => {
    const db = freshDb();
    await playTo(db, 6);
    expect(await db.ledger.where('kind').equals('book-game').count()).toBe(0);
    expect(await db.settings.get('economy.v11From')).toBeUndefined();
    expect(await db.settings.get('bookGame.signXp')).toBeUndefined();
    expect([...playedMonths(await loadGame(db, BOOK))]).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('flag on (test only): +10 per sign month with every sign found, once each, max 40, from its own cutoff', async () => {
    const db = freshDb();
    await db.settings.put({ key: 'bookGame.signXp', value: true, updatedAt: 1, deleted: 0, deviceId: 'a' });
    await playTo(db, 11);
    const facts = await db.ledger.where('kind').equals('book-game').toArray();
    expect(facts.map(f => f.id).sort()).toEqual([2, 3, 5, 6].map(m => `book-game:${BOOK}:${m}`).sort());
    expect((await db.settings.get('economy.v11From'))?.value).toBe('2026-11-12');
    const view = deriveEconomy(await db.ledger.toArray(), undefined, await db.settings.toArray(), '2026-11-12');
    const without = deriveEconomy((await db.ledger.toArray()).filter(f => f.kind !== 'book-game'), undefined, await db.settings.toArray(), '2026-11-12');
    expect(view.totalXp - without.totalXp).toBe(40);
    // Before its cutoff nothing pays.
    const early = deriveEconomy(await db.ledger.toArray(), undefined, (await db.settings.toArray()).map(r => r.key === 'economy.v11From' ? { ...r, value: '2026-11-13' } : r), '2026-11-12');
    expect(early.totalXp).toBe(without.totalXp);
  });

  it('a double tap opens a month once (salary once); a played month reopens read-only and is never replayed', async () => {
    const db = freshDb();
    await playTo(db, 0);
    const a = await startMonth(db, BOOK, 1, NOON);
    const b = await startMonth(db, BOOK, 1, NOON + 1);
    expect(b.pots).toEqual(a.pots);
    await playMove(db, BOOK, 'feb-commit', NOON + 2);
    const done = await loadGame(db, BOOK);
    const again = await playMove(db, BOOK, 'feb-commit', NOON + 3);
    expect(again.state.pots).toEqual(done!.pots);
    expect((await startMonth(db, BOOK, 1, NOON + 4)).history[1]).toEqual(done!.history[1]);
  });

  it('a mid-year backup restores to the same month, pots, net, debt and ledger; a pre-v7 backup restores with no game', async () => {
    const db = freshDb();
    await playTo(db, 4);
    const before = await loadGame(db, BOOK);
    const envelope = await exportBackup(db, NOON);
    const target = freshDb();
    await importBackup(target, envelope);
    expect(await loadGame(target, BOOK)).toEqual(before);

    const old = structuredClone(envelope);
    old.dexie.data.databaseVersion = 6;
    old.dexie.data.tables = old.dexie.data.tables.filter(table => table.name !== 'bookGameStates');
    old.dexie.data.data = old.dexie.data.data.filter(table => table.tableName !== 'bookGameStates');
    const migrated = validateBackup(old);
    expect(migrated.success).toBe(true);
    const third = freshDb();
    await importBackup(third, migrated.envelope!);
    expect(await loadGame(third, BOOK)).toBeNull();
    expect(await third.ledger.count()).toBe(await db.ledger.count());
  });

  it('deriveEconomy is identical before and after on a fixture with no game facts (the flag and v11From never touch it)', async () => {
    const db = freshDb();
    await db.ledger.add({ id: 'task:1', mode: 'tasks', kind: 'done', refId: '1', dayKey: '2026-11-12', inputs: { plannedSize: 'M', wasPlanned: true }, updatedAt: NOON, deleted: 0, deviceId: 'a' });
    const plain = deriveEconomy(await db.ledger.toArray(), undefined, [], '2026-11-12');
    const withCutoff = deriveEconomy(await db.ledger.toArray(), undefined, [{ key: 'economy.v11From', value: '2026-11-01', updatedAt: 1, deleted: 0, deviceId: 'a' }], '2026-11-12');
    expect(withCutoff).toEqual(plain);
  });
});
