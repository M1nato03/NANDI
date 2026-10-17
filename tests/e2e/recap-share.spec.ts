import { expect, test } from '@playwright/test';
import { seedRecapWeek } from './recap-seed';

test('You previews a shareable week with seeded data', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-17T12:00:00') });
  await page.goto('/#you');
  await seedRecapWeek(page, '2026-10-15');
  const week = page.getByRole('region', { name: 'What your time became this week' });
  await expect(week.getByRole('button', { name: 'Share my week' })).toBeVisible();
  await week.getByRole('button', { name: 'Share my week' }).click();
  const preview = page.getByRole('dialog', { name: 'Weekly recap preview' });
  await expect(preview.getByRole('img')).toHaveAttribute('alt', /1 task finished, 1 workout/);
  await expect(preview.getByRole('button', { name: 'Share' })).toBeEnabled();
  await preview.getByRole('button', { name: 'Not now' }).click();
  await expect(preview).toHaveCount(0);
});

test('Monday end card links to the weekly preview', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-19T12:00:00') });
  await page.goto('/#now');
  await seedRecapWeek(page, '2026-10-15');
  await page.getByRole('button', { name: 'Go to card 8: The day is yours' }).click();
  const end = page.getByRole('article', { name: 'The day is yours card' });
  await end.getByRole('button', { name: 'Your week is ready to share' }).click();
  await expect(page.getByRole('dialog', { name: 'Weekly recap preview' }).getByRole('img')).toBeVisible();
});
