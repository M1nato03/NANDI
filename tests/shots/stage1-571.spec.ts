import { expect, test, type Browser, type Page } from '@playwright/test';
import { textAt200 } from '../e2e/helpers/text';

// Spec 571 stage 1 (G5): 360x800, light and dark, every touched screen top (and scrolled where it runs long), each
// Grow door, and 200% text on the Grow and You tops. Pictures go to SHOTS_DIR (default D:/nandi-gate-logs/shots-571-s1).
const OUT = process.env.SHOTS_DIR ?? 'D:/nandi-gate-logs/shots-571-s1';
const NOON = new Date('2026-11-06T12:00:00');
const settle = (page: Page) => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

async function phone(browser: Browser, colorScheme: 'light' | 'dark'): Promise<Page> {
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme, reducedMotion: 'reduce', baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#yatra');
  return page;
}
async function shot(page: Page, route: string, name: string, opts: { scrolled?: boolean; big?: boolean } = {}) {
  await page.goto(`/?e2e#${route}`);
  await page.reload();
  if (opts.big) await textAt200(page);
  await expect(page.locator('main h1').first()).toBeVisible();
  await page.waitForTimeout(500);
  if (opts.scrolled) await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await settle(page);
  await page.screenshot({ path: `${OUT}/${name}.png` });
}

for (const theme of ['light', 'dark'] as const) {
  test(`stage 1 screens, ${theme}`, async ({ browser }) => {
    const page = await phone(browser, theme);
    const t = theme === 'light' ? 'l' : 'd';
    await shot(page, 'grow', `s1-${t}-01-grow`);
    await shot(page, 'grow/read', `s1-${t}-02-read`);
    await shot(page, 'grow/remember', `s1-${t}-03-remember`);
    await shot(page, 'grow/remember', `s1-${t}-03b-remember-scrolled`, { scrolled: true });
    await shot(page, 'grow/play', `s1-${t}-04-play`);
    await shot(page, 'grow/play', `s1-${t}-04b-play-scrolled`, { scrolled: true });
    await shot(page, 'grow/train', `s1-${t}-05-train`);
    await shot(page, 'grow/sleep', `s1-${t}-06-calm-sleep`);
    await shot(page, 'grow/sleep', `s1-${t}-06b-calm-sleep-scrolled`, { scrolled: true });
    await shot(page, 'you', `s1-${t}-07-you`);
    await shot(page, 'you', `s1-${t}-07b-you-scrolled`, { scrolled: true });
    await shot(page, 'you/settings', `s1-${t}-08-settings`);
    await shot(page, 'yatra', `s1-${t}-09-yatra-home`);
    if (theme === 'light') {
      // Picks set the doors: Train and Calm & Sleep picked.
      await page.evaluate(async () => {
        const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
        await new Promise<void>(resolve => { const tx = database.transaction('settings', 'readwrite'); tx.objectStore('settings').put({ key: 'profile.goals', value: ['train', 'sleep'], updatedAt: 1, deleted: 0, deviceId: 'shots' }); tx.objectStore('settings').put({ key: 'profile.size', value: 'two', updatedAt: 1, deleted: 0, deviceId: 'shots' }); tx.oncomplete = () => resolve(); });
        database.close();
      });
      await shot(page, 'grow', 's1-l-10-grow-two-picks');
      await shot(page, 'grow', 's1-l-11-grow-200-text', { big: true });
      await shot(page, 'you', 's1-l-12-you-200-text', { big: true });
    }
    await page.context().close();
  });
}
