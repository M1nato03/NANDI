import { expect, test } from '@playwright/test';

// Live QA (build 67): the Board tile opened an intro board, and solving it left "Board: Not done"
// with no way on. The warm-up now says so and leads straight to today's board.
test('a solved warm-up board leads straight to today\'s board', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto('/?e2e#mind');
  await page.getByRole('button', { name: 'Board: not done' }).click();
  await expect(page.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Warm-up board · /)).toBeVisible();
  await page.waitForFunction(() => Boolean((window as Window & { __nandiMindTest?: unknown }).__nandiMindTest));
  await page.evaluate(() => (window as Window & { __nandiMindTest?: { solveKnownSolution: () => void } }).__nandiMindTest!.solveKnownSolution());
  const result = page.getByLabel('Puzzle result');
  await expect(result).toContainText('Warm-up done');
  await result.getByRole('button', { name: "Now today's board" }).click();
  await expect(page.getByText(/Daily board · /)).toBeVisible();
  await expect(page.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
});
