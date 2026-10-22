/// <reference lib="dom" />
import { expect, test } from '@playwright/test';

test('weekly review starts with plain words and keeps details optional', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-18T12:00:00') });
  await page.goto('/#plan/review');
  const words = page.getByRole('region', { name: 'This week, in words' });
  await expect(words).toContainText('Week of 12 Oct');
  await expect(words).toContainText("A quiet week. That's data, not a verdict.");
  await expect(page.getByRole('region', { name: 'What helped' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'What got in the way' })).toBeVisible();
  const numbers = page.locator('.planner-numbers');
  await expect(numbers).not.toHaveAttribute('open', '');
  await numbers.locator('summary').click();
  await expect(numbers).toContainText('Weekly move budget: 0 of 5 used');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('daily case progress and completion survive reload', async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.setFixedTime(new Date('2026-10-11T12:00:00'));
  await page.goto('/?e2e#mind');
  await page.getByRole('button', { name: 'Case Not done' }).click();
  await expect(page.getByRole('heading', { name: 'Who was where?' })).toBeVisible({ timeout: 30_000 });
  const cell = page.getByRole('region', { name: 'Who was where?' }).getByRole('button').first();
  const original = await cell.getAttribute('aria-label');
  await cell.click();
  await expect(cell).toHaveAttribute('aria-label', original!.replace('blank', 'no'));
  await expect(page.locator('.mind-case')).toHaveAttribute('data-save-state', 'saved');
  await page.reload();
  await expect(page.getByRole('button', { name: original!.replace('blank', 'no') })).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => Boolean(window.__nandiCaseTest));
  await page.evaluate(() => window.__nandiCaseTest!.solveTodaysCase());
  await expect(page.getByRole('heading', { name: 'Case closed.' })).toBeVisible();
  await expect(page.locator('.mind-case')).toHaveAttribute('data-save-state', 'saved');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Case closed.' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Mind' }).click();
  await expect(page.getByRole('button', { name: 'Case Done' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('focus phase follows timestamps and keeps the chosen cycle', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#plan');
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').click();
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Focus cycle task');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.getByRole('button', { name: 'Focus timer' }).click();
  await page.getByLabel('Focus cycle').selectOption('50/10');
  await page.getByRole('button', { name: 'Start focus' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Focus · cycle 1' })).toBeVisible();
  await page.clock.fastForward(50 * 60_000);
  await expect(page.getByRole('status').filter({ hasText: 'Break · cycle 1' })).toBeVisible();
  await expect(page.getByText(/A quiet break is here/)).toBeVisible();
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Focus paused.' })).toBeVisible();
  await page.clock.fastForward(20 * 60_000);
  await expect(page.getByRole('status').filter({ hasText: 'Paused · Break' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('status').filter({ hasText: 'Paused · Break' })).toBeVisible();
});
