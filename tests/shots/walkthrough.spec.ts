import { expect, test, type Browser, type Page } from '@playwright/test';
import { textAt200 } from '../e2e/helpers/text';

// Sun 15 Nov whole-app walkthrough (walkthrough-15nov/walkthrough-script-b2.md): the journeys no other shot set takes.
// The rest come from the existing sets (stage2-571, trek575, quests660, spec40, shots, sat14, j3), filed by journey in
// the folder's INDEX.md. Pictures: SHOTS_DIR (default D:/nandi-gate-logs/shots-walkthrough-15nov), 360x800.
const OUT = process.env.SHOTS_DIR ?? 'D:/nandi-gate-logs/shots-walkthrough-15nov';
const NOON = new Date('2026-11-10T12:00:00');
const DAY = '2026-11-10';
const settle = (page: Page) => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

type Row = Record<string, unknown>;
let serial = 0;
const fact = (day: string, mode: string, kind: string, inputs: Row = {}): Row => ({
  id: `${kind}:walk-${++serial}`, dayKey: day, mode, kind, refId: `walk-${serial}`, inputs, updatedAt: new Date(`${day}T10:00:00`).getTime() + serial, deleted: 0, deviceId: 'walk',
});
const daysBefore = (day: string, n: number) => Array.from({ length: n }, (_, i) => new Date(Date.parse(`${day}T12:00:00Z`) - (i + 1) * 86_400_000).toISOString().slice(0, 10));
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
const setting = (key: string, value: unknown): Row => ({ key, value, updatedAt: 1, deleted: 0, deviceId: 'walk' });
async function phone(browser: Browser, theme: 'light' | 'dark', time: Date, fakeClock = false): Promise<Page> {
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme, reducedMotion: 'reduce', baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  if (fakeClock) await page.clock.install({ time }); else await page.clock.setFixedTime(time);
  await page.goto('/?e2e#courtyard');
  return page;
}
/** Opens a route fresh, leaving the night deck if it opens, and waits for `ready`. */
async function open(page: Page, route: string, ready: string) {
  await page.goto(`/?e2e#${route}`);
  await page.reload();
  const deck = page.getByRole('button', { name: 'Leave night deck' });
  await expect(page.locator(ready).first().or(deck)).toBeVisible({ timeout: 15_000 });
  if (route !== 'night' && await deck.isVisible()) { await deck.click(); await page.goto(`/?e2e#${route}`); await expect(page.locator(ready).first()).toBeVisible({ timeout: 15_000 }); }
  await page.waitForTimeout(400);
  await settle(page);
}
const snap = (page: Page, name: string, full = false) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
const variants = [['light', 100], ['dark', 100], ['light', 200]] as const;
const tag = (theme: string, size: number) => `${theme === 'light' ? '' : '-dark'}${size === 200 ? '-200' : ''}`;

// w02 Day one: plan one task, a 6-minute focus, finish; the trek moves and the jar fills.
test('w02 day one: plan a task, focus 6 minutes, finish', async ({ browser }) => {
  const page = await phone(browser, 'light', NOON, true);
  await open(page, 'plan', 'main');
  await page.getByLabel('Add a task').fill('Water the plants');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const row = page.getByRole('region', { name: 'Today', exact: true }).locator('.mor-row').filter({ hasText: 'Water the plants' });
  await expect(row).toBeVisible();
  await snap(page, 'w02-day-one-01-planned');
  await row.getByRole('button', { name: 'Start' }).click();
  const focus = page.getByRole('region', { name: 'Focus' });
  await expect(focus).toContainText('Water the plants');
  await page.clock.fastForward(6 * 60_000);
  await settle(page);
  await snap(page, 'w02-day-one-02-focus-6min');
  await focus.getByRole('button', { name: 'Done' }).click();
  await page.waitForTimeout(600);
  await snap(page, 'w02-day-one-03-done');
  await page.goto('/?e2e#yatra');
  await expect(page.locator('.trek-strip').first()).toBeVisible({ timeout: 15_000 });
  // The Yatra tab keeps Plan's scroll; the trek is at the top.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await snap(page, 'w02-day-one-04-yatra-after');
  await page.goto('/?e2e#courtyard');
  await expect(page.locator('.courtyard-b')).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(500);
  await snap(page, 'w02-day-one-05-courtyard-after');
  await page.context().close();
});

// w03 (b2 14 Nov): s4 and s5 with 2 soft days, by day, at dusk and at night (the lamp stand and the lit windows).
for (const stage of [4, 5]) for (const [when, time] of [['day', '2026-11-10T12:00:00'], ['dusk', '2026-11-10T18:45:00'], ['night', '2026-11-11T01:45:00']] as const) {
  test(`w03 courtyard s${stage} with 2 soft days, ${when}`, async ({ browser }) => {
    for (const theme of ['light', 'dark'] as const) {
      const page = await phone(browser, theme, new Date(time));
      await put(page, 'ledger', [...corners(stage), ...daysBefore(DAY, 2).map(day => fact(day, 'soft', 'soft', {}))]);
      await open(page, 'courtyard', '.courtyard-b');
      await expect(page.locator('.courtyard-b [data-lanterns="2"]')).toHaveCount(1);
      await snap(page, `w03-courtyard-s${stage}-2soft-${when}${theme === 'dark' ? '-dark' : ''}`);
      await page.context().close();
    }
  });
}

// w05 Night window: bedtime set, past it: the courtyard rests, Grow › Calm & Sleep has the Tonight link, a task done
// after bedtime counts toward no day.
for (const [theme, size] of variants) {
  test(`w05 night window${tag(theme, size)}`, async ({ browser }) => {
    const page = await phone(browser, theme, new Date('2026-11-10T23:30:00'));
    await put(page, 'settings', [setting('planner.bedtime', '22:00'), setting('planner.shutdown', '21:30')]);
    await put(page, 'ledger', corners(2));
    await open(page, 'courtyard', '.courtyard-b');
    if (size === 200) await textAt200(page);
    await settle(page);
    await snap(page, `w05-night-01-courtyard${tag(theme, size)}`);
    await open(page, 'grow/sleep', 'main h1');
    if (size === 200) await textAt200(page);
    await settle(page);
    await snap(page, `w05-night-02-calm-sleep${tag(theme, size)}`, true);
    await page.context().close();
  });
}

// w10 Grow's other doors: each door's first screen.
test('w10 grow doors', async ({ browser }) => {
  const page = await phone(browser, 'light', NOON);
  await put(page, 'ledger', corners(2));
  for (const [route, name] of [['grow', 'grow'], ['grow/remember', 'remember'], ['yatra/mind', 'play'], ['yatra/train', 'train'], ['yatra/calm', 'calm']] as const) {
    await open(page, route, 'main h1, main h2');
    await snap(page, `w10-grow-${name}`, true);
  }
  await page.context().close();
});

// w12 You: the tab, Your record, settings and history (light, dark and 200% on the tab and the record).
for (const [theme, size] of variants) {
  test(`w12 you${tag(theme, size)}`, async ({ browser }) => {
    const page = await phone(browser, theme, NOON);
    await put(page, 'ledger', corners(3));
    for (const [route, name] of [['you', 'tab'], ['yatra/days', 'record'], ['you/settings', 'settings'], ['you/history', 'history']] as const) {
      if (size !== 100 && (name === 'settings' || name === 'history')) continue;
      if (theme === 'dark' && (name === 'settings' || name === 'history')) continue;
      await open(page, route, 'main h1, main h2');
      if (size === 200) await textAt200(page);
      await settle(page);
      await snap(page, `w12-you-${name}${tag(theme, size)}`, true);
    }
    await page.context().close();
  });
}

// w01 Fresh install: the first open, picking two, the first thing, then the Courtyard at s1.
for (const [theme, size] of variants) {
  test(`w01 fresh install${tag(theme, size)}`, async ({ browser }) => {
    const page = await phone(browser, theme, NOON);
    await page.goto('/?e2e&welcome');
    const welcome = page.getByRole('dialog', { name: 'Welcome to NANDI' });
    await expect(welcome).toBeVisible({ timeout: 15_000 });
    if (size === 200) await textAt200(page);
    await settle(page);
    await snap(page, `w01-fresh-01-welcome${tag(theme, size)}`);
    await welcome.getByLabel('I’m 18 or older.').check();
    await welcome.getByRole('button', { name: 'Let’s start' }).click();
    await expect(welcome.getByRole('heading', { name: 'Pick two to start' })).toBeVisible();
    await welcome.getByRole('button', { name: 'Get things done', exact: true }).click();
    await welcome.getByRole('button', { name: 'Sleep earlier', exact: true }).click();
    await settle(page);
    await snap(page, `w01-fresh-02-pick-two${tag(theme, size)}`);
    await welcome.getByRole('button', { name: 'Continue' }).click();
    await settle(page);
    await snap(page, `w01-fresh-03-first-thing${tag(theme, size)}`);
    await page.goto('/?e2e#courtyard');
    await expect(page.locator('.courtyard-b')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(500);
    await snap(page, `w01-fresh-04-courtyard${tag(theme, size)}`);
    await page.context().close();
  });
}
