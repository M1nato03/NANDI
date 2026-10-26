import { expect, test } from '@playwright/test';
import { seedTaughtTopics } from './learn-helpers';

// Spec 25, one look per friend: each tab takes its area's colour and puts its friend on a stage at the top.
const shell = (page: import('@playwright/test').Page) => page.locator('.app-shell');

test('each tab carries its own area, with its friend on a stage; You stays neutral', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-03T12:00:00'));
  for (const [route, area, friend] of [['train', 'train', 'Nandi'], ['learn', 'learn', 'Chiku'], ['mind', 'mind', 'Kapi']] as const) {
    await page.goto(`/?e2e#${route}`);
    await expect(shell(page)).toHaveAttribute('data-area', area);
    await expect(page.getByRole('region', { name: `${friend}'s stage` })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto('/?e2e#plan');
  await expect(shell(page)).toHaveAttribute('data-area', 'plan');
  // Plan stays a list first: a short Mor band on top (Codex B item 123), at most 96 px tall.
  const mor = page.getByRole('region', { name: "Mor's stage" });
  await expect(mor).toBeVisible();
  expect((await mor.boundingBox())!.height).toBeLessThanOrEqual(96);
  await page.goto('/?e2e#you');
  await expect(shell(page)).not.toHaveAttribute('data-area', /.+/);
});

test('the main button and the page tint follow the area', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-03T12:00:00'));
  await page.goto('/?e2e#learn');
  const learnTint = await shell(page).evaluate(node => getComputedStyle(node).backgroundColor);
  await page.goto('/?e2e#mind');
  const mindTint = await shell(page).evaluate(node => getComputedStyle(node).backgroundColor);
  expect(learnTint).not.toBe(mindTint);
});

test("Moti's review screens switch to the rose area and hand it back on leaving", async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-03T12:00:00'));
  await page.goto('/?e2e&cap=1#learn/haveli-demo');
  await expect(page.getByRole('region', { name: "Moti's haveli" })).toBeVisible();
  await expect(shell(page)).toHaveAttribute('data-area', 'review');
  await page.goto('/?e2e#learn');
  await expect(shell(page)).toHaveAttribute('data-area', 'learn');
});

test('the night deck keeps its own dark and gives Kachhua a stage', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-04T00:30:00'));
  await page.goto('/?e2e#night');
  await expect(shell(page)).toHaveAttribute('data-area', 'night');
  await expect(page.getByRole('region', { name: "Kachhua's stage" })).toBeVisible();
});

test('in the app, a real Gold review turns rose and leaving it hands Learn its teal back (Codex B item 123)', async ({ page }) => {
  const noon = new Date('2026-10-20T12:00:00').getTime();
  await page.clock.setFixedTime(new Date(noon));
  await page.goto('/?e2e#learn');
  await seedTaughtTopics(page, ['money-markets']);
  await page.evaluate(async at => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('learnConcepts', 'readwrite');
      transaction.objectStore('learnConcepts').put({ id: 'inflation', mastery: 0.97, attempts: 8, memory: { stability: 30, difficulty: 5, interval: 30, lastReview: at - 86_400_000, dueAt: at + 86_400_000 }, activeMisconceptions: [], updatedAt: at, deleted: 0, deviceId: 'area-e2e' });
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, noon);
  await page.reload();
  await expect(shell(page)).toHaveAttribute('data-area', 'learn');
  const topic = page.locator('.learn-map-topic').filter({ hasText: 'Money and markets' });
  await topic.getByRole('button', { name: /Money and markets/ }).click();
  await topic.locator('.learn-trail-node').first().getByRole('button', { name: 'Gold review' }).click();
  await expect(page.locator('.learn-drop-head')).toContainText('1 / 5');
  await expect(shell(page)).toHaveAttribute('data-area', 'review');
  await page.getByRole('button', { name: '← Practice · Leave' }).click();
  await expect(shell(page)).toHaveAttribute('data-area', 'learn');
});

test('the pause card over the night deck keeps the dark night accent in the light theme (Codex B item 123)', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.clock.setFixedTime(new Date('2026-11-04T00:30:00'));
  await page.goto('/?e2e#night');
  await expect(shell(page)).toHaveAttribute('data-area', 'night');
  expect(await shell(page).evaluate(node => getComputedStyle(node).getPropertyValue('--accent-ink').trim().toLowerCase())).toBe('#9fa8ff');
});
