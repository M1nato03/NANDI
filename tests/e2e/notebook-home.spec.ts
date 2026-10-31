import { expect, test, type Page } from '@playwright/test';

// Spec 45b: Home is a notebook page: the useful days (decision 7), the camp's heading, five friends at camp (each a
// button to its area) and exactly one next move, in the order focus, Book check, Train day, task, Read.
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
async function home(page: Page) {
  await page.goto('/?e2e#yatra');
  await expect(page.locator('.notebook-home h1')).toBeVisible();
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
  await expect(page.locator('.notebook-home progress, .notebook-home [role="progressbar"]')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'One next move' })).toHaveCount(1);
  await expect(move(page)).toHaveCount(1);
  await expect(move(page)).toContainText('Read one idea');
  // The record with no useful day yet is only its one-line rule.
  await page.locator('.home-week').click();
  await expect(page.getByRole('heading', { name: 'A fresh week', level: 1 })).toBeVisible();
  await expect(page.locator('.useful-days-note')).toHaveText(/^A day counts when/);
  await expect(page.locator('.useful-days-list')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText(/\byet\b|\bnone\b/i);
  await page.goBack();
  await move(page).click();
  await expect(page).toHaveURL(/#read$/);
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
  await page.locator('.home-week').click();
  await expect(page).toHaveURL(/#yatra\/days$/);
  await expect(page.getByRole('heading', { name: '2 useful days', level: 1 })).toBeVisible();
  const days = page.locator('.useful-days-list > li');
  await expect(days).toHaveCount(2);
  await expect(days.nth(0)).toContainText('Tue 27 Oct');
  await expect(days.nth(0)).toContainText('Call the bank');
  await expect(days.nth(0)).toContainText('Calm, 12 min');
  await expect(days.nth(1)).toContainText('Mon 26 Oct');
  await page.goBack();
  await expect(page).toHaveURL(/#yatra$/);
});

test('in Season 1 the line counts the season, from its first Monday', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-10T10:00:00') });
  await home(page);
  const done = (day: string) => ({ id: `done:s1-${day}`, mode: 'tasks', kind: 'done', refId: `s1-${day}`, dayKey: day, inputs: { plannedSize: 'M', wasPlanned: true }, updatedAt: new Date(`${day}T12:00:00`).getTime(), deleted: 0, deviceId: 'e2e' });
  await put(page, 'ledger', ['2026-11-01', '2026-11-02', '2026-11-04', '2026-11-09'].map(done));
  await page.reload();
  await expect(page.locator('.home-week')).toHaveText(/^3 useful days\s*this season/);
});

test('all five friends go to their areas, once each, and Back returns to the same Home', async ({ page }) => {
  await page.clock.install({ time: WED });
  await home(page);
  for (const [name, hash] of [['Plan, Mor at the map', 'plan'], ['Read, Chiku on the reading rock', 'read'], ['Train, Nandi by the pack', 'yatra/train'], ['Play, Kapi in the branches', 'yatra/mind'], ['Calm, Kachhua by the fire', 'yatra/calm']] as const) {
    // A double tap still opens the area once.
    await page.getByRole('button', { name }).dblclick();
    await expect(page).toHaveURL(new RegExp(`#${hash}$`));
    // One Back is Home again, so the double tap opened it once.
    await page.goBack();
    await expect(page).toHaveURL(/#yatra$/);
    await expect(page.locator('.notebook-home h1')).toHaveText('Camp at Jobra');
    // Back never replays the opening breath.
    await expect(page.getByRole('dialog', { name: 'Breathe with the square.' })).toHaveCount(0);
  }
});

test('with motion, a tap plays the friend\'s reaction where it stands, then opens its area', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install({ time: WED });
  await home(page);
  const kapi = page.getByRole('button', { name: 'Play, Kapi in the branches' });
  await expect(page.locator('.home-week-time')).toBeVisible();
  await page.waitForTimeout(1300); // the walk-in step ends
  // Where Kapi stands within the scene (the page itself can shift when the "Ready to work offline" note comes and goes).
  const within = async () => { const [friend, scene] = [(await kapi.boundingBox())!, (await page.locator('.trek-scene').boundingBox())!]; return { x: friend.x - scene.x, y: friend.y - scene.y, width: friend.width, height: friend.height }; };
  const box = await within();
  await kapi.click();
  await expect(kapi.locator('svg')).toHaveAttribute('data-moment', 'tap');
  expect(await within()).toEqual(box);
  await expect(page).toHaveURL(/#yatra$/);
  await page.clock.runFor(300);
  await expect(page).toHaveURL(/#yatra\/mind$/);
});

test('the move follows the order: focus, then Book check, then Train day, then a task', async ({ page }) => {
  await page.clock.install({ time: WED });
  await home(page);
  // A task for today.
  await put(page, 'tasks', [{ id: 't1', title: 'Call the bank', status: 'planned', dayKey: '2026-10-28', ...meta }]);
  await page.reload();
  await expect(move(page)).toContainText('Call the bank');
  // A Train day (Wednesday is a program day) comes before it.
  await put(page, 'programs', [{ id: 'train-program', track: 'bodyweight', days: [1, 3, 5], weeklyTarget: 3, startedAt: WED.getTime() - 7 * 86_400_000, ...meta }]);
  await page.reload();
  await expect(move(page)).toContainText('Today\'s session with Nandi');
  // Yesterday's chapter waits for its Book check, before Train.
  await put(page, 'ledger', [{ id: 'ch1', mode: 'read', kind: 'chapter', refId: 'richest-man-in-babylon:babylon-2', dayKey: '2026-10-27', inputs: { checkLater: true }, ...meta }]);
  await page.reload();
  await expect(move(page)).toContainText('Book check');
  await move(page).click();
  await expect(page).toHaveURL(/#read\/check\/richest-man-in-babylon\/babylon-2$/);
  // A focus, before everything.
  await put(page, 'focus', [{ id: 'f1', taskId: 't1', startedAt: WED.getTime() - 5 * 60_000, ...meta }]);
  await home(page);
  await page.reload();
  await expect(move(page)).toContainText('Working on \'Call the bank\'');
  await expect(move(page)).toHaveCount(1);
});

test('a soft day keeps the move gentle: no Train day and no task', async ({ page }) => {
  await page.clock.install({ time: WED });
  await home(page);
  await put(page, 'tasks', [{ id: 't1', title: 'Call the bank', status: 'planned', dayKey: '2026-10-28', ...meta }]);
  await put(page, 'ledger', [{ id: 'soft1', mode: 'soft', kind: 'soft-start', refId: 'soft', dayKey: '2026-10-28', inputs: { state: 'tired' }, ...meta }]);
  await page.reload();
  await expect(move(page)).toContainText('Read one idea');
});

test('at 360x800 nothing overlaps, and at 200% text the page scrolls to the next move', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.install({ time: WED });
  await home(page);
  // Measure the settled page: the useful-days line replaces its placeholder, and the camp and the move load after it.
  await expect(page.locator('button.home-week')).toHaveText(/^A fresh week/);
  await expect(page.locator('.notebook-home h1')).toHaveText('Camp at Jobra');
  await expect(page.locator('.next-move')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = async (selector: string) => (await page.locator(selector).boundingBox())!;
  const [week, title, scene, next] = [await box('.home-week'), await box('.home-title'), await box('.trek-scene'), await box('.next-move')];
  expect(week.y + week.height).toBeLessThanOrEqual(title.y + 1);
  expect(title.y + title.height).toBeLessThanOrEqual(scene.y + 1);
  expect(scene.y + scene.height).toBeLessThanOrEqual(next.y + 1);
  // The five friends do not cover one another's middles.
  const friends = await page.locator('.camp-friend').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
  for (const point of friends) {
    const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('.camp-friend')?.getAttribute('aria-label'), point);
    expect(hit).toBeTruthy();
  }
  expect(new Set(await Promise.all(friends.map(point => page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('.camp-friend')?.getAttribute('aria-label'), point))))).toHaveProperty('size', 5);
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await move(page).scrollIntoViewIfNeeded();
  await expect(move(page)).toBeInViewport();
  const bar = (await page.getByRole('navigation', { name: 'Main tabs' }).boundingBox())!;
  const go = await box('.next-move-go');
  expect(go.y + go.height).toBeLessThanOrEqual(bar.y + 1);
});
