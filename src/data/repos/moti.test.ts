// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { saveHaveliRebuilt, saveMatkaAnswer } from './moti';
import { exportBackup, importBackup } from '../backup';

const stores: NandiDb[] = [];
afterEach(async () => { for (const store of stores.splice(0)) await store.delete(); });
const fresh = () => { const store = createDb(`moti-${crypto.randomUUID()}`); stores.push(store); return store; };
const noon = new Date('2026-11-08T12:00:00').getTime();

describe('spec 26 Moti facts', () => {
  it('a rebuilt idea is one card review a day; the next day it can be rebuilt again', async () => {
    const db = fresh();
    await saveHaveliRebuilt(db, 'habits', noon);
    await saveHaveliRebuilt(db, 'habits', noon + 60_000);
    await saveHaveliRebuilt(db, 'habits', noon + 86_400_000);
    const facts = (await db.ledger.toArray()).filter(row => row.kind === 'card');
    expect(facts.map(row => row.refId).sort()).toEqual(['2026-11-08:haveli:habits', '2026-11-09:haveli:habits']);
    expect(facts.every(row => row.mode === 'mind' && row.inputs.afterBedtime === false)).toBe(true);
  });
  it('a matka answer keeps the seal, the recall and the shift, and pays one card review whatever the result; it survives a backup', async () => {
    const db = fresh();
    const item = { factId: 'learn-answer:a', level: 2 as const, itemId: 'i', sealed: 40, answer: 70, dayKey: '2026-10-30' };
    await saveMatkaAnswer(db, { week: '2026-11-02', item, recalled: 60, now: noon });
    await saveMatkaAnswer(db, { week: '2026-11-02', item, recalled: 70, now: noon + 1000 });
    const facts = await db.ledger.toArray();
    const matka = facts.filter(row => row.kind === 'matka');
    expect(matka).toHaveLength(1);
    expect(matka[0]!.inputs).toMatchObject({ sourceFactId: 'learn-answer:a', level: 2, recalled: 60, sealed: 40, answer: 70 });
    expect(matka[0]!.inputs.shift).toBeCloseTo(2 / 3);
    expect(facts.filter(row => row.kind === 'card' && row.refId.includes(':matka:'))).toHaveLength(1);
    const envelope = await exportBackup(db, new Date(noon));
    await Promise.all(db.tables.map(table => table.clear()));
    await importBackup(db, envelope);
    expect((await db.ledger.toArray()).filter(row => row.kind === 'matka')).toHaveLength(1);
  });
});
