import { expect, test } from '@playwright/test';

test('finishing a repeating task plans the next one at the same time', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-23T08:00:00') });
  await page.goto('/#plan');
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').click();
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Morning walk');
  await page.getByLabel('Minutes').fill('20');
  await page.getByLabel('Repeat').selectOption('weekdays');
  await page.getByLabel('Start time').fill('2026-10-23T09:00');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  const today = page.getByRole('region', { name: 'Today' });
  await expect(today).toContainText('repeats on weekdays');
  await today.getByRole('button', { name: 'Done', exact: true }).first().click();
  await expect(today.locator('.done-mark')).toHaveCount(1);
  const next = await page.evaluate(async () => {
    const open = indexedDB.open('nandi');
    const db = await new Promise<IDBDatabase>(resolve => { open.onsuccess = () => resolve(open.result); });
    const rows = await new Promise<{ title: string; dayKey: string; status: string; scheduledStart?: number; repeatOf?: string }[]>(resolve => { const request = db.transaction('tasks').objectStore('tasks').getAll(); request.onsuccess = () => resolve(request.result); });
    return rows.filter(row => row.repeatOf).map(row => ({ title: row.title, dayKey: row.dayKey, status: row.status, time: new Date(row.scheduledStart!).toTimeString().slice(0, 5) }));
  });
  // Friday's walk is done, so the next one waits for Monday at 09:00.
  expect(next).toEqual([{ title: 'Morning walk', dayKey: '2026-10-26', status: 'planned', time: '09:00' }]);
});
