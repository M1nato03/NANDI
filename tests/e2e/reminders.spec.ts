import { expect, test } from '@playwright/test';
import { openMore } from './helpers/plan';

// Spec 660 §3.4 (jenil-0b F4): Plan's undated Reminders fold into Mor's list as Later items. Each open reminder becomes
// one Later task (fixed id, so it is made once); finishing one lights nothing and pays nothing, as reminders never did.
// The originals stay read-only in Settings › Reminders until "Delete old reminders".
test('old reminders become Later tasks once, pay nothing when done, and the originals can be deleted in Settings', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-20T12:00:00') });
  await page.goto('/?e2e#plan');
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>(resolve => {
      const tx = database.transaction('settings', 'readwrite');
      tx.objectStore('settings').put({ key: 'plan.reminders', value: [
        { id: 'r1', text: 'buy a notebook', createdAt: new Date('2026-10-18T10:00:00').getTime() },
        { id: 'r2', text: 'call Nani', createdAt: new Date('2026-10-19T10:00:00').getTime() },
        { id: 'r3', text: 'old one', createdAt: new Date('2026-10-17T10:00:00').getTime(), doneAt: new Date('2026-10-19T10:00:00').getTime() },
      ], updatedAt: 1, deleted: 0, deviceId: 'old-build' });
      tx.oncomplete = () => resolve();
    });
    database.close();
  });
  await page.reload();
  // No Reminders list on Plan any more; the open lines are in Later.
  await openMore(page);
  await expect(page.getByRole('region', { name: 'Reminders' })).toHaveCount(0);
  const later = page.getByRole('region', { name: 'Later', exact: true });
  await expect(later).toContainText('buy a notebook');
  await expect(later).toContainText('call Nani');
  await expect(later).not.toContainText('old one');
  // A reload runs the fold again and makes nothing twice.
  await page.reload();
  await expect(page.getByRole('region', { name: 'Later', exact: true }).getByText('call Nani')).toHaveCount(1);
  // A reminder is not a planned task: the Yatra ring stays unlit.
  await expect(page.getByRole('button', { name: 'Yatra: keep one promise.' })).toBeVisible();
  // Settings › Reminders keeps the originals, read-only, until deleted.
  await page.goto('/?e2e#you/settings');
  const old = page.getByTestId('old-reminders');
  await expect(old).toContainText('buy a notebook');
  await expect(old).toContainText('old one · done');
  await old.getByRole('button', { name: 'Delete old reminders' }).click();
  await expect(page.getByTestId('old-reminders')).toHaveCount(0);
  await page.goto('/?e2e#plan');
  await openMore(page);
  await expect(page.getByRole('region', { name: 'Later', exact: true })).toContainText('call Nani');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
