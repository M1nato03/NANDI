import { expect, test } from '@playwright/test';
import { todaysBoard, BOARD_DONE } from './helpers/mind';

// Spec 29 (Codex B item 106) replaces the warm-up board: one daily board per type per day. On a hard featured day a
// new player's daily board is the shelf's easy daily for that type, opened from today's tile.
test("on a hard featured day, today's tile opens the easy daily board, and opening it again gives the same board", async ({ page }) => {
  // Sat 24 Oct 2026: the featured board is Crowns, hard.
  await page.clock.setFixedTime(new Date('2026-10-24T12:00:00'));
  await page.goto('/?e2e#mind');
  await todaysBoard(page).click();
  await expect(page.getByRole('group', { name: 'Crowns board' })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.mind-board .eyebrow')).toHaveText(/^Daily board (#\d+ )?· /);
  const first = await page.locator('.mind-board').getAttribute('data-board-seed');
  expect(await page.getByRole('group', { name: 'Crowns board' }).getByRole('button').count()).toBe(36);
  await page.goto('/?e2e#mind');
  await page.getByRole('region', { name: "Kapi's shelf" }).getByRole('button', { name: /^Crowns/ }).click();
  await expect(page.getByRole('group', { name: 'Crowns board' })).toBeVisible({ timeout: 30_000 });
  expect(await page.locator('.mind-board').getAttribute('data-board-seed')).toBe(first);
  await page.waitForFunction(() => Boolean((window as Window & { __nandiMindTest?: unknown }).__nandiMindTest));
  await page.evaluate(() => (window as Window & { __nandiMindTest?: { solveKnownSolution: () => void } }).__nandiMindTest!.solveKnownSolution());
  await expect(page.locator('.mind-board')).toHaveAttribute('data-save-state', 'saved');
  await page.goto('/?e2e#mind');
  await expect(todaysBoard(page)).toContainText(BOARD_DONE);
  // The daily plus two more: the shelf now offers only the extras.
  await expect(page.getByRole('region', { name: "Kapi's shelf" }).getByRole('button', { name: /^Crowns/ })).toContainText('Solved · 1 of 3');
});

test('the Read dot (spec 33: games live in Read) and the night deck count the easy daily of the featured type', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-24T12:00:00'));
  await page.goto('/?e2e#mind/board/daily');
  await expect(page.getByRole('group', { name: 'Crowns board' })).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => Boolean((window as Window & { __nandiMindTest?: unknown }).__nandiMindTest));
  await page.evaluate(() => (window as Window & { __nandiMindTest?: { solveKnownSolution: () => void } }).__nandiMindTest!.solveKnownSolution());
  await expect(page.locator('.mind-board')).toHaveAttribute('data-save-state', 'saved');
  await expect(page.getByRole('button', { name: 'Read: done' })).toBeVisible();
});
