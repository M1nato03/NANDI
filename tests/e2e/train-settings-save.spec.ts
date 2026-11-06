import { expect, test } from '@playwright/test';

// Train › Settings saved the control's value AFTER an async wait, when React had already put the controlled input
// back, so "Equipment saved." showed while the old value was kept. Each change must survive a reload.
test('Train settings: track, rest day, hot-day mode and equipment keep what you pick', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-06T12:00:00'));
  await page.goto('/?e2e#yatra/train');
  await page.getByRole('button', { name: 'Start placement' }).click();
  for (let pattern = 0; pattern < 7; pattern++) {
    if (pattern === 4 || pattern === 5) await page.getByRole('spinbutton', { name: 'Clean seconds' }).fill('30');
    await page.getByRole('button', { name: 'Record test' }).click();
  }
  await expect(page.getByRole('button', { name: 'Start session' })).toBeVisible();
  const settings = async () => {
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Training settings' })).toBeVisible();
  };
  await settings();
  await page.getByLabel('Barbell').selectOption('20');
  await expect(page.getByRole('heading', { name: 'Plate calculator' })).toBeVisible();
  await page.getByLabel('Dumbbells').click();
  await expect(page.getByLabel('Dumbbells')).toBeChecked();
  await page.getByLabel('Hot-day mode').click();
  await expect(page.getByLabel('Hot-day mode')).toBeChecked();
  await page.getByLabel('Rest day').selectOption('3');
  await expect(page.getByLabel('Rest day')).toHaveValue('3');

  await page.reload();
  // The reload keeps Train on its settings page.
  await expect(page.getByRole('heading', { name: 'Training settings' })).toBeVisible();
  await expect(page.getByLabel('Barbell')).toHaveValue('20');
  await expect(page.getByLabel('Dumbbells')).toBeChecked();
  await expect(page.getByLabel('Hot-day mode')).toBeChecked();
  await expect(page.getByLabel('Rest day')).toHaveValue('3');
  // Last: the select is drawn from the saved program, so it shows gym only once that is stored (gym then asks for setup).
  await page.getByLabel('Training track').selectOption('gym');
  await expect(page.getByLabel('Training track')).toHaveValue('gym');
});
