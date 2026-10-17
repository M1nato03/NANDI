import { expect, test } from '@playwright/test';

async function swipeDown(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const deck = document.querySelector('.deck-screen');
    if (!deck) throw new Error('Deck missing');
    const start = new Touch({ identifier: 1, target: deck, clientX: 150, clientY: 200 });
    const end = new Touch({ identifier: 1, target: deck, clientX: 150, clientY: 480 });
    deck.dispatchEvent(new TouchEvent('touchstart', { touches: [start], bubbles: true }));
    deck.dispatchEvent(new TouchEvent('touchend', { changedTouches: [end], bubbles: true }));
  });
}

test('deck Back, downward swipe, dashes and end card work at phone size', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#now');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('4 of 7')).toBeVisible();
  // The text Back link was removed in the redesign; the dots and a downward swipe go back.
  await page.getByRole('button', { name: /^Go to card 3:/ }).click();
  await swipeDown(page);
  await expect(page.getByText('2 of 7')).toBeVisible();
  await swipeDown(page);
  await expect(page.getByText('1 of 7')).toBeVisible();
  await page.getByRole('button', { name: 'Go to card 7: The day is yours' }).click();
  await expect(page.getByText('7 of 7')).toBeVisible();
  await page.getByRole('button', { name: 'Back to cards' }).click();
  await expect(page.getByText('6 of 7')).toBeVisible();
  const sizes = await page.locator('.deck-dashes button, .deck-back, .deck-next').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  expect(sizes.every(size => size.width >= 44 && size.height >= 44)).toBe(true);
});

test('browser Back restores the deck card and saved puzzle progress', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#now');
  await page.getByRole('button', { name: 'Go to card 3: Think' }).click();
  await page.getByRole('button', { name: 'Play' }).click();
  const board = page.locator('.mind-board');
  await expect(board.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
  const before = await board.locator('.mind-grid button').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')));
  await board.getByRole('button', { name: 'Hint' }).click();
  await expect(board).toHaveAttribute('data-save-state', 'saved');
  const cells = await board.locator('.mind-grid button').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')));
  expect(cells).not.toEqual(before);
  await page.goBack();
  await expect(page.getByText('3 of 7')).toBeVisible();
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(board.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
  expect(await board.locator('.mind-grid button').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')))).toEqual(cells);
  await expect(page.getByRole('button', { name: 'Back to Now' })).toBeVisible();
  const back = await page.getByRole('button', { name: 'Back to Now' }).boundingBox();
  expect(back && back.width >= 44 && back.height >= 44).toBe(true);
});

test('browser Back returns from the Practice hub daily board', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-11T12:00:00'));
  await page.goto('/#you/mind');
  await page.getByRole('button', { name: 'Board: not done' }).click();
  await expect(page.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Mind & learning' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Board: not done' })).toBeVisible();
});
