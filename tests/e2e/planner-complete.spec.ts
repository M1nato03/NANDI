import { expect, test, type Page } from '@playwright/test';

async function open(page: Page) {
  await page.clock.install({ time: new Date('2026-10-19T10:00:00') });
  await page.goto('/?e2e#plan');
  await page.waitForFunction(() => !!window.__nandiTest);
}
async function seed(page: Page, kind: 'fresh' | 'calibration' | 'checkpoint' | 'history') {
  await page.evaluate(kind => (window.__nandiTest as typeof window.__nandiTest & { seedPlannerComplete: (value: typeof kind) => Promise<void> }).seedPlannerComplete(kind), kind);
  await page.reload();
}
async function add(page: Page, title: string) {
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').click();
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill(title);
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
}

test('Now card starts focus, shows the next block and horizon, and completes', async ({ page }) => {
  await open(page);
  await add(page, 'First block');
  await add(page, 'Second block');
  const card = page.getByRole('region', { name: 'Now card' });
  await expect(card).toContainText('First block');
  await expect(card).toContainText('Next');
  await expect(card).toContainText('Second block');
  await expect(card).toContainText('left before shutdown');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await card.locator('button').evaluateAll(nodes => nodes.filter(node => { const box = node.getBoundingClientRect(); return box.width < 44 || box.height < 44; }).length)).toBe(0);
  await card.getByRole('button', { name: 'Start focus' }).click();
  await expect(page.getByRole('heading', { name: 'Focus', exact: true })).toBeVisible();
  await page.locator('.focus-screen').getByRole('button', { name: 'Back to Plan' }).click();
  await card.getByRole('button', { name: 'Done' }).click();
  await expect(card).toContainText('Second block');
});

test('fresh start offers a calm one-tap Must', async ({ page }) => {
  await open(page);
  await seed(page, 'fresh');
  const fresh = page.getByRole('region', { name: 'Fresh start' });
  await expect(fresh).toContainText("Yesterday didn't go to plan. That's data, not a verdict.");
  await fresh.getByRole('button', { name: 'Pick one Must' }).click();
  await fresh.getByRole('button', { name: 'Yesterday task' }).click();
  await expect(fresh).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Today' })).toContainText('Must');
});

test('task detail edits fields and shows move history', async ({ page }) => {
  await open(page);
  await seed(page, 'history');
  await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: 'History task' }).click();
  const detail = page.getByRole('dialog', { name: 'Task detail History task' });
  await expect(detail).toContainText('blocked');
  await detail.getByLabel('Title').fill('Revised history task');
  await detail.getByLabel('Estimate in minutes').fill('40');
  await detail.getByLabel('First step').fill('Open the notes');
  await detail.getByRole('button', { name: 'Save task' }).click();
  await expect(page.getByRole('region', { name: 'Today' })).toContainText('Revised history task');
});

test('calibration suggests an estimate after five timed study tasks', async ({ page }) => {
  await open(page);
  await seed(page, 'calibration');
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').click();
  await page.getByLabel('Category').selectOption('study');
  await expect(page.getByText('Your study tasks usually take about 1.4x the estimate.')).toBeVisible();
  await page.getByRole('button', { name: 'Use 42 min' }).click();
  await expect(page.getByLabel('Minutes')).toHaveValue('42');
});

test('reward appears after a work block', async ({ page }) => {
  await open(page);
  await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'You' }).click();
  await page.getByRole('button', { name: /Settings/ }).click();
  const settings = page.getByRole('region', { name: 'Plan settings' });
  await settings.getByLabel('Name your reward').fill('chai');
  await settings.getByRole('button', { name: 'Save reward' }).click();
  await settings.getByLabel('Reward after a focus block').check();
  await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Plan' }).click();
  await add(page, 'Focus block');
  await page.getByRole('region', { name: 'Now card' }).getByRole('button', { name: 'Start focus' }).click();
  await expect(page.getByText('Block done. Time for chai.')).toHaveCount(0);
  await page.clock.fastForward(25 * 60_000);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByText('Block done. Time for chai.')).toBeVisible();
});

test('checkpoints are proposed and can be re-spaced after moving one', async ({ page }) => {
  await open(page);
  await seed(page, 'checkpoint');
  await page.getByText('Tap to see what is waiting. Nothing here is late.').click();
  await page.getByRole('region', { name: 'Upcoming' }).getByRole('button', { name: 'Prepare exam' }).click();
  const detail = page.getByRole('dialog', { name: 'Task detail Prepare exam' });
  await detail.getByRole('button', { name: 'Add checkpoints' }).click();
  await expect(detail.getByText(/checkpoint 3/)).toBeVisible();
  await detail.getByRole('button', { name: 'Accept checkpoints' }).click();
  await expect(page.getByRole('region', { name: 'Upcoming' })).toContainText('checkpoint 1');
  const row = page.getByRole('region', { name: 'Upcoming' }).locator('.task-row').filter({ hasText: 'checkpoint 1' });
  await row.getByRole('button', { name: 'Move' }).click();
  await page.getByRole('dialog', { name: /Move Prepare exam/ }).getByRole('button', { name: 'Save new time' }).click();
  await expect(page.getByRole('dialog', { name: 'Re-space checkpoints' })).toBeVisible();
  await page.getByRole('button', { name: 'Re-space', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Re-space checkpoints' })).toHaveCount(0);
});
