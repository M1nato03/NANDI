import { expect, type Page } from '@playwright/test';

/**
 * The phone's text at 200%. The first open's offline-ready reload can drop a style added too early, so this adds it
 * until the page really reads at twice the size.
 */
export async function textAt200(page: Page) {
  await expect.poll(async () => {
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await page.waitForTimeout(300);
    return page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
  }).toBe('32px');
}
