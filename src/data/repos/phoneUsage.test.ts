// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { exportBackup, importBackup } from '../backup';
import { capturePhoneUsage, stopPhoneUsage } from './phoneUsage';
import { addCalendarDays, calendarBounds, calendarDayKey } from '../../core/phoneUsage/calendarDay';
import { PHONE_USAGE_KEYS, readBaselines, setIdFor, trackedPackages } from '../../core/phoneUsage/baseline';
import { PHONE_USAGE_CATALOG } from '../../core/rules.config';
import type { GuardEvent } from '../../core/focusGuard';
import type { ForegroundRead } from '../../platform/phoneUsage';

let serial = 0;
const opened: NandiDb[] = [];
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const stamp = { updatedAt: 1, deleted: 0 as const, deviceId: 't' };
const MIN = 60_000, HOUR = 60 * MIN;
const IG = 'com.instagram.android', YT = 'com.google.android.youtube', CHROME = 'com.android.chrome';
const NOW = new Date('2026-11-20T12:00:00').getTime();
const TODAY = calendarDayKey(NOW);
const TRACKED = trackedPackages([IG]).length;

async function phone(picked: string[] | null = [IG], pauseOn = false) {
  const db = createDb(`phone-usage-${++serial}`);
  opened.push(db);
  await db.settings.bulkPut([
    ...(picked ? [{ key: 'night.pause.apps', value: picked, ...stamp }] : []),
    { key: 'pause.card.on', value: pauseOn, ...stamp },
  ]);
  return db;
}
/** Every day the log covers: a screen-off at 23:00 the night before, then Instagram 10 min at 10:00 and YouTube 5 min at 21:00. */
function log(firstDay: string, lastDay: string): GuardEvent[] {
  const events: GuardEvent[] = [];
  for (let day = addCalendarDays(firstDay, -1); day <= lastDay; day = addCalendarDays(day, 1)) {
    const { fromMs } = calendarBounds(day);
    events.push({ type: 'on', at: fromMs + 10 * HOUR - MIN }, { type: 'fg', at: fromMs + 10 * HOUR, pkg: IG, cls: 'M' }, { type: 'bg', at: fromMs + 10 * HOUR + 10 * MIN, pkg: IG, cls: 'M' });
    events.push({ type: 'fg', at: fromMs + 21 * HOUR, pkg: YT, cls: 'M' }, { type: 'bg', at: fromMs + 21 * HOUR + 5 * MIN, pkg: YT, cls: 'M' }, { type: 'off', at: fromMs + 23 * HOUR });
  }
  return events;
}
/** A phone whose log reaches back to `logFrom` (a calendar day). */
function reader(logFrom: string, change: Partial<Extract<ForegroundRead, { access: true }>> = {}, calls: number[][] = []) {
  return async (from: number, to: number): Promise<ForegroundRead> => {
    calls.push([from, to]);
    const start = calendarBounds(logFrom).fromMs;
    return { access: true, logStart: start, events: log(logFrom, addCalendarDays(TODAY, 30)).filter(event => event.at >= start && event.at > from && event.at <= to), installed: [IG, YT], cross: [], bootCount: 3, bootWallMs: 1000, ...change };
  };
}
const rowsOf = async (db: NandiDb) => (await db.phoneUsageMinutes.toArray()).sort((a, b) => a.id.localeCompare(b.id));

describe('spec 46a: the daily minutes record', () => {
  it('writes nothing until apps are picked, and nothing on a phone with no usage log', async () => {
    const none = await phone(null);
    expect(await capturePhoneUsage(none, NOW, reader('2026-11-01'))).toBe('not-picked');
    const web = await phone();
    expect(await capturePhoneUsage(web, NOW, async () => null)).toBe('unavailable');
    expect(await capturePhoneUsage(web, NOW, async () => ({ access: false }))).toBe('no-access');
    expect(await web.phoneUsageMinutes.count()).toBe(0);
    expect(await web.settings.get(PHONE_USAGE_KEYS.since)).toBeUndefined();
  });
  it('backfills only the days the log holds (at most 9), one row per tracked package, with real zeros', async () => {
    const db = await phone();
    expect(await capturePhoneUsage(db, NOW, reader('2026-11-01'))).toBe('read');
    const rows = await rowsOf(db);
    const days = [...new Set(rows.map(row => row.dayKey))].sort();
    expect(days).toEqual(Array.from({ length: 9 }, (_, i) => addCalendarDays(TODAY, i - 9)));
    expect(rows).toHaveLength(9 * TRACKED);
    const day = rows.filter(row => row.dayKey === addCalendarDays(TODAY, -1));
    expect(day.find(row => row.packageName === IG)).toMatchObject({ foregroundMs: 10 * MIN, group: 'picked', installed: true, setId: setIdFor([IG]), catalogId: PHONE_USAGE_CATALOG.id });
    expect(day.find(row => row.packageName === YT)).toMatchObject({ foregroundMs: 5 * MIN, group: 'substitute' });
    expect(day.find(row => row.packageName === CHROME)).toMatchObject({ foregroundMs: 0, installed: false });
    // Today is not finished, so it has no row.
    expect(rows.some(row => row.dayKey === TODAY)).toBe(false);
  });
  it('never fabricates days the log does not reach: they are unknown, not zero', async () => {
    const db = await phone();
    await capturePhoneUsage(db, NOW, reader(addCalendarDays(TODAY, -3)));
    const rows = await rowsOf(db);
    const early = rows.filter(row => row.dayKey < addCalendarDays(TODAY, -2));
    expect(early.length).toBeGreaterThan(0);
    expect(early.every(row => row.foregroundMs === null && row.reason)).toBe(true);
    expect(rows.filter(row => row.dayKey === addCalendarDays(TODAY, -1)).every(row => row.foregroundMs !== null)).toBe(true);
  });
  it('a second open writes nothing new and does not read the log again', async () => {
    const db = await phone();
    await capturePhoneUsage(db, NOW, reader('2026-11-01'));
    const before = await rowsOf(db);
    const calls: number[][] = [];
    expect(await capturePhoneUsage(db, NOW + HOUR, reader('2026-11-01', {}, calls))).toBe('nothing-due');
    expect(calls).toEqual([]);
    expect(await rowsOf(db)).toEqual(before);
  });
  it('an unknown day is read again and replaced only by evidence; a measured day is never rewritten', async () => {
    const db = await phone();
    await capturePhoneUsage(db, NOW, async () => ({ access: true, logStart: null, events: [], installed: [], cross: [], bootCount: 3, bootWallMs: 1000 }));
    expect((await rowsOf(db)).every(row => row.foregroundMs === null && row.reason === 'short_history')).toBe(true);
    const later = NOW + 11 * MIN;
    await capturePhoneUsage(db, later, reader('2026-11-01'));
    const rows = await rowsOf(db);
    expect(rows.find(row => row.id === `${addCalendarDays(TODAY, -1)}|${IG}`)?.foregroundMs).toBe(10 * MIN);
    // Usage access turned off afterwards: the measured days stay as they were.
    await capturePhoneUsage(db, NOW + 2 * HOUR, async () => ({ access: false }));
    expect(await rowsOf(db)).toEqual(rows);
  });
  it('a clock moved since the last read makes the days from then unknown for good', async () => {
    const db = await phone();
    await capturePhoneUsage(db, NOW, reader('2026-11-01'));
    const next = NOW + 2 * 24 * HOUR;
    await capturePhoneUsage(db, next, reader('2026-11-01', { bootWallMs: 1000 + 5 * MIN }));
    const rows = await rowsOf(db);
    expect(rows.filter(row => row.dayKey === TODAY).every(row => row.reason === 'clock_change')).toBe(true);
    expect(rows.find(row => row.id === `${addCalendarDays(TODAY, -1)}|${IG}`)?.foregroundMs).toBe(10 * MIN);
  });
  it('freezes the first 7 complete days in a row as the starting week, labelled by what is known about the Pause card', async () => {
    const db = await phone([IG], true);
    await capturePhoneUsage(db, NOW, reader('2026-11-01'));
    const [baseline] = readBaselines(await db.settings.toArray());
    expect(baseline?.days).toEqual(Array.from({ length: 7 }, (_, i) => addCalendarDays(TODAY, i - 9)));
    expect(baseline).toMatchObject({ setId: setIdFor([IG]), picked: [IG], label: 'first-measured' });
    // Later reads never move it.
    await capturePhoneUsage(db, NOW + 3 * 24 * HOUR, reader('2026-11-01'));
    expect(readBaselines(await db.settings.toArray())).toEqual([baseline]);
  });
  it('a missing day delays the week; picking another app starts a new week and keeps the old one', async () => {
    const db = await phone();
    const gap = addCalendarDays(TODAY, -6);
    await capturePhoneUsage(db, NOW, async (from, to) => { const read = await reader('2026-11-01')(from, to); return read.access ? { ...read, events: read.events.filter(event => calendarDayKey(event.at) !== gap) } : read; });
    // The day with no events has no screen-off before the next day either, so two days are unknown: no 7 in a row yet.
    expect(readBaselines(await db.settings.toArray())).toEqual([]);
    const second = await phone();
    await capturePhoneUsage(second, NOW, reader('2026-11-01'));
    const first = readBaselines(await second.settings.toArray());
    expect(first).toHaveLength(1);
    await second.settings.put({ key: 'night.pause.apps', value: [IG, 'com.facebook.katana'], ...stamp });
    await capturePhoneUsage(second, NOW + 8 * 24 * HOUR, reader('2026-11-01'));
    expect(readBaselines(await second.settings.toArray())).toEqual(first);
    await capturePhoneUsage(second, NOW + 16 * 24 * HOUR, reader('2026-11-01'));
    const both = readBaselines(await second.settings.toArray());
    expect(both[0]).toEqual(first[0]);
    expect(both[1]?.setId).toBe(setIdFor([IG, 'com.facebook.katana']));
    // The change was seen on day +8, so the new week starts there, not on the days read late under the old set.
    expect(both[1]?.days[0]).toBe(addCalendarDays(TODAY, 8));
  });
  it('Stop and delete removes the record and keeps nothing more', async () => {
    const db = await phone();
    await capturePhoneUsage(db, NOW, reader('2026-11-01'));
    await stopPhoneUsage(db, NOW);
    expect(await db.phoneUsageMinutes.count()).toBe(0);
    expect(await db.settings.get(PHONE_USAGE_KEYS.baselines)).toBeUndefined();
    expect(await capturePhoneUsage(db, NOW + HOUR, reader('2026-11-01'))).toBe('off');
    expect(await db.phoneUsageMinutes.count()).toBe(0);
  });
  it('a backup carries the table empty and no record setting; a restore keeps this phone\'s record, and a new phone gets none', async () => {
    const db = await phone();
    await capturePhoneUsage(db, NOW, reader('2026-11-01'));
    const rows = await rowsOf(db);
    const file = await exportBackup(db, NOW);
    const table = file.dexie.data.data.find(entry => entry.tableName === 'phoneUsageMinutes');
    expect(table?.rows).toEqual([]);
    expect(file.dexie.data.tables.find(entry => entry.name === 'phoneUsageMinutes')?.rowCount).toBe(0);
    const settings = file.dexie.data.data.find(entry => entry.tableName === 'settings')!.rows.map(row => String(row.key));
    expect(settings.filter(key => key.startsWith('phoneUsage.'))).toEqual([]);
    expect(JSON.stringify(file)).not.toContain('foregroundMs');
    await importBackup(db, file);
    expect(await rowsOf(db)).toEqual(rows);
    expect(readBaselines(await db.settings.toArray())).toHaveLength(1);
    const other = await phone(null);
    await importBackup(other, file);
    expect(await other.phoneUsageMinutes.count()).toBe(0);
    expect(await other.settings.get(PHONE_USAGE_KEYS.since)).toBeUndefined();
  });
});
