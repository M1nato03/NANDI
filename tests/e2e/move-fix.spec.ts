import { expect, test, type Page } from '@playwright/test';

// Item 83: Jenil's "move task didn't work". A refused move says why inside the sheet, a moved task leaves the Now
// card even while its focus was running, and Shutdown's "Move to tomorrow" moves the task at once.
const addToday = async (page: Page, title: string, time: string) => {
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').click();
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill(title);
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.locator('.task-row').filter({ hasText: title }).getByRole('button', { name: 'Move' }).click();
  await page.getByLabel('New date and time').fill(time);
  await page.getByRole('dialog').getByRole('button', { name: 'Save new time' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
};

test('a move the rules refuse says why inside the open sheet', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#plan');
  for (const [index, title] of ['Class one', 'Class two', 'Class three'].entries()) {
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').click();
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill(title);
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await page.locator('.task-row').filter({ hasText: title }).getByRole('button', { name: 'Move' }).click();
    const sheet = page.getByRole('dialog');
    await sheet.getByText('Schedule changed for a real reason?').click();
    await sheet.getByLabel('class moved', { exact: true }).check();
    await sheet.getByLabel('New date and time').fill(`2026-10-12T1${index}:00`);
    await sheet.getByRole('button', { name: 'Move with reason' }).click();
    if (index < 2) await expect(sheet).toHaveCount(0);
  }
  // Two real-reason moves a week: the third is refused, and the reason shows in the sheet, not behind it.
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('alert')).toHaveText('Real-reason moves are used up for this week.');
  await expect(sheet).toBeVisible();
});

test('moving the task you are focusing on to tomorrow takes it off the Now card', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#plan');
  await addToday(page, 'Write report', '2026-10-11T15:00');
  const now = page.getByRole('region', { name: 'Now card' });
  await expect(now).toContainText('Write report');
  await now.getByRole('button', { name: 'Start focus' }).click();
  // On the focus screen: Move in Plan, to tomorrow.
  await page.getByRole('button', { name: 'Move in Plan' }).click();
  await page.getByLabel('New date and time').fill('2026-10-12T10:00');
  await page.getByRole('dialog').getByRole('button', { name: 'Save new time' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.focus-screen')).not.toContainText('Write report');
  await page.goto('/#plan');
  await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Now card' })).toHaveCount(0);
});

test("Shutdown's Move to tomorrow moves the task to tomorrow 9:00 at once", async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#plan');
  await addToday(page, 'Pay the bill', '2026-10-11T16:00');
  await page.goto('/#plan/shutdown');
  const close = page.getByRole('region', { name: 'Close today' });
  await close.getByRole('button', { name: 'Move to tomorrow' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: 'Moved to' })).toContainText('9:00');
  await expect(close).not.toContainText('Pay the bill');
  const start = await page.evaluate(async () => {
    const open = indexedDB.open('nandi');
    const db = await new Promise<IDBDatabase>((resolve) => { open.onsuccess = () => resolve(open.result); });
    const rows = await new Promise<{ title: string; scheduledStart?: number }[]>((resolve) => { const request = db.transaction('tasks').objectStore('tasks').getAll(); request.onsuccess = () => resolve(request.result); });
    db.close();
    return rows.find(row => row.title === 'Pay the bill')?.scheduledStart;
  });
  expect(start).toBe(new Date('2026-10-12T09:00:00').getTime());
});
