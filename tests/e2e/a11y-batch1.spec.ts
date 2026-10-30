import { expect, test, type Page } from '@playwright/test';
import { seedTaughtTopics } from './learn-helpers';

// a11y batch 1 (audit D:\nandi-gate-logs\idea-engine\a11y\audit.md §C): failed saves say so and can be tried again,
// Calm's sheets hold focus, a new screen takes focus at its heading, and repeated buttons say which row they act on.
const NOON = new Date('2026-10-28T12:00:00');

/** Makes every write to the ledger fail (as a full or broken store would), until `heal` puts the store back. */
async function breakLedger(page: Page) {
  await page.evaluate(() => {
    const store = IDBObjectStore.prototype as unknown as Record<string, unknown> & { __kept?: Record<string, unknown> };
    store.__kept = { add: store.add, put: store.put };
    for (const name of ['add', 'put'] as const) {
      const original = store.__kept[name] as (this: IDBObjectStore, ...args: unknown[]) => IDBRequest;
      store[name] = function (this: IDBObjectStore, ...args: unknown[]) {
        if (this.name === 'ledger') throw new DOMException('Test: the ledger cannot be written', 'QuotaExceededError');
        return original.apply(this, args);
      };
    }
  });
}
async function heal(page: Page) {
  await page.evaluate(() => {
    const store = IDBObjectStore.prototype as unknown as Record<string, unknown> & { __kept?: Record<string, unknown> };
    if (store.__kept) Object.assign(store, store.__kept);
  });
}

test('Calm: a sit that could not be saved says so, and saving again keeps it', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/#yatra/calm');
  await expect(page.getByRole('heading', { name: 'Breathe with Kachhua' })).toBeVisible();
  await page.getByRole('button', { name: 'Quiet', exact: true }).click();
  await page.getByRole('button', { name: '3 min', exact: true }).click();
  await page.locator('.calm-start').click();
  await page.clock.fastForward(61_000);
  await breakLedger(page);
  const dim = page.locator('.calm-dim');
  if (await dim.count()) await dim.click();
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByRole('alert')).toContainText('Your sit could not be saved.');
  await heal(page);
  await page.getByRole('button', { name: 'Try saving again' }).click();
  await expect(page.locator('.calm-phase')).toHaveText('A quiet minute, together.');
});

test('Calm: the Other sheet takes focus, Escape closes it, and focus goes back to Other', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/#yatra/calm');
  const other = page.locator('.calm-other');
  await other.focus();
  await page.keyboard.press('Enter');
  const sheet = page.getByRole('dialog', { name: 'Other lengths' });
  await expect(sheet).toBeVisible();
  expect(await sheet.evaluate(node => node.contains(document.activeElement))).toBe(true);
  // Tab stays inside the sheet.
  for (let press = 0; press < 6; press++) await page.keyboard.press('Tab');
  expect(await sheet.evaluate(node => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(other).toBeFocused();
  // Every length chip is on screen at 360 px: the row wraps rather than sliding.
  const chips = page.locator('.calm-lengths button');
  for (const chip of await chips.all()) await expect(chip).toBeInViewport();
});

test('a chapter that could not be saved does not say done; saving again finishes it', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#read');
  await seedTaughtTopics(page, ['psychology']);
  await page.goto('/?e2e#read/chapter/psychology/psychology-ch1');
  await expect(page.locator('.chiku-skip')).toBeVisible();
  await breakLedger(page);
  await page.locator('.chiku-skip').click();
  await expect(page.getByRole('alert')).toContainText('This chapter could not be saved on this phone.');
  await expect(page.locator('.read-done-card')).not.toContainText('Chapter 1 done');
  await heal(page);
  await page.getByRole('button', { name: 'Try saving again' }).click();
  await expect(page.locator('.read-done-card')).toContainText('Chapter 1 done');
});

test('a new screen takes focus at its heading; each task\'s Done names its task; Focus has one way back', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#plan');
  await page.getByRole('button', { name: /^Pause card/ }).click();
  await expect(page.getByRole('heading', { name: 'Pause card', level: 1 })).toBeFocused();
  await page.getByRole('button', { name: /^Back to/ }).click();
  await expect(page.locator('#main h1').first()).toBeFocused();
  await page.goto('/?e2e#plan/focus');
  await expect(page.getByRole('button', { name: /Back/ })).toHaveCount(1);
  await page.getByLabel('Add a task').fill('Email Riya the slides');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.goto('/?e2e#plan');
  await expect(page.getByRole('button', { name: 'Done: Email Riya the slides' })).toBeVisible();
});
