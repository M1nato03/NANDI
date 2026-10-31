import { expect, test, type Page } from '@playwright/test';

// Spec 45b: Home is a notebook page: this week's recorded time, the camp's heading, five friends at camp (each a
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

test('a new phone: nothing recorded yet, the camp, and one move to Read', async ({ page }) => {
  await page.clock.install({ time: WED });
  await home(page);
  await expect(page.locator('.home-week-time')).toHaveText('Nothing yet');
  await expect(page.locator('main')).not.toContainText(/back to you|time back|returned/i);
  await expect(page.getByRole('region', { name: 'One next move' })).toHaveCount(1);
  await expect(move(page)).toHaveCount(1);
  await expect(move(page)).toContainText('Read one idea');
  await move(page).click();
  await expect(page).toHaveURL(/#read$/);
});

test('the week line adds only recorded time: focus, Train and Calm minutes, and ideas as a count', async ({ page }) => {
  await page.clock.install({ time: WED });
  await home(page);
  const at = (day: string, hour: number) => new Date(`2026-10-${day}T${String(hour).padStart(2, '0')}:00:00`).getTime();
  await put(page, 'focus', [{ id: 'f1', taskId: 'gone', startedAt: at('26', 9), endedAt: at('26', 9) + 50 * 60_000, ...meta }, { id: 'f0', taskId: 'gone', startedAt: at('25', 9), endedAt: at('25', 11), ...meta }]);
  await put(page, 'sessions', [{ id: 's1', dayKey: '2026-10-27', status: 'completed', startedAt: at('27', 18), endedAt: at('27', 18) + 40 * 60_000, ...meta }]);
  await put(page, 'ledger', [
    { id: 'c1', mode: 'calm', kind: 'session', refId: 'c1', dayKey: '2026-10-27', inputs: { minutes: 10 }, ...meta },
    { id: 'i1', mode: 'read', kind: 'idea', refId: 'i1', dayKey: '2026-10-27', inputs: {}, ...meta },
  ]);
  await page.reload();
  await expect(page.locator('.home-week-time')).toHaveText('1 h 40 m');
  await expect(page.locator('.home-week-what')).toHaveText('focus, moving, breathing · 1 idea read');
  await expect(page.locator('.home-week-label')).toHaveText('This week, recorded');
});

test('all five friends go to their areas, once each, and Back returns to the same Home', async ({ page }) => {
  await page.clock.install({ time: WED });
  await home(page);
  for (const [name, hash] of [['Mor at the map: Plan', 'plan'], ['Chiku on the reading rock: Read', 'read'], ['Nandi by the pack: Train', 'yatra/train'], ['Kapi in the branches: Play', 'yatra/mind'], ['Kachhua by the fire: Calm', 'yatra/calm']] as const) {
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
  const kapi = page.getByRole('button', { name: 'Kapi in the branches: Play' });
  await expect(page.locator('.home-week-time')).toBeVisible();
  await page.waitForTimeout(1300); // the walk-in step ends
  const box = await kapi.boundingBox();
  await kapi.click();
  await expect(kapi.locator('svg')).toHaveAttribute('data-moment', 'tap');
  expect(await kapi.boundingBox()).toEqual(box);
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
