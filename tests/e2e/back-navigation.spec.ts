import { expect, test } from '@playwright/test';
import { todaysBoard } from './helpers/mind';

test('tabs and Today dots navigate to feature homes at phone size', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#plan');
  // Spec 33: three tabs (Read's heading is "Your books") and three dots: Plan, Read, Night.
  const heading: Record<string, string> = { Plan: 'Plan', Read: 'Your books', You: 'You' };
  for (const name of ['Plan', 'Read', 'Yatra', 'You']) {
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name }).click();
    await expect(page.getByRole('heading', { name: heading[name], exact: true })).toBeVisible();
  }
  for (const name of ['Plan', 'Read']) {
    await page.getByRole('button', { name: `${name}: not done` }).click();
    await expect(page).toHaveURL(new RegExp(`#${name.toLowerCase()}$`));
  }
  const sizes = await page.locator('.today-dot, .tabbar a').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  expect(sizes.every(size => size.width >= 43.5 && size.height >= 43.5)).toBe(true);
});

test('browser Back restores the Mind board and saved puzzle progress', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#mind');
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
  await expect(page.getByRole('heading', { name: "Kapi's shelf", exact: true })).toBeVisible();
  await todaysBoard(page).click();
  await expect(board.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
  expect(await board.locator('.mind-grid button').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')))).toEqual(cells);
  const back = await page.getByRole('button', { name: "Back to Kapi's shelf" }).boundingBox();
  // 43.5: a box measured while the page fades in (spec 45a) can read 43.99 px.
  expect(back && back.width >= 43.5 && back.height >= 43.5, JSON.stringify(back)).toBe(true);
});
