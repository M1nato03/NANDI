import { expect, test } from '@playwright/test';

test('plan and cancel days away on You; the rest bank and trip persist', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto('/#you');
  const season = page.getByRole('region', { name: 'Your season' });
  await expect(season).toContainText('4 rest days banked');
  await season.getByRole('button', { name: 'Plan days away' }).click();
  await season.getByLabel('Start date').fill('2026-10-22');
  await season.getByLabel('End date').fill('2026-10-24');
  await season.getByRole('button', { name: 'Save trip' }).click();
  await expect(season).toContainText('2026-10-22 to 2026-10-24');
  await season.getByRole('button', { name: 'Plan days away' }).click();
  await season.getByLabel('Start date').fill('2026-10-26');
  await season.getByLabel('End date').fill('2026-10-26');
  await season.getByRole('button', { name: 'Save trip' }).click();
  await expect(season).toContainText('2026-10-26 to 2026-10-26');
  await season.getByRole('button', { name: 'Cancel' }).last().click();
  await expect(season).not.toContainText('2026-10-26 to 2026-10-26');
  await page.reload();
  await expect(season).toContainText('4 rest days banked');
  await expect(season).toContainText('2026-10-22 to 2026-10-24');
});
