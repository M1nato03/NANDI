import { expect, test, type Page } from '@playwright/test';
import { textAt200 } from './helpers/text';

// Spec 47c: the season result. Once, on the first ordinary open after a season ends (Season 1: from Mon 7 Dec), never
// on top of the opening breath, a Pause card or a link's page; Continue and Skip both close it; it is marked shown only
// once it was on screen; the record keeps every past result. The words are spec 47 L4 with real numbers.
const MONDAY = new Date('2026-12-07T10:00:00');
type Row = Record<string, unknown>;
async function put(page: Page, store: 'settings' | 'ledger', rows: Row[]) {
  await page.evaluate(async ({ store, rows }) => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>(resolve => {
      const transaction = database.transaction(store, 'readwrite');
      for (const row of rows) transaction.objectStore(store).put(row);
      transaction.oncomplete = () => resolve();
    });
    database.close();
  }, { store, rows });
}
const setting = (key: string, value: unknown) => ({ key, value, updatedAt: 1, deleted: 0, deviceId: 'e2e' });
const shownFlag = (page: Page) => page.evaluate(async () => {
  const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
  const row = await new Promise<{ value: unknown } | undefined>(resolve => { const request = database.transaction('settings').objectStore('settings').get('useful.resultShown:2026-11-02'); request.onsuccess = () => resolve(request.result); });
  database.close();
  return row?.value ?? null;
});
/** A phone that took part in Season 1 (three useful days in it), through the first run, with this opening breath. */
async function ready(page: Page, breath: 'off' | 'daily', time = MONDAY, extra: Row[] = []) {
  await page.clock.install({ time });
  await page.goto('/?e2e#you');
  let n = 0;
  await put(page, 'ledger', ['2026-11-03', '2026-11-10', '2026-11-24'].map(day => ({ id: `done:sr-${++n}`, dayKey: day, mode: 'tasks', kind: 'done', refId: `sr-${n}`, inputs: { plannedSize: 'L', wasPlanned: true }, updatedAt: new Date(`${day}T12:00:00`).getTime(), deleted: 0, deviceId: 'e2e' })));
  await put(page, 'settings', [setting('welcome.done', '2026-11-01'), setting('notebook.breath.opening', breath), ...extra]);
}
/** An ordinary open: no route in the address, no notification, no widget, no Pause card waiting. */
async function open(page: Page) {
  await page.goto('/?e2e');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-opening-breath', /shown|skipped/);
}
const result = (page: Page) => page.getByRole('dialog', { name: 'Season 1 result' });

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('the first ordinary open after Season 1 shows its result once, with real numbers; Continue closes it for good', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await ready(page, 'off');
  await open(page);
  await expect(result(page)).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(result(page)).toContainText('Season 1 · 2 Nov–6 Dec 2026');
  await expect(result(page).locator('.season-result-facts')).toHaveText(/^#\d+ of 500 · ((Bench|Challenger) · 3 useful days toward your goal|3 useful days moved your goal forward|3 useful days) · (50|100|150|200|250|300) Shards\.$/);
  await expect(result(page)).toContainText('Season 2 starts today with a fresh climb.');
  await expect(result(page)).not.toContainText(/fail|fell|dropped|lost|missed/i);
  await expect(result(page).getByRole('button', { name: 'Continue' })).toBeFocused();
  // At 200% text it keeps to the phone's width and every way out stays reachable.
  await textAt200(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('.season-result *')].every(node => node.getBoundingClientRect().right <= innerWidth + 1))).toBe(true);
  await result(page).getByRole('button', { name: 'Skip' }).scrollIntoViewIfNeeded();
  await expect(result(page).getByRole('button', { name: 'Skip' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect.poll(() => shownFlag(page)).not.toBeNull();
  await result(page).getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await open(page);
  await expect(result(page)).toHaveCount(0);
});

test('it waits for the opening breath and never stacks with it; Skip closes it the same way', async ({ page }) => {
  await ready(page, 'daily');
  await open(page);
  const breath = page.getByRole('dialog', { name: 'Breathe with the square.' });
  await expect(breath).toBeVisible();
  await expect(result(page)).toHaveCount(0);
  expect(await shownFlag(page)).toBeNull();
  await breath.getByRole('button', { name: 'Skip →' }).click();
  await expect(result(page)).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await result(page).getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(() => shownFlag(page)).not.toBeNull();
});

test('a link\'s open, or one before the season ends, shows nothing and keeps it for the next ordinary open', async ({ page }) => {
  await ready(page, 'off', new Date('2026-12-06T20:00:00'));
  await open(page);
  await expect(result(page)).toHaveCount(0);
  await page.clock.setFixedTime(MONDAY);
  await page.goto('/?e2e#plan');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-opening-breath', 'skipped');
  await expect(result(page)).toHaveCount(0);
  expect(await shownFlag(page)).toBeNull();
  await open(page);
  await expect(result(page)).toBeVisible();
});

test('with rank tucked away the result leaves out the rank; "See your useful days" opens the record, which keeps every past result', async ({ page }) => {
  await ready(page, 'off', MONDAY, [setting('season.rankShown', false)]);
  await open(page);
  await expect(result(page).locator('.season-result-facts')).not.toContainText('of 500');
  await expect(result(page).locator('.season-result-facts')).toContainText('3 useful days');
  await result(page).getByRole('button', { name: 'See your useful days' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/#yatra\/days$/);
  await page.getByRole('button', { name: /^Past seasons/ }).click();
  await expect(page).toHaveURL(/#yatra\/days\/seasons$/);
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('Past seasons');
  await expect(page.getByRole('article', { name: 'Season 1' })).toContainText('3 useful days');
  await page.goBack();
  await expect(page).toHaveURL(/#yatra\/days$/);
});

test('a phone first used after the season ended has no result for it', async ({ page }) => {
  await page.clock.install({ time: MONDAY });
  await page.goto('/?e2e#you');
  await put(page, 'settings', [setting('welcome.done', '2026-12-07'), setting('notebook.breath.opening', 'off')]);
  await open(page);
  await expect(result(page)).toHaveCount(0);
});
