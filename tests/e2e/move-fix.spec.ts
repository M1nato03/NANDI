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
  // The message sits by the pressed button and takes focus, so it is on screen at 360 px too (Codex A items 87, 88).
  await expect(sheet.getByRole('alert')).toBeInViewport();
  await expect(sheet.getByRole('alert')).toBeFocused();
  await expect(sheet.locator('details').getByRole('alert')).toHaveCount(1);
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

test('Pick one Must says why a choice could not move, on that choice', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#plan');
  await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
  // Yesterday's planned task, moved once and missed: the move rules want a first step before it moves again.
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('tasks', 'readwrite');
      const base = { status: 'unplaced', dayKey: '2026-10-11', size: 'M', plannedSize: 'M', estimateMin: 30, category: 'general', mustOrCould: 'could', scheduledStart: null, scheduledEnd: null, firstScheduledDayKey: '2026-10-09', lastPlannedDayKey: '2026-10-10', updatedAt: Date.now(), deleted: 0, deviceId: 'move-e2e' };
      for (let index = 0; index < 6; index++) transaction.objectStore('tasks').put({ ...base, id: `z-filler-${index}`, title: `Filler ${index + 1}`, postponeCount: 0 });
      transaction.objectStore('tasks').put({ ...base, id: 'a-slipped', title: 'Slipped task', postponeCount: 1 });
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });
  await page.reload();
  const fresh = page.getByRole('region', { name: 'Fresh start' });
  await fresh.getByRole('button', { name: 'Pick one Must' }).click();
  await fresh.getByRole('button', { name: 'Slipped task' }).click();
  const note = fresh.getByRole('alert');
  await expect(note).toContainText('Add a first step of 10 minutes or less.');
  // It sits right under the tapped choice, not after the whole list.
  const [choice, alert] = [await fresh.getByRole('button', { name: 'Slipped task' }).boundingBox(), await note.boundingBox()];
  expect(alert!.y).toBeGreaterThanOrEqual(choice!.y + choice!.height - 1);
  expect(alert!.y - (choice!.y + choice!.height)).toBeLessThan(40);
  await expect(note).toBeInViewport();
});
