import { expect, test } from '@playwright/test';

test('You shows the six-stat hexagon once there is a week of use, and not before', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00'));
  await page.goto('/#you');
  await expect(page.getByRole('heading', { name: 'You', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Your six stats' })).toHaveCount(0);
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('ledger', 'readwrite');
      const store = transaction.objectStore('ledger');
      const row = (id: string, dayKey: string, mode: string, kind: string, inputs: Record<string, unknown> = {}) => ({ id, dayKey, mode, kind, refId: id, inputs, updatedAt: Date.now(), deleted: 0, deviceId: 'hex-e2e' });
      for (let back = 0; back < 10; back++) {
        const dayKey = `2026-10-${String(21 - back).padStart(2, '0')}`;
        store.put(row(`hex-lesson:${back}`, dayKey, 'mind', 'learn-lesson'));
        if (back % 2 === 0) store.put(row(`hex-lo:${back}`, dayKey, 'bonuses', 'lightsout', { metTarget: true }));
      }
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });
  await page.reload();
  const card = page.getByRole('region', { name: 'Your six stats' });
  await expect(card).toBeVisible();
  await expect(card.getByText('Last 10 days')).toBeVisible();
  await expect(card.getByText('Wisdom · 100')).toBeVisible();
  await expect(card.getByText('Discipline · 35')).toBeVisible();
  await expect(card.getByText('Drive · not yet')).toBeVisible();
  const box = await card.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
});
