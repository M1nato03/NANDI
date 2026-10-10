/// <reference lib="dom" />
import { expect, test } from '@playwright/test';

for (const scheme of ['light', 'dark'] as const) {
  test(`Mind daily board, saved progress, and offline reload in ${scheme}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/?e2e#mind');
    await page.getByRole('button', { name: 'Open daily board' }).click();
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
    await expect(page.getByLabel('Puzzle result')).toContainText('Board complete');
    await expect(page.getByLabel('Puzzle result')).toContainText('Best');
    await page.getByRole('button', { name: 'Back to Mind' }).click();
    await expect(page.getByRole('heading', { name: "Today's drop complete." })).toBeVisible();

    await page.getByRole('button', { name: 'Practice', exact: true }).click();
    await page.getByRole('heading', { name: 'Mini Sudoku' }).locator('..').getByRole('button', { name: 'easy' }).click();
    const empty = page.getByRole('grid', { name: 'Mini Sudoku board' }).getByRole('button', { name: /empty/ }).first();
    await expect(empty).toBeVisible({ timeout: 30_000 });
    const label = await empty.getAttribute('aria-label');
    await empty.click();
    await page.getByLabel('Number pad').getByRole('button', { name: '1', exact: true }).click();
    await expect(page.getByRole('grid', { name: 'Mini Sudoku board' }).getByRole('button', { name: `${label!.replace(': empty', ': 1')}` })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Practice', exact: true }).click();
    await page.getByRole('heading', { name: 'Mini Sudoku' }).locator('..').getByRole('button', { name: 'easy' }).click();
    await expect(page.getByRole('grid', { name: 'Mini Sudoku board' }).getByRole('button', { name: label!.replace(': empty', ': 1') })).toBeVisible({ timeout: 30_000 });

    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
    await page.context().setOffline(true);
    await page.reload();
    await page.getByRole('button', { name: 'Practice', exact: true }).click();
    await page.getByRole('heading', { name: 'Mini Sudoku' }).locator('..').getByRole('button', { name: 'easy' }).click();
    await expect(page.getByRole('grid', { name: 'Mini Sudoku board' }).getByRole('button', { name: label!.replace(': empty', ': 1') })).toBeVisible({ timeout: 30_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.context().setOffline(false);
    await page.waitForFunction(() => Boolean((window as Window & { __nandiMindTest?: unknown }).__nandiMindTest));
    await page.evaluate(() => (window as Window & { __nandiMindTest?: { solveKnownSolution: () => void } }).__nandiMindTest!.solveKnownSolution());
    await expect(page.getByLabel('Puzzle result')).toBeVisible();
    await page.getByRole('button', { name: 'Back to Mind' }).click();
    await page.getByRole('heading', { name: 'Mini Sudoku' }).locator('..').getByRole('button', { name: 'easy' }).click();
    await expect(page.getByRole('grid', { name: 'Mini Sudoku board' }).getByRole('button', { name: /empty/ }).first()).toBeVisible({ timeout: 30_000 });
  });
}
