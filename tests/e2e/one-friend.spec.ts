import { expect, test, type Page } from '@playwright/test';
import { seedTaughtTopics } from './learn-helpers';

// Item 135: a friend appears only in its own area's panels. The courtyard banner shows the whole cast on purpose.
const friendsOnScreen = (page: Page) => page.evaluate(() => [...document.querySelectorAll('main [data-cast]')]
  .filter(node => !node.closest('.courtyard-banner')).map(node => node.getAttribute('data-cast')));

async function seedDueIdeas(page: Page, ids: string[], at: number) {
  await page.evaluate(async ({ ids, at }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('learnConcepts', 'readwrite');
      for (const id of ids) transaction.objectStore('learnConcepts').put({ id, mastery: 0.5, attempts: 3, firstLearnedAt: at - 3 * 86_400_000, memory: { stability: 2, difficulty: 5, interval: 2, lastReview: at - 2 * 86_400_000, dueAt: at - 3_600_000 }, activeMisconceptions: [], updatedAt: at, deleted: 0, deviceId: 'one-friend-e2e' });
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, { ids, at });
}

test('Plan has one Mor, on its stage, and Mor reacts there', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-26T12:00:00') });
  await page.goto('/#plan');
  await expect(page.getByRole('region', { name: "Mor's stage" })).toBeVisible();
  await expect(page.getByText('Your list for today.')).toHaveCount(0);
  expect(await friendsOnScreen(page)).toEqual(['Mor']);
  await page.getByLabel('Add a task').fill('Water the plants');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('region', { name: "Mor's stage" }).locator('.mor-friend')).toHaveAttribute('data-moment', 'add');
});

test("Learn: Today is Chiku's, idea checks get Moti's own card, and the trail is Chiku's", async ({ page }) => {
  const noon = new Date('2026-10-20T12:00:00').getTime();
  await page.clock.setFixedTime(new Date(noon));
  await page.goto('/?e2e#learn');
  await seedTaughtTopics(page, ['money-markets']);
  await seedDueIdeas(page, ['inflation', 'compounding'], noon);
  await page.reload();
  // Idea checks count only topics in your drops.
  await page.locator('.learn-map-topic').filter({ hasText: 'Money and markets' }).getByRole('button', { name: 'Add to my drops' }).click();
  const moti = page.getByRole('region', { name: 'Review with Moti' });
  await expect(moti.getByRole('button', { name: 'Idea checks · 2 today' })).toBeVisible();
  await expect(moti.locator('[data-cast="Moti"]')).toHaveCount(1);
  await expect(page.locator('.learn-today [data-cast]')).toHaveCount(0);
  await page.locator('.learn-map-topic').filter({ hasText: 'Money and markets' }).locator('.learn-topic-expand').click();
  await expect(page.locator('.learn-trail-chest [data-cast="Chiku"]').first()).toBeVisible();
  const trail = await page.evaluate(() => [...document.querySelectorAll('.learn-trail [data-cast]')].map(node => node.getAttribute('data-cast')));
  expect(new Set(trail)).toEqual(new Set(['Chiku']));
});
