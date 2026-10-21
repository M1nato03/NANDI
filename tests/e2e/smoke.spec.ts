import { expect, test } from '@playwright/test';

test('loads NANDI', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); // daytime: after shutdown the app opens the night deck
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'NANDI' })).toBeVisible();
});
