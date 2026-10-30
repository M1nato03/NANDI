import { expect, test, type Page } from '@playwright/test';

// Spec 38: on the phone, Calm's sound, bells and clock live in a native player that keeps going with the screen off.
// The phone's player is the e2e stand-in in platform/calmPlayback.ts: sessionStorage 'nandi.e2eCalm' holds the sit
// and its dated journal. Only playing spans count.
const NOON = new Date('2026-10-28T12:00:00');
const MIN = 60_000;

const calmRows = (page: Page) => page.evaluate(async () => {
  const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const rows = await new Promise<{ mode: string; inputs: Record<string, unknown> }[]>((resolve, reject) => { const request = database.transaction('ledger').objectStore('ledger').getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  database.close();
  return rows.filter(row => row.mode === 'calm').map(row => row.inputs);
});
/** The phone's player notes a dated event (a call pauses the sit, it resumes after). */
const phone = (page: Page, type: 'paused' | 'resumed', reason?: string) => page.evaluate(({ type, reason }) => {
  const fake = JSON.parse(sessionStorage.getItem('nandi.e2eCalm')!);
  fake.sit.journal.push({ type, at: Date.now(), ...(reason ? { reason } : {}) });
  fake.sit.status = type === 'paused' ? 'paused' : 'playing';
  if (reason) fake.sit.pausedFor = reason;
  sessionStorage.setItem('nandi.e2eCalm', JSON.stringify(fake));
}, { type, reason });

async function openCalm(page: Page) {
  await page.clock.install({ time: NOON });
  await page.goto('/#plan');
  await page.evaluate(() => sessionStorage.setItem('nandi.e2eCalm', JSON.stringify({ on: true })));
  await page.goto('/#yatra/calm');
  await expect(page.getByRole('heading', { name: 'Breathe with Kachhua' })).toBeVisible();
}

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('the phone plays the sit; a call pauses it and its minutes never count', async ({ page }) => {
  await openCalm(page);
  await page.getByRole('button', { name: 'River', exact: true }).click();
  await expect(page.locator('.calm-under')).toHaveText('You can lock your phone. The sound and bells keep playing.');
  await page.getByRole('button', { name: 'Quiet', exact: true }).click();
  await page.getByRole('button', { name: '20 min', exact: true }).click();
  await page.locator('.calm-start').click();
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  await page.clock.fastForward(MIN);
  await phone(page, 'paused', 'call');
  await expect(page.getByText('Paused for a call. The clock waits.')).toBeVisible();
  await page.clock.fastForward(5 * MIN);
  await phone(page, 'resumed');
  await page.clock.fastForward(MIN);
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  const dim = page.locator('.calm-dim');
  if (await dim.count()) await dim.click();
  await page.getByRole('button', { name: 'Stop' }).click();
  // 1 minute, a 5-minute call, 1 more minute: 2 minutes sat.
  await expect(page.locator('.calm-phase')).toHaveText('2 quiet minutes, together.');
  expect(await calmRows(page)).toEqual([{ minutes: 2, way: 'quiet' }]);
});

test('a timed sit that ends while NANDI is away is saved on return, once', async ({ page }) => {
  await openCalm(page);
  await page.getByRole('button', { name: 'River', exact: true }).click();
  await page.getByRole('button', { name: 'Quiet', exact: true }).click();
  await page.getByRole('button', { name: '3 min', exact: true }).click();
  await page.locator('.calm-start').click();
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  // Away from Calm (the phone locked, another screen): the player ends the sit at its length on its own.
  await page.evaluate(() => { location.hash = '#plan'; });
  await page.clock.fastForward(4 * MIN);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect.poll(() => calmRows(page)).toEqual([{ minutes: 3, way: 'quiet' }]);
  await page.evaluate(() => { location.hash = '#yatra/calm'; });
  await expect(page.locator('.calm-start')).toBeVisible();
  expect(await calmRows(page)).toEqual([{ minutes: 3, way: 'quiet' }]);
});

test('no sound and no interval bells: nothing to play, so the sit stays in the app (no silent media service)', async ({ page }) => {
  await openCalm(page);
  await page.getByRole('button', { name: 'None', exact: true }).click();
  await expect(page.locator('.calm-under')).not.toContainText('lock your phone');
  await page.getByRole('button', { name: '20 min', exact: true }).click();
  await expect(page.locator('.calm-under')).toHaveText('Keep NANDI open. The sound and bells play here.');
  await page.locator('.calm-start').click();
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  // The phone's player was never started.
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('nandi.e2eCalm')!).sit)).toBeUndefined();
  await expect(page.getByRole('button', { name: 'Pause' })).toHaveCount(0);
});
