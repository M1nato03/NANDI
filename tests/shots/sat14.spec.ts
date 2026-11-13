import { readFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { textAt200 } from '../e2e/helpers/text';

// The Sat 14 polish batch (walkthrough-15nov/sat-14-polish-list.md, M1): the shots no other set already takes.
// Pictures go to SHOTS_DIR (default D:/nandi-gate-logs/shots-sat14). 360x800, light and dark unless named.
const OUT = process.env.SHOTS_DIR ?? 'D:/nandi-gate-logs/shots-sat14';
const NOON = new Date('2026-11-10T12:00:00');
const DAY = '2026-11-10';
const settle = (page: Page) => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

type Row = Record<string, unknown>;
let serial = 0;
const fact = (day: string, mode: string, kind: string, inputs: Row = {}): Row => ({
  id: `${kind}:sat14-${++serial}`, dayKey: day, mode, kind, refId: `sat14-${serial}`, inputs, updatedAt: new Date(`${day}T10:00:00`).getTime() + serial, deleted: 0, deviceId: 'sat14',
});
const daysBefore = (day: string, n: number) => Array.from({ length: n }, (_, i) => new Date(Date.parse(`${day}T12:00:00Z`) - (i + 1) * 86_400_000).toISOString().slice(0, 10));
/** Every corner at a stage: [3, 7, 14, 30, 60] practice days per area (rules.config courtyard.stageDays), as stage2-571. */
const STAGE_DAYS = [0, 3, 7, 14, 30, 60];
const corners = (stage: number): Row[] => daysBefore(DAY, STAGE_DAYS[stage]!).flatMap(day => [
  fact(day, 'train', 'session', { xp: 60, workingSets: 6 }), fact(day, 'tasks', 'done', { plannedSize: 'M', wasPlanned: true }),
  fact(day, 'bonuses', 'lightsout', { metTarget: true }), fact(day, 'mind', 'board', { daily: false }),
  fact(day, 'mind', 'card', {}), fact(day, 'mind', 'learn-drop', {}),
]);
async function put(page: Page, store: string, rows: Row[]) {
  await page.evaluate(async ({ store, rows }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => { const transaction = database.transaction(store, 'readwrite'); for (const row of rows) transaction.objectStore(store).put(row); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
    database.close();
  }, { store, rows });
}
async function phone(browser: Browser, colorScheme: 'light' | 'dark', time = NOON): Promise<Page> {
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme, reducedMotion: 'reduce', baseURL: test.info().project.use.baseURL, acceptDownloads: true });
  const page = await context.newPage();
  await page.clock.setFixedTime(time);
  await page.goto('/?e2e#courtyard');
  return page;
}
async function open(page: Page, route: string, ready: string) {
  await page.goto(`/?e2e#${route}`);
  await page.reload();
  await expect(page.locator(ready).first()).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(400);
  await settle(page);
}
const snap = (page: Page, name: string, options: { full?: boolean; clip?: { x: number; y: number; width: number; height: number } } = {}) =>
  page.screenshot({ path: `${OUT}/${name}.png`, fullPage: options.full ?? false, ...(options.clip ? { clip: options.clip } : {}) });

for (const theme of ['light', 'dark'] as const) {
  const t = theme === 'light' ? 'l' : 'd';

  test(`O1: the Yatra heading and its JOURNAL stamp at 100% and 200%, ${theme}`, async ({ browser }) => {
    const page = await phone(browser, theme);
    await put(page, 'ledger', corners(3));
    await open(page, 'yatra', '.trek-strip');
    // The top of the tab: the heading and its stamp (the stamp sits above the heading's line, so frame from the top).
    const top = { x: 0, y: 0, width: 360, height: 420 };
    await snap(page, `o1-${t}-yatra-heading-100`, { clip: top });
    await textAt200(page);
    await settle(page);
    await snap(page, `o1-${t}-yatra-heading-200`, { clip: top });
    await page.context().close();
  });

  test(`B9: a new user's You at 100% and 200%, ${theme}`, async ({ browser }) => {
    const page = await phone(browser, theme);
    await open(page, 'you', 'main h1, main h2');
    await snap(page, `b9-${t}-you-new-100`, { full: true });
    await textAt200(page);
    await settle(page);
    await snap(page, `b9-${t}-you-new-200`, { full: true });
    await page.context().close();
  });

  test(`H8: the backup nudge at 200%, ${theme}`, async ({ browser }) => {
    const page = await phone(browser, theme);
    // Nine days of use and no backup: the nudge shows on You.
    await put(page, 'ledger', daysBefore(DAY, 9).map(day => fact(day, 'tasks', 'done', { plannedSize: 'M', wasPlanned: true })));
    await open(page, 'you', 'main h1, main h2');
    const nudge = page.getByRole('button', { name: 'Save a backup' }).first();
    await expect(nudge).toBeVisible();
    await textAt200(page);
    await nudge.scrollIntoViewIfNeeded();
    await settle(page);
    const card = nudge.locator('xpath=ancestor::*[contains(@class, "card") or contains(@class, "nudge")][1]');
    const b = (await card.boundingBox()) ?? (await nudge.boundingBox())!;
    await snap(page, `h8-${t}-backup-nudge-200`, { clip: { x: 0, y: Math.max(0, b.y - 8), width: 360, height: Math.min(800 - Math.max(0, b.y - 8), b.height + 16) } });
    await page.context().close();
  });

  test(`H: the restore review of an old backup and an unreadable file, at 200%, ${theme}`, async ({ browser }) => {
    const page = await phone(browser, theme);
    await put(page, 'ledger', daysBefore(DAY, 3).map(day => fact(day, 'tasks', 'done', { plannedSize: 'M', wasPlanned: true })));
    await open(page, 'you/backup', 'main h2');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save a backup' }).first().click();
    const saved = JSON.parse(readFileSync((await (await download).path())!, 'utf8')) as { dexie: { data: { databaseVersion: number; tables: { name: string }[]; data: { tableName: string }[] } } };
    // A backup from before the book game (database version 6): the review says the Read game starts fresh.
    saved.dexie.data.databaseVersion = 6;
    saved.dexie.data.tables = saved.dexie.data.tables.filter(table => table.name !== 'bookGameStates');
    saved.dexie.data.data = saved.dexie.data.data.filter(table => table.tableName !== 'bookGameStates');
    await textAt200(page);
    const choose = async (name: string, body: string) => {
      const chooser = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Choose restore file' }).click();
      await (await chooser).setFiles({ name, mimeType: 'application/json', buffer: Buffer.from(body) });
    };
    await choose('nandi-old.json', JSON.stringify(saved));
    const review = page.getByLabel('Restore preview');
    await expect(review).toContainText('Your Read game starts fresh.');
    await review.scrollIntoViewIfNeeded();
    await settle(page);
    await snap(page, `h-${t}-restore-review-old-200`, { full: true });
    await review.getByRole('button', { name: 'Cancel' }).click();
    await choose('not-a-backup.json', '{"hello": "world"}');
    const line = page.getByRole('main').getByRole('status').last();
    await expect(line).toContainText('couldn’t be read as a NANDI backup');
    await line.scrollIntoViewIfNeeded();
    await settle(page);
    await snap(page, `h-${t}-unreadable-200`);
    await page.context().close();
  });

  test(`D-lantern: s4 with 2 soft days, ${theme}`, async ({ browser }) => {
    const page = await phone(browser, theme);
    await put(page, 'ledger', [...corners(4), ...daysBefore(DAY, 2).map(day => fact(day, 'soft', 'soft', {}))]);
    await open(page, 'courtyard', '.courtyard-b');
    await snap(page, `lantern-${t}-s4-two-soft-days`);
    await page.context().close();
  });
}
