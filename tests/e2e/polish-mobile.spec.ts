import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-360x800', 'Screenshots target 360x800.');
  await page.emulateMedia({ colorScheme: 'dark' });
});

test('first night uses one card frame at 360x800', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-10-11T02:00:00') });
  await page.goto('/#now');
  const card = page.getByRole('article', { name: 'Tonight card' });
  await expect(card.locator('.night-plan-setting')).toBeVisible();
  await expect(card.locator('.night-plan-setting')).not.toHaveClass(/\bcard\b/);
  expect(await card.locator('.night-plan-setting').evaluate(element => getComputedStyle(element).borderTopWidth)).toBe('0px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('first-night-360x800-dark.png') });
});

test('Now header leaves the first step action visible at 360x800', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#plan');
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Call bank 15m');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.getByRole('link', { name: 'Now' }).click();
  const heading = page.locator('.deck-heading');
  await expect(heading.getByRole('heading', { name: 'Now' })).toBeVisible();
  await expect(heading).toContainText('1 of 7');
  const dots = await page.locator('.deck-dashes button').all();
  expect(dots).toHaveLength(7);
  expect((await dots[0]!.boundingBox())?.y).toBe((await dots[6]!.boundingBox())?.y);
  const button = page.getByRole('article', { name: 'First step card' }).getByRole('button', { name: 'Start' });
  const action = await button.boundingBox();
  const nav = await page.getByRole('navigation', { name: 'Main tabs' }).boundingBox();
  expect(action && nav && action.y + action.height < nav.y).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('now-360x800-dark.png') });
});

test('Train equipment has accessible toggle chips at 360x800', async ({ page }, testInfo) => {
  await page.goto('/#you/train');
  const gym = page.getByRole('checkbox', { name: 'Gym access' });
  await expect(gym).not.toBeChecked();
  await gym.check();
  await expect(gym).toBeChecked();
  await expect(page.locator('.train-checks label').first().locator('span')).toHaveCSS('background-color', 'rgb(255, 178, 91)');
  const box = await page.locator('.train-checks label').first().boundingBox();
  expect(box && box.height >= 44).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('train-equipment-360x800-dark.png') });
});
