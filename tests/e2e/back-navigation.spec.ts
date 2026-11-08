import { expect, test } from '@playwright/test';
import { todaysBoard } from './helpers/mind';

test('tabs and Today dots navigate to feature homes at phone size', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#plan');
  // Spec 571 stage 2: tabs Courtyard · Yatra · Grow · You; the rings' lines lead to Yatra and to Grow › Read.
  const heading: Record<string, string> = { Courtyard: 'Courtyard', Grow: 'Grow', Yatra: 'Plan', You: 'You' };
  for (const name of ['Courtyard', 'Grow', 'Yatra', 'You']) {
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name }).click();
    await expect(page.getByRole('heading', { name: heading[name], exact: true })).toBeAttached();
  }
  for (const [ring, open, route] of [['Yatra: keep one promise.', 'Open Yatra', /#yatra$/], ['Mind: any two.', 'Open Read', /#grow\/read$/]] as const) {
    await page.getByRole('button', { name: ring }).click();
    await page.locator('.today-rings-line').getByRole('button', { name: open }).click();
    await expect(page).toHaveURL(route);
  }
  const sizes = await page.locator('.today-ring, .tabbar a').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  expect(sizes.every(size => size.width >= 43.5 && size.height >= 43.5)).toBe(true);
});

test('browser Back restores the Mind board and saved puzzle progress', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#grow/play');
  await todaysBoard(page).click();
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
  await expect(page.getByRole('heading', { name: 'Play', exact: true })).toBeVisible();
  await todaysBoard(page).click();
  await expect(board.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
  expect(await board.locator('.mind-grid button').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')))).toEqual(cells);
  const back = await page.getByRole('button', { name: 'Back to Play' }).boundingBox();
  // 43.5: a box measured while the page fades in (spec 45a) can read 43.99 px.
  expect(back && back.width >= 43.5 && back.height >= 43.5, JSON.stringify(back)).toBe(true);
});
