import { expect, test, type Page } from '@playwright/test';
import { textAt200 } from './helpers/text';

// Spec 45b, moved by spec 571 stage 2: Home is the Courtyard (layout B) with the §0.2 rows in one bottom card: exactly
// one next move (collapsed), in the order focus, Book check, Train day, task, Read; swiped up, the useful days
// (decision 7) and the crew. The camp's heading and its five friends (each a button to its area) are on the Yatra tab.
const WED = new Date('2026-10-28T10:00:00');
const meta = { updatedAt: 1, deleted: 0, deviceId: 'e2e' };
const move = (page: Page) => page.locator('.next-move-go');

async function put(page: Page, store: string, rows: Record<string, unknown>[]) {
  await page.evaluate(async ({ store, rows }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => { const transaction = database.transaction(store, 'readwrite'); for (const row of rows) transaction.objectStore(store).put(row); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
    database.close();
  }, { store, rows });
}
/** Spec 660 (b2 ruling a): the collapsed row is the next move only when it is due now; otherwise today's quest. */
const row = (page: Page) => page.locator('.courtyard-card-next');
const questRow = (page: Page) => row(page).locator('.courtyard-card-row[data-kind="quest"]');
async function home(page: Page) {
  await page.goto('/?e2e#courtyard');
  await expect(row(page).locator('.next-move-go, .courtyard-card-row').first()).toBeVisible();
}
/** The move is in the row when due, else the sheet's first section: open the card when it is not on show. */
async function tapMove(page: Page) {
  if (!await move(page).isVisible()) await openCard(page);
  await move(page).click();
}
/** Opens the Courtyard's card (its handle is a button as well as a swipe). */
async function openCard(page: Page) {
  const handle = page.locator('.courtyard-card-handle');
  if (await handle.getAttribute('aria-expanded') !== 'true') await handle.click();
  await expect(handle).toHaveAttribute('aria-expanded', 'true');
}
async function camp(page: Page) {
  await page.goto('/?e2e#yatra');
  await expect(page.locator('.trek-strip .home-title h2')).toBeVisible();
}

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('a new phone: no useful day yet, the camp, and one move to Read', async ({ page }) => {
  await page.clock.install({ time: WED });
  await home(page);
  // A count of 0 is words, not a score; no Journal stamp before the first postcard.
  await expect(page.locator('.home-week')).toHaveText(/^A fresh week/);
  await expect(page.locator('.home-permit')).toHaveCount(0);
  // No time number, no bar, no time-back claim.
  await expect(page.locator('main')).not.toContainText(/back to you|time back|returned|\d+ h \d+ m|recorded/i);
  await expect(page.locator('.courtyard-card progress, .courtyard-card [role="progressbar"]')).toHaveCount(0);
  // Spec 660: Read is not due now, so the row is today's quest and the one move opens the sheet, first.
  await expect(questRow(page)).toContainText(/has a quest/);
  await expect(row(page).locator('.next-move-go')).toHaveCount(0);
  await openCard(page);
  // Spec 660 E12 (b2 12 Nov): on a new phone the safety question is unanswered, so Quests (holding it) leads the
  // sheet and the one move comes right after it.
  await expect(page.locator('.courtyard-card-section').first()).toHaveAttribute('data-section', 'quests');
  await expect(page.locator('.courtyard-card-section').nth(1)).toHaveAttribute('data-section', 'move');
  await expect(page.getByRole('region', { name: 'One next move' })).toHaveCount(1);
  await expect(move(page)).toHaveCount(1);
  await expect(move(page)).toContainText('Read one idea');
  // The record with no useful day yet is only its one-line rule.
  await page.locator('.home-week').click();
  // Spec 47b: before Season 1 the record is plainly "Your record", its week in words.
  await expect(page.getByRole('heading', { name: 'Your record', level: 1 })).toBeVisible();
  await expect(page.locator('.useful-days-facts')).toContainText('This weekA fresh week');
  await expect(page.locator('.useful-days-note')).toHaveText(/^A day counts when/);
  await expect(page.locator('.useful-days-list')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText(/\byet\b|\bnone\b/i);
  await page.goBack();
  // Spec 571: the move lands in the chapter under Grow.
  await tapMove(page);
  await expect(page).toHaveURL(/#grow\/read\/chapter\/psychology\/psychology-ch1$/);
});

test('useful days count marked dates this week (before Season 1), and one tap opens the record', async ({ page }) => {
  await page.clock.install({ time: WED });
  await home(page);
  const done = (day: string, n: number) => ({ id: `done:e2e-${day}-${n}`, mode: 'tasks', kind: 'done', refId: `e2e-${day}-${n}`, dayKey: day, inputs: { plannedSize: 'M', wasPlanned: true }, updatedAt: new Date(`${day}T12:00:00`).getTime() + n, deleted: 0, deviceId: 'e2e' });
  await put(page, 'tasks', [{ id: 'e2e-2026-10-27-1', title: 'Call the bank', status: 'done', dayKey: '2026-10-27', ...meta }]);
  await put(page, 'ledger', [
    done('2026-10-25', 1), // last week: not counted
    done('2026-10-26', 1), done('2026-10-27', 1), done('2026-10-27', 2), // two dates this week, one of them twice
    { id: 'calm-e2e', mode: 'calm', kind: 'session', refId: 'c', dayKey: '2026-10-27', inputs: { minutes: 12 }, ...meta },
  ]);
  await page.reload();
  await expect(page.locator('.home-week')).toHaveText(/^2 useful days\s*this week/);
  await openCard(page);
  await page.locator('.home-week').click();
  await expect(page).toHaveURL(/#you\/days$/);
  await expect(page.getByRole('heading', { name: 'Your record', level: 1 })).toBeVisible();
  await expect(page.locator('.useful-days-facts')).toContainText('This week2 useful days');
  const days = page.locator('.useful-days-list > li');
  await expect(days).toHaveCount(2);
  await expect(days.nth(0)).toContainText('Tue 27 Oct');
  await expect(days.nth(0)).toContainText('Call the bank');
  await expect(days.nth(0)).toContainText('Calm, 12 min');
  await expect(days.nth(1)).toContainText('Mon 26 Oct');
  await page.goBack();
  await expect(page).toHaveURL(/#courtyard$/);
});

test('in Season 1 the line counts the season, from its first Monday', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-10T10:00:00') });
  await home(page);
  const done = (day: string) => ({ id: `done:s1-${day}`, mode: 'tasks', kind: 'done', refId: `s1-${day}`, dayKey: day, inputs: { plannedSize: 'M', wasPlanned: true }, updatedAt: new Date(`${day}T12:00:00`).getTime(), deleted: 0, deviceId: 'e2e' });
  await put(page, 'ledger', ['2026-11-01', '2026-11-02', '2026-11-04', '2026-11-09'].map(done));
  await page.reload();
  await expect(page.locator('.home-week')).toHaveText(/^3 useful days\s*this season/);
});

test('all five camp friends (Yatra tab) go to their areas, once each, and Back returns to the same camp', async ({ page }) => {
  await page.clock.install({ time: WED });
  await camp(page);
  // Spec 571: camp friends still open their screens directly at the new routes.
  for (const [name, hash] of [['Plan, Mor at the map', 'plan'], ['Read, Chiku on the reading rock', 'grow/read'], ['Train, Nandi by the pack', 'grow/train'], ['Play, Kapi in the branches', 'grow/play'], ['Calm, Kachhua by the fire', 'grow/calm']] as const) {
    // A double tap still opens the area once.
    await page.getByRole('button', { name }).dblclick();
    await expect(page).toHaveURL(new RegExp(`#${hash}$`));
    // One Back is Home again, so the double tap opened it once.
    await page.goBack();
    await expect(page).toHaveURL(/#yatra$/);
    await expect(page.locator('.trek-strip .home-title h2')).toHaveText('Camp at Jobra');
    // Back never replays the opening breath.
    await expect(page.getByRole('dialog', { name: 'Breathe with the square.' })).toHaveCount(0);
  }
});

test('with motion, a tap plays the friend\'s reaction where it stands, then opens its area', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install({ time: WED });
  await camp(page);
  const kapi = page.getByRole('button', { name: 'Play, Kapi in the branches' });
  await expect(page.locator('.trek-scene')).toBeVisible();
  // Where Kapi stands within the scene (the page itself can shift when the "Ready to work offline" note comes and goes).
  const within = async () => { const [friend, scene] = [(await kapi.boundingBox())!, (await page.locator('.trek-scene').boundingBox())!]; return { x: friend.x - scene.x, y: friend.y - scene.y, width: friend.width, height: friend.height }; };
  // The walk-in step has ended once Kapi stands still: two readings 300 ms apart agree (a busy machine runs it late).
  let box = await within();
  await expect.poll(async () => { await page.waitForTimeout(300); const now = await within(); const still = JSON.stringify(now) === JSON.stringify(box); box = now; return still; }, { timeout: 10_000 }).toBe(true);
  await kapi.click();
  await expect(kapi.locator('svg')).toHaveAttribute('data-moment', 'tap');
  expect(await within()).toEqual(box);
  await expect(page).toHaveURL(/#yatra$/);
  await page.clock.runFor(300);
  await expect(page).toHaveURL(/#grow\/play$/);
});

test('the move follows the order: focus, then Book check, then Train day, then a task', async ({ page }) => {
  await page.clock.install({ time: WED });
  await home(page);
  // A task for today.
  await put(page, 'tasks', [{ id: 't1', title: 'Call the bank', status: 'planned', dayKey: '2026-10-28', ...meta }]);
  await page.reload();
  await expect(move(page)).toContainText('Call the bank');
  // Spec 660: an untimed task is not due, so today's quest has the row.
  await expect(questRow(page)).toBeVisible();
  // A Train day (Wednesday is a program day) comes before it.
  await put(page, 'programs', [{ id: 'train-program', track: 'bodyweight', days: [1, 3, 5], weeklyTarget: 3, startedAt: WED.getTime() - 7 * 86_400_000, ...meta }]);
  await page.reload();
  await expect(move(page)).toContainText('Today\'s session with Nandi');
  // Yesterday's chapter waits for its Book check, before Train.
  await put(page, 'ledger', [{ id: 'ch1', mode: 'read', kind: 'chapter', refId: 'richest-man-in-babylon:babylon-2', dayKey: '2026-10-27', inputs: { checkLater: true }, ...meta }]);
  await page.reload();
  await expect(move(page)).toContainText('Book check');
  // Spec 660: a due Book check is due now, so it keeps the row (no quest there).
  await expect(row(page).locator('.next-move-go')).toContainText('Book check');
  await expect(questRow(page)).toHaveCount(0);
  await move(page).click();
  await expect(page).toHaveURL(/#grow\/read\/check\/richest-man-in-babylon\/babylon-2$/);
  // A focus, before everything.
  await put(page, 'focus', [{ id: 'f1', taskId: 't1', startedAt: WED.getTime() - 5 * 60_000, ...meta }]);
  await home(page);
  await page.reload();
  await expect(move(page)).toContainText('Working on \'Call the bank\'');
  await expect(move(page)).toHaveCount(1);
  // A running focus is due now: the move has the row.
  await expect(row(page).locator('.next-move-go')).toBeVisible();
  await expect(questRow(page)).toHaveCount(0);
});

test('a soft day keeps the move gentle: no Train day and no task', async ({ page }) => {
  await page.clock.install({ time: WED });
  await home(page);
  await put(page, 'tasks', [{ id: 't1', title: 'Call the bank', status: 'planned', dayKey: '2026-10-28', ...meta }]);
  await put(page, 'ledger', [{ id: 'soft1', mode: 'soft', kind: 'soft-start', refId: 'soft', dayKey: '2026-10-28', inputs: { state: 'tired' }, ...meta }]);
  await page.reload();
  await expect(move(page)).toContainText('Read one idea');
});

test('layout B at 360x800: the card sits above the tab bar, every friend is tappable, and at 200% the move stays on screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.install({ time: WED });
  await home(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = async (selector: string) => (await page.locator(selector).boundingBox())!;
  const bar = (await page.getByRole('navigation', { name: 'Main tabs' }).boundingBox())!;
  const header = await box('.topbar');
  const card = await box('.courtyard-card');
  expect(card.y + card.height).toBeLessThanOrEqual(bar.y + 1);
  // The six friends: each tap's middle is that tap (nothing covers it), below the header and above the card.
  const taps = page.locator('.courtyard-friend-tap');
  await expect(taps).toHaveCount(6);
  for (const tap of await taps.all()) {
    const rect = (await tap.boundingBox())!;
    const label = (await tap.getAttribute('aria-label'))!;
    expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.getAttribute('aria-label'), { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }), label).toBe(label);
    expect(rect.y, label).toBeGreaterThanOrEqual(header.y + header.height - 1);
    expect(rect.y + rect.height, label).toBeLessThanOrEqual(card.y + 1);
    expect(Math.min(rect.width, rect.height), label).toBeGreaterThanOrEqual(48);
    expect(rect.x, label).toBeGreaterThanOrEqual(16);
    expect(rect.x + rect.width, label).toBeLessThanOrEqual(360 - 16);
  }
  // A friend opens its corner (spec 35), and Back is Home again.
  await page.getByRole('button', { name: /^Chiku, Learn/ }).click();
  await expect(page).toHaveURL(/#courtyard\/view\/learn$/);
  await expect(page.getByRole('region', { name: 'Chiku card' })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#courtyard$/);
  // 200% text: the card grows, the move stays whole on screen above the tab bar, and nothing scrolls sideways.
  await textAt200(page);
  // Spec 660: the row (today's quest here, nothing being due) stays whole on screen.
  await expect(row(page)).toBeInViewport();
  const go = await box('.courtyard-card-next .courtyard-card-row');
  expect(go.y + go.height).toBeLessThanOrEqual(bar.y + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('the card opens by its button and by a swipe up, and closes by a swipe down', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.install({ time: WED });
  await home(page);
  const handle = page.locator('.courtyard-card-handle');
  await expect(page.locator('#courtyard-card-more')).toBeHidden();
  await handle.click();
  await expect(page.locator('#courtyard-card-more')).toBeVisible();
  await handle.click();
  await expect(page.locator('#courtyard-card-more')).toBeHidden();
  const drag = async (dy: number) => {
    const rect = (await handle.boundingBox())!;
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2 + dy, { steps: 4 });
    await page.mouse.up();
  };
  await drag(-80);
  await expect(handle).toHaveAttribute('aria-expanded', 'true');
  // This week and the crew bar close the sheet (spec 660's board will sit above them).
  const order = await page.locator('.courtyard-card-section').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-section')));
  expect(order.slice(-2)).toEqual(['week', 'crew']);
  await drag(80);
  await expect(handle).toHaveAttribute('aria-expanded', 'false');
});
