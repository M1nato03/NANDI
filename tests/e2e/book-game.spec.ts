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
/** The rendered lines of the first element matching `selector` (its text's line boxes). */
async function lineCount(page: Page, selector: string): Promise<number> {
  return page.locator(selector).first().evaluate(node => {
    const tops = new Set<number>();
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      const range = document.createRange(); range.selectNodeContents(text);
      for (const rect of range.getClientRects()) if (rect.width > 0) tops.add(Math.round(rect.top / 4));
    }
    return tops.size;
  });
}
async function open(page: Page, route = `grow/read/game/${BOOK}`, ready = '.book-game') {
  await page.goto(`/?e2e#${route}`);
  await page.reload();
  await expect(page.locator(ready).first()).toBeVisible({ timeout: 15_000 });
}
/** The moves sit above the tab bar, in view, before any tap and with no scroll. */
async function movesInView(page: Page) {
  await expect(page.locator('.book-game-actions')).toBeVisible();
  const tabTop = await page.locator('.tabbar').evaluate(node => node.getBoundingClientRect().top);
  const boxes = await page.locator('.book-game-actions button').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect()).map(r => ({ top: r.top, bottom: r.bottom })));
  expect(boxes.length).toBeGreaterThan(0);
  for (const box of boxes) { expect(box.top).toBeGreaterThanOrEqual(0); expect(box.bottom).toBeLessThanOrEqual(tabTop + 1); }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // b2 12 Nov: the footer meets the tab bar on every month, short ones too (no band floating mid-screen).
  const footerBottom = await page.locator('.book-game-actions').evaluate(node => node.getBoundingClientRect().bottom);
  expect(footerBottom, 'footer meets the tab bar').toBeGreaterThanOrEqual(tabTop - 2);
  // a9 12 Nov: the footer is sticky, so it is pinned in view even when the page is far too long; measuring only its
  // buttons passed with the real choices (split chips, auto-charges, festival chips) pushed below the fold. Every
  // choice must be fully in view with no scroll: above the tab bar, and not under the footer band unless it is in it.
  const footerTop = await page.locator('.book-game-actions').evaluate(node => node.getBoundingClientRect().top);
  // b2 12 Nov: at large text the picks list may scroll INSIDE the footer; then the list itself must be in view with
  // its first pick fully shown, and the rest are reached by that inner scroll (not the page's).
  const choices = await page.locator('.book-game .book-game-chips button, .book-game .book-game-subs button').evaluateAll(nodes => nodes.map((node, i, all) => {
    const r = node.getBoundingClientRect(), list = node.closest('.book-game-chips, .book-game-subs')!, l = list.getBoundingClientRect();
    const scrolls = list.scrollHeight > list.clientHeight + 1, first = all.find(other => other.closest('.book-game-chips, .book-game-subs') === list) === node;
    return scrolls && !first ? { label: node.textContent ?? '', top: l.top, bottom: l.bottom, pinned: true } : { label: node.textContent ?? '', top: r.top, bottom: r.bottom, pinned: !!node.closest('.book-game-actions') };
  }));
  for (const choice of choices) { expect(choice.top, choice.label).toBeGreaterThanOrEqual(0); expect(choice.bottom, choice.label).toBeLessThanOrEqual((choice.pinned ? tabTop : footerTop) + 1); }
  const rootPx = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  if (rootPx >= 32) {
    const [footerHeight, viewport] = await page.locator('.book-game-actions').evaluate(node => [node.getBoundingClientRect().height, innerHeight]);
    expect(footerHeight, `footer height at 200% (viewport ${viewport})`).toBeLessThanOrEqual(viewport * 2 / 3 + 1);
  }
  // b2 12 Nov: a month with picks (Jan, Feb, Oct, Nov) has its one prompt line in the footer, fully in view; and no
  // empty scene card sits under the footer.
  if (await page.locator('.book-game-picks').count()) {
    const prompt = page.locator('.book-game-actions .book-game-prompt');
    await expect(prompt).toHaveCount(1);
    const box = await prompt.evaluate(node => { const r = node.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; });
    expect(box.top, 'prompt top').toBeGreaterThanOrEqual(0);
    expect(box.bottom, 'prompt bottom').toBeLessThanOrEqual(tabTop + 1);
    // The ≤2-line copy rule is for the phone's normal text size; at 200% the prompt may wrap, but stays fully in view.
    if (rootPx < 20) expect(await lineCount(page, '.book-game-actions .book-game-prompt'), 'prompt lines').toBeLessThanOrEqual(2);
  }
  expect(await page.locator('.book-game-scene').evaluateAll(cards => cards.filter(card => !(card.lastElementChild?.textContent ?? '').trim()).length), 'empty scene cards').toBe(0);
}

test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(NOON); });

test('no chapter done: the book card says 0/12, the game and a month deep link show the plain one-line reason', async ({ page }) => {
  await open(page, `grow/read/book/${BOOK}`, '.read-book-page');
  await expect(page.getByTestId('book-game-card')).toContainText('0/12 · Finish a chapter to open January');
  await open(page);
  await expect(page.getByTestId('book-game-lock')).toHaveText('Finish 1 more chapter to open January.');
  await open(page, `grow/read/game/${BOOK}/mar`);
  await expect(page.getByTestId('book-game-lock')).toHaveText('Finish 1 more chapter to open March.');
  await page.getByRole('button', { name: 'Back to the book' }).click();
  await expect(page).toHaveURL(new RegExp(`#grow/read/book/${BOOK}$`));
});

test('one chapter (any one) opens Jan-Mar in order; Mar has labelled phrases and a Check first sheet; Apr waits with its line; nothing paid', async ({ page }) => {
  await page.goto('/?e2e#courtyard');
  await chapters(page, 'babylon-3');
  await open(page);
  await page.getByRole('button', { name: 'Goa with friends' }).click();
  // a9's E12: all three goals are in view before any scroll.
  for (const name of ['A new laptop', 'Goa with friends', 'Bike down-payment']) await expect(page.getByRole('button', { name: new RegExp(`^${name}`) })).toBeInViewport();
  expect(await lineCount(page, '.book-game-rule')).toBeLessThanOrEqual(2);
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
  await expect(page.getByTestId('book-game-lock')).toHaveText('Finish 1 more chapter to open April.');
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
  await expect(page.locator('.book-game-play[data-month="jan"]')).toBeVisible();
  await textAt200(page);
  await movesInView(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start Feb' }).click();
  await expect(page.locator('.book-game-play[data-month="feb"]')).toBeVisible();
  await movesInView(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start Mar' }).click();
  await expect(page.locator('.book-game-play[data-month="mar"]')).toBeVisible();
  await movesInView(page);
});

test('E12 at 200% text: Oct and Nov keep the prompt, picks and move in view (b2 12 Nov)', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?e2e#courtyard');
  await chapters(page, 'babylon-1', 'babylon-2', 'babylon-3', 'babylon-4', 'babylon-5');
  await open(page);
  await page.getByRole('button', { name: 'Start January' }).click();
  for (const [month, move] of [['Jan', 'Continue'], ['Feb', 'Continue'], ['Mar', 'Say no'], ['Apr', 'Say no'], ['May', 'Move ₹3,000'], ['Jun', 'Say yes'], ['Jul', 'Say no'], ['Aug', 'Handle the repair'], ['Sep', 'Take the course']] as const) {
    if (month !== 'Jan') await page.getByRole('button', { name: `Start ${month}` }).click();
    await page.locator('.book-game-actions').getByRole('button', { name: move, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Start Oct' }).click();
  await expect(page.locator('.book-game-play[data-month="oct"]')).toBeVisible();
  await textAt200(page);
  await movesInView(page);
  await page.locator('.book-game-actions').getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Start Nov' }).click();
  await expect(page.locator('.book-game-play[data-month="nov"]')).toBeVisible();
  await movesInView(page);
});

test('the links: Play has one line to the game; the game has no Courtyard or Yatra card', async ({ page }) => {
  await open(page, 'grow/play', '[data-testid="book-game-play-link"]');
  await page.getByTestId('book-game-play-link').click();
  await expect(page).toHaveURL(new RegExp(`#grow/read/game/${BOOK}$`));
  await open(page, 'courtyard', '.courtyard-b');
  await expect(page.locator('[data-testid^="book-game"]')).toHaveCount(0);
});

test('all 12 months (5 chapters): the moves are in view before any tap; each scene message is measured for the ≤35-word rule', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?e2e#courtyard');
  await chapters(page, 'babylon-1', 'babylon-2', 'babylon-3', 'babylon-4', 'babylon-5');
  await open(page);
  await page.getByRole('button', { name: 'Start January' }).click();
  const words: Record<string, number> = {}, lines: Record<string, number> = {};
  const moves: Record<number, string> = { 0: 'Continue', 1: 'Continue', 2: 'Say no', 3: 'Say no', 4: 'Move ₹3,000', 5: 'Say yes', 6: 'Say no', 7: 'Handle the repair', 8: 'Take the course', 9: 'Continue', 10: 'Continue', 11: 'See my year' };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let m = 0; m < 12; m++) {
    await expect(page.locator(`.book-game-play[data-month="${MONTHS[m]!.toLowerCase()}"]`)).toBeVisible();
    await movesInView(page);
    // The month's message: its footer prompt where it has picks, else the scene card's text.
    const message = (await page.locator('.book-game-actions .book-game-prompt').count()) ? '.book-game-actions .book-game-prompt' : '.book-game-scene > div:last-child';
    const text = await page.locator(message).first().innerText();
    words[MONTHS[m]!] = text.trim().split(/\s+/).length;
    // a9/b2 copy limits: a month's message ≤35 words and ≤2 lines at 360 (the sign months' messages are phrases to tap,
    // measured by words only; Jan and Nov hold the split controls, not a message).
    expect(words[MONTHS[m]!], `${MONTHS[m]} words`).toBeLessThanOrEqual(35);
    if (![0, 2, 3, 5, 6, 10].includes(m)) {
      lines[MONTHS[m]!] = await lineCount(page, message);
      expect(lines[MONTHS[m]!], `${MONTHS[m]} message lines`).toBeLessThanOrEqual(2);
    }
    await page.locator('.book-game-actions').getByRole('button', { name: moves[m]!, exact: true }).click();
    // A result paragraph is ≤3 lines at 360.
    expect(await lineCount(page, '.book-game-result .card p:not(.book-game-delta):not(.book-game-net):not(.small)'), `${MONTHS[m]} result lines`).toBeLessThanOrEqual(3);
    if (m < 11) await page.getByRole('button', { name: `Start ${MONTHS[m + 1]}` }).click();
  }
  console.log(`spec 40 scene words: ${JSON.stringify(words)} · message lines at this width: ${JSON.stringify(lines)}`);
  await page.getByRole('button', { name: 'View the full year' }).click();
  await expect(page.locator('.book-game-end')).toContainText('net worth');
});
