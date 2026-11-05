import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { seedRecapWeek } from './recap-seed';

// Spec 53: the week as a receipt. Home offers it from Sunday 18:00 through Monday; Share and Save image both run;
// after shutdown it hides; the image is story size and its layout fits with the real fonts.
const link = (page: Page) => page.getByRole('button', { name: "Your week's receipt is ready" });

async function homeAt(page: Page, time: string) {
  await page.clock.setFixedTime(new Date(time));
  await page.goto('/?e2e#yatra');
  await page.reload();
  await toHome(page);
}

// Late in the evening the night deck can open over Home (after shutdown it may, on any reload); Home is one tap behind it.
async function toHome(page: Page) {
  const deck = page.getByRole('button', { name: 'Leave night deck' });
  await expect(page.locator('.next-move-go').or(deck).first()).toBeVisible();
  if (await deck.isVisible()) { await deck.click(); await page.getByRole('link', { name: 'Yatra' }).click(); }
  await expect(page.locator('.next-move-go')).toBeVisible();
}

async function setting(page: Page, key: string, value: unknown) {
  await page.evaluate(async ([name, saved]) => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>(resolve => { const transaction = database.transaction('settings', 'readwrite'); transaction.objectStore('settings').put({ key: name, value: saved, updatedAt: 1, deleted: 0, deviceId: 'receipt' }); transaction.oncomplete = () => resolve(); });
    database.close();
  }, [key, value] as const);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
  });
});

test('Home offers the receipt from Sunday 18:05 through Monday 23:59, not on Tuesday or before Sunday 18:00', async ({ page }) => {
  await homeAt(page, '2026-11-08T18:05:00');
  await seedRecapWeek(page, '2026-11-05');
  await expect(link(page)).toBeVisible();
  // The one next move stays the first thing under the camp.
  const move = await page.locator('.next-move').boundingBox();
  const offer = await link(page).boundingBox();
  expect(offer!.y).toBeGreaterThan(move!.y);
  // Spec 19 wins over the window: with the default shutdown sharing has closed before 23:59, so a late sleeper's Monday
  // (shutdown 02:00, bedtime 03:30) shows that the window itself still runs to the end of Monday.
  await setting(page, 'planner.bedtime', '03:30');
  await setting(page, 'planner.shutdown', '02:00');
  await homeAt(page, '2026-11-09T23:59:00');
  await expect(link(page)).toBeVisible();
  await homeAt(page, '2026-11-10T12:00:00');
  await expect(page.locator('.next-move')).toBeVisible();
  await expect(link(page)).toHaveCount(0);
  await homeAt(page, '2026-11-08T17:55:00');
  await expect(link(page)).toHaveCount(0);
});

test('Share and Save image both run, and the image is 1080×1920', async ({ page }) => {
  await homeAt(page, '2026-11-09T12:00:00');
  await seedRecapWeek(page, '2026-11-05');
  await link(page).click();
  const sheet = page.getByRole('dialog', { name: "Your week's receipt" });
  // Monday: last week has closed, so no "so far".
  await expect(sheet.getByRole('img')).toHaveAttribute('alt', 'Receipt, week of 2–8 Nov: Workouts 1, Tasks done 1.', { timeout: 20_000 });
  const saved = page.waitForEvent('download');
  await sheet.getByRole('button', { name: 'Save image' }).click();
  const file = await saved;
  expect(file.suggestedFilename()).toBe('nandi-receipt-2026-11-02.png');
  const png = readFileSync(await file.path());
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1080, 1920]);
  await expect(page.getByRole('status').filter({ hasText: 'Image saved.' })).toBeVisible();
  await link(page).click();
  const shared = page.waitForEvent('download');
  await page.getByRole('dialog', { name: "Your week's receipt" }).getByRole('button', { name: 'Share' }).click();
  expect((await shared).suggestedFilename()).toBe('nandi-receipt-2026-11-02.png');
});

test('after shutdown the receipt hides (spec 19)', async ({ page }) => {
  await homeAt(page, '2026-11-08T20:30:00');
  await seedRecapWeek(page, '2026-11-05');
  await expect(link(page)).toBeVisible();
  await setting(page, 'planner.bedtime', '20:00');
  await page.reload();
  await toHome(page);
  await expect(link(page)).toHaveCount(0);
});

test('with the real fonts nothing on the receipt is clipped or overlaps: a full, a two-line and a long-number week', async ({ page }) => {
  await homeAt(page, '2026-11-10T12:00:00');
  await page.waitForFunction(() => Boolean(window.__nandiReceiptTest));
  const base = { from: '2026-11-02', to: '2026-11-09', tasks: 0, focusMinutes: 0, longestFocusMinutes: 0, workouts: 0, sideQuests: 0, concepts: 0, nights: 0, chapters: 0, realMs: 0 };
  const weeks = [
    { ...base, chapters: 2, concepts: 9, workouts: 3, focusMinutes: 250, tasks: 11, nights: 4, sideQuests: 1, longestFocusMinutes: 52, realMs: 400 * 60_000 },
    { ...base, tasks: 2, workouts: 1, realMs: 20 * 60_000 },
    { ...base, chapters: 14, concepts: 128, workouts: 12, focusMinutes: 750, tasks: 312, nights: 7, longestFocusMinutes: 185, realMs: 9_999 * 60_000 },
  ];
  for (const week of weeks) {
    // Checked with the open-week subline too, the longest one.
    for (const now of [undefined, new Date('2026-11-05T12:00:00').getTime()]) {
      expect(await page.evaluate(([data, at]) => window.__nandiReceiptTest!.problems(data, at), [week, now] as const)).toEqual([]);
    }
  }
});
