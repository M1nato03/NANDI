import { expect, test, type Browser, type Page } from '@playwright/test';
import { textAt200 } from '../e2e/helpers/text';

// Spec 40 "Your first year": a9's shot list (40-gate-checklist §6), 360×800 light and dark, plus 200% of Jan, Feb,
// Mar and the year end. To SHOTS40_DIR (default D:/nandi-gate-logs/shots-spec40).
const OUT = process.env.SHOTS40_DIR ?? 'D:/nandi-gate-logs/shots-spec40';
const BOOK = 'richest-man-in-babylon';
const NOON = new Date('2026-11-12T12:00:00');

async function phone(browser: Browser, colorScheme: 'light' | 'dark'): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme, reducedMotion: 'reduce', baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#courtyard');
  return page;
}
async function chapters(page: Page, count: number) {
  await page.evaluate(async ({ book, count }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction('ledger', 'readwrite');
      for (let i = 1; i <= count; i++) tx.objectStore('ledger').put({ id: `chapter:${book}:babylon-${i}`, mode: 'read', kind: 'chapter', refId: `${book}:babylon-${i}`, dayKey: '2026-11-11', inputs: { newSteps: 3, firstRight: 0, readDrops: [] }, updatedAt: i, deleted: 0, deviceId: 'shots' });
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    database.close();
  }, { book: BOOK, count });
}
const snap = (page: Page, name: string) => page.screenshot({ path: `${OUT}/${name}.png` });
async function go(page: Page, route: string, ready: string) { await page.goto(`/?e2e#${route}`); await page.reload(); await expect(page.locator(ready).first()).toBeVisible(); await page.waitForTimeout(300); }

for (const theme of ['light', 'dark'] as const) {
  const t = theme === 'light' ? 'l' : 'd';
  test(`spec 40 shots, ${theme}`, async ({ browser }) => {
    test.setTimeout(240_000);
    const page = await phone(browser, theme);
    await go(page, `grow/read/game/${BOOK}/mar`, '.book-game');
    await snap(page, `40-${t}-13-locked-month`);
    await chapters(page, 2);
    await go(page, `grow/read/book/${BOOK}`, '.read-book-page');
    await snap(page, `40-${t}-01-book-page`);
    await go(page, `grow/read/chapter/${BOOK}/babylon-2`, '.learn-screen');
    await snap(page, `40-${t}-14-chapter-done`);
    await go(page, `grow/read/game/${BOOK}`, '.book-game-teach');
    await page.getByRole('button', { name: 'A new laptop' }).click();
    await snap(page, `40-${t}-02-goal-picker`);
    await page.getByRole('button', { name: 'Start January' }).click();
    await page.getByRole('button', { name: /^₹7,500/ }).click();
    await snap(page, `40-${t}-03-jan-play`);
    await page.getByRole('button', { name: 'Continue' }).click();
    await snap(page, `40-${t}-04-jan-result`);
    await page.getByRole('button', { name: 'Start Feb' }).click();
    await snap(page, `40-${t}-05a-feb-before`);
    for (const name of ['Cancel OTT app #1', 'Cancel Gym you have not used']) await page.getByRole('button', { name }).click();
    await snap(page, `40-${t}-05-feb`);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Start Mar' }).click();
    for (const name of ['+212% this week', 'sure-shot calls', 'Only 20 seats left']) await page.getByRole('button', { name }).click();
    await snap(page, `40-${t}-06-mar-phrases`);
    await page.getByRole('button', { name: 'Check first' }).click();
    await page.getByRole('dialog', { name: 'Check first' }).getByRole('button', { name: 'Registered investment adviser' }).click();
    await snap(page, `40-${t}-07-check-first`);
    await page.getByRole('dialog', { name: 'Check first' }).getByRole('button', { name: 'Say no' }).click();
    await snap(page, `40-${t}-08-mar-result`);
    await page.getByRole('button', { name: 'Start Apr' }).click();
    await page.getByRole('button', { name: 'Say no' }).click();
    await page.getByRole('button', { name: 'Start May' }).click();
    await page.getByRole('button', { name: 'Move ₹3,000' }).click();
    await snap(page, `40-${t}-09-may-result`);
    await go(page, `grow/read/game/${BOOK}/feb`, '.book-game-result');
    await snap(page, `40-${t}-15-replayed-month`);
    await chapters(page, 5);
    await go(page, `grow/read/game/${BOOK}`, '.book-game-result');
    await page.getByRole('button', { name: 'Start Jun' }).click();
    await page.getByRole('button', { name: 'Say yes' }).click();
    await page.getByRole('button', { name: 'Start Jul' }).click();
    await page.getByRole('button', { name: 'Say no' }).click();
    await page.getByRole('button', { name: 'Start Aug' }).click();
    await snap(page, `40-${t}-10-aug-cushion`);
    await page.getByRole('button', { name: 'Handle the repair' }).click();
    await page.getByRole('button', { name: 'Start Sep' }).click();
    await page.getByRole('button', { name: 'Take the course' }).click();
    await page.getByRole('button', { name: 'Start Oct' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Start Nov' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await snap(page, `40-${t}-11-nov-raise`);
    await page.getByRole('button', { name: 'Start Dec' }).click();
    await page.getByRole('button', { name: 'See my year' }).click();
    await page.getByRole('button', { name: 'View the full year' }).click();
    await snap(page, `40-${t}-12-year-end`);
    if (theme === 'light') {
      await textAt200(page);
      await snap(page, `40-l-12-year-end-200`);
    }
    await page.context().close();
  });
}

test('spec 40 shots at 200% text: Jan, Feb, Mar (light)', async ({ browser }) => {
  const page = await phone(browser, 'light');
  await chapters(page, 1);
  await go(page, `grow/read/game/${BOOK}`, '.book-game-teach');
  await page.getByRole('button', { name: 'Start January' }).click();
  await textAt200(page);
  await snap(page, '40-l-03-jan-play-200');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start Feb' }).click();
  await snap(page, '40-l-05-feb-200');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start Mar' }).click();
  await page.getByRole('button', { name: '+212% this week' }).click();
  await snap(page, '40-l-06-mar-200');
  await page.context().close();
});

// a9's frame-by-frame review (spec 40 §7.8): Jan → Mar and the year end, light and dark. Playwright records the
// screen; the gate script re-encodes it at 30 fps (D:/nandi-gate-logs/shots-spec40/rec-*.mp4).
for (const theme of ['light', 'dark'] as const) {
  test(`spec 40 recording, ${theme}`, async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, colorScheme: theme, reducedMotion: 'reduce', baseURL: test.info().project.use.baseURL, recordVideo: { dir: `${OUT}/raw-${theme}`, size: { width: 360, height: 800 } } });
    const page = await context.newPage();
    await page.clock.setFixedTime(NOON);
    await page.goto('/?e2e#courtyard');
    await chapters(page, 5);
    await go(page, `grow/read/game/${BOOK}`, '.book-game-teach');
    const pause = () => page.waitForTimeout(900);
    await page.getByRole('button', { name: 'A new laptop' }).click(); await pause();
    await page.getByRole('button', { name: 'Start January' }).click(); await pause();
    await page.getByRole('button', { name: /^₹7,500/ }).click(); await pause();
    await page.getByRole('button', { name: 'Continue' }).click(); await pause();
    await page.getByRole('button', { name: 'Start Feb' }).click(); await pause();
    await page.getByRole('button', { name: 'Cancel OTT app #1' }).click(); await pause();
    await page.getByRole('button', { name: 'Continue' }).click(); await pause();
    await page.getByRole('button', { name: 'Start Mar' }).click(); await pause();
    await page.getByRole('button', { name: '+212% this week' }).click(); await pause();
    await page.getByRole('button', { name: 'Check first' }).click(); await pause();
    await page.getByRole('dialog', { name: 'Check first' }).getByRole('button', { name: 'Registered investment adviser' }).click(); await pause();
    await page.getByRole('dialog', { name: 'Check first' }).getByRole('button', { name: 'Say no' }).click(); await pause();
    for (const [start, move] of [['Apr', 'Say no'], ['May', 'Move ₹3,000'], ['Jun', 'Say yes'], ['Jul', 'Say no'], ['Aug', 'Handle the repair'], ['Sep', 'Take the course'], ['Oct', 'Continue'], ['Nov', 'Continue'], ['Dec', 'See my year']] as const) {
      await page.getByRole('button', { name: `Start ${start}` }).click();
      await page.locator('.book-game-actions').getByRole('button', { name: move, exact: true }).click();
    }
    await pause();
    await page.getByRole('button', { name: 'View the full year' }).click(); await pause(); await pause();
    await page.mouse.wheel(0, 900); await pause(); await pause();
    await context.close();
  });
}
