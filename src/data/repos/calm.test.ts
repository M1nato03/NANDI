// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { deriveEconomy } from '../../core/economy/deriveEconomy';
import { deriveCourtyard } from '../../core/courtyard/courtyard';
import { DEFAULT_BREATH, readBreath, saveCalmDone } from './calm';

const stores: NandiDb[] = [];
afterEach(async () => { for (const store of stores.splice(0)) await store.delete(); });
const fresh = () => { const store = createDb(`calm-${crypto.randomUUID()}`); stores.push(store); return store; };
const at = new Date('2026-10-28T09:00:00').getTime();

describe('spec 34 Calm', () => {
  it('keeps the breath pattern inside its bounds and falls back to 4 in, 6 out', () => {
    expect(readBreath(undefined)).toEqual(DEFAULT_BREATH);
    expect(readBreath({ in: 5, out: 7 })).toEqual({ in: 5, out: 7 });
    expect(readBreath({ in: 1, out: 20 })).toEqual({ in: 3, out: 8 });
    expect(readBreath({ in: 4.5, out: 'six' })).toEqual(DEFAULT_BREATH);
  });

  it('a finished session is one calm row a start, and it changes no XP, mark or courtyard area', async () => {
    const db = fresh();
    await saveCalmDone(db, { minutes: 3, breath: DEFAULT_BREATH, startedAt: at }, at + 180_000);
    await saveCalmDone(db, { minutes: 3, breath: DEFAULT_BREATH, startedAt: at }, at + 181_000);
    const rows = await db.ledger.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ mode: 'calm', kind: 'session', dayKey: '2026-10-28', inputs: { minutes: 3, in: 4, out: 6 } });
    const economy = deriveEconomy(rows, undefined, [], '2026-10-28');
    expect(economy.days.filter(day => day.total > 0 || day.mark)).toEqual([]);
    expect(deriveCourtyard(rows, '2026-10-28').activeDays).toBe(0);
  });
});
