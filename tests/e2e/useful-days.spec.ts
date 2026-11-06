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
  await expect(season(page)).toContainText('Useful days: 2 of your 4');
  const dots = week(page).getByRole('listitem');
  await expect(dots).toHaveCount(7);
  await expect(dots.nth(0)).toHaveAttribute('aria-label', 'Monday, useful day');
  await expect(dots.nth(1)).toHaveAttribute('aria-label', 'Tuesday, no useful action recorded');
  await expect(dots.nth(2)).toHaveAttribute('aria-label', 'Wednesday, useful day');
  await expect(dots.nth(3)).toHaveAttribute('aria-label', 'Thursday, still to come');
  await expect(season(page)).not.toContainText(/streak|missed|lose|broken|save your/i);
  await expect(week(page)).toContainText('Your weekly target: 4 days');
  expect(await fits(page)).toBe(true);
  // The record: the same count, the longest run and Clean weeks, and each day with what was finished.
  await season(page).getByRole('button', { name: /^Your record/ }).click();
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('2 useful days this season');
  await expect(page.locator('.useful-days-facts')).toContainText('Longest run');
  await expect(page.locator('.useful-days-facts')).toContainText('Clean weeks');
  await expect(page.locator('.useful-days-list > li')).toHaveCount(2);
  await page.goto('/?e2e#yatra');
  await expect(page.locator('button.home-week')).toHaveText(/^2 useful days\s*this season/);
  // The dates are kept, so a later sync or a restore cannot lower the count.
  await expect.poll(() => setting(page, 'useful.confirmed:2026-11-02')).toEqual(['2026-11-02', '2026-11-04']);
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
  // Rest days are no longer sold.
  await page.goto('/?e2e#you/shop');
  await expect(page.getByRole('heading', { name: 'Shop', level: 1 })).toBeVisible();
  await expect(page.locator('.shop-item')).not.toHaveCount(0);
  await expect(page.getByText('Adds one day to your rest bank.')).toHaveCount(0);
  await expect(page.locator('.shop-item .eyebrow').filter({ hasText: 'Rest day' })).toHaveCount(0);
});

test('L2: "Keep rank tucked away" hides the rank, places and rival on You; the ladder itself stays whole', async ({ page }) => {
  await page.clock.install({ time: WED });
  await page.goto('/?e2e#you');
  await seed(page, [done('2026-11-02'), done('2026-11-03'), done('2026-11-04')]);
  await expect(season(page)).toContainText(/#\d+ of 500/);
  await season(page).getByRole('button', { name: 'View the ladder' }).click();
  const choice = page.getByRole('group', { name: 'On your You page' });
  await expect(choice.getByRole('radio', { name: 'Show my climb' })).toBeChecked();
  await choice.getByRole('radio', { name: 'Keep rank tucked away' }).check();
  await expect.poll(() => setting(page, 'season.rankShown')).toBe(false);
  await expect(page.locator('.ladder-seat.you')).toBeVisible();
  await page.goBack();
  await expect(season(page)).not.toContainText(/of 500|places this week|pace-setter/);
  await expect(season(page)).toContainText(/Bench|Challenger|Contender|Elite|Ace|Apex/);
  await expect(season(page)).toContainText('Useful days: 3 of your 4');
  await expect(season(page).getByRole('button', { name: 'View the ladder' })).toBeVisible();
  await season(page).getByRole('button', { name: 'View the ladder' }).click();
  await page.getByRole('radio', { name: 'Show my climb' }).check();
  await page.goBack();
  await expect(season(page)).toContainText(/#\d+ of 500/);
});

test('L3: "How the ladder works" gives the real numbers, from the card and the ladder, and gives focus back', async ({ page }) => {
  await page.clock.install({ time: WED });
  await page.goto('/?e2e#you');
  const open = season(page).getByRole('button', { name: 'How the ladder works' });
  await open.click();
  const sheet = page.getByRole('dialog', { name: 'How the ladder works' });
  await expect(sheet).toContainText('up to 300 SP a day');
  await expect(sheet).toContainText('Your rank never goes down within a season. There is no relegation.');
  await expect(sheet).toContainText('10% of a season\'s SP carries into the next, capped at 10% of its target. It never changes a finished season.');
  await expect(sheet.getByRole('row', { name: /^Apex/ })).toContainText('300 Shards');
  await expect(sheet.getByRole('row', { name: /^Bench/ })).toContainText('0 SP');
  await expect(sheet.getByRole('row', { name: /^Bench/ })).toContainText('50 Shards');
  await expect(sheet).not.toContainText(/passed you|countdown|left in the season/i);
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(open).toBeFocused();
  await page.goto('/?e2e#you/season');
  await page.getByRole('button', { name: 'How the ladder works' }).click();
  await expect(page.getByRole('dialog', { name: 'How the ladder works' })).toBeVisible();
  await page.getByRole('dialog', { name: 'How the ladder works' }).getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('at 200% text You\'s week, the target choice, the record and the ladder sheet keep to the phone\'s width', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.install({ time: WED });
  await page.goto('/?e2e#you');
  await seed(page, [done('2026-11-02')]);
  await textAt200(page);
  await expect(week(page).getByRole('heading')).toHaveText('1 of your 4');
  await week(page).getByRole('button', { name: /^Change your weekly target/ }).click();
  await expect(week(page).getByRole('button', { name: 'Set target' })).toBeVisible();
  expect(await fits(page)).toBe(true);
  await season(page).getByRole('button', { name: 'How the ladder works' }).click();
  const close = page.getByRole('dialog', { name: 'How the ladder works' }).getByRole('button', { name: 'Close' });
  await close.scrollIntoViewIfNeeded();
  await expect(close).toBeInViewport();
  expect(await fits(page)).toBe(true);
  await close.click();
  await page.goto('/?e2e#you/days');
  await textAt200(page);
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('1 useful day this season');
  expect(await fits(page)).toBe(true);
});
