import { expect, test } from '@playwright/test';

// Item 177 (Jenil's build 90 screenshots): Plan's success line fades; last night's check-in fits a 360 px phone.
test('the line under Add says what happened, then fades after a few seconds', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-27T15:00:00') });
  await page.goto('/#plan');
  await page.getByLabel('Add a task').fill('Buy milk');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const line = page.getByRole('main').getByRole('status').filter({ hasText: 'Added to Today.' });
  await expect(line).toBeVisible();
  await page.clock.runFor(6_000);
  await expect(line).toHaveCount(0);
});

test("last night's check-in shows its time and range choices in full", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); // no opening animation over the card in the picture
  await page.clock.install({ time: new Date('2026-10-26T15:00:00') });
  await page.goto('/#plan');
  await page.getByLabel('Add a task').fill('Yesterday task');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Today' })).toContainText('Yesterday task');
  await page.clock.setSystemTime(new Date('2026-10-27T08:30:00'));
  await page.reload();
  const card = page.getByRole('region', { name: 'Last night' });
  await expect(card).toBeVisible();
  const cardBox = (await card.boundingBox())!;
  for (const select of await card.locator('select').all()) {
    const box = (await select.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(cardBox.x + cardBox.width);
    // Wide enough for "Choose a time" / "Choose a range" without clipping.
    expect(await select.evaluate(node => node.scrollWidth <= node.clientWidth + 1 && node.clientWidth >= 120)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // The save button keeps the card's normal gap below the last choice (jenil-7b, item 179).
  const lastSelect = (await card.locator('select').last().boundingBox())!;
  const save = (await card.getByRole('button', { name: 'Save last night' }).boundingBox())!;
  expect(save.y - (lastSelect.y + lastSelect.height)).toBeGreaterThanOrEqual(12);
  if (testInfo.project.name === 'mobile-360x800') await card.screenshot({ path: testInfo.outputPath('checkin-360.png') });
});
