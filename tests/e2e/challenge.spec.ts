import { expect, test } from '@playwright/test';

type Hook = { board: () => { seed: number; solution: number[] }; solveKnownSolution: () => void };

test('a solved daily board becomes a link that opens the same board for a friend', async ({ page, browser }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00'));
  await page.addInitScript(() => { Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => { (window as Window & { shared?: ShareData }).shared = data; } }); });
  await page.goto('/?e2e#mind/board/daily');
  await page.waitForFunction(() => Boolean((window as Window & { __nandiMindTest?: unknown }).__nandiMindTest));
  const mine = await page.evaluate(() => (window as Window & { __nandiMindTest?: Hook }).__nandiMindTest!.board());
  await page.evaluate(() => (window as Window & { __nandiMindTest?: Hook }).__nandiMindTest!.solveKnownSolution());
  await page.getByRole('button', { name: 'Challenge a friend' }).click();
  const shared = await page.waitForFunction(() => (window as Window & { shared?: ShareData }).shared?.text).then(handle => handle.jsonValue() as Promise<string>);
  expect(shared).toMatch(/^I solved today's .+ on NANDI in \d+:\d\d with no hints\. Same board, your turn \(no sign-up\): https:\/\/nandi\.nandi11\.workers\.dev\/#mind\/challenge\//);
  const hash = shared.slice(shared.indexOf('#'));

  // The friend: a fresh phone with no NANDI data, no account, and no first-run screens in the way.
  const friend = await (await browser.newContext({ viewport: { width: 360, height: 800 } })).newPage();
  await friend.clock.setFixedTime(new Date('2026-10-23T12:00:00'));
  await friend.goto(`/?e2e&welcome${hash}`);
  await expect(friend.getByText(/A friend's challenge/)).toBeVisible();
  await expect(friend.getByRole('dialog', { name: 'Welcome to NANDI' })).toHaveCount(0);
  await friend.waitForFunction(() => Boolean((window as Window & { __nandiMindTest?: unknown }).__nandiMindTest));
  const theirs = await friend.evaluate(() => (window as Window & { __nandiMindTest?: Hook }).__nandiMindTest!.board());
  expect(theirs).toEqual(mine);
  await friend.evaluate(() => (window as Window & { __nandiMindTest?: Hook }).__nandiMindTest!.solveKnownSolution());
  await expect(friend.getByRole('button', { name: 'Send your time back' })).toBeVisible();
  // Their next visit still gets the first run, with its 18+ tick (spec 18).
  await friend.goto('/?e2e&welcome#plan');
  await friend.reload(); // only the hash changed, so load the app again like a new visit
  await expect(friend.getByRole('dialog', { name: 'Welcome to NANDI' })).toBeVisible();
  await expect(friend.getByRole('button', { name: "Let's start" })).toBeDisabled();
});
