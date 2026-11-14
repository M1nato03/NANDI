import { readFileSync } from 'node:fs';
import { expect, test, type Browser, type Page, type TestInfo } from '@playwright/test';
import { walkIdea } from './learn-helpers';
import { openMore } from './helpers/plan';

// Spec 52 (A + C + D): two things first. Welcome's picks, nothing locked, one next move that lands in the thing (timed
// on the Low profile: 4x CPU), the ten-day offer, the pause offer after the first finish, and the first win's app time.
const NOON = new Date('2026-11-04T12:00:00'); // a Wednesday
type Row = readonly [string, unknown];
const putSettings = (page: Page, rows: readonly Row[]) => page.evaluate(async entries => {
  const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
  await new Promise<void>(resolve => {
    const transaction = database.transaction('settings', 'readwrite');
    for (const [key, value] of entries) transaction.objectStore('settings').put({ key, value, updatedAt: 1, deleted: 0, deviceId: 'two-e2e' });
    transaction.oncomplete = () => resolve();
  });
  database.close();
}, rows);
const settingsOf = (page: Page, keys: string[]) => page.evaluate(async names => {
  const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
  const get = (key: string) => new Promise<unknown>(resolve => { const request = database.transaction('settings').objectStore('settings').get(key); request.onsuccess = () => resolve((request.result as { value?: unknown } | undefined)?.value); });
  const values = Object.fromEntries(await Promise.all(names.map(async key => [key, await get(key)] as const)));
  database.close();
  return values;
}, keys);
type Fact = { id: string; dayKey: string; mode: string; kind: string; refId: string; inputs: Record<string, unknown>; updatedAt: number; deleted: 0; deviceId: string };
let count = 0;
const fact = (day: string, mode = 'tasks', kind = 'done'): Fact => ({ id: `${kind}:two-${++count}`, dayKey: day, mode, kind, refId: `two-${count}`,
  inputs: kind === 'done' ? { plannedSize: 'M', wasPlanned: true } : {}, updatedAt: new Date(`${day}T12:00:00`).getTime() + count, deleted: 0, deviceId: 'two-e2e' });
const putFacts = (page: Page, rows: Fact[]) => page.evaluate(async facts => {
  const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
  await new Promise<void>(resolve => { const transaction = database.transaction('ledger', 'readwrite'); for (const row of facts) transaction.objectStore('ledger').put(row); transaction.oncomplete = () => resolve(); });
  database.close();
}, rows);
const days = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `2026-10-${String(from + i).padStart(2, '0')}`);
/** A fresh app with these picks (written as Welcome writes them), opened on Home (the Courtyard, spec 571 stage 2). */
async function withPicks(page: Page, goals: string[], size = goals.length > 2 ? 'more' : 'two', extra: Row[] = []) {
  await page.goto('/?e2e#plan');
  await expect(page.locator('.plan-screen')).toBeVisible();
  await putSettings(page, [['profile.goals', goals], ['profile.size', size], ['profile.adultConfirmedAt', '2026-10-20T12:00:00.000Z'], ...extra]);
  await page.goto('/?e2e#courtyard');
  await page.reload();
  await settled(page);
}
/** b2 13 Nov: the card's row is final (the phase, the rows and the quests are all in), so nothing swaps under a tap. */
async function settled(page: Page) {
  await expect(page.locator('.courtyard-card[data-ready]')).toHaveCount(1, { timeout: 15_000 });
  await expect(cardRow(page)).toBeVisible();
}
const move = (page: Page) => page.locator('.next-move-go');
/**
 * Spec 660 (b2 ruling a): the card's collapsed row is the next move when it is due now, else today's quest (the move
 * then opens the sheet, first). Either way the row is on show.
 */
const cardRow = (page: Page) => page.locator('.courtyard-card-next .next-move-go, .courtyard-card-next .courtyard-card-row').first();
async function tapMove(page: Page) {
  const handle = page.locator('.courtyard-card-handle');
  if (!await move(page).isVisible() && await handle.getAttribute('aria-expanded') !== 'true') await handle.click();
  await move(page).click();
}
/** Spec 571 stage 2: the Courtyard's card holds the week's rows; its handle opens it (a button as well as a swipe). */
async function openCard(page: Page) {
  const handle = page.locator('.courtyard-card-handle');
  await expect(handle).toBeVisible();
  if (await handle.getAttribute('aria-expanded') !== 'true') await handle.click();
  await expect(handle).toHaveAttribute('aria-expanded', 'true');
}
/** Spec 571 §0.20: the header rings' lines (each ring's aria-label), in order, once the rings are there. */
const ringLines = (page: Page) => page.getByRole('navigation', { name: "Today’s rings" }).getByRole('button').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')));
const ALL_RINGS = ['Yatra: keep one promise.', 'Body: one real move.', 'Mind: any two.'];

async function hello(page: Page) {
  const welcome = page.getByRole('dialog', { name: 'Welcome to NANDI' });
  await welcome.getByLabel("I’m 18 or older.").check();
  await welcome.getByRole('button', { name: "Let’s start" }).click();
  await expect(welcome.getByRole('heading', { name: 'Pick two to start' })).toBeVisible();
  return welcome;
}

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test.describe('Welcome: pick two to start', () => {
  test('one or two picks; a third tap is refused; 3-4 things takes four; the picks and the size are saved', async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await page.goto('/?e2e&welcome');
    const welcome = await hello(page);
    await expect(welcome).toContainText('The rest is always there. You can change this any time in the You tab.');
    await expect(welcome.getByRole('button', { name: 'Continue' })).toHaveCount(0);
    const area = (name: string) => welcome.getByRole('button', { name, exact: true });
    await area('Sharpen my mind').click();
    await expect(area('Sharpen my mind')).toHaveAttribute('aria-pressed', 'true');
    await expect(welcome.getByRole('button', { name: 'Continue' })).toBeVisible();
    await area('Learn something').click();
    await area('Get fit').click();
    await expect(area('Get fit')).toHaveAttribute('aria-pressed', 'false');
    await expect(welcome.getByRole('status')).toHaveText('Two to start. You can add more later.');
    await expect(welcome).toContainText('Want more?');
    await welcome.getByRole('button', { name: '3-4 things' }).click();
    // The title follows the size; the size line drops back to "Just two".
    await expect(welcome.getByRole('heading', { level: 1 })).toHaveText('Pick up to four');
    await expect(welcome.locator('.goal-size')).toHaveText('Up to four·Just two·Everything');
    await area('Get fit').click();
    await area('Get things done').click();
    await area('Sleep earlier').click();
    await expect(area('Sleep earlier')).toHaveAttribute('aria-pressed', 'false');
    await expect(welcome.getByRole('status')).toHaveText('Four at most. Tap Everything to pick all five.');
    await welcome.getByRole('button', { name: 'Continue' }).click();
    // The first pick's first action is still the first action.
    await welcome.getByRole('button', { name: 'Try today’s puzzle' }).click();
    await expect(welcome).toHaveCount(0);
    expect(await settingsOf(page, ['profile.goals', 'profile.size'])).toEqual({ 'profile.goals': ['mind', 'learn', 'train', 'plan'], 'profile.size': 'more' });
  });

  test('the rows hold still under the finger: the first pick, the second and a refused third move nothing', async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await page.goto('/?e2e&welcome');
    const welcome = await hello(page);
    const area = (name: string) => welcome.getByRole('button', { name, exact: true });
    const top = async () => (await area('Sleep earlier').boundingBox())!.y;
    const before = await top();
    await area('Learn something').click();
    await expect(welcome.getByRole('button', { name: 'Continue' })).toBeVisible();
    expect(await top()).toBe(before);
    await area('Get fit').click();
    expect(await top()).toBe(before);
    await area('Sharpen my mind').click();
    await expect(welcome.getByRole('status')).toHaveText('Two to start. You can add more later.');
    expect(await top()).toBe(before);
  });

  test('Everything picks all five and goes on; with nothing tapped first, the first win is the first chapter', async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await page.goto('/?e2e&welcome');
    const welcome = await hello(page);
    await welcome.getByRole('button', { name: 'Everything' }).click();
    await expect(welcome).toContainText('When do you want to be asleep?');
    await welcome.getByRole('button', { name: 'Start your first chapter' }).click();
    await expect(page).toHaveURL(/#grow\/read\/chapter\/psychology\/psychology-ch1$/);
    expect(await settingsOf(page, ['profile.goals', 'profile.size'])).toEqual({ 'profile.goals': ['sleep', 'learn', 'train', 'mind', 'plan'], 'profile.size': 'all' });
  });
});

test('an install from before spec 52 counts as Everything: Home, the rings and You read as before', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#courtyard');
  await expect(move(page)).toContainText('Read one idea');
  await expect(move(page)).toContainText('A short sitting with Chiku');
  // Spec 571 §0.20: Everything shows all three rings.
  await expect.poll(() => ringLines(page)).toEqual(ALL_RINGS);
  // Spec 660: Read is not due now, so the row is today's quest and the move waits in the sheet, first.
  await expect(page.locator('.courtyard-card-next .courtyard-card-row[data-kind="quest"]')).toContainText(/has a quest/);
  // The one change for existing installs: the card opens the chapter itself, not the Read tab's front page.
  await tapMove(page);
  await expect(page).toHaveURL(/#grow\/read\/chapter\/psychology\/psychology-ch1$/);
  await page.goto('/?e2e#you');
  await expect(page.getByRole('button', { name: /^What NANDI helps with/ })).toContainText('Everything');
  expect(await settingsOf(page, ['profile.size'])).toEqual({ 'profile.size': undefined });
});

test('You: the same toggles; a change applies at once to the next move and the rings', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await withPicks(page, ['learn', 'mind']);
  await expect(move(page)).toContainText('Read one idea');
  await expect.poll(() => ringLines(page)).toEqual(['Mind: any two.']);
  await page.goto('/?e2e#you');
  await page.getByRole('button', { name: /^What NANDI helps with/ }).click();
  await expect(page).toHaveURL(/#you\/helps$/);
  await page.getByRole('button', { name: 'Learn something', exact: true }).click();
  await page.getByRole('button', { name: 'Sleep earlier', exact: true }).click();
  await expect.poll(() => settingsOf(page, ['profile.goals'])).toEqual({ 'profile.goals': ['mind', 'sleep'] });
  await page.goto('/?e2e#courtyard');
  await expect(move(page)).toContainText("Today’s puzzle board");
  // Mind and Sleep: the Mind ring only (Sleep has no ring).
  await expect.poll(() => ringLines(page)).toEqual(['Mind: any two.']);
  // Train alone: the Body ring.
  await putSettings(page, [['profile.goals', ['train']]]);
  await page.reload();
  await expect(cardRow(page)).toBeVisible();
  await expect.poll(() => ringLines(page)).toEqual(['Body: one real move.']);
  // Sleep alone: no rings (the empty slot keeps the bar's size).
  await putSettings(page, [['profile.goals', ['sleep']]]);
  await page.reload();
  await expect(cardRow(page)).toBeVisible();
  await expect(page.getByRole('navigation', { name: "Today’s rings" })).toHaveCount(0);
  await expect(page.locator('.today-rings-slot')).toHaveCount(1);
});

test('nothing is locked: at two picks every route in the app table opens the same screen as at Everything', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  await page.clock.setFixedTime(NOON);
  const source = readFileSync('src/ui/shell/AppShell.tsx', 'utf8');
  const routes = [...new Set([...source.matchAll(/path === '([a-z0-9/-]+)'/g)].map(match => match[1]!))];
  testInfo.annotations.push({ type: 'routes', description: `${routes.length} routes: ${routes.join(' ')}` });
  console.log(`spec 52 gate 4: ${routes.length} routes in AppShell's table`);
  const screens = async () => {
    const seen: Record<string, string> = {};
    for (const route of routes) {
      await page.goto(`/?e2e#${route}`);
      await expect(page.locator('#main')).toBeVisible();
      // A hash change keeps the page, so the screen swaps in a moment later: read the heading once it holds still.
      let heading = '', last = '-';
      for (let tries = 0; tries < 20 && heading !== last; tries++) {
        last = heading;
        await page.waitForTimeout(200);
        heading = (await page.locator('#main h1').first().textContent({ timeout: 2000 }).catch(() => ''))?.trim() ?? '';
      }
      seen[route] = `${await page.evaluate(() => location.hash)} | ${heading}`;
    }
    return seen;
  };
  await page.goto('/?e2e#plan');
  const all = await screens();
  await putSettings(page, [['profile.goals', ['learn', 'mind']], ['profile.size', 'two']]);
  expect(await screens()).toEqual(all);
});

/** Opens a fresh context on the Low profile (4x CPU), with these picks, on Home, at the project's own size (a9 13 Nov). */
async function lowPhone(browser: Browser, testInfo: TestInfo, goals: string[]) {
  const context = await browser.newContext({ baseURL: testInfo.project.use.baseURL, viewport: testInfo.project.use.viewport ?? { width: 360, height: 800 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.clock.setFixedTime(NOON);
  await withPicks(page, goals);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  return { page, close: () => context.close() };
}
const LANDS: { area: string; title: string; route: RegExp; first: (page: Page) => ReturnType<Page['locator']> }[] = [
  { area: 'learn', title: 'Read one idea', route: /#grow\/read\/chapter\/psychology\/psychology-ch1$/, first: page => page.locator('.idea-page') },
  { area: 'mind', title: "Today’s puzzle board", route: /#grow\/play\/board\/daily$/, first: page => page.getByText(/Daily board (#\d+ )?· /) },
  { area: 'train', title: 'An easy first workout', route: /#grow\/train\/workout$/, first: page => page.getByText('Current exercise') },
  { area: 'plan', title: 'Plan today', route: /#plan\/morning$/, first: page => page.getByRole('heading', { name: 'Morning plan' }) },
  { area: 'sleep', title: 'Plan tonight', route: /#you\/tonight$/, first: page => page.getByRole('region', { name: 'Night plan setting' }) },
];
const median = (values: number[]) => [...values].sort((a, b) => a - b)[1]!;

test('b2 13 Nov: on the Low profile the card row never swaps between its first paint and settled', async ({ browser }, testInfo) => {
  test.setTimeout(120_000);
  for (const goals of [['sleep'], ['train'], ['learn']]) {
    const context = await browser.newContext({ baseURL: testInfo.project.use.baseURL, viewport: { width: 360, height: 800 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.clock.setFixedTime(NOON);
    await page.goto('/?e2e#plan');
    await expect(page.locator('.plan-screen')).toBeVisible();
    await putSettings(page, [['profile.goals', goals], ['profile.size', 'two'], ['profile.adultConfirmedAt', '2026-10-20T12:00:00.000Z']]);
    // Every text the row shows, from the first paint on (a fresh document after the reload), recorded as it changes.
    await page.addInitScript(() => {
      const seen: string[] = [];
      (window as unknown as { rowTexts: string[] }).rowTexts = seen;
      const read = () => { const text = document.querySelector('.courtyard-card-next')?.textContent?.trim() ?? ''; if (text && seen[seen.length - 1] !== text) seen.push(text); };
      new MutationObserver(read).observe(document, { subtree: true, childList: true, characterData: true });
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto('/?e2e#courtyard');
    await page.reload();
    await settled(page);
    await page.waitForTimeout(1000);
    const texts = await page.evaluate(() => (window as unknown as { rowTexts: string[] }).rowTexts);
    testInfo.annotations.push({ type: 'row', description: `${goals[0]}: ${texts.join(' -> ')}` });
    expect(texts, `${goals[0]}: the row's texts from first paint`).toHaveLength(1);
    await context.close();
  }
});

test.describe('lands in the thing in 2 s or less on the Low profile (median of 3)', () => {
  test.describe.configure({ mode: 'serial' });
  for (const land of LANDS) {
    test(`${land.area}: one tap from Home to the first readable text`, async ({ browser }, testInfo) => {
      test.setTimeout(120_000);
      const times: number[] = [];
      for (let run = 0; run < 3; run++) {
        const phone = await lowPhone(browser, testInfo, [land.area]);
        // Spec 660 (b2 ruling a, every size): a move that is not due now sits first in the card's sheet, so Home to the
        // thing is at most 2 taps (open the card, the move), timed from the first tap; the move's tap starts it, with no
        // confirm screen between (the first readable text is checked right after it).
        const handle = phone.page.locator('.courtyard-card-handle');
        let taps = 0;
        // The clock runs from the first tap on a settled card (b2 13 Nov): the row the person sees is the one they tap.
        await settled(phone.page);
        const start = performance.now();
        if (!await move(phone.page).isVisible() && await handle.getAttribute('aria-expanded') !== 'true') { await handle.click(); taps++; }
        await expect(move(phone.page)).toContainText(land.title);
        await move(phone.page).click(); taps++;
        expect(taps, `${land.area}: taps from Home`).toBeLessThanOrEqual(2);
        await expect(land.first(phone.page)).toBeVisible({ timeout: 15_000 });
        times.push(Math.round(performance.now() - start));
        await expect(phone.page).toHaveURL(land.route);
        await phone.close();
      }
      testInfo.annotations.push({ type: 'ms', description: `${land.area}: ${times.join(', ')} (median ${median(times)})` });
      console.log(`spec 52 gate 5 [${testInfo.project.name} r${testInfo.repeatEachIndex}]: ${land.area} ${times.join(', ')} ms, median ${median(times)}`);
      expect(median(times)).toBeLessThanOrEqual(2000);
    });
  }
});

test.describe('the ten-day offer', () => {
  test('shows on the tenth useful day, not the ninth; "Not now" is final (day 11, day 20, a reload)', async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await withPicks(page, ['learn', 'mind']);
    await openCard(page);
    const offer = page.getByRole('region', { name: 'Add one more thing' });
    await putFacts(page, days(21, 29).map(day => fact(day)));
    await page.reload();
    await expect(cardRow(page)).toBeVisible();
    await expect(offer).toHaveCount(0);
    await putFacts(page, [fact('2026-10-30')]);
    await page.reload();
    await openCard(page);
    await expect(offer).toContainText('Ten useful days. Add one more thing?');
    // Nine of the ten were tasks done: Plan is the area used most without being picked.
    await expect(offer.getByRole('button', { name: 'Get things done' })).toBeVisible();
    await offer.getByRole('button', { name: 'Not now' }).click();
    await expect(offer).toHaveCount(0);
    await putFacts(page, [fact('2026-10-31')]);
    await page.reload();
    await expect(cardRow(page)).toBeVisible();
    await expect(offer).toHaveCount(0);
    await putFacts(page, days(1, 9).map(day => fact(day.replace('-10-', '-11-'))).filter(row => row.dayKey <= '2026-11-04'));
    await page.reload();
    await expect(cardRow(page)).toBeVisible();
    await expect(offer).toHaveCount(0);
    expect(await settingsOf(page, ['profile.moreOffer'])).toEqual({ 'profile.moreOffer': 'not-now' });
  });
  test('names the area used most without picking it, and adding it saves the picks', async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await withPicks(page, ['plan', 'learn']);
    await putFacts(page, [...days(21, 30).map(day => fact(day)), fact('2026-10-22', 'mind', 'board'), fact('2026-10-25', 'mind', 'board')]);
    await page.reload();
    await openCard(page);
    const offer = page.getByRole('region', { name: 'Add one more thing' });
    await offer.getByRole('button', { name: 'Sharpen my mind' }).click();
    await expect(offer).toHaveCount(0);
    expect(await settingsOf(page, ['profile.goals', 'profile.size', 'profile.moreOffer'])).toEqual({ 'profile.goals': ['plan', 'learn', 'mind'], 'profile.size': 'more', 'profile.moreOffer': 'added' });
  });
  test('four picks are offered Everything; Everything is offered nothing', async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await withPicks(page, ['plan', 'learn', 'mind', 'sleep']);
    await putFacts(page, days(21, 30).map(day => fact(day)));
    await page.reload();
    await openCard(page);
    await expect(page.getByRole('region', { name: 'Add one more thing' }).getByRole('button', { name: 'Everything' })).toBeVisible();
    await putSettings(page, [['profile.size', 'all']]);
    await page.reload();
    await expect(cardRow(page)).toBeVisible();
    await expect(page.getByRole('region', { name: 'Add one more thing' })).toHaveCount(0);
  });
});

test.describe('the pause offer after the first finish', () => {
  const offer = (page: Page) => page.getByRole('dialog', { name: 'Want NANDI to catch you when you open Instagram or YouTube?' });
  async function doTask(page: Page, title: string) {
    await page.goto('/?e2e#plan');
    await openMore(page);
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill(title);
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: 'Done' }).last().click();
    await expect(page.locator('.finish-moment')).toBeVisible();
  }
  test('once, after the finish moment fades, where the card works; Not now is final', async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await withPicks(page, ['plan', 'learn']);
    await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
    await doTask(page, 'Call the bank');
    await expect(offer(page)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.finish-moment')).toHaveCount(0);
    await offer(page).getByRole('button', { name: 'Not now' }).click();
    await expect(offer(page)).toHaveCount(0);
    await doTask(page, 'Post the letter');
    await page.waitForTimeout(2500);
    await expect(offer(page)).toHaveCount(0);
    expect(await settingsOf(page, ['pause.offer'])).toEqual({ 'pause.offer': 'not-now' });
  });
  test('no offer without a phone build (no pause stand-in)', async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await withPicks(page, ['plan']);
    await doTask(page, 'Water the plants');
    await page.waitForTimeout(2500);
    await expect(offer(page)).toHaveCount(0);
  });
  test('no offer for an install from before spec 52 (no size), even on a phone', async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await page.goto('/?e2e#plan');
    await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
    await doTask(page, 'Pay the rent');
    await page.waitForTimeout(2500);
    await expect(offer(page)).toHaveCount(0);
  });
  test('Set it up opens the existing setup', async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await withPicks(page, ['plan']);
    await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
    await doTask(page, 'Call home');
    await offer(page).getByRole('button', { name: 'Set it up' }).click();
    await expect(page).toHaveURL(/#plan\/pause$/);
    // The answer is saved without holding up the move to setup, so it can land just after the URL changes.
    await expect.poll(() => settingsOf(page, ['pause.offer'])).toEqual({ 'pause.offer': 'set-up' });
  });
});

test.describe('the first win: app time from first paint to the first finish moment', () => {
  test.describe.configure({ mode: 'serial' });
  const firstPaint = (page: Page) => page.evaluate(() => performance.getEntriesByName('first-paint')[0]?.startTime ?? performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0);
  // The finish moment is a short toast, so the page notes when it first appears rather than the test catching it.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      new MutationObserver((_, observer) => {
        if (!document.querySelector('.finish-moment')) return;
        (window as Window & { firstFinish?: number }).firstFinish = performance.now();
        observer.disconnect();
      }).observe(document, { childList: true, subtree: true });
    });
  });
  const finishAt = async (page: Page) => (await page.waitForFunction(() => (window as Window & { firstFinish?: number }).firstFinish, undefined, { timeout: 10_000 })).jsonValue() as Promise<number>;
  const record = (testInfo: TestInfo, pick: string, ms: number | string) => {
    testInfo.annotations.push({ type: 'first-win', description: `${pick}: ${ms}` });
    console.log(`spec 52 gate 7 [${testInfo.project.name} r${testInfo.repeatEachIndex}]: ${pick} ${ms}`);
  };
  async function start(page: Page, label: string, action: string) {
    await page.clock.setFixedTime(NOON);
    await page.goto('/?e2e&welcome');
    const welcome = await hello(page);
    await welcome.getByRole('button', { name: label, exact: true }).click();
    await welcome.getByRole('button', { name: 'Continue' }).click();
    await welcome.getByRole('button', { name: action }).click();
    await expect(welcome).toHaveCount(0);
  }
  test('Learn something', async ({ page }, testInfo) => {
    await start(page, 'Learn something', 'Start your first chapter');
    await walkIdea(page, 'psychology');
    await expect(page.locator('.idea-end')).toContainText('Idea done');
    // The first idea's finish shows even when reconcile's first badge tier lands in the same update (it missed 3 in 16).
    const at = await finishAt(page);
    record(testInfo, 'learn', `${Math.round(at - await firstPaint(page))} ms`);
  });
  test('Sharpen my mind', async ({ page }, testInfo) => {
    await start(page, 'Sharpen my mind', 'Try today’s puzzle');
    await page.waitForFunction(() => Boolean((window as Window & { __nandiMindTest?: unknown }).__nandiMindTest));
    await page.evaluate(() => (window as Window & { __nandiMindTest?: { solveKnownSolution: () => void } }).__nandiMindTest!.solveKnownSolution());
    const at = await finishAt(page);
    record(testInfo, 'mind', `${Math.round(at - await firstPaint(page))} ms`);
  });
  test('Get fit', async ({ page }, testInfo) => {
    await start(page, 'Get fit', 'Start an easy first workout');
    await page.getByRole('button', { name: 'Log set' }).click();
    await page.getByRole('button', { name: 'Finish session' }).click();
    const at = await finishAt(page);
    record(testInfo, 'train', `${Math.round(at - await firstPaint(page))} ms`);
  });
  test('Get things done', async ({ page }, testInfo) => {
    await start(page, 'Get things done', 'Add your first task');
    await page.getByPlaceholder('Add a task', { exact: true }).fill('Call the bank');
    await page.getByPlaceholder('Add a task', { exact: true }).press('Enter');
    await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: /^Done/ }).first().click();
    const at = await finishAt(page);
    record(testInfo, 'plan', `${Math.round(at - await firstPaint(page))} ms`);
  });
  test('Sleep earlier', async ({ page }, testInfo) => {
    await start(page, 'Sleep earlier', 'Plan tonight');
    await expect(page.getByRole('region', { name: 'Night plan setting' })).toBeVisible();
    // Planning tonight saves a plan; it is not a finish moment (none of its writes is a finish), so there is no time.
    record(testInfo, 'sleep', 'no finish moment on its first action (Plan tonight saves a plan)');
  });
});
