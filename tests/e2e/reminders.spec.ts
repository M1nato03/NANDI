import { expect, test } from '@playwright/test';
import { openMore } from './helpers/plan';

test('reminders have no time, survive reload and backup, and never fill the Plan dot', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-20T12:00:00') });
  await page.goto('/?e2e#plan');
  // Spec 27: Reminders sit in Plan's More fold.
  await openMore(page);
  const reminders = page.getByRole('region', { name: 'Reminders' });
  await expect(reminders).toContainText('Little things to remember, with no clock attached.');

  await reminders.getByLabel('New reminder').fill('  buy a   notebook ');
  await reminders.getByRole('button', { name: 'Add', exact: true }).click();
  await reminders.getByLabel('New reminder').fill('call Nani');
  await reminders.getByRole('button', { name: 'Add', exact: true }).click();
  // Both lines are kept (a quick second add no longer overwrites the first) and stay in the order they were made.
  await expect(reminders.locator('.reminder-list').first().locator('.reminder-text')).toHaveText(['buy a notebook', 'call Nani']);
  await expect(reminders.locator('h2')).toContainText('2');

  await reminders.getByRole('button', { name: 'Done: buy a notebook' }).click();
  await expect(reminders.getByText('Done lately · 1')).toBeVisible();
  // A reminder is not a planned task: the Yatra ring stays unlit.
  await expect(page.getByRole('button', { name: 'Yatra: keep one promise.' })).toBeVisible();

  await page.reload();
  await openMore(page);
  await expect(reminders.getByText('call Nani')).toBeVisible();
  await expect(reminders.getByText('Done lately · 1')).toBeVisible();

  await page.waitForFunction(() => Boolean((window as Window & { __nandiTest?: unknown }).__nandiTest));
  await page.evaluate(() => (window as Window & { __nandiTest?: { backupRoundTrip: () => Promise<unknown> } }).__nandiTest!.backupRoundTrip());
  await page.reload();
  await openMore(page);
  await expect(reminders.getByText('call Nani')).toBeVisible();

  await reminders.getByText('Done lately · 1').click();
  await reminders.getByRole('button', { name: 'Not done yet: buy a notebook' }).click();
  await expect(reminders.locator('h2')).toContainText('2');
  await reminders.getByRole('button', { name: 'Remove call Nani' }).click();
  await expect(reminders.getByText('call Nani')).toHaveCount(0);

  await reminders.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(reminders.getByRole('alert')).toHaveText('Write a few words first.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
