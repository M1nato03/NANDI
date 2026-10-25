import { expect, test } from '@playwright/test';
import { openMoreBoards } from './helpers/mind';

const openSudoku = async (page: import('@playwright/test').Page) => {
  await page.clock.setFixedTime(new Date('2026-11-02T12:00:00'));
  await page.goto('/?e2e#mind');
  await openMoreBoards(page);
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.getByRole('heading', { name: 'Mini Sudoku' }).locator('..').getByRole('button', { name: 'easy' }).click();
  await expect(page.getByRole('group', { name: 'Mini Sudoku board' })).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => Boolean((window as Window & { __nandiMindTest?: unknown }).__nandiMindTest));
};

test('three hint taps show a nudge, a technique and one move', async ({ page }) => {
  await openSudoku(page);
  await page.getByRole('button', { name: 'Hint' }).click();
  await expect(page.getByText(/^Look at row \d/)).toBeVisible();
  await expect(page.locator('.mind-grid .hint-focus').first()).toBeVisible();
  await page.getByRole('button', { name: 'Hint' }).click();
  await expect(page.getByText(/(?:Naked single|Hidden single): 4×4:/)).toBeVisible();
  await page.getByRole('button', { name: 'Hint' }).click();
  await expect(page.getByText(/^Move: row \d/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a correctly used technique unlocks after solve and survives reload and backup', async ({ page }) => {
  await openSudoku(page);
  const deduction = await page.evaluate(() => (window as Window & { __nandiMindTest?: { nextDeduction: () => { cell: number; value: number; technique: string } } }).__nandiMindTest!.nextDeduction());
  expect(deduction).toBeTruthy();
  await page.getByRole('group', { name: 'Mini Sudoku board' }).locator('.mind-cell').nth(deduction.cell).click();
  await page.getByLabel('Number pad').getByRole('button', { name: String(deduction.value), exact: true }).click();
  await expect(page.locator('.mind-board')).toHaveAttribute('data-save-state', 'saved');
  await page.evaluate(() => (window as Window & { __nandiMindTest?: { solveKnownSolution: () => void } }).__nandiMindTest!.solveKnownSolution());
  await expect(page.getByLabel('Puzzle result')).toContainText('New technique card');
  await expect(page.locator('.mind-board')).toHaveAttribute('data-save-state', 'saved');
  await page.getByRole('button', { name: 'Back to Mind' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Mind', exact: true })).toBeVisible({ timeout: 30_000 });
  await page.evaluate(() => (window as Window & { __nandiTest?: { roundTripCurrent: () => Promise<void> } }).__nandiTest!.roundTripCurrent());
  // A real restore runs from the Backup screen and screens mount fresh afterwards; reload to match.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Mind', exact: true })).toBeVisible({ timeout: 30_000 });
  await openMoreBoards(page);
  await page.getByText('Technique cards', { exact: true }).click();
  const card = page.locator('.mind-technique-list article').filter({ has: page.getByRole('heading', { name: deduction.technique, exact: true }) });
  await expect(card).not.toContainText('Solve to unlock');
});

test('solving a case reveals the next story panel', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-02T12:00:00'));
  await page.goto('/?e2e#mind');
  await page.getByRole('button', { name: 'Case Not done' }).click();
  await page.waitForFunction(() => Boolean((window as Window & { __nandiCaseTest?: unknown }).__nandiCaseTest));
  await page.evaluate(() => (window as Window & { __nandiCaseTest?: { solveTodaysCase: () => void } }).__nandiCaseTest!.solveTodaysCase());
  await expect(page.getByRole('heading', { name: 'Case closed.' })).toBeVisible();
  await expect(page.locator('.mind-story-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Back to Mind' }).click();
  await page.getByText(/^Story so far/).click();
  await expect(page.locator('.mind-story article')).toHaveCount(1);
});

test('share is hidden after bedtime with the clock pinned', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-02T12:00:00'));
  await page.goto('/?e2e#mind');
  await page.getByRole('button', { name: 'Case Not done' }).click();
  await page.waitForFunction(() => Boolean((window as Window & { __nandiCaseTest?: unknown }).__nandiCaseTest));
  await page.clock.setFixedTime(new Date('2026-11-02T23:30:00'));
  await page.clock.runFor(1100);
  await page.evaluate(() => (window as Window & { __nandiCaseTest?: { solveTodaysCase: () => void } }).__nandiCaseTest!.solveTodaysCase());
  await expect(page.getByRole('heading', { name: 'Case closed.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share result' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Share as image' })).toHaveCount(0);
});
