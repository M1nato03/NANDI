import { expect, test } from '@playwright/test';

test('reminders have no time, survive reload and backup, and never fill the Plan dot', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-20T12:00:00') });
  await page.goto('/?e2e#plan');
  const reminders = page.getByRole('region', { name: 'Reminders' });
  await expect(reminders).toContainText('Little things to remember, with no clock attached.');

  await reminders.getByLabel('New reminder').fill('  buy a   notebook ');
  await reminders.getByRole('button', { name: 'Add', exact: true }).click();
  await reminders.getByLabel('New reminder').fill('call Nani');
  await reminders.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(reminders.locator('.reminder-list').first()).toContainText('buy a notebook');
  await expect(reminders.locator('h2')).toContainText('2');

  await reminders.getByRole('button', { name: 'Done: buy a notebook' }).click();
  await expect(reminders.getByText('Done lately · 1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Plan: not done' })).toBeVisible();

  await page.reload();
  await expect(reminders.getByText('call Nani')).toBeVisible();
  await expect(reminders.getByText('Done lately · 1')).toBeVisible();

  await page.waitForFunction(() => Boolean((window as Window & { __nandiTest?: unknown }).__nandiTest));
  await page.evaluate(() => (window as Window & { __nandiTest?: { backupRoundTrip: () => Promise<unknown> } }).__nandiTest!.backupRoundTrip());
  await page.reload();
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
