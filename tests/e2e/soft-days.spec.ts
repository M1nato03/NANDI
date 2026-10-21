import { expect, test } from '@playwright/test';

test('a tired day: one gentle thing, a calm finish, and a lantern that stays', async ({ page }, testInfo) => {
  await page.clock.setFixedTime(new Date('2026-11-04T12:00:00'));
  await page.goto('/#plan');
  await page.getByRole('button', { name: 'Low on energy today?' }).click();
  const sheet = page.getByRole('dialog', { name: 'What kind of day is it?' });
  await sheet.getByRole('button', { name: 'Tired' }).click();
  const card = page.getByRole('region', { name: 'Soft day' });
  await expect(card).toContainText('Slow is still moving. Pick one small thing.');
  // One card only: no quests, task list or rituals today.
  await expect(page.getByRole('region', { name: 'Planning routines' })).toHaveCount(0);
  await expect(card.locator('.soft-option')).toHaveCount(3);
  await card.getByRole('button', { name: /Stretch in bed/ }).click();
  await expect(card.locator('.exercise-figure')).toHaveCount(3);
  if (testInfo.project.name === 'mobile-360x800') await page.screenshot({ path: testInfo.outputPath('soft-stretch-360.png'), fullPage: true });
  await card.getByRole('button', { name: 'Done' }).click();
  await expect(card).toContainText('That counts. Kachhua lit a lantern for today.');
  await expect(card).toContainText('You can stop here.');
  await card.getByRole('button', { name: 'Close for today' }).click();
  await expect(card).toContainText('Today is kept.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  // The lantern is in Kachhua's corner of the courtyard.
  await page.goto('/#you/courtyard');
  await expect(page.locator('.courtyard-lanterns')).toHaveAttribute('data-lanterns', '1');
  // The next morning opens with one line about it, and the usual Plan is back.
  await page.clock.setFixedTime(new Date('2026-11-05T09:00:00'));
  await page.goto('/#plan');
  await expect(page.getByText('Yesterday was a soft day. You still showed up.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Low on energy today?' })).toBeVisible();
});

test('a low day: keep one good thing, or switch back when you feel okay', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-04T12:00:00'));
  await page.goto('/#plan');
  await page.getByRole('button', { name: 'Low on energy today?' }).click();
  await page.getByRole('dialog', { name: 'What kind of day is it?' }).getByRole('button', { name: 'Feeling low' }).click();
  const card = page.getByRole('region', { name: 'Soft day' });
  await expect(card).toContainText('Low days happen. Pick one kind thing.');
  await card.getByRole('button', { name: 'I feel okay now' }).click();
  await expect(page.getByRole('button', { name: 'Low on energy today?' })).toBeVisible();
  await page.getByRole('button', { name: 'Low on energy today?' }).click();
  await page.getByRole('dialog', { name: 'What kind of day is it?' }).getByRole('button', { name: 'Feeling low' }).click();
  await card.getByRole('button', { name: 'One good thing from today' }).click();
  await card.getByLabel(/One good thing from today/).fill('Chai with Ma');
  await card.getByRole('button', { name: 'Keep it' }).click();
  await expect(card).toContainText('That counts. Kachhua lit a lantern for today.');
  await card.getByRole('button', { name: 'I feel better, show me more' }).click();
  await expect(page.getByRole('region', { name: 'Planning routines' })).toBeVisible();
});
