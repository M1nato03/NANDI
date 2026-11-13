import { expect, test, type Page } from '@playwright/test';
import { textAt200 } from './helpers/text';

// Spec 47b: useful days and a chosen week. One selector counts them for Home, You's week and the record; a day counts
// once; the target is 4 until changed, and a change starts next Monday; an empty day is only empty. With L2 (the
// person can keep the rank tucked away) and L3 (a truthful season card and "How the ladder works").
const WED = new Date('2026-11-04T12:00:00');
type Fact = { id: string; dayKey: string; mode: string; kind: string; refId: string; inputs: Record<string, unknown>; updatedAt: number; deleted: 0; deviceId: string };
let count = 0;
const done = (day: string): Fact => ({ id: `done:useful-${++count}`, dayKey: day, mode: 'tasks', kind: 'done', refId: `useful-${count}`,
  inputs: { plannedSize: 'M', wasPlanned: true }, updatedAt: new Date(`${day}T12:00:00`).getTime() + count, deleted: 0, deviceId: 'useful-e2e' });
async function seed(page: Page, facts: Fact[]) {
  await page.evaluate(async rows => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>(resolve => {
      const transaction = database.transaction('ledger', 'readwrite');
      for (const row of rows) transaction.objectStore('ledger').put(row);
      transaction.oncomplete = () => resolve();
    });
    database.close();
  }, facts);
  await page.reload();
}
const setting = (page: Page, key: string) => page.evaluate(async name => {
  const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
  const row = await new Promise<{ value: unknown } | undefined>(resolve => { const request = database.transaction('settings').objectStore('settings').get(name); request.onsuccess = () => resolve(request.result); });
  database.close();
  return row?.value;
}, key);
const season = (page: Page) => page.getByRole('region', { name: 'Your season' });
const week = (page: Page) => season(page).getByRole('region', { name: 'This week' });
const fits = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('Home, You and the record count the same useful days, each date once, and the week shows seven named days', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.install({ time: WED });
  await page.goto('/?e2e#you');
  // Two tasks on Monday are one useful day; Wednesday is another.
  await seed(page, [done('2026-11-02'), done('2026-11-02'), done('2026-11-04')]);
  await expect(week(page).getByRole('heading')).toHaveText('2 of your 4');
  await expect(season(page)).toContainText('Useful days this season: 2');
  const dots = week(page).getByRole('listitem');
  await expect(dots).toHaveCount(7);
  await expect(dots.nth(0)).toHaveAttribute('aria-label', 'Monday, useful day');
  await expect(dots.nth(1)).toHaveAttribute('aria-label', 'Tuesday, no useful action recorded');
  await expect(dots.nth(2)).toHaveAttribute('aria-label', 'Wednesday, useful day');
  await expect(dots.nth(3)).toHaveAttribute('aria-label', 'Thursday, still to come');
  await expect(season(page)).not.toContainText(/streak|missed|lose|broken|save your/i);
  await expect(week(page)).toContainText('Your weekly target: 4 days');
  expect(await fits(page)).toBe(true);
  // The record: the same count, the longest run and Clean Weeks, and each day with what was finished.
  await season(page).getByRole('button', { name: /^Your record/ }).click();
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('2 useful days this season');
  await expect(page.locator('.useful-days-facts')).toContainText('Longest run');
  await expect(page.locator('.useful-days-facts')).toContainText('Clean Weeks');
  await expect(page.locator('.useful-days-list > li')).toHaveCount(2);
  await page.goto('/?e2e#courtyard');
  await expect(page.locator('button.home-week')).toHaveText(/^2 useful days\s*this season/);
  // The dates are kept, so a later sync or a restore cannot lower the count.
  await expect.poll(() => setting(page, 'useful.confirmed:2026-11-02')).toEqual(['2026-11-02', '2026-11-04']);
});

test('B2 (Sat): the week counts this week only and the season card counts the whole season (Wed 11 Nov: 4 and 10 Nov)', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-11T12:00:00') });
  await page.goto('/?e2e#you');
  // 4 Nov is last week (the season's, not this week's); 10 Nov is this week's Tuesday.
  await seed(page, [done('2026-11-04'), done('2026-11-10')]);
  await expect(week(page).getByRole('heading')).toHaveText('1 of your 4');
  await expect(season(page)).toContainText('Useful days this season: 2');
});

test('a new target starts next Monday; this week keeps its own, and a second change replaces the first', async ({ page }) => {
  await page.clock.install({ time: WED });
  await page.goto('/?e2e#you');
  await seed(page, [done('2026-11-03')]);
  await week(page).getByRole('button', { name: 'Change your weekly target, now 4 days' }).click();
  const form = week(page).getByRole('group', { name: 'Days a week' });
  await expect(form.getByRole('radio')).toHaveCount(4);
  await expect(form.getByRole('radio', { name: '4' })).toBeChecked();
  await form.getByRole('radio', { name: '5' }).check();
  await form.getByRole('button', { name: 'Set target' }).click();
  await expect(week(page)).toContainText('4 this week · 5 from Mon 9 Nov');
  await expect(week(page).getByRole('heading')).toHaveText('1 of your 4');
  await expect.poll(() => setting(page, 'useful.weeklyTarget')).toEqual([{ fromWeek: '2026-11-09', target: 5 }]);
  await week(page).getByRole('button', { name: /^Change your weekly target/ }).click();
  await week(page).getByRole('radio', { name: '7' }).check();
  await week(page).getByRole('button', { name: 'Set target' }).click();
  await expect(week(page)).toContainText('4 this week · 7 from Mon 9 Nov');
  await expect.poll(() => setting(page, 'useful.weeklyTarget')).toEqual([{ fromWeek: '2026-11-09', target: 7 }]);
  // Cancel keeps the choice as it was.
  await week(page).getByRole('button', { name: /^Change your weekly target/ }).click();
  await week(page).getByRole('radio', { name: '3' }).check();
  await week(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(week(page)).toContainText('7 from Mon 9 Nov');
});

test('an empty week is only empty: no number warning, no "+0 places", and rest days and days away sit below it', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.install({ time: WED });
  await page.goto('/?e2e#you');
  await expect(week(page).getByRole('heading')).toHaveText('0 of your 4');
  for (const dot of await week(page).getByRole('listitem').all()) await expect(dot).not.toHaveAttribute('aria-label', /useful day$/);
  await expect(season(page)).not.toContainText(/places this week|streak|missed|try harder|behind/i);
  await expect(week(page)).toContainText(/rest days? banked/);
  await expect(week(page).getByRole('button', { name: 'Plan days away' })).toBeVisible();
  // Rest days are not sold (spec 660 §3.1: no shop at all). The banked count above is where they show; a new phone with
  // no Shards and nothing owned never sees the closed shop's card in You › history (b2 12 Nov).
  await page.goto('/?e2e#you/shop');
  await expect(page.getByTestId('you-history')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Shards kept/ })).toHaveCount(0);
  await expect(page.locator('.shop-item')).toHaveCount(0);
});

test('spec 660 §3.2: the season card is a month\'s frame only (no rank, tier, places, pace-setters or ladder)', async ({ page }) => {
  await page.clock.install({ time: WED });
  await page.goto('/?e2e#you');
  await seed(page, [done('2026-11-02'), done('2026-11-03'), done('2026-11-04')]);
  await expect(season(page)).toContainText('Useful days this season: 3');
  await expect(season(page)).not.toContainText(/of 500|places this week|pace-setter|Bench|Challenger|Contender|Elite|Ace|Apex/);
  await expect(season(page).getByRole('button', { name: /ladder/ })).toHaveCount(0);
  await page.goto('/?e2e#you/season');
  await expect(page).toHaveURL(/#you$/);
});

test('at 200% text You\'s week, the target choice and the record keep to the phone\'s width', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.install({ time: WED });
  await page.goto('/?e2e#you');
  await seed(page, [done('2026-11-02')]);
  await textAt200(page);
  await expect(week(page).getByRole('heading')).toHaveText('1 of your 4');
  await week(page).getByRole('button', { name: /^Change your weekly target/ }).click();
  await expect(week(page).getByRole('button', { name: 'Set target' })).toBeVisible();
  expect(await fits(page)).toBe(true);
  await page.goto('/?e2e#you/days');
  await textAt200(page);
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('1 useful day this season');
  expect(await fits(page)).toBe(true);
});
