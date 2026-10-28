// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { deriveEconomy } from '../../core/economy/deriveEconomy';
import { deriveCourtyard } from '../../core/courtyard/courtyard';
import { DEFAULT_BREATH, DEFAULT_CALM_PREFS, readBreath, readCalmPrefs, saveCalmDone, saveCalmSettings, calmKeys } from './calm';

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

  it('a counted session is one calm row a start, and it changes no XP, mark or courtyard area', async () => {
    const db = fresh();
    await saveCalmDone(db, { elapsedMs: 180_000, way: 'paced', breath: DEFAULT_BREATH, startedAt: at }, at + 180_000);
    await saveCalmDone(db, { elapsedMs: 181_000, way: 'paced', breath: DEFAULT_BREATH, startedAt: at }, at + 181_000);
    const rows = await db.ledger.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ mode: 'calm', kind: 'session', dayKey: '2026-10-28', inputs: { minutes: 3, way: 'paced', in: 4, out: 6 } });
    const economy = deriveEconomy(rows, undefined, [], '2026-10-28');
    expect(economy.days.filter(day => day.total > 0 || day.mark)).toEqual([]);
    expect(deriveCourtyard(rows, '2026-10-28').activeDays).toBe(0);
  });
});

describe('spec 35 Calm v1.1', () => {
  it('saves nothing under a minute, whole minutes from one, and the way with no breath for a scan or quiet sit', async () => {
    const db = fresh();
    expect(await saveCalmDone(db, { elapsedMs: 59_999, way: 'quiet', breath: DEFAULT_BREATH, startedAt: at }, at + 59_999)).toBeNull();
    await saveCalmDone(db, { elapsedMs: 60_000, way: 'quiet', breath: DEFAULT_BREATH, startedAt: at + 1 }, at + 60_001);
    await saveCalmDone(db, { elapsedMs: 30 * 60_000 + 59_000, way: 'scan', breath: DEFAULT_BREATH, startedAt: at + 2 }, at + 31 * 60_000);
    const rows = (await db.ledger.toArray()).sort((a, b) => a.id.localeCompare(b.id));
    expect(rows.map(row => row.inputs)).toEqual([{ minutes: 1, way: 'quiet' }, { minutes: 30, way: 'scan' }]);
    // Length never earns more: a 30-minute sit pays exactly what a 1-minute sit pays, which is nothing.
    expect(deriveEconomy(rows, undefined, [], '2026-10-28').days.filter(day => day.total > 0 || day.mark)).toEqual([]);
  });

  it('remembers the last choice and keeps every pref inside its bounds', async () => {
    expect(readCalmPrefs(undefined)).toEqual(DEFAULT_CALM_PREFS);
    expect(readCalmPrefs({ minutes: 'open', way: 'quiet', interval: 10, sound: 'river' })).toMatchObject({ minutes: 'open', way: 'quiet', interval: 10, sound: 'river' });
    expect(readCalmPrefs({ minutes: 500, way: 'nap', interval: 7, soundVolume: -4, fade: 'yes' })).toMatchObject({ minutes: 120, way: 'paced', interval: 0, soundVolume: 0, fade: true });
    expect(readCalmPrefs({ minutes: 0.5 }).minutes).toBe(3);
    const db = fresh();
    await saveCalmSettings(db, { prefs: { minutes: 45 } }, at);
    await saveCalmSettings(db, { prefs: { way: 'scan' } }, at + 1);
    expect(readCalmPrefs((await db.settings.get(calmKeys.prefs))?.value)).toMatchObject({ minutes: 45, way: 'scan', startBell: true, interval: 0, sound: 'none' });
  });
});
