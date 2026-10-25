import type { Page } from '@playwright/test';

/** Spec 29: Practice boards, best times and technique cards sit in Mind's closed "More boards" fold. */
export async function openMoreBoards(page: Page) {
  const more = page.locator('details.mind-more');
  if (!(await more.evaluate(node => (node as HTMLDetailsElement).open))) await more.locator(':scope > summary').click();
}
