// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { exportBackup, importBackup } from '../backup';
import { breathKeys, DEFAULT_BREATH_SETTINGS, loadBreathSettings, markBreathShown, readBreathSettings, saveHolds, saveOpeningMode } from './notebookBreath';
import { openerDue } from '../../core/calm/squareBreath';

const stores: NandiDb[] = [];
afterEach(async () => { for (const store of stores.splice(0)) await store.delete(); });
const fresh = () => { const store = createDb(`breath-${crypto.randomUUID()}`); stores.push(store); return store; };
const at = new Date('2026-10-31T09:00:00').getTime();
const row = (key: string, value: unknown, deleted: 0 | 1 = 0) => ({ key, value, deleted });

describe('spec 45a breath settings', () => {
  it('missing or unreadable values read as the defaults', () => {
    expect(readBreathSettings(undefined)).toEqual(DEFAULT_BREATH_SETTINGS);
    expect(readBreathSettings([row(breathKeys.opening, 'sometimes'), row(breathKeys.holds, 'yes'), row(breathKeys.lastShownDay, '31 Oct')])).toEqual(DEFAULT_BREATH_SETTINGS);
    expect(readBreathSettings([row(breathKeys.opening, 'every', 1), row(breathKeys.holds, false, 1)])).toEqual(DEFAULT_BREATH_SETTINGS);
    expect(readBreathSettings([row(breathKeys.opening, 'off'), row(breathKeys.holds, false), row(breathKeys.lastShownDay, '2026-10-31')])).toEqual({ opening: 'off', holds: false, lastShownDay: '2026-10-31' });
  });

  it('saves each setting through the settings table', async () => {
    const db = fresh();
    expect(await loadBreathSettings(db)).toEqual(DEFAULT_BREATH_SETTINGS);
    await saveOpeningMode(db, 'every', at);
    await saveHolds(db, false, at);
    await markBreathShown(db, '2026-10-31', at);
    expect(await loadBreathSettings(db)).toEqual({ opening: 'every', holds: false, lastShownDay: '2026-10-31' });
    expect((await db.settings.get(breathKeys.holds))?.deviceId).toBeTruthy();
  });

  it('a backup carries all three, and a restored day keeps the breath to once that day', async () => {
    const source = fresh();
    await saveOpeningMode(source, 'daily', at);
    await saveHolds(source, false, at);
    await markBreathShown(source, '2026-10-31', at);
    const envelope = await exportBackup(source, at);
    const target = fresh();
    await importBackup(target, envelope);
    const restored = await loadBreathSettings(target);
    expect(restored).toEqual({ opening: 'daily', holds: false, lastShownDay: '2026-10-31' });
    expect(openerDue({ mode: restored.opening, today: '2026-10-31', lastShownDay: restored.lastShownDay, ordinary: true })).toBe(false);
    expect(openerDue({ mode: restored.opening, today: '2026-11-01', lastShownDay: restored.lastShownDay, ordinary: true })).toBe(true);
  });
});
