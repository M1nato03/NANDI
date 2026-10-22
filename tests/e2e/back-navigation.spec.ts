import { expect, test } from '@playwright/test';

test('tabs and Today dots navigate to feature homes at phone size', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#plan');
  const names = ['Plan', 'Train', 'Learn', 'Mind', 'You'];
  for (const name of names) {
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name }).click();
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  for (const name of names.slice(0, 4)) {
    await page.getByRole('button', { name: `${name}: not done` }).click();
    await expect(page).toHaveURL(new RegExp(`#${name.toLowerCase()}$`));
  }
  const sizes = await page.locator('.today-dot, .tabbar a').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  expect(sizes.every(size => size.width >= 44 && size.height >= 44)).toBe(true);
});

test('browser Back restores the Mind board and saved puzzle progress', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#mind');
  await page.getByRole('button', { name: 'Board Not done' }).click();
  const board = page.locator('.mind-board');
  await expect(board.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
  const before = await board.locator('.mind-grid button').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')));
  await board.getByRole('button', { name: 'Hint' }).click();
  await board.getByRole('button', { name: 'Hint' }).click();
  await board.getByRole('button', { name: 'Hint' }).click();
  await expect(board).toHaveAttribute('data-save-state', 'saved');
  const cells = await board.locator('.mind-grid button').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')));
  expect(cells).not.toEqual(before);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Mind', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Board Not done' }).click();
  await expect(board.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
  expect(await board.locator('.mind-grid button').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')))).toEqual(cells);
  const back = await page.getByRole('button', { name: 'Back to Mind' }).boundingBox();
  expect(back && back.width >= 44 && back.height >= 44).toBe(true);
});
