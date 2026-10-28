import { expect, test, type Page } from '@playwright/test';

// Item 214 (Jenil): Start, Stop for now, then Start again carries on from the task's whole time, and the focus card
// has a Pause that holds the clock.
const add = async (page: Page, title: string) => {
  await page.getByLabel('Add a task').fill(title);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Today' })).toContainText(title);
};
const start = (page: Page, title: string) => page.getByRole('region', { name: 'Today', exact: true }).locator('.mor-row').filter({ hasText: title }).getByRole('button', { name: 'Start' }).click();
const focus = (page: Page) => page.getByRole('region', { name: 'Focus' });
const clock = (page: Page) => focus(page).locator('.mor-clock');
const MIN = 60_000;

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-26T12:00:00') });
  await page.goto('/#plan');
  await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
});

test('Start after Stop for now carries on from 10:00 and keeps counting', async ({ page }) => {
  await add(page, 'Write the report');
  await start(page, 'Write the report');
  await page.clock.fastForward(10 * MIN);
  await expect(clock(page)).toHaveText(/^10:0\d$/);
  await focus(page).getByRole('button', { name: 'Stop for now' }).click();
  await expect(page.locator('.mor-noted')).toHaveText("Noted: 10 minutes on 'Write the report' so far.");
  await start(page, 'Write the report');
  await expect(clock(page)).toHaveText(/^10:0\d$/);
  await page.clock.fastForward(2 * MIN);
  await expect(clock(page)).toHaveText(/^12:0\d$/);
  // Stop for now again says the whole time so far.
  await focus(page).getByRole('button', { name: 'Stop for now' }).click();
  await expect(page.locator('.mor-noted')).toHaveText("Noted: 12 minutes on 'Write the report' so far.");
});

test('Pause holds the clock at 3:00 and Resume carries on from the same second', async ({ page }) => {
  await add(page, 'Read chapter 2');
  await start(page, 'Read chapter 2');
  await expect(focus(page)).toContainText('Working on');
  await page.clock.fastForward(3 * MIN);
  await focus(page).getByRole('button', { name: 'Pause' }).click();
  await expect(focus(page)).toContainText('Paused');
  const held = await clock(page).textContent();
  expect(held).toMatch(/^3:0\d$/);
  await page.clock.fastForward(5 * MIN);
  await expect(clock(page)).toHaveText(held!);
  await focus(page).getByRole('button', { name: 'Resume' }).click();
  await expect(focus(page).getByRole('button', { name: 'Pause' })).toBeVisible();
  await page.clock.fastForward(MIN);
  await expect(clock(page)).toHaveText(/^4:0\d$/);
});

test('two tasks each keep their own time when switching between them', async ({ page }) => {
  await add(page, 'Task A');
  await add(page, 'Task B');
  await start(page, 'Task A');
  await page.clock.fastForward(4 * MIN);
  await start(page, 'Task B');
  await expect(focus(page)).toContainText('Task B');
  await expect(clock(page)).toHaveText(/^0:0\d$/);
  await page.clock.fastForward(2 * MIN);
  await start(page, 'Task A');
  await expect(focus(page)).toContainText('Task A');
  await expect(clock(page)).toHaveText(/^4:0\d$/);
  await start(page, 'Task B');
  await expect(clock(page)).toHaveText(/^2:0\d$/);
});

test('Done after Stop for now and Start again notes the full minutes', async ({ page }) => {
  await add(page, 'Fix the bike');
  await start(page, 'Fix the bike');
  await page.clock.fastForward(7 * MIN);
  await focus(page).getByRole('button', { name: 'Stop for now' }).click();
  await start(page, 'Fix the bike');
  await page.clock.fastForward(5 * MIN);
  await focus(page).getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('.mor-noted')).toHaveText("Noted: 'Fix the bike' took 12 minutes.");
});

test('the focus timer screen carries on from the task total too', async ({ page }) => {
  await add(page, 'Plan the trip');
  await start(page, 'Plan the trip');
  await page.clock.fastForward(6 * MIN);
  await focus(page).getByRole('button', { name: 'Stop for now' }).click();
  await page.goto('/#plan/focus');
  await page.getByRole('button', { name: 'Start focus' }).click();
  await expect(page.locator('.timer-caption')).toHaveText(/^Elapsed 6:0\d$/);
});
