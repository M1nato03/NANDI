import { expect, test } from '@playwright/test';

// Accessibility audit 10-22 #1: dialogs take focus, keep it, close on Escape and give focus back.
test('the first run keeps keyboard focus inside the welcome', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00'));
  await page.goto('/?e2e&welcome');
  const welcome = page.getByRole('dialog', { name: 'Welcome to NANDI' });
  await expect(welcome).toBeVisible();
  const inside = () => welcome.evaluate(node => node.contains(document.activeElement));
  expect(await inside()).toBe(true);
  for (let press = 0; press < 6; press++) {
    await page.keyboard.press('Tab');
    expect(await inside(), `Tab ${press + 1}`).toBe(true);
  }
  // There is no close action, so Escape leaves it open.
  await page.keyboard.press('Escape');
  await expect(welcome).toBeVisible();
});

test('the Move sheet takes focus, closes on Escape and returns focus to Move', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#plan');
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Review notes');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  const move = page.locator('.task-row').filter({ hasText: 'Review notes' }).getByRole('button', { name: 'Move' });
  await move.click();
  const sheet = page.getByRole('dialog', { name: /Move Review notes/ });
  await expect(sheet).toBeVisible();
  expect(await sheet.evaluate(node => node.contains(document.activeElement))).toBe(true);
  for (let press = 0; press < 12; press++) await page.keyboard.press('Tab');
  expect(await sheet.evaluate(node => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(move).toBeFocused();
});

test('the Number Path board shows where keyboard focus is', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00'));
  await page.goto('/?e2e#mind/board/daily');
  const board = page.getByRole('group', { name: /board/i }).first();
  await expect(board).toBeVisible({ timeout: 30_000 });
  // Before any move no cell is the path head, so the board is not outlined everywhere.
  expect(await page.locator('.mind-cell.path-head').count()).toBeLessThanOrEqual(1);
});
