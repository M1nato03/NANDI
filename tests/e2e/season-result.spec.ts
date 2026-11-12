import { expect, test, type Page } from '@playwright/test';

// Spec 660 §3.2 (jenil-0b 12 Nov): the season ladder went, and the season-result moment with it (spec 47c). No page
// opens when a season ends; each finished season stays readable in You › history, with its dates and useful days
// only (no rank, tier or Shards). The record's "Past seasons" and every old link lead there.
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
test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('the first ordinary open after Season 1 shows no result page; You › history keeps the season, without rank or Shards', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await ready(page, 'off');
  await open(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(() => shownFlag(page)).toBeNull();
  await page.goto('/?e2e#you/history');
  const seasons = page.getByRole('region', { name: 'Past seasons' });
  await expect(seasons).toContainText('Season 1 · 2 Nov–6 Dec 2026 · 3 useful days');
  await expect(seasons).not.toContainText(/of 500|Shards|Bench|Challenger|Contender|Elite|Ace|Apex/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('the record’s Past seasons and the old links (you/days/seasons, you/season) lead to one place each', async ({ page }) => {
  await ready(page, 'off');
  await page.goto('/?e2e#you/days');
  await page.getByRole('button', { name: /^Past seasons/ }).click();
  await expect(page).toHaveURL(/#you\/history$/);
  await page.goto('/?e2e#you/days/seasons');
  await expect(page).toHaveURL(/#you\/history$/);
  await page.goto('/?e2e#you/season');
  await expect(page).toHaveURL(/#you$/);
  await expect(page.getByRole('region', { name: 'Your season' })).not.toContainText(/of 500|pace-setter|places this week|View the ladder/);
});
