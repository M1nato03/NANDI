import { expect, test, type Page } from '@playwright/test';

// Spec 27: Mor's list first. Plan is a plain to-do list; moves are never refused; Start counts up.
const add = async (page: Page, title: string) => {
  await page.getByLabel('Add a task').fill(title);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Today' })).toContainText(title);
};
const taskRow = (page: Page, list: string, title: string) => page.getByRole('region', { name: list, exact: true }).locator('.mor-row').filter({ hasText: title });
const readTask = (page: Page, title: string) => page.evaluate(async name => {
  const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const rows = await new Promise<Record<string, unknown>[]>(resolve => { const request = database.transaction('tasks').objectStore('tasks').getAll(); request.onsuccess = () => resolve(request.result); });
  database.close();
  return rows.find(row => row.title === name);
}, title);

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-26T12:00:00') });
  await page.goto('/#plan');
  await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
});

test('a task added with no time shows no time anywhere; the time chip lives in the add panel and is never pre-selected', async ({ page }) => {
  await expect(page.getByRole('button', { name: '+ time' })).toHaveCount(0);
  await page.getByLabel('Add a task').fill('Call the bank');
  await page.getByRole('button', { name: '+ time' }).click();
  for (const minutes of ['15 min', '30 min', '60 min']) await expect(page.getByRole('button', { name: minutes })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'No time' }).click();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const row = taskRow(page, 'Today', 'Call the bank');
  await expect(row).toBeVisible();
  await expect(row).not.toContainText(/min|:\d\d|am|pm/i);
  // With a time picked, the row shows it.
  await page.getByLabel('Add a task').fill('Read');
  await page.getByRole('button', { name: '+ time' }).click();
  await page.getByRole('button', { name: '15 min' }).click();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(taskRow(page, 'Today', 'Read')).toContainText('15 min');
});

test('Tomorrow → moves at once with a toast and Undo, and a fourth kept move works like the first', async ({ page }) => {
  await add(page, 'Write report');
  // An undone move is not kept.
  await taskRow(page, 'Today', 'Write report').getByRole('button', { name: 'Tomorrow: Write report' }).click();
  await expect(page.locator('.mor-toast')).toContainText('Moved to Tomorrow.');
  await page.locator('.mor-toast').getByRole('button', { name: 'Undo' }).click();
  await expect(taskRow(page, 'Today', 'Write report')).toBeVisible();
  expect(await readTask(page, 'Write report')).toMatchObject({ postponeCount: 0 });
  // Four kept moves to tomorrow (brought back each time with ← Today, which does not count): none is refused,
  // none lands in Later, and the count reads 4.
  for (let move = 1; move <= 4; move++) {
    await taskRow(page, 'Today', 'Write report').getByRole('button', { name: 'Tomorrow: Write report' }).click();
    await expect(page.locator('.mor-toast')).toContainText('Moved to Tomorrow.');
    await expect(taskRow(page, 'Tomorrow', 'Write report')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await readTask(page, 'Write report')).toMatchObject({ status: 'planned', dayKey: '2026-10-27', postponeCount: move });
    if (move < 4) await taskRow(page, 'Tomorrow', 'Write report').getByRole('button', { name: 'Today: Write report' }).click();
  }
  await expect(page.getByRole('region', { name: 'Later', exact: true })).not.toContainText('Write report');
});

test('Undo after a move that ended a focus brings back the task, the running timer and the minutes as they were', async ({ page }) => {
  await add(page, 'Draft the letter');
  await taskRow(page, 'Today', 'Draft the letter').getByRole('button', { name: 'Start' }).click();
  await page.clock.runFor(5 * 60_000);
  await taskRow(page, 'Today', 'Draft the letter').getByRole('button', { name: 'Tomorrow: Draft the letter' }).click();
  await expect(page.getByRole('region', { name: 'Focus' })).toHaveCount(0);
  expect(await readTask(page, 'Draft the letter')).toMatchObject({ actualMinutes: 5, postponeCount: 1 });
  await page.locator('.mor-toast').getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('region', { name: 'Focus' })).toContainText('Draft the letter');
  await expect(page.getByRole('region', { name: 'Focus' })).toContainText('Working on');
  const row = await readTask(page, 'Draft the letter');
  expect(row).toMatchObject({ dayKey: '2026-10-26', postponeCount: 0 });
  expect(row?.actualMinutes).toBeUndefined();
});

test('Start on a Tomorrow task brings it to Today and starts the timer, with Undo', async ({ page }) => {
  await add(page, 'Book tickets');
  await taskRow(page, 'Today', 'Book tickets').getByRole('button', { name: 'Tomorrow: Book tickets' }).click();
  await taskRow(page, 'Tomorrow', 'Book tickets').getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('region', { name: 'Focus' })).toContainText('Book tickets');
  await expect(taskRow(page, 'Today', 'Book tickets')).toBeVisible();
  await expect(page.locator('.mor-toast')).toContainText('Moved to Today.');
  await page.locator('.mor-toast').getByRole('button', { name: 'Undo' }).click();
  await expect(taskRow(page, 'Tomorrow', 'Book tickets')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Focus' })).toHaveCount(0);
});

test('Start → Done saves the real minutes and Mor notes them; Stop for now keeps the task', async ({ page }) => {
  await add(page, 'Revise chapter 4');
  await taskRow(page, 'Today', 'Revise chapter 4').getByRole('button', { name: 'Start' }).click();
  const focus = page.getByRole('region', { name: 'Focus' });
  await expect(focus).toContainText('Revise chapter 4');
  await page.clock.runFor(12 * 60_000);
  await expect(focus.locator('.mor-clock')).toHaveText(/^12:\d\d$/);
  await focus.getByRole('button', { name: 'Stop for now' }).click();
  await expect(page.locator('.mor-noted')).toHaveText("Noted: 12 minutes on 'Revise chapter 4' so far.");
  await expect(taskRow(page, 'Today', 'Revise chapter 4')).toBeVisible();
  await taskRow(page, 'Today', 'Revise chapter 4').getByRole('button', { name: 'Start' }).click();
  await page.clock.runFor(30 * 60_000);
  await page.getByRole('region', { name: 'Focus' }).getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('.mor-noted')).toHaveText("Noted: 'Revise chapter 4' took 42 minutes.");
  expect(await readTask(page, 'Revise chapter 4')).toMatchObject({ status: 'done', actualMinutes: 42 });
});

test('moving a task in focus stops its timer and it leaves the focus card', async ({ page }) => {
  await add(page, 'Pay the bill');
  await taskRow(page, 'Today', 'Pay the bill').getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('region', { name: 'Focus' })).toBeVisible();
  await page.clock.runFor(5 * 60_000);
  await taskRow(page, 'Today', 'Pay the bill').getByRole('button', { name: 'Tomorrow: Pay the bill' }).click();
  await expect(page.getByRole('region', { name: 'Focus' })).toHaveCount(0);
  await expect(taskRow(page, 'Tomorrow', 'Pay the bill')).toBeVisible();
  expect(await readTask(page, 'Pay the bill')).toMatchObject({ actualMinutes: 5 });
});

test('Mor reacts once per action and stays still under reduced motion', async ({ page }) => {
  const mor = page.locator('.mor-friend');
  await add(page, 'Water the plants');
  await expect(mor).toHaveAttribute('data-moment', 'add');
  await taskRow(page, 'Today', 'Water the plants').getByRole('button', { name: 'Done: Water the plants' }).click();
  await expect(mor).toHaveAttribute('data-moment', 'done');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await mor.evaluate(node => getComputedStyle(node).animationName)).toBe('none');
});

test('at 360 px with a 20 px root font the rows wrap and nothing is clipped', async ({ page }) => {
  await add(page, 'A fairly long task name that needs room to wrap');
  await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
  const width = page.viewportSize()!.width;
  for (const button of await taskRow(page, 'Today', 'A fairly long').getByRole('button').all()) {
    const box = (await button.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a focus paused on the timer screen shows as paused on Plan, with Resume (Codex A item 91)', async ({ page }) => {
  await add(page, 'Sort the files');
  await taskRow(page, 'Today', 'Sort the files').getByRole('button', { name: 'Start' }).click();
  await page.goto('/#plan/focus');
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.goto('/#plan');
  const focus = page.getByRole('region', { name: 'Focus' });
  await expect(focus).toContainText('Paused');
  await focus.getByRole('button', { name: 'Resume' }).click();
  await expect(focus).toContainText('Working on');
  await expect(focus.getByRole('button', { name: 'Resume' })).toHaveCount(0);
});

test('Undo lasts only until the next action: Done, Start or another move clears it (Codex A item 92)', async ({ page }) => {
  for (const title of ['Alpha', 'Beta', 'Gamma']) await add(page, title);
  const toast = page.locator('.mor-toast');
  await taskRow(page, 'Today', 'Alpha').getByRole('button', { name: 'Tomorrow: Alpha' }).click();
  await expect(toast).toContainText('Moved to Tomorrow.');
  await taskRow(page, 'Today', 'Beta').getByRole('button', { name: 'Done: Beta' }).click();
  await expect(toast).toHaveCount(0);
  await taskRow(page, 'Tomorrow', 'Alpha').getByRole('button', { name: 'Today: Alpha' }).click();
  await expect(toast).toContainText('Moved to Today.');
  await taskRow(page, 'Today', 'Gamma').getByRole('button', { name: 'Start' }).click();
  await expect(toast).toHaveCount(0);
  // A second move replaces the first one's Undo: Undo now takes back only the second.
  await taskRow(page, 'Today', 'Alpha').getByRole('button', { name: 'Tomorrow: Alpha' }).click();
  await taskRow(page, 'Today', 'Gamma').getByRole('button', { name: 'Tomorrow: Gamma' }).click();
  await toast.getByRole('button', { name: 'Undo' }).click();
  await expect(taskRow(page, 'Today', 'Gamma')).toBeVisible();
  await expect(taskRow(page, 'Tomorrow', 'Alpha')).toBeVisible();
});
