import type { Page } from '@playwright/test';

/** Spec 29: Practice boards, best times and technique cards sit in Mind's closed "More boards" fold. */
export async function openMoreBoards(page: Page) {
  const more = page.locator('details.mind-more');
  if (!(await more.evaluate(node => (node as HTMLDetailsElement).open))) await more.locator(':scope > summary').click();
}

/** Spec 34: Kapi's shelf is Yatra's Mind corner. Opens it the way a person does: the Yatra tab, then the corner. */
export async function openGames(page: Page) {
  await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Yatra' }).click();
  await page.getByRole('button', { name: /^Mind: / }).click();
}
/** Spec 34: Train is Yatra's Train corner. */
export async function openTrain(page: Page) {
  await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Yatra' }).click();
  await page.getByRole('button', { name: /^Train: / }).click();
}

/** Item 213: today's board is the shelf tile of the weekday's featured type (the lone Today chip is gone). */
export const todaysBoard = (page: Page) => page.locator('.mind-shelf-tile[data-featured]');
/** The tile reads solved once today's daily board is done. */
export const BOARD_DONE = /Solved · \d of 3|Done for today/;
