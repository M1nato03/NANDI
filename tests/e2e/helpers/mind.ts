import type { Page } from '@playwright/test';

/** Spec 29: Practice boards, best times and technique cards sit in Mind's closed "More boards" fold. */
export async function openMoreBoards(page: Page) {
  const more = page.locator('details.mind-more');
  if (!(await more.evaluate(node => (node as HTMLDetailsElement).open))) await more.locator(':scope > summary').click();
}

/**
 * Spec 45b: Home's friends are the way in, the Yatra tab then the friend. A gate a session opened shows its postcard
 * on Home once; a person keeps it in the journal and taps on, so the helper does the same.
 */
async function openFriend(page: Page, name: RegExp) {
  const postcard = page.getByRole('dialog', { name: /postcard$/ });
  await page.addLocatorHandler(postcard, dialog => dialog.getByRole('button', { name: 'Keep in the journal' }).click());
  await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Yatra' }).click();
  await page.getByRole('button', { name }).click();
  await page.removeLocatorHandler(postcard);
}
/** Spec 34: Kapi's shelf is Yatra's Mind corner (Kapi, "Play", on Home). */
export const openGames = (page: Page) => openFriend(page, /^Play, /);
/** Spec 34: Train is Yatra's Train corner (Nandi on Home). */
export const openTrain = (page: Page) => openFriend(page, /^Train, /);

/** Item 213: today's board is the shelf tile of the weekday's featured type (the lone Today chip is gone). */
export const todaysBoard = (page: Page) => page.locator('.mind-shelf-tile[data-featured]');
/** The tile reads solved once today's daily board is done. */
export const BOARD_DONE = /Solved · \d of 3|Done for today/;
