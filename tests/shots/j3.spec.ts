import { mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// J3 (Jenil 13 Nov "only keep one"): the Yatra tab's first view, light and dark, and Mor mid-reaction after adding a task.
const OUT = process.env.SHOTS_J3_DIR ?? 'D:/nandi-gate-logs/shots-j3';
const TAG = process.env.SHOTS_J3_TAG ?? 'after';
mkdirSync(OUT, { recursive: true });

for (const theme of ['light', 'dark'] as const) test(`J3 the Yatra tab's first view (${theme})`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'no-preference' });
  await page.clock.setFixedTime(new Date('2026-11-13T12:00:00'));
  await page.goto('/?e2e#plan');
  await page.evaluate(async value => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('settings', 'readwrite');
      transaction.objectStore('settings').put({ key: 'theme', value, updatedAt: 1, deleted: 0, deviceId: 'j3' });
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, theme);
  await page.reload();
  await expect(page.locator('main .trek-strip .trek-scene')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/j3-${TAG}-yatra-first-${theme}.png` });
  await page.getByLabel('Add a task').fill('Water the plants');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.locator('.mor-friend[data-moment="add"]')).toHaveCount(1);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/j3-${TAG}-mor-reacts-add-${theme}.png` });
});
