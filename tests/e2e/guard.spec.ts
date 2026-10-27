import { expect, test, type Page } from '@playwright/test';
import { openMore } from './helpers/plan';

async function readLog(page: Page, dayKey: string) {
  return page.evaluate(async key => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    const row = await new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
      const request = database.transaction('dailyLog').objectStore('dailyLog').get(key);
      request.onsuccess = () => resolve(request.result as Record<string, unknown> | undefined); request.onerror = () => reject(request.error);
    });
    database.close();
    return row;
  }, dayKey);
}

test('the weekly agency check comes to Plan on Sunday, saves in one tap each, and shows in the weekly review', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-25T12:00:00'));
  await page.goto('/#plan');
  await openMore(page);
  const check = page.getByRole('region', { name: 'Time in NANDI' });
  await expect(check).toBeVisible();
  await check.getByRole('button', { name: '4 of 5' }).click();
  await expect(check.getByRole('button', { name: '4 of 5' })).toHaveAttribute('aria-pressed', 'true');
  await expect(check).toBeVisible();
  await check.getByRole('button', { name: 'No', exact: true }).click();
  await expect(check.getByRole('status')).toHaveText('Saved for this week. Thank you.');
  expect(await readLog(page, '2026-10-25')).toMatchObject({ agency1to5: 4, agencyOpenedInstead: false });
  await page.goto('/#plan/review');
  await expect(page.getByRole('region', { name: 'Time in NANDI' }).getByRole('button', { name: '4 of 5' })).toHaveAttribute('aria-pressed', 'true');
});

test('Plan does not ask on other days', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-22T12:00:00'));
  await page.goto('/#plan');
  await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
  await openMore(page);
  await expect(page.getByRole('region', { name: 'Time in NANDI' })).toHaveCount(0);
});

test('time on screen is written as app minutes, and a running focus timer is left out', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-22T12:00:00') });
  await page.goto('/#plan');
  await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
  // Minutes are written in fives (and on leaving the app), so each write wakes the screens less often.
  await page.clock.runFor(2 * 60_000 + 20_000);
  expect((await readLog(page, '2026-10-22'))?.appMinutes ?? 0).toBe(0);
  await page.clock.runFor(3 * 60_000);
  await expect.poll(async () => (await readLog(page, '2026-10-22'))?.appMinutes).toBe(5);
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('focus', 'readwrite');
      transaction.objectStore('focus').put({ id: 'guard-focus', taskId: 'none', startedAt: Date.now(), updatedAt: Date.now(), deleted: 0, deviceId: 'guard-e2e' });
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });
  await page.clock.runFor(6 * 60_000);
  expect((await readLog(page, '2026-10-22'))?.appMinutes).toBe(5);
});
