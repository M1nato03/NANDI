import type { Page } from '@playwright/test';

/** Spec 29: Practice boards, best times and technique cards sit in Mind's closed "More boards" fold. */
export async function openMoreBoards(page: Page) {
  const more = page.locator('details.mind-more');
  if (!(await more.evaluate(node => (node as HTMLDetailsElement).open))) await more.locator(':scope > summary').click();
}

/** Spec 33: Mind is Read's Games. Opens Kapi's shelf the way a person does: the Read tab, the Games fold, the button. */
export async function openGames(page: Page) {
  await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Read' }).click();
  const games = page.locator('details.read-games');
  if (!(await games.evaluate(node => (node as HTMLDetailsElement).open))) await games.locator(':scope > summary').click();
  await page.getByRole('button', { name: "Open Kapi's shelf" }).click();
}
/** Spec 33: Train is parked under You. */
export async function openTrain(page: Page) {
  await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'You' }).click();
  await page.getByRole('button', { name: /^Train \(paused\)/ }).click();
}
