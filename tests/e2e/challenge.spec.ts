import { expect, test, type Page } from '@playwright/test';
import { todaysBoard, BOARD_DONE } from './helpers/mind';

type Hook = { board: () => { seed: number; solution: number[] }; solveKnownSolution: () => void };
const hook = (page: Page) => page.waitForFunction(() => Boolean((window as Window & { __nandiMindTest?: unknown }).__nandiMindTest));
const board = (page: Page) => page.evaluate(() => (window as Window & { __nandiMindTest?: Hook }).__nandiMindTest!.board());
const solve = (page: Page) => page.evaluate(() => (window as Window & { __nandiMindTest?: Hook }).__nandiMindTest!.solveKnownSolution());
const catchShares = (page: Page) => page.addInitScript(() => { Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => { (window as Window & { shared?: ShareData }).shared = data; } }); });
const shared = (page: Page) => page.waitForFunction(() => (window as Window & { shared?: ShareData }).shared?.text).then(handle => handle.jsonValue() as Promise<string>);

test('a solved daily board becomes a link that opens the same board for a friend', async ({ page, browser }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00'));
  await catchShares(page);
  await page.goto('/?e2e#mind/board/daily');
  await hook(page);
  const mine = await board(page);
  await solve(page);
  await expect(page.getByRole('button', { name: 'Share as image' })).toBeVisible();
  await page.getByRole('button', { name: 'Share result' }).click();
  const text = await shared(page);
  // Spec 19 C: three lines, text only. 21 Oct is before the board-number epoch, so no number yet. Spec 24: the link ends
  // with the sender's pace marks.
  expect(text).toMatch(/^NANDI \S+ [A-Za-z &]+ · (Easy|Medium|Hard)\n\d+:\d\d · no hints ✨\nSame board, your turn: https:\/\/nandi\.nandi11\.workers\.dev\/#mind\/challenge\/20261021\/[a-z]+\/[a-z]+\/\d+\/p[0-9a-z]{30}$/);
  const hash = text.slice(text.indexOf('#'));

  // The friend, two days later: a fresh phone with no NANDI data, no account, and no first-run screens in the way.
  const friend = await (await browser.newContext({ viewport: { width: 360, height: 800 } })).newPage();
  await friend.clock.setFixedTime(new Date('2026-10-23T12:00:00'));
  await catchShares(friend);
  await friend.goto(`/?e2e&welcome${hash}`);
  await expect(friend.getByText(/A friend's challenge/)).toBeVisible();
  await expect(friend.getByRole('dialog', { name: 'Welcome to NANDI' })).toHaveCount(0);
  await hook(friend);
  expect(await board(friend)).toEqual(mine);
  await solve(friend);
  await friend.getByRole('button', { name: 'Share result' }).click();
  const reply = await shared(friend);
  expect(reply.split('\n')[2]).toBe(`My time on your board: https://nandi.nandi11.workers.dev/${hash}`);
  // Their next visit still gets the first run, with its 18+ tick (spec 18).
  await friend.goto('/?e2e&welcome#plan');
  await friend.reload(); // only the hash changed, so load the app again like a new visit
  await expect(friend.getByRole('dialog', { name: 'Welcome to NANDI' })).toBeVisible();
  await expect(friend.getByRole('button', { name: "Let's start" })).toBeDisabled();
});

test("a friend opening today's link plays today's daily board and gets the Today chip", async ({ page, browser }) => {
  await page.clock.setFixedTime(new Date('2026-10-23T12:00:00'));
  await catchShares(page);
  await page.goto('/?e2e#mind/board/daily');
  await hook(page);
  const mine = await board(page);
  await solve(page);
  await page.getByRole('button', { name: 'Share result' }).click();
  const text = await shared(page);
  expect(text.split('\n')[0]).toMatch(/^NANDI \S+ [A-Za-z &]+ #1 · (Easy|Medium|Hard)$/);
  // The 3-line result ends with the full link; the first line's "#1" is the board number, not the link.
  const hash = text.slice(text.indexOf('#mind/'));
  expect(hash).toMatch(/^#mind\/challenge\/20261023\//);

  const friend = await (await browser.newContext({ viewport: { width: 360, height: 800 } })).newPage();
  await friend.clock.setFixedTime(new Date('2026-10-23T18:00:00'));
  await friend.goto(`/?e2e${hash}`);
  await expect(friend.locator('.mind-board .eyebrow')).toHaveText(/^Daily board #1 · /);
  await hook(friend);
  expect(await board(friend)).toEqual(mine);
  await solve(friend);
  await expect(friend.getByRole('button', { name: 'Share result' })).toBeVisible();
  // The solved run is written after the result shows; leave only once it is saved (CI flake 10-25).
  await expect(friend.locator('.mind-board')).toHaveAttribute('data-save-state', 'saved');
  await friend.goto('/?e2e#mind');
  await friend.reload();
  await expect(todaysBoard(friend)).toContainText(BOARD_DONE);
});
