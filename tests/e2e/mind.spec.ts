/// <reference lib="dom" />
import { expect, test } from '@playwright/test';
import { openMoreBoards } from './helpers/mind';

test('daily case grid contrast and layout', async ({ page }, testInfo) => {
  await page.clock.setFixedTime(new Date('2026-10-11T12:00:00'));
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/#mind');
  await page.getByRole('button', { name: 'Case Not done' }).click();
  const grid = page.locator('.case-grid').first();
  await expect(grid).toBeVisible({ timeout: 30_000 });
  const blank = grid.locator('.case-blank').first();
  await expect(blank).toHaveCSS('background-color', 'rgb(30, 32, 39)');
  await blank.click();
  await expect(grid.locator('.case-no').first()).toBeVisible();
  await grid.locator('.case-no').first().click();
  await expect(grid.locator('.case-yes').first()).toBeVisible();
  const sizes = await page.locator('.case-cell').evaluateAll(cells => cells.map(cell => cell.getBoundingClientRect()).every(rect => rect.width >= 44 && rect.height >= 44));
  expect(sizes).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const gap = await page.evaluate(() => {
    const heading = document.querySelector('.case-accusation-heading')!.getBoundingClientRect();
    const clear = [...document.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Clear grid')!.getBoundingClientRect();
    return heading.top - clear.bottom;
  });
  expect(gap).toBeGreaterThan(16);
  if (testInfo.project.name === 'mobile-390x844') {
    await page.screenshot({ path: 'screenshots/case-grid-390x844.png', fullPage: true });
  }
});

test('Practice hub shows daily status, destinations and fits a phone', async ({ page }, testInfo) => {
  await page.clock.setFixedTime(new Date('2026-10-11T12:00:00'));
  await page.goto('/#mind');
  await expect(page.getByRole('heading', { name: 'Mind', exact: true })).toBeVisible();
  for (const name of ['Case Not done', 'Board Not done']) await expect(page.getByRole('button', { name })).toBeVisible();
  await openMoreBoards(page);
  await expect(page.getByRole('heading', { name: 'Practice boards' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Card reviews' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toHaveCount(0);
  await expect(page.getByText('4 left:', { exact: false })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (testInfo.project.name === 'mobile-390x844') await page.screenshot({ path: 'screenshots/mind-hub-390x844.png', fullPage: true });
  await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Learn' }).click();
  await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeVisible();
});

for (const scheme of ['light', 'dark'] as const) {
  test(`practice board screenshots in ${scheme}`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.clock.setFixedTime(new Date('2026-10-11T12:00:00'));
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/#mind');
    await openMoreBoards(page);
    await page.getByRole('button', { name: 'Practice', exact: true }).click();
    const boards = [
      { name: 'Mini Sudoku', grid: 'Mini Sudoku board', slug: 'sudoku', difficulty: 'easy' },
      { name: 'Crowns', grid: 'Crowns board', slug: 'crowns', difficulty: 'hard' },
      { name: 'Sun & Moon', grid: 'Sun and Moon board', slug: 'sunmoon', difficulty: 'easy' },
      { name: 'Number Path', grid: 'Number Path board', slug: 'path', difficulty: 'easy' },
      { name: 'Calcudoku', grid: 'Calcudoku board', slug: 'calc', difficulty: 'easy' },
    ];
    for (const board of boards) {
      await page.getByRole('heading', { name: board.name }).locator('..').getByRole('button', { name: board.difficulty }).click();
      const grid = page.getByRole('group', { name: board.grid });
      await expect(grid).toBeVisible({ timeout: 30_000 });
      if (board.slug === 'crowns') {
        const first = grid.locator('.mind-cell').first();
        await first.click();
        await first.click();
        await expect(first).toHaveAttribute('aria-label', /crown$/);
        const colors = await grid.locator('.mind-cell').evaluateAll(cells => new Set(cells.map(cell => getComputedStyle(cell).backgroundColor)).size);
        expect(colors).toBe(8);
      }
      await page.screenshot({ path: testInfo.outputPath(`mind-${board.slug}-${scheme}.png`), fullPage: true });
      await page.getByRole('button', { name: 'Back to Mind' }).click();
    }
  });

  test(`Mind daily board, saved progress, and offline reload in ${scheme}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.clock.setFixedTime(new Date('2026-10-11T12:00:00'));
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/?e2e#mind');
    await page.getByRole('button', { name: 'Board Not done' }).click();
    await expect(page.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => Boolean((window as Window & { __nandiMindTest?: unknown }).__nandiMindTest));
    await expect(page.locator('html')).toHaveCSS('color-scheme', scheme);
    await page.screenshot({ path: testInfo.outputPath(`mind-board-${scheme}.png`), fullPage: true });
    const sizing = await page.evaluate(() => {
      const grid = document.querySelector('.mind-grid')!;
      const cells = [...grid.querySelectorAll<HTMLButtonElement>('.mind-cell')];
      const n = Number((grid as HTMLElement).style.gridTemplateColumns.match(/repeat\((\d+)/)?.[1] ?? 6);
      const available = grid.getBoundingClientRect().width / n;
      const controls = [...document.querySelectorAll<HTMLButtonElement>('.mind-board button:not(.mind-cell)')];
      return {
        cells: cells.every(cell => cell.getBoundingClientRect().width + 1 >= Math.min(44, available)),
        controls: controls.every(control => control.getBoundingClientRect().height >= 44 && control.getBoundingClientRect().width >= 44),
        noScroll: document.documentElement.scrollWidth <= innerWidth,
      };
    });
    expect(sizing).toEqual({ cells: true, controls: true, noScroll: true });
    await page.evaluate(() => (window as Window & { __nandiMindTest?: { solveKnownSolution: () => void } }).__nandiMindTest!.solveKnownSolution());
    // A new user's first board is the warm-up (live QA, build 67).
    await expect(page.getByLabel('Puzzle result')).toContainText('Warm-up done');
    await expect(page.getByLabel('Puzzle result')).toContainText('Best');
    await expect(page.locator('.mind-board')).toHaveAttribute('data-save-state', 'saved');
    await page.getByRole('button', { name: 'Back to Mind' }).click();
    await openMoreBoards(page);
    await expect(page.getByText('Best times')).toBeVisible();
    await expect(page.locator('.mind-best-times')).toContainText('0:');
    await page.getByRole('button', { name: /^Board (Not done|Done)$/ }).click();
    await expect(page.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => Boolean((window as Window & { __nandiMindTest?: unknown }).__nandiMindTest));
    await page.evaluate(() => (window as Window & { __nandiMindTest?: { solveKnownSolution: () => void } }).__nandiMindTest!.solveKnownSolution());
    await expect(page.locator('.mind-board')).toHaveAttribute('data-save-state', 'saved');
    await page.getByRole('button', { name: 'Back to Mind' }).click();
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Learn' }).click();
    await page.getByText('Courses', { exact: true }).click();
    await expect(page.getByRole('heading', { name: "Today's lesson" })).toBeVisible();
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Mind' }).click();

    await openMoreBoards(page);

    await page.getByRole('button', { name: 'Practice', exact: true }).click();
    await page.getByRole('heading', { name: 'Mini Sudoku' }).locator('..').getByRole('button', { name: 'easy' }).click();
    const empty = page.getByRole('group', { name: 'Mini Sudoku board' }).getByRole('button', { name: /empty/ }).first();
    await expect(empty).toBeVisible({ timeout: 30_000 });
    const label = await empty.getAttribute('aria-label');
    await empty.click();
    await page.getByLabel('Number pad').getByRole('button', { name: '1', exact: true }).click();
    await expect(page.getByRole('group', { name: 'Mini Sudoku board' }).getByRole('button', { name: `${label!.replace(': empty', ': 1')}` })).toBeVisible();
    await expect(page.locator('.mind-board')).toHaveAttribute('data-save-state', 'saved');
    await page.reload();
    // The bookmarked board route now resumes directly after reload.
    await expect(page.getByRole('group', { name: 'Mini Sudoku board' }).getByRole('button', { name: label!.replace(': empty', ': 1') })).toBeVisible({ timeout: 30_000 });

    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 60_000 });
    await expect(page.locator('.mind-board')).toHaveAttribute('data-save-state', 'saved');
    await page.context().setOffline(true);
    await page.reload();
    await expect(page.getByRole('group', { name: 'Mini Sudoku board' }).getByRole('button', { name: label!.replace(': empty', ': 1') })).toBeVisible({ timeout: 30_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.context().setOffline(false);
    await page.waitForFunction(() => Boolean((window as Window & { __nandiMindTest?: unknown }).__nandiMindTest));
    await page.evaluate(() => (window as Window & { __nandiMindTest?: { solveKnownSolution: () => void } }).__nandiMindTest!.solveKnownSolution());
    await expect(page.getByLabel('Puzzle result')).toBeVisible();
    await page.getByRole('button', { name: 'Back to Mind' }).click();
    await page.getByRole('heading', { name: 'Mini Sudoku' }).locator('..').getByRole('button', { name: 'easy' }).click();
    await expect(page.getByRole('group', { name: 'Mini Sudoku board' }).getByRole('button', { name: /empty/ }).first()).toBeVisible({ timeout: 30_000 });
  });
}
