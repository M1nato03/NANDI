import { expect, test, type Page } from '@playwright/test';
import { openMore } from './helpers/plan';

// Item 83, carried into spec 27: moves are never refused. Shutdown's "Move to tomorrow" moves the task at once, the
// detail sheet's "Another day…" moves to a picked day and says how the 4 am line works, and Pick one Must places
// the chosen task without asking for anything first. (Moving a task in focus: mor-list.spec.ts.)
const add = async (page: Page, title: string) => {
  await page.getByLabel('Add a task').fill(title);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Today', exact: true })).toContainText(title);
};
const readTask = (page: Page, title: string) => page.evaluate(async name => {
  const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const rows = await new Promise<Record<string, unknown>[]>(resolve => { const request = database.transaction('tasks').objectStore('tasks').getAll(); request.onsuccess = () => resolve(request.result); });
  database.close();
  return rows.find(row => row.title === name);
}, title);

test("Shutdown's Move to tomorrow moves the task to tomorrow 9:00 at once", async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#plan');
  await add(page, 'Pay the bill');
  await page.goto('/#plan/shutdown');
  const close = page.getByRole('region', { name: 'Close today' });
  await close.getByRole('button', { name: 'Move to tomorrow' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: 'Moved to' })).toContainText('9:00');
  await expect(close).not.toContainText('Pay the bill');
  expect((await readTask(page, 'Pay the bill'))?.scheduledStart).toBe(new Date('2026-10-12T09:00:00').getTime());
});

test('Another day… moves a task to the picked day, states the 4 am line, and never refuses', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#plan');
  await add(page, 'Renew the licence');
  for (const day of ['12', '13', '14', '15', '16']) {
    await page.locator('.mor-row').filter({ hasText: 'Renew the licence' }).locator('.task-title-button').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Another day…' }).click();
    const sheet = page.getByRole('dialog', { name: 'Move Renew the licence' });
    await expect(sheet).toContainText('Times before 4 am count as the night before.');
    await sheet.getByLabel('Day').fill(`2026-10-${day}`);
    await sheet.getByRole('button', { name: 'Move to this day' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await readTask(page, 'Renew the licence')).toMatchObject({ status: 'planned', dayKey: `2026-10-${day}` });
  }
});

test('Pick one Must places the last choice today without asking for anything first', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#plan');
  await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
  // Yesterday's planned tasks, missed; the last one has moved before and has no first step.
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('tasks', 'readwrite');
      const base = { status: 'unplaced', dayKey: '2026-10-11', size: 'M', plannedSize: 'M', estimateMin: 30, category: 'general', mustOrCould: 'could', scheduledStart: null, scheduledEnd: null, firstScheduledDayKey: '2026-10-09', lastPlannedDayKey: '2026-10-10', updatedAt: Date.now(), deleted: 0, deviceId: 'move-e2e' };
      for (let index = 0; index < 12; index++) transaction.objectStore('tasks').put({ ...base, id: `a-filler-${String(index).padStart(2, '0')}`, title: `Filler ${index + 1}`, postponeCount: 0 });
      transaction.objectStore('tasks').put({ ...base, id: 'z-slipped', title: 'Slipped task', postponeCount: 1 });
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });
  await page.reload();
  await openMore(page);
  const fresh = page.getByRole('region', { name: 'Fresh start' });
  await fresh.getByRole('button', { name: 'Pick one Must' }).click();
  await fresh.getByRole('button', { name: 'Slipped task' }).click();
  await expect(page.getByRole('region', { name: 'Fresh start' })).toHaveCount(0);
  expect(await readTask(page, 'Slipped task')).toMatchObject({ status: 'planned', dayKey: '2026-10-11', mustOrCould: 'must' });
});
