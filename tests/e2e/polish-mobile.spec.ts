import { expect, test } from '@playwright/test';
import { openMore } from './helpers/plan';

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-360x800', 'Screenshots target 360x800.');
  await page.emulateMedia({ colorScheme: 'dark' });
});

test('first night uses one card frame at 360x800', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-10-11T02:00:00') });
  await page.goto('/#night');
  const card = page.getByRole('article', { name: 'Tonight card' });
  await expect(card.locator('.night-plan-setting')).toBeVisible();
  await expect(card.locator('.night-plan-setting')).not.toHaveClass(/\bcard\b/);
  expect(await card.locator('.night-plan-setting').evaluate(element => getComputedStyle(element).borderTopWidth)).toBe('0px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('first-night-360x800-dark.png') });
});

test('Plan and focus controls fit at 360x800', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#plan');
  // Let the one-time offline toast come and go so it cannot shift the layout mid-measurement.
  const offlineReady = page.getByRole('status', { name: 'Offline ready' });
  await expect(offlineReady).toBeVisible({ timeout: 30_000 });
  await page.clock.fastForward(4500);
  await expect(offlineReady).toBeHidden({ timeout: 10_000 });
  await openMore(page);
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Call bank 15m');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.getByRole('button', { name: 'Focus timer' }).click();
  const button = page.getByRole('button', { name: 'Start focus' });
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  expect(box && box.width >= 43.5 && box.height >= 43.5).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('focus-360x800-dark.png') });
});

test('Train equipment has accessible toggle chips at 360x800', async ({ page }, testInfo) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); // daytime: after shutdown the app opens the night deck
  await page.goto('/#train');
  const gym = page.getByRole('checkbox', { name: 'Gym access' });
  await expect(gym).not.toBeChecked();
  await gym.check();
  await expect(gym).toBeChecked();
  await expect(page.locator('.train-checks label').first().locator('span')).toHaveCSS('background-color', 'rgb(143, 211, 155)'); // spec 25: Train's area accent (--area-move, dark)
  const box = await page.locator('.train-checks label').first().boundingBox();
  expect(box && box.height >= 43.5).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('train-equipment-360x800-dark.png') });
});
