import { expect, test, type Page } from '@playwright/test';
import { openIdeas, seedTaughtTopics, selectBooks } from './learn-helpers';

// Item 135: a friend appears only in its own area's panels. The courtyard banner and the Yatra tab's camp strip
// (571 stage 2: the trek above Mor's plan) show the whole cast on purpose.
const friendsOnScreen = (page: Page) => page.evaluate(() => [...document.querySelectorAll('main [data-cast]')]
  .filter(node => !node.closest('.courtyard-banner, .trek-strip')).map(node => node.getAttribute('data-cast')));

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

test('Plan has one Mor, the camp’s, and Mor reacts there (J3, Jenil 13 Nov)', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-26T12:00:00') });
  await page.goto('/#plan');
  await expect(page.getByRole('region', { name: "Mor's stage" })).toBeVisible();
  await expect(page.getByText('Your list for today.')).toHaveCount(0);
  // The camp strip is a lazy chunk: read the friends once it has painted, so the read never races it (CI 43389063511).
  const campMor = page.locator('main .trek-strip .mor-friend');
  await expect(campMor).toBeVisible();
  // J3: Plan's heading keeps its words only; the one Mor on screen is the camp's (in the strip above).
  expect(await friendsOnScreen(page)).toEqual([]);
  await expect(page.getByRole('region', { name: "Mor's stage" }).locator('[data-cast]')).toHaveCount(0);
  // (The courtyard banner inside Plan's closed More shows the whole cast on purpose.)
  await expect(page.locator('main [data-cast="Mor"]:not(.courtyard-banner *)')).toHaveCount(1);
  // a9 13 Nov: no named Mor beside it either (Cast names itself by aria-label and a <title> child, not a title attribute).
  await expect(page.locator('main :is([data-cast="Mor"], [aria-label="Mor"], [title="Mor"]):not(.courtyard-banner *)')).toHaveCount(1);
  await page.getByLabel('Add a task').fill('Water the plants');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(campMor).toHaveAttribute('data-moment', 'add');
});

test("Read: Continue is Chiku's, idea checks get Moti's own card, and a book's ideas and chest are Chiku's", async ({ page }) => {
  const noon = new Date('2026-10-20T12:00:00').getTime();
  await page.clock.setFixedTime(new Date(noon));
  await page.goto('/?e2e#grow/read');
  await seedTaughtTopics(page, ['money-markets']);
  await seedDueIdeas(page, ['inflation', 'compounding'], noon);
  // Idea checks count the books you have started (spec 33; the old topic picks).
  await selectBooks(page, ['money-markets']);
  await page.reload();
  // Spec 571: Moti's review card lives in Remember; Chiku's Continue remains in Read.
  await expect(page.getByRole('region', { name: 'Continue' }).locator('[data-cast]')).toHaveCount(0);
  await page.goto('/?e2e#grow/remember');
  const moti = page.getByRole('region', { name: 'Review with Moti' });
  await expect(moti.getByRole('button', { name: 'Idea checks · 2 today' })).toBeVisible();
  // Spec 571: one Moti per screen: on Remember's stage, not again inside the card.
  await expect(page.getByRole('region', { name: "Moti's stage" }).locator('[data-cast="Moti"]')).toHaveCount(1);
  await expect(moti.locator('[data-cast]')).toHaveCount(0);
  await page.goto('/?e2e#grow/read');
  await openIdeas(page, 'money-markets', 'Inflation');
  await expect(page.locator('.learn-trail-chest [data-cast="Chiku"]').first()).toBeVisible();
  const trail = await page.evaluate(() => [...document.querySelectorAll('.read-book-page [data-cast]')].map(node => node.getAttribute('data-cast')));
  expect(new Set(trail)).toEqual(new Set(['Chiku']));
});
