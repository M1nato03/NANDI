import { expect, test } from '@playwright/test';
import { openMore } from './helpers/plan';

test('phone-down move leaves lights-out check-in for an explicit tap', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-19T12:00:00') });
  await page.goto('/#plan');
  await openMore(page);
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Unfinished plan');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.clock.setFixedTime(new Date('2026-10-19T23:40:00'));
  await page.goto('/#night');
  await page.getByRole('button', { name: 'Go to card 5: Phone-down move' }).click();
  await page.getByRole('article', { name: 'Phone-down move card' }).getByRole('button', { name: /do it/ }).click();
  await page.getByRole('region', { name: 'Now deck' }).getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Lights-out check-in' })).toBeVisible();
  await page.clock.setFixedTime(new Date('2026-10-20T08:30:00'));
  await page.goto('/#plan');
  await openMore(page);
  await expect(page.getByRole('region', { name: 'Last night' })).toBeVisible();
  await page.getByRole('region', { name: 'Last night' }).getByLabel('Phone-down time').selectOption('23:30');
  await page.getByRole('region', { name: 'Last night' }).getByLabel('Reels time').selectOption('none');
  await page.getByRole('region', { name: 'Last night' }).getByRole('button', { name: 'Save last night' }).click();
  await expect(page.getByRole('region', { name: 'Last night' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('region', { name: 'Last night' })).toHaveCount(0);
});

test('first morning on a new profile has no back-fill request', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-20T08:30:00') });
  await page.goto('/#plan');
  await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Last night' })).toHaveCount(0);
});
