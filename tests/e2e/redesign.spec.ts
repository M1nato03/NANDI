import { expect, test } from '@playwright/test';

for (const scheme of ['light', 'dark'] as const) {
  test(`three-tab deck and Plan in ${scheme}`, async ({ page }, testInfo) => {
    await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/#plan');
    const offlineReady = page.getByRole('status', { name: 'Offline ready' });
    await expect(offlineReady).toBeVisible({ timeout: 30_000 });
    await page.clock.fastForward(4500);
    await expect(offlineReady).toBeHidden({ timeout: 10_000 });
    const tabs = page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link');
    await expect(tabs).toHaveCount(3);
    await expect(tabs).toHaveText(['Now', 'Plan', 'You']);

    const add = page.getByPlaceholder('Add a task, e.g. call bank 15m');
    await add.fill('Call bank 15m');
    await page.getByRole('heading', { name: 'Plan', exact: true }).click();
    await expect(page.getByLabel('Minutes')).toHaveValue('15');
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Today' })).toContainText('Call bank');
    await expect(page.getByRole('main').getByText('Call bank', { exact: true })).toHaveCount(1);
    await page.screenshot({ path: testInfo.outputPath(`plan-${scheme}.png`), fullPage: true });

    await tabs.filter({ hasText: 'Now' }).click();
    await expect(page.getByRole('article', { name: 'First step card' })).toContainText('Call bank');
    await expect(page.getByRole('main').getByText('Call bank', { exact: true })).toHaveCount(1);
    await expect(page.getByText('1 of 7')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`now-task-${scheme}.png`), fullPage: true });

    await page.evaluate(() => {
      const deck = document.querySelector('.deck-screen');
      if (!deck) throw new Error('Deck missing');
      const start = new Touch({ identifier: 1, target: deck, clientX: 150, clientY: 480 });
      const end = new Touch({ identifier: 1, target: deck, clientX: 150, clientY: 200 });
      deck.dispatchEvent(new TouchEvent('touchstart', { touches: [start], bubbles: true }));
      deck.dispatchEvent(new TouchEvent('touchend', { changedTouches: [end], bubbles: true }));
    });
    await expect(page.getByRole('article', { name: 'Move card' })).toContainText("Today's workout");
    for (const [name, title] of [
      ['Think card', "Today's puzzle board"],
      ['Notice card', "Today's mystery case"],
      ['Learn card', 'learning'],
      ['A little extra card', 'Side quest'],
      ['The day is yours card', "That's today."],
    ] as const) {
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByRole('article', { name })).toContainText(title);
    }
    await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: "Plan tomorrow's first step" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`now-end-${scheme}.png`), fullPage: true });

    await tabs.filter({ hasText: 'You' }).click();
    await expect(page.getByRole('heading', { name: 'You', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Train/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Mind & learning/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mastery map' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`you-${scheme}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('after bedtime the deck has only lights-out and reviews', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T02:00:00') });
  await page.goto('/#now');
  await expect(page.getByText('1 of 2')).toBeVisible();
  await expect(page.getByRole('article', { name: 'Lights-out card' })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('article', { name: 'Gentle review card' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
});

test('deck cards open the existing Mind activities', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#now');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Open board' }).click();
  await expect(page.locator('.mind-board')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
  await page.goto('/#now');
  for (let index = 0; index < 3; index++) await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Open case' }).click();
  await expect(page.getByRole('heading', { name: 'Who was where?' })).toBeVisible({ timeout: 30_000 });
});
