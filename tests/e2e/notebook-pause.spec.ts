import { expect, test, type Page } from '@playwright/test';
import { textAt200 } from './helpers/text';

// Spec 45c: the Pause card is a paper slip. Jenil 14 Nov: three ways on it, a filled "Start the 2 minutes", "Open <app>
// anyway" and a small "Not now" (to NANDI's Courtyard); "I did it" comes in the 2 minutes. Ledger outcomes and pay are
// spec 39b's. The phone's side is the e2e stand-in in platform/nightPause.ts.
const NOON = new Date('2026-11-04T12:00:00');
const slip = (page: Page) => page.getByRole('dialog', { name: 'Pause card' });
const did = (page: Page) => page.evaluate(() => (JSON.parse(sessionStorage.getItem('nandi.e2ePause') ?? '{}') as { did?: string[] }).did ?? []);
const attempts = (page: Page) => page.evaluate(async () => {
  const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
  const rows = await new Promise<{ mode: string; inputs: { outcome: string } }[]>(resolve => { const request = database.transaction('ledger').objectStore('ledger').getAll(); request.onsuccess = () => resolve(request.result); });
  database.close();
  return rows.filter(row => row.mode === 'pause').map(row => row.inputs.outcome);
});
const totalXp = async (page: Page) => {
  await page.goto('/?e2e#you');
  return Number((await page.getByText(/^[\d,]+\sXP in all$/).innerText()).replace(/[^\d]/g, ''));
};

/** The card on, Instagram picked, the line "do 10 squats", every open: written as the setup would. */
async function cardOn(page: Page) {
  await page.goto('/?e2e#you');
  await expect(page.getByText(/XP in all$/)).toBeVisible();
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>(resolve => {
      const transaction = database.transaction('settings', 'readwrite');
      for (const [key, value] of [['pause.card.on', true], ['pause.act', 'do 10 squats'], ['night.pause.apps', ['com.instagram.android']], ['night.pause.dayMode', 'open']] as const) transaction.objectStore('settings').put({ key, value, updatedAt: 1, deleted: 0, deviceId: 'e2e' });
      transaction.oncomplete = () => resolve();
    });
    database.close();
    sessionStorage.setItem('nandi.e2ePause', '{}');
  });
  await page.reload();
}
async function phoneOpens(page: Page) {
  await page.evaluate(() => {
    const raw = sessionStorage.getItem('nandi.e2ePause');
    sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ ...(raw ? JSON.parse(raw) : {}), pendingPackage: 'com.instagram.android', pendingReason: 'open' }));
    window.dispatchEvent(new Event('nandi:night-pause'));
  });
  await expect(slip(page)).toBeVisible();
}

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('the slip (Jenil 14 Nov): the plan, a filled Start, Open anyway and a small Not now, each a 44 px target; it fits the screen, and at 200% every way stays on it', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.install({ time: NOON });
  await cardOn(page);
  await phoneOpens(page);
  await expect(slip(page).getByRole('heading')).toHaveText("If I open Instagram, I’ll do 10 squats first.");
  await expect(slip(page).getByRole('button')).toHaveText([/^Start the 2\s+minutes$/, 'Open Instagram anyway', 'Not now']);
  const start = slip(page).getByRole('button', { name: 'Start the 2 minutes: do 10 squats' });
  // Start is the one filled button, full width.
  await expect(start).toHaveClass(/pause-do/);
  const card = (await slip(page).locator('.pause-card').boundingBox())!;
  expect((await start.boundingBox())!.width).toBeGreaterThan(card.width - 64);
  for (const target of await slip(page).getByRole('button').all()) expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  // E12: the slip fits the screen; nothing to scroll at normal text.
  expect(card.y).toBeGreaterThanOrEqual(0);
  expect(card.y + card.height).toBeLessThanOrEqual(800);
  await textAt200(page);
  await expect(slip(page).locator('.pause-card')).toHaveCSS('font-size', '32px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const way of await slip(page).getByRole('button').all()) await expect(way).toBeInViewport({ ratio: 1 });
  await expect(slip(page).locator('.eyebrow')).toBeInViewport();
});

test('after "I did it": act_done, +2 once, and "Back to NANDI" closes on the Courtyard', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await cardOn(page);
  const before = await totalXp(page);
  await phoneOpens(page);
  await expect(slip(page).getByRole('button', { name: 'I did it' })).toHaveCount(0);
  await slip(page).getByRole('button', { name: 'Start the 2 minutes: do 10 squats' }).click();
  await slip(page).getByRole('button', { name: 'I did it' }).click();
  await expect(slip(page).getByRole('heading')).toHaveText('Done: Do 10 squats.');
  await expect(slip(page).locator('.pause-earned')).toHaveText('+2 XP');
  await expect(slip(page)).not.toContainText(/minutes back|time back/);
  await slip(page).getByRole('button', { name: 'Back to NANDI' }).click();
  await expect(slip(page)).toHaveCount(0);
  await expect(page).toHaveURL(/#courtyard$/);
  expect(await did(page)).toEqual(['clear']);
  expect(await attempts(page)).toEqual(['act_done']);
  await expect.poll(() => totalXp(page)).toBe(before + 2);
});

test('"Start the 2 minutes" opens the act with "I did it" at once and the clock only a guide', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await cardOn(page);
  await phoneOpens(page);
  await slip(page).getByRole('button', { name: 'Start the 2 minutes: do 10 squats' }).click();
  await expect(slip(page).getByRole('heading')).toHaveText('Do 10 squats');
  await expect(slip(page).getByRole('timer')).toHaveText('2:00');
  await expect(slip(page).getByRole('button', { name: 'I did it' })).toBeVisible();
  await page.clock.fastForward(15_000);
  await slip(page).getByRole('button', { name: 'I did it' }).click();
  await expect(slip(page).getByRole('heading')).toHaveText('Done: Do 10 squats.');
  await expect(slip(page).locator('.pause-earned')).toHaveText('+2 XP');
  expect(await attempts(page)).toEqual(['act_done']);
});

test('"Open anyway" opens the app; "Not now" lands on NANDI\'s Courtyard (not the phone\'s home) and records backed_out', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await cardOn(page);
  const before = await totalXp(page);
  await phoneOpens(page);
  await slip(page).getByRole('button', { name: 'Open Instagram anyway' }).click();
  // Spec 54: how long (the setup's 10 min chosen) and an optional why, then open.
  await slip(page).getByRole('button', { name: 'Open for 10 min' }).click();
  await expect(slip(page)).toHaveCount(0);
  expect((await did(page)).at(-1)).toBe('open:com.instagram.android:600000');
  await phoneOpens(page);
  await slip(page).getByRole('button', { name: 'Not now' }).click();
  await expect(slip(page)).toHaveCount(0);
  expect((await did(page)).at(-1)).toBe('clear');
  expect(await did(page)).not.toContain('home');
  await expect(page).toHaveURL(/#courtyard$/);
  expect(await attempts(page)).toEqual(['opened_anyway', 'backed_out']);
  expect(await totalXp(page)).toBe(before);
});

test('a phone that opens NANDI for the slip shows the slip, not the opening breath', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await cardOn(page);
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ pendingPackage: 'com.instagram.android', pendingReason: 'open' })));
  await page.goto('/?e2e');
  await expect(slip(page)).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Breathe with the square.' })).toHaveCount(0);
  await expect(slip(page).getByRole('button')).toHaveCount(3); // Jenil 14 Nov: Start, Open anyway, Not now
});
