import { expect, test } from '@playwright/test';

// Spec 25, one look per friend: each tab takes its area's colour and puts its friend on a stage at the top.
const shell = (page: import('@playwright/test').Page) => page.locator('.app-shell');

test('each tab carries its own area, with its friend on a stage; You stays neutral', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-03T12:00:00'));
  for (const [route, area, friend] of [['learn', 'learn', 'Chiku'], ['mind', 'mind', 'Kapi']] as const) {
    await page.goto(`/?e2e#${route}`);
    await expect(shell(page)).toHaveAttribute('data-area', area);
    await expect(page.getByRole('region', { name: `${friend}'s stage` })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto('/?e2e#plan');
  await expect(shell(page)).toHaveAttribute('data-area', 'plan');
  await page.goto('/?e2e#you');
  await expect(shell(page)).not.toHaveAttribute('data-area', /.+/);
});

test('the main button and the page tint follow the area', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-03T12:00:00'));
  await page.goto('/?e2e#learn');
  const learnTint = await shell(page).evaluate(node => getComputedStyle(node).backgroundColor);
  await page.goto('/?e2e#mind');
  const mindTint = await shell(page).evaluate(node => getComputedStyle(node).backgroundColor);
  expect(learnTint).not.toBe(mindTint);
});

test("Moti's review screens switch to the rose area and hand it back on leaving", async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-03T12:00:00'));
  await page.goto('/?e2e&cap=1#learn/haveli-demo');
  await expect(page.getByRole('region', { name: "Moti's haveli" })).toBeVisible();
  await expect(shell(page)).toHaveAttribute('data-area', 'review');
  await page.goto('/?e2e#learn');
  await expect(shell(page)).toHaveAttribute('data-area', 'learn');
});

test('the night deck keeps its own dark and gives Kachhua a stage', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-04T00:30:00'));
  await page.goto('/?e2e#night');
  await expect(shell(page)).toHaveAttribute('data-area', 'night');
  await expect(page.getByRole('region', { name: "Kachhua's stage" })).toBeVisible();
});
