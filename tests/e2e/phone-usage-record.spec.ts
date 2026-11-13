import { expect, test, type Page } from '@playwright/test';
import { textAt200 } from './helpers/text';

// Spec 46a: the daily minutes record is written silently. The only thing a person sees is one quiet line in You →
// Settings, with what is kept and an off switch that deletes the record (jenil-87, 31 Oct). The phone's side is the
// e2e stand-in in platform/phoneUsage.ts (`phoneLog` on the Pause card's stand-in).
const NOON = new Date('2026-11-20T12:00:00');
const IG = 'com.instagram.android';
const HOUR = 3_600_000, MIN = 60_000;

/** Ten days of a phone's log: a screen-off each night, Instagram 10 minutes at 10:00, YouTube 5 minutes at 21:00. */
function phoneLog() {
  const events: { type: string; at: number; pkg?: string; cls?: string }[] = [];
  for (let back = 11; back >= 0; back -= 1) {
    const day = new Date(NOON.getFullYear(), NOON.getMonth(), NOON.getDate() - back).getTime();
    events.push({ type: 'on', at: day + 10 * HOUR - MIN }, { type: 'fg', at: day + 10 * HOUR, pkg: IG, cls: 'M' }, { type: 'bg', at: day + 10 * HOUR + 10 * MIN, pkg: IG, cls: 'M' });
    events.push({ type: 'fg', at: day + 21 * HOUR, pkg: 'com.google.android.youtube', cls: 'M' }, { type: 'bg', at: day + 21 * HOUR + 5 * MIN, pkg: 'com.google.android.youtube', cls: 'M' }, { type: 'off', at: day + 23 * HOUR });
  }
  return { logStart: new Date(NOON.getFullYear(), NOON.getMonth(), NOON.getDate() - 11).getTime(), events, installed: [IG], cross: [], bootCount: 4, bootWallMs: 1000 };
}

const minutesRows = (page: Page) => page.evaluate(async () => {
  const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
  if (!database.objectStoreNames.contains('phoneUsageMinutes')) { database.close(); return []; }
  const rows = await new Promise<{ id: string; foregroundMs: number | null; reason?: string }[]>(resolve => { const request = database.transaction('phoneUsageMinutes').objectStore('phoneUsageMinutes').getAll(); request.onsuccess = () => resolve(request.result as never); });
  database.close();
  return rows;
});

/** Instagram picked for the Pause card (written as the setup would), and the phone's stand-in. */
async function picked(page: Page, phone: Record<string, unknown>) {
  await page.goto('/?e2e#you');
  await expect(page.getByText(/XP in all$/)).toBeVisible();
  await page.evaluate(async ([apps, fake]) => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>(resolve => {
      const transaction = database.transaction('settings', 'readwrite');
      transaction.objectStore('settings').put({ key: 'night.pause.apps', value: apps, updatedAt: 1, deleted: 0, deviceId: 'e2e' });
      transaction.oncomplete = () => resolve();
    });
    database.close();
    sessionStorage.setItem('nandi.e2ePause', JSON.stringify(fake));
  }, [[IG], phone] as const);
  await page.reload();
}

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('with Usage access the record fills silently, and the only sign is the Settings line', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.install({ time: NOON });
  await picked(page, { phoneLog: phoneLog() });
  await expect.poll(async () => (await minutesRows(page)).length).toBeGreaterThan(0);
  const rows = await minutesRows(page);
  const yesterday = rows.find(row => row.id.endsWith(`|${IG}`) && row.id.startsWith('2026-11-19'));
  expect(yesterday?.foregroundMs).toBe(10 * MIN);
  // Nothing on Home or You shows a minute from it.
  for (const route of ['/?e2e#yatra', '/?e2e#you']) {
    await page.goto(route);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('main')).not.toContainText(/minutes record|phone use|lower than|higher than/i);
  }
  await page.goto('/?e2e#you/settings');
  const record = page.getByRole('region', { name: 'Daily minutes record' });
  await expect(record).toContainText('Keeping a daily minutes record on this phone');
  await record.getByText("What’s kept").click();
  await expect(record).toContainText('A daily minutes record for the apps you picked and similar apps, on this phone only.');
  await expect(record).toContainText('It never leaves this phone: not in a backup, a share or a notification.');
  // No other app is named.
  await expect(record).not.toContainText(/YouTube|Chrome|Firefox|Opera|Brave|Edge|Moj|Josh|ShareChat|Snapchat/);
});

test('without Usage access nothing is written and the line says the record is paused; on return it begins', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.install({ time: NOON });
  await picked(page, { usageAllowed: false, phoneLog: phoneLog() });
  await page.goto('/?e2e#you/settings');
  await expect(page.getByRole('region', { name: 'Daily minutes record' })).toContainText('Daily minutes record paused: Usage access is off.');
  expect(await minutesRows(page)).toEqual([]);
  // Usage access turned on; the next look at NANDI (after the 10-minute wait) reads the days.
  await page.evaluate(log => sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ usageAllowed: true, phoneLog: log })), phoneLog());
  await page.clock.fastForward('11:00');
  await page.evaluate(() => window.dispatchEvent(new Event('nandi:night-pause')));
  await expect.poll(async () => (await minutesRows(page)).length).toBeGreaterThan(0);
});

test('a day the log cannot vouch for is kept as unknown, never as zero', async ({ page }) => {
  await page.clock.install({ time: NOON });
  const log = phoneLog();
  // The phone's log only reaches back three days.
  const start = new Date(NOON.getFullYear(), NOON.getMonth(), NOON.getDate() - 3).getTime();
  await picked(page, { phoneLog: { ...log, logStart: start, events: log.events.filter(event => event.at >= start) } });
  await expect.poll(async () => (await minutesRows(page)).length).toBeGreaterThan(0);
  const rows = await minutesRows(page);
  const old = rows.filter(row => row.id < '2026-11-17');
  expect(old.length).toBeGreaterThan(0);
  expect(old.every(row => row.foregroundMs === null && !!row.reason)).toBe(true);
});

test('Stop and delete asks once, deletes every row, and stays off until turned on again', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.install({ time: NOON });
  await picked(page, { phoneLog: phoneLog() });
  await expect.poll(async () => (await minutesRows(page)).length).toBeGreaterThan(0);
  await page.goto('/?e2e#you/settings');
  const record = page.getByRole('region', { name: 'Daily minutes record' });
  await record.getByRole('button', { name: 'Stop and delete the record' }).click();
  await expect(record).toContainText("Delete the record? This can’t be undone.");
  await record.getByRole('button', { name: 'Keep it' }).click();
  expect((await minutesRows(page)).length).toBeGreaterThan(0);
  await record.getByRole('button', { name: 'Stop and delete the record' }).click();
  await record.getByRole('button', { name: 'Delete it' }).click();
  await expect(record.getByRole('status')).toHaveText('Record deleted. Nothing more is kept.');
  await expect(record).toContainText('Daily minutes record is off.');
  await expect(record).not.toContainText('To end it');
  expect(await minutesRows(page)).toEqual([]);
  await page.clock.fastForward('11:00');
  await page.evaluate(() => window.dispatchEvent(new Event('nandi:night-pause')));
  await page.waitForTimeout(500);
  expect(await minutesRows(page)).toEqual([]);
  await record.getByRole('button', { name: 'Keep a record again' }).click();
  await expect(record).toContainText('Keeping a daily minutes record on this phone');
});

test('the Settings line reads at 200% text without spilling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.install({ time: NOON });
  await picked(page, { phoneLog: phoneLog() });
  await page.goto('/?e2e#you/settings');
  const record = page.getByRole('region', { name: 'Daily minutes record' });
  await expect(record).toBeVisible();
  await textAt200(page);
  await record.getByText("What’s kept").click();
  // The help text follows the text size too (rem), not a fixed 13px. Polled with the 200% style re-applied, since the
  // first open's offline-ready reload can drop it after textAt200 returns (a 13px read in gate-snack2).
  await expect.poll(async () => {
    await textAt200(page);
    return record.locator('.setting-help').first().evaluate(node => parseFloat(getComputedStyle(node).fontSize));
  }).toBeGreaterThanOrEqual(26);
  expect(await record.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  for (const target of await record.getByRole('button').all()) expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});
