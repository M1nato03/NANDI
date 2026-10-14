/// <reference lib="dom" />
import { expect, test } from '@playwright/test';

for (const scheme of ['light', 'dark'] as const) {
  test(`daily routine and four pillars in ${scheme}`, async ({ page }, testInfo) => {
    await page.clock.install({ time: new Date('2026-10-13T12:00:00') });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/#plan');
    const offlineReady = page.getByRole('status', { name: 'Offline ready' });
    await expect(offlineReady).toBeVisible({ timeout: 30_000 });
    await page.clock.fastForward(4500);
    await expect(offlineReady).toBeHidden({ timeout: 10_000 });
    const tabs = page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link');
    await expect(tabs).toHaveText(['Now', 'Plan', 'You']);
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Call bank 15m');
    await page.getByRole('heading', { name: 'Plan', exact: true }).click();
    await expect(page.getByLabel('Minutes')).toHaveValue('15');
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Today' })).toContainText('Call bank');
    await tabs.filter({ hasText: 'Now' }).click();
    await expect(page.getByRole('article', { name: 'Plan your day card' })).toContainText('1 task planned');
    await expect(page.getByText('1 of 9')).toBeVisible();
    const nextBox = await page.getByRole('button', { name: 'Next', exact: true }).boundingBox();
    const navBox = await page.getByRole('navigation', { name: 'Main tabs' }).boundingBox();
    expect(nextBox!.y + nextBox!.height).toBeLessThanOrEqual(navBox!.y);
    await page.screenshot({ path: testInfo.outputPath(`now-plan-${scheme}.png`), fullPage: true });
    await page.evaluate(() => {
      const deck = document.querySelector('.deck-screen')!;
      deck.dispatchEvent(new TouchEvent('touchstart', { touches: [new Touch({ identifier: 1, target: deck, clientX: 150, clientY: 480 })], bubbles: true }));
      deck.dispatchEvent(new TouchEvent('touchend', { changedTouches: [new Touch({ identifier: 1, target: deck, clientX: 150, clientY: 200 })], bubbles: true }));
    });
    await expect(page.getByRole('article', { name: 'Move card' })).toContainText("Today's workout");
    for (const [name, title] of [
      ['Settle card', 'A few quiet minutes.'],
      ['Your tasks card', 'Call bank'],
      ['In your free time card', 'learning'],
      ['Think card', "Today's puzzle board"],
      ['Notice card', "Today's mystery case"],
      ['A little extra card', 'Side quest'],
      ['The day is yours card', "That's today."],
    ] as const) {
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(page.getByRole('article', { name })).toContainText(title);
    }
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toHaveCount(0);
    await expect(page.getByText('One more puzzle, just for fun')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath(`now-end-${scheme}.png`), fullPage: true });
    await tabs.filter({ hasText: 'You' }).click();
    await expect(page.locator('.you-links strong')).toHaveText(['Plan', 'Train', 'Mind', 'Learn']);
    await expect(page.getByLabel("Today's progress")).toContainText('0 tasks done');
    await page.screenshot({ path: testInfo.outputPath(`you-${scheme}.png`), fullPage: true });
    await page.getByRole('button', { name: /Clarity Mind/ }).click();
    await expect(page.getByRole('heading', { name: 'Mind', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open meditation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: "Today's lesson" })).toHaveCount(0);
    await page.goto('/#you/learn');
    await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: "Today's lesson" })).toBeVisible();
    await expect(page.getByRole('heading', { name: "Today's board" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`learn-${scheme}.png`), fullPage: true });
  });
}

test('night routine leads to tomorrow, meditation and a stopping point', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-13T02:00:00') });
  await page.goto('/#now');
  await expect(page.getByText('1 of 3')).toBeVisible();
  await expect(page.getByRole('article', { name: 'Plan tonight card' })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('article', { name: 'Settle card' })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('article', { name: 'Lights-out card' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open reviews' })).toHaveCount(0);
});

test('optional puzzle cards still open the existing activities', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-13T12:00:00') });
  await page.goto('/#now');
  for (let step = 0; step < 5; step++) await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Open board' }).click();
  await expect(page.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
  await page.goto('/#now');
  for (let step = 0; step < 6; step++) await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Open case' }).click();
  await expect(page.getByRole('heading', { name: 'Who was where?' })).toBeVisible({ timeout: 30_000 });
});
