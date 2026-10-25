import type { Page } from '@playwright/test';

/** Spec 27: the fuller add form, the routines and the focus timer with breaks sit in Plan's More fold. */
export async function openMore(page: Page) {
  const more = page.locator('details.plan-more');
  if (!(await more.evaluate(node => (node as HTMLDetailsElement).open))) await more.locator('summary').click();
}
