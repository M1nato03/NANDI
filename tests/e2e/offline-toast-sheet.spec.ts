import { expect, test } from '@playwright/test';
import { openMore } from './helpers/plan';

for (const wait of [10_000, 60_001]) {
  test(`offline-ready notice waits for a task sheet (${wait} ms)`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-05T12:00:00') });
    await page.goto('/?e2e#plan');
    await openMore(page);
    const input = page.getByPlaceholder('Add a task, e.g. call bank 15m');
    await input.click();
    await input.fill('Read a page');
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await page.getByRole('region', { name: 'Today', exact: true }).locator('.task-title-button').filter({ hasText: 'Read a page' }).click();
    const sheet = page.getByRole('dialog', { name: 'Task detail Read a page' });
    await expect(sheet).toBeVisible();
    // Clear the first-install marker, then use the guarded hook to run the real once-only path.
    await page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('nandi');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction('settings', 'readwrite');
        transaction.objectStore('settings').delete('offlineReadyShown');
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      database.close();
      window.dispatchEvent(new Event('nandi:e2e-offline-ready'));
    });
    // The marker proves the hook fired before advancing its deadline.
    await expect.poll(() => page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>(resolve => {
        const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result);
      });
      const saved = await new Promise<boolean>(resolve => {
        const request = database.transaction('settings').objectStore('settings').get('offlineReadyShown');
        request.onsuccess = () => resolve(request.result?.value === true);
      });
      database.close();
      return saved;
    })).toBe(true);
    const toast = page.getByRole('status', { name: 'Offline ready' });
    await expect(toast).not.toBeVisible();
    await page.clock.runFor(wait);
    await expect(toast).not.toBeVisible();
    await sheet.getByRole('button', { name: 'Close', exact: true }).click();
    if (wait > 60_000) {
      await expect(toast).not.toBeVisible();
      return;
    }
    await expect(toast).toBeVisible();
    const [notice, tabs] = [await toast.boundingBox(), await page.locator('.tabbar').boundingBox()];
    expect(notice && tabs && notice.y + notice.height <= tabs.y).toBeTruthy();
    // Spec 571 E10: it keeps its place at the top of the page flow (shell.spec: it never covers a button).
    await page.clock.runFor(4000);
    await expect(toast).not.toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event('nandi:e2e-offline-ready')));
    await expect(toast).not.toBeVisible();
  });
}
