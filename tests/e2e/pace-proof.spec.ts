import { expect, test, type Page } from '@playwright/test';
import { openMoreBoards } from './helpers/mind';

// Spec 24 Mind: the pace line (cj5-mind §7.1) and Prove it (§7.2). Both are optional, day-window only, and pay 0 XP.
const marks = 'p' + Array.from({ length: 10 }, (_, index) => ((index + 1) * 5).toString(36).padStart(3, '0')).join('');

const openPractice = async (page: Page) => {
  await openMoreBoards(page);
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.getByRole('heading', { name: 'Mini Sudoku' }).locator('..').getByRole('button', { name: 'easy' }).click();
  await expect(page.getByRole('group', { name: 'Mini Sudoku board' })).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => Boolean(window.__nandiMindTest));
};

test('the pace line is opt-in, remembered, compares with your best, and hides after bedtime', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-02T12:00:00'));
  await page.goto('/?e2e#mind');
  await openPractice(page);
  // No earlier run with marks yet, so there is nothing to compare with.
  await expect(page.getByRole('button', { name: 'Show pace' })).toHaveCount(0);
  await page.evaluate(() => window.__nandiMindTest!.solveKnownSolution());
  await expect(page.getByLabel('Puzzle result')).toBeVisible();
  await expect(page.locator('.mind-board')).toHaveAttribute('data-save-state', 'saved');
  // A second practice board of the same type and difficulty (the route picks the next attempt).
  await page.goto('/?e2e#mind/board/sudoku/easy');
  await page.reload();
  await expect(page.getByRole('group', { name: 'Mini Sudoku board' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel('Puzzle result')).toHaveCount(0);
  const boardTop = async () => (await page.getByRole('group', { name: 'Mini Sudoku board' }).boundingBox())!.y;
  const before = await boardTop();
  await page.getByRole('button', { name: 'Show pace' }).click();
  await expect(page.getByRole('img', { name: /^Your best Mini Sudoku easy pace\./ })).toBeVisible();
  // One slim row with the timer: the board does not move down (Codex A item 77).
  expect(Math.abs((await boardTop()) - before)).toBeLessThanOrEqual(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // Your dot never moves back: fill one cell, then Restart.
  const deduction = await page.evaluate(() => (window as Window & { __nandiMindTest?: { nextDeduction: () => { cell: number; value: number } } }).__nandiMindTest!.nextDeduction());
  await page.getByRole('group', { name: 'Mini Sudoku board' }).locator('.mind-cell').nth(deduction.cell).click();
  await page.getByLabel('Number pad').getByRole('button', { name: String(deduction.value), exact: true }).click();
  const left = () => page.locator('.mind-pace-you').evaluate(node => parseFloat((node as HTMLElement).style.left));
  await expect.poll(left).toBeGreaterThan(0);
  const reached = await left();
  await page.getByRole('button', { name: 'Restart' }).click();
  await expect(page.locator('.mind-board')).toHaveAttribute('data-save-state', 'saved');
  expect(await left()).toBe(reached);
  await page.reload();
  await expect(page.getByRole('group', { name: 'Mini Sudoku board' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Hide pace' })).toBeVisible();
  // After a reload the dot starts where it got to, not at zero.
  expect(await left()).toBe(reached);
  // Hidden in wind-down (from 23:15) and after bedtime (01:30).
  await page.clock.setFixedTime(new Date('2026-11-02T23:30:00'));
  await page.clock.runFor(1100);
  await expect(page.locator('.mind-pace-box')).toHaveCount(0);
  await page.clock.setFixedTime(new Date('2026-11-03T02:00:00'));
  await page.clock.runFor(1100);
  await expect(page.locator('.mind-pace-box')).toHaveCount(0);
});

test('with large text (20 px root) the pace row fits above the board without clipping (Codex A items 79, 80; spec 29)', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-02T12:00:00'));
  await page.goto(`/?e2e#mind/challenge/sudoku/easy/12345/${marks}`);
  await expect(page.getByRole('group', { name: 'Mini Sudoku board' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Show pace' }).click();
  await expect(page.locator('.mind-pace-track')).toBeVisible();
  // Spec 29: no timer while playing, so the opt-in pace box has the row to itself, above the board, at any text size.
  await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
  const board = (await page.getByRole('group', { name: 'Mini Sudoku board' }).boundingBox())!;
  const pace = (await page.locator('.mind-pace-box').boundingBox())!;
  expect(pace.y + pace.height).toBeLessThanOrEqual(board.y);
  await expect(page.locator('.mind-timer')).toHaveCount(0);
  const width = page.viewportSize()!.width;
  for (const selector of ['.mind-pace-track', '.mind-pace-key', '.mind-pace-toggle']) {
    const box = (await page.locator(selector).boundingBox())!;
    expect(box.x, selector).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, selector).toBeLessThanOrEqual(width);
  }
  expect((await page.locator('.mind-pace-track').boundingBox())!.width).toBeGreaterThanOrEqual(60);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // The key text grows with the root size: 0.75rem at 20 px is 15 px.
  expect(await page.locator('.mind-pace-key').evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBe(15);
});

test('under reduced motion the pace line is one still line of text', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.setFixedTime(new Date('2026-11-02T12:00:00'));
  await page.goto(`/?e2e#mind/challenge/sudoku/easy/12345/${marks}`);
  await expect(page.getByRole('group', { name: 'Mini Sudoku board' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Show pace' }).click();
  await expect(page.locator('.mind-pace-still')).toHaveText('Your friend: 0:50');
  await expect(page.locator('.mind-pace-dot')).toHaveCount(0);
});

test("a friend's link carries their pace; the finish shows their time and the reply link carries yours", async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-02T12:00:00'));
  await page.goto(`/?e2e#mind/challenge/sudoku/easy/12345/${marks}`);
  await expect(page.getByRole('group', { name: 'Mini Sudoku board' })).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => Boolean(window.__nandiMindTest));
  await page.getByRole('button', { name: 'Show pace' }).click();
  await expect(page.getByRole('img', { name: /^Your friend on this board\./ })).toBeVisible();
  await page.evaluate(() => window.__nandiMindTest!.solveKnownSolution());
  const result = page.getByLabel('Puzzle result');
  await expect(result).toContainText('Your friend took 0:50 on this board.');
  await expect(result.locator('.mind-share-text')).toContainText(/\/sudoku\/easy\/12345\/p[0-9a-z]{30}/);
});

test('Prove it: a short pick shows what still fits, a real proof earns the stamp, and it stays after reload', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-02T12:00:00'));
  await page.goto('/?e2e#mind');
  await page.getByRole('button', { name: /^(?:Open|Continue) the case$/ }).click();
  await page.waitForFunction(() => Boolean(window.__nandiCaseTest));
  const { shortest, clues } = await page.evaluate(() => window.__nandiCaseTest!.proof());
  await page.evaluate(() => window.__nandiCaseTest!.solveTodaysCase());
  await expect(page.getByRole('heading', { name: 'Case closed.' })).toBeVisible();
  const card = page.getByRole('region', { name: 'Prove it' });
  if (shortest.length === clues) { await expect(card).toHaveCount(0); return; }
  const clue = card.locator('.case-prove-clue');
  await expect(clue).toHaveCount(clues);
  // The finish toast moves clear of the card while it is open (Codex A item 77).
  const toast = page.locator('.economy-toast').first();
  await expect(toast).toBeVisible();
  const [toastBox, cardBox] = [await toast.boundingBox(), await card.boundingBox()];
  expect(toastBox!.y + toastBox!.height <= cardBox!.y || toastBox!.y >= cardBox!.y + cardBox!.height).toBe(true);
  await clue.nth(shortest[0]!).click();
  if (shortest.length > 1) {
    await card.getByRole('button', { name: 'Check' }).click();
    await expect(card.getByRole('status')).toContainText('These clues still allow');
  }
  for (const index of shortest.slice(1)) await clue.nth(index).click();
  await card.getByRole('button', { name: 'Check' }).click();
  await expect(card.locator('.mind-stamp')).toHaveText(`Proof stamp · ${shortest.length} ${shortest.length === 1 ? 'clue' : 'clues'}`);
  await card.getByRole('button', { name: 'Another proof' }).click();
  await expect(card).toContainText('Yours is one of the shortest proofs.');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Case closed.' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('region', { name: 'Prove it' }).locator('.mind-stamp')).toBeVisible();
});

test('Prove it is not offered after bedtime', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-02T12:00:00'));
  await page.goto('/?e2e#mind');
  await page.getByRole('button', { name: /^(?:Open|Continue) the case$/ }).click();
  await page.waitForFunction(() => Boolean(window.__nandiCaseTest));
  await page.clock.setFixedTime(new Date('2026-11-02T23:30:00'));
  await page.clock.runFor(1100);
  await page.evaluate(() => window.__nandiCaseTest!.solveTodaysCase());
  await expect(page.getByRole('heading', { name: 'Case closed.' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Prove it' })).toHaveCount(0);
});
