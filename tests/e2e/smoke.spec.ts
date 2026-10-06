import { expect, test } from '@playwright/test';

test('loads NANDI', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'NANDI' })).toBeVisible();
});
