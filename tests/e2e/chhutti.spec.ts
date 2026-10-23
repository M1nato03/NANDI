import { expect, test } from '@playwright/test';

test('phone ki chhutti: plan a window, answer afterwards where there is no usage log, and a marigold hangs (spec 24 #1)', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-02T12:00:00') });
  await page.goto('/?e2e#plan');
  const card = page.getByRole('region', { name: 'Phone ki chhutti' });
  await expect(card).toContainText('Give your phone a short day off.');
  await card.getByRole('button', { name: 'After class' }).click();
  await card.getByRole('button', { name: 'Save the chhutti' }).click();
  await expect(card).toContainText('After class, the phone goes on the shelf from 17:00 until 17:30.');
  await expect(card.getByRole('button', { name: 'Not today' })).toBeVisible();

  // The web build has no usage log, so after the window it asks once instead of guessing.
  await page.clock.setSystemTime(new Date('2026-11-02T18:00:00'));
  await page.reload();
  await expect(card.getByRole('group', { name: 'After class check-in' })).toContainText('Did the phone get its chhutti (after class)?');
  await card.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect(card.getByRole('status')).toHaveText('After class: the phone got its chhutti.');
  await expect(page.getByRole('img', { name: /One marigold hangs over the door/ }).first()).toBeAttached();

  // It survives a backup round trip and is asked only once.
  await page.waitForFunction(() => Boolean((window as Window & { __nandiTest?: unknown }).__nandiTest));
  await page.evaluate(() => (window as Window & { __nandiTest?: { backupRoundTrip: () => Promise<unknown> } }).__nandiTest!.backupRoundTrip());
  await page.reload();
  await expect(card.getByRole('status')).toHaveText('After class: the phone got its chhutti.');
  await expect(card.getByRole('group', { name: 'After class check-in' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
