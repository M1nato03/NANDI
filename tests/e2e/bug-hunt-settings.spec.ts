import { expect, test } from '@playwright/test';

test('night and morning nudge choices persist through reload', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-19T12:00:00') });
  await page.goto('/#you/settings');
  const night = page.getByLabel('Night deck nudge');
  const morning = page.getByLabel('Morning first step nudge');
  await night.click();
  await morning.click();
  await expect(night).not.toBeChecked();
  await expect(morning).not.toBeChecked();
  await page.reload();
  await expect(night).not.toBeChecked();
  await expect(morning).not.toBeChecked();
});
