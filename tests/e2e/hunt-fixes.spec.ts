import { expect, test } from '@playwright/test';

// Bug hunt 30 Oct (jenil-87): a workout stopped with no set logged is not a session anywhere, and gets no praise.
test('a session stopped with no set logged counts nowhere, gets no praise, and its card goes at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.setFixedTime(new Date('2026-10-30T12:00:00'));
  await page.goto('/?e2e#yatra/train');
  await page.getByRole('button', { name: 'Start easy, skip the test' }).click();
  await page.getByRole('button', { name: 'Finish session' }).click();
  await expect(page).toHaveURL(/train\/finish$/);
  await expect(page.getByText('0 sets logged')).toBeVisible();
  // No finish line and no badge tier for logging nothing.
  await page.waitForTimeout(1500);
  await expect(page.locator('.economy-toast')).toHaveCount(0);
  await page.goto('/?e2e#yatra/train');
  await expect(page.getByText('A fresh week. Start with one session.')).toBeVisible();
  await expect(page.getByText('Session in progress')).toHaveCount(0);
  await expect(page.getByText('0 of 3 sessions this week.')).toBeVisible();
  await expect(page.getByText(/^Last session:/)).toHaveCount(0);
});
