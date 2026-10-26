import { expect, test, type Page } from '@playwright/test';
import { openMore } from '../e2e/helpers/plan';
import { seedTaughtTopics } from '../e2e/learn-helpers';

// The 360x800 review set (item 140): each main screen with seeded data, reduced motion so a frame is stable.
// Run with `npm run shots`; add a shot here when a change touches a screen that is not in the set.
const out = process.env.SHOTS_DIR ?? 'shots-out';
const themes = process.env.SHOTS_THEME === 'both' ? ['light', 'dark'] as const : process.env.SHOTS_THEME === 'dark' ? ['dark'] as const : ['light'] as const;
const NOON = new Date('2026-10-26T12:00:00');

async function planWithTasks(page: Page) {
  await page.clock.install({ time: NOON });
  await page.goto('/#plan');
  await page.getByLabel('Add a task').fill('Call the bank');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await openMore(page);
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Finish the redesign');
  await page.getByLabel('Minutes').fill('150');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  const preview = page.getByRole('dialog', { name: 'Split preview' });
  await preview.getByLabel('Number of steps').selectOption('3');
  await preview.getByRole('button', { name: 'Save' }).click();
  await page.goto('/#plan');
  await expect(page.locator('.mor-parent')).toHaveCount(1);
}

async function seedDueIdeas(page: Page, ids: string[], at: number) {
  await page.evaluate(async ({ ids, at }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('learnConcepts', 'readwrite');
      for (const id of ids) transaction.objectStore('learnConcepts').put({ id, mastery: 0.5, attempts: 3, firstLearnedAt: at - 3 * 86_400_000, memory: { stability: 2, difficulty: 5, interval: 2, lastReview: at - 2 * 86_400_000, dueAt: at - 3_600_000 }, activeMisconceptions: [], updatedAt: at, deleted: 0, deviceId: 'shots' });
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, { ids, at });
}

for (const theme of themes) test.describe(theme, () => {
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' }); });
  const shot = (page: Page, name: string, fullPage = true) => page.screenshot({ path: `${out}/${theme}/${name}.png`, fullPage });

  test('plan: a plain and a stepped task, then the mark-all check and a move menu', async ({ page }) => {
    await planWithTasks(page);
    await shot(page, 'plan-1-tasks');
    await page.locator('.mor-parent').getByRole('button', { name: /^Done: / }).click();
    await shot(page, 'plan-2-mark-all');
    await page.locator('.mor-parent').getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'More for Call the bank' }).click();
    await shot(page, 'plan-3-move-menu');
  });

  test('plan: a running focus', async ({ page }) => {
    await planWithTasks(page);
    await page.getByRole('button', { name: 'Start: Call the bank' }).click();
    await expect(page.getByRole('region', { name: 'Focus' })).toBeVisible();
    await page.clock.runFor(125_000);
    await shot(page, 'plan-4-focus');
  });

  test('learn: idea checks due, and a topic trail', async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await page.goto('/?e2e#learn');
    await seedTaughtTopics(page, ['money-markets']);
    await seedDueIdeas(page, ['inflation', 'compounding'], NOON.getTime());
    await page.reload();
    const money = page.locator('.learn-map-topic').filter({ hasText: 'Money and markets' });
    await money.getByRole('button', { name: 'Add to my drops' }).click();
    await expect(page.getByRole('region', { name: 'Review with Moti' })).toBeVisible();
    await shot(page, 'learn-1-today');
    await money.locator('.learn-topic-expand').click();
    await page.locator('.learn-trail-chest').first().scrollIntoViewIfNeeded();
    await shot(page, 'learn-2-trail', false);
  });

  for (const route of ['train', 'mind', 'you', 'you/courtyard', 'you/cast'] as const) test(`tab: ${route}`, async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await page.goto(`/?e2e#${route}`);
    await expect(page.locator('main')).toBeVisible();
    await page.waitForTimeout(600);
    await shot(page, route.replace('/', '-'));
  });

  test('night deck', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-26T23:30:00'));
    await page.goto('/?e2e#night');
    await expect(page.getByRole('region', { name: 'Now deck' })).toBeVisible();
    await shot(page, 'night-deck');
  });
});
