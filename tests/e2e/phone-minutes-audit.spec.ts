import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// Spec 46b: the owner's phone minutes audit. It sits behind the owner PIN inside the owner panel (no route of its own),
// lists the last 30 finished days with unknown reasons, warns before the CSV is made, and gives a fail-closed pass.
const NOON = new Date('2026-11-20T12:00:00');
const IG = 'com.instagram.android';
const CATALOG = ['com.google.android.youtube', 'com.snapchat.android', 'com.android.chrome', 'org.mozilla.firefox', 'com.microsoft.emmx', 'com.brave.browser',
  'com.sec.android.app.sbrowser', 'com.opera.browser', 'com.opera.mini.native', 'in.mohalla.video', 'com.eterno.shortvideos', 'in.mohalla.sharechat'];

/** Instagram picked, and `days` finished days of rows before NOON: Instagram 12 min, YouTube 5, the rest 0; 18 Nov unknown. */
async function seed(page: Page, days: number) {
  await page.goto('/?e2e#you');
  await expect(page.getByText(/XP in all$/)).toBeVisible();
  await page.evaluate(async ([days, ig, catalog, noon]) => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    const setId = `scroll-2026-11-01|${ig}`;
    await new Promise<void>(resolve => {
      const transaction = database.transaction(['settings', 'phoneUsageMinutes'], 'readwrite');
      transaction.objectStore('settings').put({ key: 'night.pause.apps', value: [ig], updatedAt: 1, deleted: 0, deviceId: 'e2e' });
      const store = transaction.objectStore('phoneUsageMinutes');
      const today = new Date(noon);
      for (let back = days; back >= 1; back -= 1) {
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back + 1);
        const dayKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
        for (const packageName of [ig, ...catalog]) {
          const gap = dayKey === '2026-11-18' && packageName === ig;
          store.put({ id: `${dayKey}|${packageName}`, dayKey, packageName, group: packageName === ig ? 'picked' : 'substitute',
            foregroundMs: gap ? null : packageName === ig ? 12 * 60_000 : packageName === catalog[0] ? 5 * 60_000 : 0, ...(gap ? { reason: 'event_gap' } : {}),
            source: 'usage-events', fromMs: start.getTime(), toMs: end.getTime(), offsetStartMin: 330, offsetEndMin: 330, catalogId: 'scroll-2026-11-01', setId,
            installed: packageName === ig, crossCheckMs: null, measuredAt: end.getTime() + 60_000, updatedAt: end.getTime() + 60_000, deleted: 0, deviceId: 'e2e' });
        }
      }
      transaction.oncomplete = () => resolve();
    });
    database.close();
  }, [days, IG, CATALOG, NOON.getTime()] as const);
  // Dexie's live queries do not see a raw IndexedDB write; a reload makes the app read it.
  await page.reload();
}

async function openAudit(page: Page) {
  await page.goto('/?e2e#you/owner');
  const entry = page.getByRole('button', { name: 'Phone minutes audit' });
  // The PIN is asked once per session; after that the panel opens straight away.
  await expect(page.getByLabel('PIN').or(entry)).toBeVisible();
  if (await page.getByLabel('PIN').isVisible()) {
    await page.getByLabel('PIN').fill('2468');
    await page.getByRole('button', { name: /Save PIN|Open/ }).click();
  }
  await entry.click();
  return page.getByRole('region', { name: 'Phone minutes audit' });
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.install({ time: NOON });
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('behind the owner PIN only: 30 finished days, newest first, with the unknown day’s reason in plain words', async ({ page }) => {
  await seed(page, 30);
  // No route reaches it without the PIN.
  for (const route of ['/?e2e#you/owner/audit', '/?e2e#you/owner']) {
    await page.goto(route);
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.getByRole('region', { name: 'Phone minutes audit' })).toHaveCount(0);
  }
  await expect(page.getByRole('heading', { name: 'Set an owner PIN' })).toBeVisible();
  const audit = await openAudit(page);
  await expect(audit.getByRole('heading', { name: 'Phone minutes audit' })).toBeVisible();
  await expect(audit).toContainText('29 complete · 1 with unknowns · 0 not recorded');
  await expect(audit).toContainText('Not audited yet.');
  const days = audit.locator('.phone-audit-days > li');
  await expect(days).toHaveCount(30);
  await expect(days.first()).toContainText('Thu 2026-11-19');
  await expect(days.first()).toContainText('Picked 12 min · Similar apps 5 min');
  const gap = days.filter({ hasText: '2026-11-18' });
  await expect(gap).toContainText('Picked unknown · Similar apps 5 min');
  await expect(gap).toContainText('Unknown: the log went quiet with an app open');
  await gap.locator('summary').click();
  await expect(gap).toContainText(`${IG} (picked): unknown, the log went quiet with an app open`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await audit.getByRole('button', { name: 'Back to owner numbers' }).click();
  await expect(page.getByRole('heading', { name: 'How NANDI is doing' })).toBeVisible();
});

test('the CSV is made only after the private-data warning, and holds stored rows, not raw events', async ({ page }) => {
  await seed(page, 30);
  const audit = await openAudit(page);
  let downloads = 0;
  page.on('download', () => { downloads += 1; });
  await audit.getByRole('button', { name: 'Export 30-day audit CSV' }).click();
  const warning = audit.getByRole('group', { name: 'Before the file is made' });
  await expect(warning).toContainText('private app-use history');
  await warning.getByRole('button', { name: 'Don’t make it' }).click();
  await expect(warning).toHaveCount(0);
  expect(downloads).toBe(0);
  await audit.getByRole('button', { name: 'Export 30-day audit CSV' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), warning.getByRole('button', { name: 'Make the file' }).click()]);
  expect(download.suggestedFilename()).toBe('nandi-phone-audit-2026-11-20.csv');
  const csv = await readFile((await download.path())!, 'utf8');
  const lines = csv.trimEnd().split('\n');
  expect(lines[0]).toBe('field,value');
  expect(lines).toContain('audit,Not audited yet.');
  expect(lines.find(line => line.startsWith(`2026-11-19,${IG},`))?.split(',').slice(0, 5)).toEqual(['2026-11-19', IG, 'picked', '12', '720000']);
  expect(lines.find(line => line.startsWith(`2026-11-18,${IG},`))?.split(',').slice(0, 6)).toEqual(['2026-11-18', IG, 'picked', '', '', 'event_gap']);
  expect(lines.filter(line => /^2026-1\d-\d\d,/.test(line))).toHaveLength(30 * 13);
  expect(csv).not.toMatch(/\b(fg|bg|ACTIVITY_RESUMED|SCREEN_\w+|events?)\b/);
  await expect(audit.getByRole('status')).toHaveText('Audit file made. Delete it once you have compared the days.');
});

test('the pass needs 30 recorded days, is given only on confirm, and stops holding when the picked apps change', async ({ page }) => {
  await seed(page, 29);
  let audit = await openAudit(page);
  await expect(audit).toContainText('28 complete · 1 with unknowns · 1 not recorded');
  await expect(audit.getByRole('button', { name: 'Mark the audit passed' })).toBeDisabled();
  await expect(audit).toContainText('needs 30 recorded days in a row');
  await seed(page, 30);
  audit = await openAudit(page);
  await audit.getByRole('button', { name: 'Mark the audit passed' }).click();
  const confirm = audit.getByRole('group', { name: 'Before marking the audit passed' });
  await expect(confirm).toContainText('at least 25 of the 30 days');
  await expect(confirm).toContainText('1 days here have unknowns');
  await confirm.getByRole('button', { name: 'Mark passed' }).click();
  await expect(audit).toContainText('Audit passed on 2026-11-20 for 2026-10-21 to 2026-11-19.');
  await expect(audit.getByRole('button', { name: 'Clear the audit pass' })).toBeVisible();
  // A different set of picked apps voids it (fail-closed).
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>(resolve => {
      const transaction = database.transaction('settings', 'readwrite');
      transaction.objectStore('settings').put({ key: 'night.pause.apps', value: ['com.instagram.android', 'com.whatsapp'], updatedAt: 2, deleted: 0, deviceId: 'e2e' });
      transaction.oncomplete = () => resolve();
    });
    database.close();
  });
  await page.reload();
  await page.getByRole('button', { name: 'Phone minutes audit' }).click();
  await expect(page.getByRole('region', { name: 'Phone minutes audit' })).toContainText('The audit pass no longer holds: the picked apps changed.');
});

test('reads at 200% text without spilling', async ({ page }) => {
  await seed(page, 30);
  const audit = await openAudit(page);
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  // The audit's small text follows the phone's text size too (the app's .small is a fixed 13px).
  expect(await audit.locator('.small').first().evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(26);
  await audit.locator('.phone-audit-days > li').filter({ hasText: '2026-11-18' }).locator('summary').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  for (const target of await audit.getByRole('button').all()) expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});
