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
    await page.screenshot({ path: testInfo.outputPath(`now-task-${scheme}.png`) });

    await page.evaluate(() => {
      const deck = document.querySelector('.deck-screen');
      if (!deck) throw new Error('Deck missing');
      const start = new Touch({ identifier: 1, target: deck, clientX: 150, clientY: 480 });
      const end = new Touch({ identifier: 1, target: deck, clientX: 150, clientY: 200 });
      deck.dispatchEvent(new TouchEvent('touchstart', { touches: [start], bubbles: true }));
      deck.dispatchEvent(new TouchEvent('touchend', { changedTouches: [end], bubbles: true }));
    });
    await expect(page.getByRole('article', { name: 'Move card' })).toContainText('Hostel Bodyweight');
    await page.screenshot({ path: testInfo.outputPath(`now-move-${scheme}.png`) });
    for (const [name, title] of [
      ['Think card', 'Play'],
      ['Notice card', 'clues to follow'],
      ['Learn card', 'learning'],
      ['A little extra card', 'I did it'],
      ['The day is yours card', "That's today."],
    ] as const) {
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByRole('article', { name })).toContainText(title);
      await page.screenshot({ path: testInfo.outputPath(`now-${name.replaceAll(' ', '-').toLowerCase()}-${scheme}.png`) });
    }
    await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: "Plan tomorrow's first step" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`now-end-${scheme}.png`) });

    await tabs.filter({ hasText: 'You' }).click();
    await expect(page.getByRole('heading', { name: 'You', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Train/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Mind & learning/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mastery map' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`you-${scheme}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('after bedtime a missing night plan sits in the deck', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T02:00:00') });
  await page.goto('/#now');
  await expect(page.getByText('1 of 3')).toBeVisible();
  await expect(page.getByRole('article', { name: 'First night card' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('article', { name: 'Lights-out card' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('article', { name: 'Gentle review card' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
});

test('deck cards open the existing Mind activities', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#now');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page.locator('.mind-board')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
  await page.goto('/#now');
  for (let index = 0; index < 3; index++) await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Solve' }).click();
  await expect(page.getByRole('heading', { name: 'Who was where?' })).toBeVisible({ timeout: 30_000 });
});

test('first step starts and finishes inside its card', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#now');
  const card = page.getByRole('article', { name: 'First step card' });
  await card.getByPlaceholder('Name one small task').fill('Write the opening paragraph');
  await card.getByRole('button', { name: 'Add' }).click();
  await expect(card).toContainText('Write the opening paragraph');
  await card.getByRole('button', { name: 'Start' }).click();
  await expect(card.getByRole('timer', { name: 'Focus countdown' })).toBeVisible();
  await page.clock.fastForward(2000);
  await expect(card.getByRole('timer')).toContainText('24:');
  await card.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('button', { name: /Go to card 1: First step, complete/ })).toBeVisible();
});

test('side quest check-in stays on the card', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#now');
  await page.getByRole('button', { name: 'Go to card 6: A little extra' }).click();
  const card = page.getByRole('article', { name: 'A little extra card' });
  await expect(card).toContainText('min');
  await card.getByRole('button', { name: 'I did it' }).click();
  await expect(page.getByRole('status')).toContainText(/Progress saved|Side quest done/);
  await expect(card).toBeVisible();
});

test('Move can begin a ten-minute minimum from the deck', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#now');
  await page.getByRole('button', { name: 'Go to card 2: Move' }).click();
  const card = page.getByRole('article', { name: 'Move card' });
  await expect(card.locator('.deck-exercises li')).toHaveCount(4);
  await card.getByRole('button', { name: 'Just the minimum (10 min)' }).click();
  await expect(page.getByLabel('Minimum session')).toContainText('One set of each movement');
  await expect(page.locator('.train-exercise').first().getByRole('button', { name: 'Log set' })).toHaveCount(1);
});

test('offline notice appears once and Settings has a back route', async ({ page }) => {
  await page.goto('/#now');
  const toast = page.getByRole('status', { name: 'Offline ready' });
  await expect(toast).toBeVisible({ timeout: 30_000 });
  await expect(toast).toBeHidden({ timeout: 10_000 });
  await page.reload();
  await expect(toast).toHaveCount(0);
  await page.getByRole('link', { name: 'You' }).click();
  await expect(page.getByRole('region', { name: 'What your time became this week' })).toBeVisible();
  await page.getByRole('button', { name: /Settings/ }).click();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true, level: 1 })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Night plan setting' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to You' }).click();
  await expect(page.getByRole('heading', { name: 'You', exact: true })).toBeVisible();
});
