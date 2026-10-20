import { expect, test, type Page } from '@playwright/test';

async function seedTasks(page: Page, minutes: number[]) {
  await page.evaluate(async list => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('tasks', 'readwrite');
      list.forEach((estimateMin, index) => transaction.objectStore('tasks').put({
        id: `busy-${index}`, title: `Busy block ${index + 1}`, status: 'planned', dayKey: '2026-10-20', size: 'L', estimateMin,
        category: 'general', mustOrCould: 'could', scheduledStart: null, scheduledEnd: null, postponeCount: 0,
        updatedAt: Date.now(), deleted: 0, deviceId: 'adaptive-e2e',
      }));
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, minutes);
  await page.reload();
}

test('a busy day starts the night later and can be undone for today', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto('/#plan');
  await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
  await seedTasks(page, [90, 90, 90]);
  const line = page.locator('.busy-day');
  await expect(line).toContainText('tonight starts 30 min later');
  await line.getByRole('button', { name: 'Keep my usual time' }).click();
  await expect(line).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.busy-day')).toHaveCount(0);
});

test('interests are chosen in Settings and survive reload', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto('/#you/settings');
  const group = page.getByRole('region', { name: 'What you enjoy' });
  await group.getByRole('button', { name: 'Anime and shows' }).click();
  await group.getByRole('button', { name: 'Gym' }).click();
  await expect(group.getByRole('button', { name: 'Anime and shows' })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByRole('region', { name: 'What you enjoy' }).getByRole('button', { name: 'Gym' })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});
