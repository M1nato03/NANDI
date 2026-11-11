import { expect, test, type Page } from '@playwright/test';
import { textAt200 } from './helpers/text';

// Spec 40 "Your first year" (the Babylon book game), a9's gate checklist §1-§4.
test.use({ viewport: { width: 360, height: 800 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
const BOOK = 'richest-man-in-babylon';
const NOON = new Date('2026-11-12T12:00:00');

async function chapters(page: Page, ...modules: string[]) {
  await page.evaluate(async ({ book, modules }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction('ledger', 'readwrite');
      for (const m of modules) tx.objectStore('ledger').put({ id: `chapter:${book}:${m}`, mode: 'read', kind: 'chapter', refId: `${book}:${m}`, dayKey: '2026-11-11', inputs: { newSteps: 3, firstRight: 0, readDrops: [] }, updatedAt: 1, deleted: 0, deviceId: 'e2e' });
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    database.close();
  }, { book: BOOK, modules });
}
async function open(page: Page, route = `grow/read/game/${BOOK}`, ready = '.book-game') {
  await page.goto(`/?e2e#${route}`);
  await page.reload();
  await expect(page.locator(ready).first()).toBeVisible();
}
/** The moves sit above the tab bar, in view, before any tap and with no scroll. */
async function movesInView(page: Page) {
  const tabTop = await page.locator('.tabbar').evaluate(node => node.getBoundingClientRect().top);
  const boxes = await page.locator('.book-game-actions button').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect()).map(r => ({ top: r.top, bottom: r.bottom })));
  expect(boxes.length).toBeGreaterThan(0);
  for (const box of boxes) { expect(box.top).toBeGreaterThanOrEqual(0); expect(box.bottom).toBeLessThanOrEqual(tabTop + 1); }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(NOON); });

test('no chapter done: the book card says 0/12, the game and a month deep link show the plain one-line reason', async ({ page }) => {
  await open(page, `grow/read/book/${BOOK}`, '.read-book-page');
  await expect(page.getByTestId('book-game-card')).toContainText('0/12 · Finish a chapter to open January');
  await open(page);
  await expect(page.getByTestId('book-game-lock')).toHaveText('Finish a chapter of the book to open Jan.');
  await open(page, `grow/read/game/${BOOK}/mar`);
  await expect(page.getByTestId('book-game-lock')).toHaveText('Finish a chapter of the book to open Mar.');
  await page.getByRole('button', { name: 'Back to the book' }).click();
  await expect(page).toHaveURL(new RegExp(`#grow/read/book/${BOOK}$`));
});

test('one chapter (any one) opens Jan-Mar in order; Mar has labelled phrases and a Check first sheet; Apr waits with its line; nothing paid', async ({ page }) => {
  await page.goto('/?e2e#courtyard');
  await chapters(page, 'babylon-3');
  await open(page);
  await page.getByRole('button', { name: 'Goa with friends' }).click();
  await page.getByRole('button', { name: 'Start January' }).click();
  await expect(page.locator('.book-game-play[data-month="jan"]')).toBeVisible();
  await movesInView(page);
  await page.getByRole('button', { name: /^₹7,500/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('.book-game-result[data-month="jan"]')).toContainText('SPLIT SET');
  await expect(page.locator('.book-game-result .book-game-ledger li')).toHaveCount(2);
  await page.getByRole('button', { name: 'Start Feb' }).click();
  await movesInView(page);
  for (const name of ['Cancel OTT app #1', 'Cancel OTT app #2']) await page.getByRole('button', { name }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start Mar' }).click();
  await movesInView(page);
  await page.getByRole('button', { name: '+212% this week' }).click();
  await expect(page.getByRole('button', { name: /\+212% this week · Warning: No proof/ })).toBeVisible();
  await expect(page.locator('.book-game-signs')).toHaveText('Warnings 1 · Good signs 0 · Other 0');
  await page.getByRole('button', { name: 'Check first' }).click();
  const sheet = page.getByRole('dialog', { name: 'Check first' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Registered investment adviser' }).click();
  await expect(sheet.getByRole('status')).toContainText('cannot promise a fixed win');
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await page.getByRole('button', { name: 'Say no' }).click();
  await expect(page.locator('.book-game-result[data-month="mar"]')).toContainText('SIGNS SPOTTED');
  await expect(page.getByTestId('book-game-lock')).toHaveText('Finish 2 chapters of the book to open Apr.');
  // Reload keeps the year; the played months reopen read-only.
  await open(page, `grow/read/game/${BOOK}/feb`);
  await expect(page.locator('.book-game-result[data-month="feb"]')).toContainText('· played');
  await expect(page.locator('.book-game-result[data-month="feb"]')).toContainText('BILLS CHECKED');
  // The XP flag is off: no book-game fact was written.
  const facts = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    const rows = await new Promise<{ kind: string }[]>((resolve, reject) => { const request = database.transaction('ledger').objectStore('ledger').getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    database.close();
    return rows.filter(row => row.kind === 'book-game').length;
  });
  expect(facts).toBe(0);
  await open(page, `grow/read/book/${BOOK}`, '.read-book-page');
  await expect(page.getByTestId('book-game-card')).toContainText('3/12');
});

test('E12 at 200% text: the moves stay in view on Jan and Mar (only the middle scrolls)', async ({ page }) => {
  await page.goto('/?e2e#courtyard');
  await chapters(page, 'babylon-1');
  await open(page);
  await page.getByRole('button', { name: 'Start January' }).click();
  await textAt200(page);
  await movesInView(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start Feb' }).click();
  await movesInView(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start Mar' }).click();
  await movesInView(page);
});

test('the links: Play has one line to the game; the game has no Courtyard or Yatra card', async ({ page }) => {
  await open(page, 'grow/play', '[data-testid="book-game-play-link"]');
  await page.getByTestId('book-game-play-link').click();
  await expect(page).toHaveURL(new RegExp(`#grow/read/game/${BOOK}$`));
  await open(page, 'courtyard', '.courtyard-b');
  await expect(page.locator('[data-testid^="book-game"]')).toHaveCount(0);
});
