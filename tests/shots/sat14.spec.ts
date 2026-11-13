import { readdirSync, readFileSync } from 'node:fs';
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
    // The legacy walk (as trek575.spec): three sessions reach one place a day, the first a Mind board so each passed
    // landmark opens. Four days in, the journal holds postcards and its stamp shows; every landmark counts as kept, so
    // no "Keep in the journal" sheet opens over the shot.
    const START = '2026-10-01';
    const dayOf = (n: number) => new Date(Date.parse(`${START}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
    const walk = Array.from({ length: 12 }, (_, i) => fact(dayOf(Math.floor(i / 3)), i % 3 === 0 ? 'mind' : 'train', i % 3 === 0 ? 'board' : 'session', i % 3 === 0 ? {} : { xp: 60, workingSets: 6 }));
    const page = await phone(browser, theme, new Date(`${dayOf(4)}T12:00:00`));
    await put(page, 'ledger', walk);
    // The trek counts from its start day (trek575.spec's seed); the app's own theme follows the shot's.
    await put(page, 'settings', [{ key: 'yatra.startDay', value: START, updatedAt: 1, deleted: 0, deviceId: 'sat14' }, { key: 'theme', value: theme, updatedAt: 1, deleted: 0, deviceId: 'sat14' }]);
    const kept = readdirSync('content/yatra').filter(name => name.endsWith('.json'))
      .flatMap(name => (JSON.parse(readFileSync(`content/yatra/${name}`, 'utf8')) as { legs?: { landmark: { id: string } }[] }).legs?.map(leg => leg.landmark.id) ?? []);
    await page.evaluate(ids => localStorage.setItem('nandi.yatra.cards', JSON.stringify(ids)), kept);
    await open(page, 'yatra', '.trek-strip');
    await expect(page.locator('.home-permit')).toBeVisible();
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

  // a9 13 Nov (option a): two strings of up to six, lifted clear of the bedroll and left of Kachhua. s4 and s5, 2 and 12
  // soft days, by day and at night (01:45, as stage2-571's night).
  for (const stage of [4, 5]) for (const soft of [2, 12]) for (const when of ['day', 'night'] as const) {
    test(`D-lantern: s${stage} with ${soft} soft days, ${when}, ${theme}`, async ({ browser }) => {
      const page = await phone(browser, theme, when === 'day' ? NOON : new Date('2026-11-11T01:45:00'));
      await put(page, 'ledger', [...corners(stage), ...daysBefore(DAY, soft).map(day => fact(day, 'soft', 'soft', {}))]);
      await page.goto('/?e2e#courtyard');
      await page.reload();
      const deck = page.getByRole('button', { name: 'Leave night deck' });
      await expect(page.locator('.courtyard-b').or(deck).first()).toBeVisible({ timeout: 15_000 });
      if (await deck.isVisible()) { await deck.click(); await page.getByRole('link', { name: 'Courtyard' }).click(); }
      await expect(page.locator(`.courtyard-b [data-lanterns="${soft}"]`)).toHaveCount(1);
      await page.waitForTimeout(500);
      await settle(page);
      await snap(page, `lantern-${t}-s${stage}-${soft}-soft-${when}`);
      await page.context().close();
    });
  }
}

// Jenil 14 Nov: the Pause card's "Go to NANDI home" way, on the card, in the 2 minutes and on the done screen. N2: a
// generic app (an unknown package reads "the app"), never a real brand on a forwardable picture.
for (const theme of ['light', 'dark'] as const) for (const size of [100, 200] as const) {
  test(`Pause card with the home way, ${theme}, ${size}%`, async ({ browser }) => {
    const t = theme === 'light' ? 'l' : 'd';
    const page = await phone(browser, theme);
    await page.goto('/?e2e#plan');
    await page.getByRole('button', { name: /^Pause card/ }).click();
    await page.getByLabel('Instagram').check();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('group', { name: 'Quick picks' }).getByRole('button', { name: 'do 10 squats' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Turn it on' }).click();
    await expect(page.getByRole('heading', { name: 'On', exact: true })).toBeVisible();
    if (size === 200) await textAt200(page);
    await page.evaluate(() => {
      sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ pendingPackage: 'com.example.video', pendingReason: 'open' }));
      window.dispatchEvent(new Event('nandi:night-pause'));
    });
    const card = page.getByRole('dialog', { name: 'Pause card' });
    await expect(card).toBeVisible();
    await settle(page);
    // a9: the card (3 ways and 3 links) on one screen, and the links each on a line of their own.
    const links = await card.locator('.ink-link').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { text: node.textContent, top: Math.round(r.top), bottom: Math.round(r.bottom) }; }));
    console.log(`pause card ${t} ${size}%: links ${JSON.stringify(links)}`);
    const tops = links.filter(link => link.text !== 'Start the 2 minutes').map(link => link.top);
    expect(new Set(tops).size).toBe(tops.length);
    if (size === 100) expect(Math.max(...links.map(link => link.bottom))).toBeLessThanOrEqual(800);
    // b2 14 Nov: the overlay scrolls, so a full-page shot cuts the card; shoot the screen, then the card scrolled to its end.
    const toEnd = () => page.locator('.pause-overlay').evaluate(node => { node.scrollTop = node.scrollHeight; });
    await snap(page, `pause-${t}-${size}-card`);
    if (size === 200) { await toEnd(); await settle(page); await snap(page, `pause-${t}-${size}-card-end`); }
    await card.getByRole('button', { name: /^Start the 2/ }).click();
    await settle(page);
    await snap(page, `pause-${t}-${size}-act`);
    if (size === 200) { await toEnd(); await settle(page); await snap(page, `pause-${t}-${size}-act-end`); }
    await card.getByRole('button', { name: 'I did it' }).click();
    await expect(card.getByRole('button', { name: 'Go to NANDI home' })).toBeVisible();
    await settle(page);
    await snap(page, `pause-${t}-${size}-done`);
    await page.context().close();
  });

  test(`Pause setup with the card on, ${theme}, ${size}%`, async ({ browser }) => {
    const t = theme === 'light' ? 'l' : 'd';
    const page = await phone(browser, theme);
    await page.goto('/?e2e#plan');
    await page.getByRole('button', { name: /^Pause card/ }).click();
    await page.getByLabel('Instagram').check();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('group', { name: 'Quick picks' }).getByRole('button', { name: 'do 10 squats' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Turn it on' }).click();
    await expect(page.getByRole('heading', { name: 'On', exact: true })).toBeVisible();
    if (size === 200) await textAt200(page);
    const row = page.locator('.pause-setup-nav');
    await row.scrollIntoViewIfNeeded();
    await settle(page);
    // b2 14 Nov: no button word splits ("Chan / ge it" at 200%): each label's text is on one line.
    const lines = await row.locator('button').evaluateAll(nodes => nodes.map(node => { const range = document.createRange(); range.selectNodeContents(node); return range.getClientRects().length; }));
    expect(lines.every(count => count === 1), JSON.stringify(lines)).toBe(true);
    await snap(page, `pause-setup-${t}-${size}`);
    await page.context().close();
  });
}
