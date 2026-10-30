// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { exportBackup, importBackup } from '../backup';
import { recordOpens } from './pause';
import { OPENS_KEY, readOpensLog } from '../../core/pauseOpens';
import type { GuardEvent } from '../../core/focusGuard';

let serial = 0;
const opened: NandiDb[] = [];
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const stamp = { updatedAt: 1, deleted: 0 as const, deviceId: 't' };
const NOW = new Date('2026-11-04T12:00:00').getTime();
const IG = 'com.instagram.android';
async function withCard(on = true) {
  const db = createDb(`pause-${++serial}`);
  opened.push(db);
  await db.settings.bulkPut([{ key: 'pause.card.on', value: on, ...stamp }, { key: 'night.pause.apps', value: [IG], ...stamp }]);
  return db;
}
// The phone's log: Instagram, WhatsApp and YouTube each opened once a day at 10:00 for 10 minutes, for 9 days.
const log: GuardEvent[] = [];
for (let back = 9; back >= 0; back -= 1) {
  const day = new Date(NOW); day.setDate(day.getDate() - back);
  log.push({ type: 'on', at: new Date(day).setHours(1, 0, 0, 0) });
  for (const pkg of [IG, 'com.whatsapp', 'com.google.android.youtube']) {
    const start = new Date(day).setHours(10, 0, 0, 0);
    log.push({ type: 'fg', at: start, pkg, cls: 'Main' }, { type: 'bg', at: start + 600_000, pkg, cls: 'Main' });
  }
}
const read = async (from: number, to: number) => log.filter(event => event.at >= from && event.at <= to);

it('keeps the picked apps only, reads the week before at once, and writes nothing without a usage log or with the card off', async () => {
  const db = await withCard();
  expect(await recordOpens(db, NOW, read)).toBe(true);
  const kept = readOpensLog(await db.settings.toArray())!;
  expect(kept.since).toBe('2026-11-04');
  expect(Object.keys(kept.days).sort()).toEqual(['2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04']);
  expect(kept.days['2026-11-01']).toEqual({ apps: { [IG]: { opens: 1, ms: 600_000 } }, anyway: { count: 0, ms: 0 }, whole: true, covered: true });
  expect(kept.days['2026-11-04']!.whole).toBe(false);
  // No other app is named anywhere in what is kept.
  expect(JSON.stringify(kept)).not.toMatch(/whatsapp|youtube/);

  const noLog = await withCard();
  expect(await recordOpens(noLog, NOW, async () => null)).toBe(false);
  expect(await noLog.settings.get(OPENS_KEY)).toBeUndefined();
  const off = await withCard(false);
  expect(await recordOpens(off, NOW, read)).toBe(false);
  expect(await off.settings.get(OPENS_KEY)).toBeUndefined();
});

it('goes into a backup like any other setting, and a restore replaces it (restore = REPLACE)', async () => {
  const db = await withCard();
  await recordOpens(db, NOW, read);
  const envelope = await exportBackup(db, new Date(NOW));
  const mine = (await db.settings.get(OPENS_KEY))!.value;
  await db.settings.put({ key: OPENS_KEY, value: { since: '2026-11-04', days: {} }, ...stamp });
  await importBackup(db, envelope);
  expect((await db.settings.get(OPENS_KEY))!.value).toEqual(mine);
  // A backup made before the log existed clears it on restore.
  const empty = await withCard();
  const before = await exportBackup(empty, new Date(NOW));
  await importBackup(db, before);
  expect(await db.settings.get(OPENS_KEY)).toBeUndefined();
});

it('spec 39b: an "every open" card moves to after 10 min a day once, says so, and the next save clears the note', async () => {
  const { switchPauseToTen, savePauseSettings } = await import('./pause');
  const { readPauseCard } = await import('../../core/pauseCard');
  const db = await withCard();
  await db.settings.put({ key: 'night.pause.dayMode', value: 'open', ...stamp });
  expect(await switchPauseToTen(db, NOW)).toBe(true);
  expect(readPauseCard(await db.settings.toArray(), '2026-11-04')).toMatchObject({ mode: 'limit', limitMin: 10, switchedTo10: true });
  // Once only: the person may go back to every open, and it stays.
  await savePauseSettings(db, { mode: 'open', modeNote: 'seen' }, NOW + 1);
  expect(await switchPauseToTen(db, NOW + 2)).toBe(false);
  expect(readPauseCard(await db.settings.toArray(), '2026-11-04')).toMatchObject({ mode: 'open', switchedTo10: false });
  // The old day pause (no card set up) is left alone.
  const old = await withCard(false);
  await old.settings.bulkPut([{ key: 'night.pause.enabled', value: true, ...stamp }, { key: 'night.pause.dayMode', value: 'open', ...stamp }]);
  await old.settings.delete('pause.card.on');
  expect(await switchPauseToTen(old, NOW)).toBe(false);
});
