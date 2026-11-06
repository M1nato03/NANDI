import type { Page } from '@playwright/test';

/** Spec 29: Practice boards, best times and technique cards sit in Mind's closed "More boards" fold. */
export async function openMoreBoards(page: Page) {
  const more = page.locator('details.mind-more');
  if (!(await more.evaluate(node => (node as HTMLDetailsElement).open))) await more.locator(':scope > summary').click();
}

/** Spec 571: Grow's doors lead to Play, Train and Remember. */
async function openDoor(page: Page, id: string) {
  await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Grow' }).click();
  await page.getByTestId(id).click();
}
export const openGames = (page: Page) => openDoor(page, 'door-play');
export const openTrain = (page: Page) => openDoor(page, 'door-train');
export const openRemember = (page: Page) => openDoor(page, 'door-remember');

/** Item 213: today's board is the shelf tile of the weekday's featured type (the lone Today chip is gone). */
export const todaysBoard = (page: Page) => page.locator('.mind-shelf-tile[data-featured]');
/** The tile reads solved once today's daily board is done. */
export const BOARD_DONE = /Solved · \d of 3|Done for today/;
