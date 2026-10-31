import { expect, test, type Page } from '@playwright/test';
import { openMore } from './helpers/plan';

// Spec 45c: a real level rise opens the notebook level page in place of the season reveal: one dialog, a lantern and
// the five friends, Continue only. It pays nothing, it keeps the page that raised it, and focus comes back to that page.
const NOON = new Date('2026-11-03T12:00:00');
async function seedNearLevelTwo(page: Page) {
  await page.goto('/#plan');
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>(resolve => { const transaction = database.transaction('ledger', 'readwrite'); transaction.objectStore('ledger').put({ id: 'train-session:l2', mode: 'train', kind: 'session', refId: 'l2', dayKey: '2026-11-03', inputs: { xp: 95 }, updatedAt: Date.now(), deleted: 0, deviceId: 'e2e' }); transaction.oncomplete = () => resolve(); });
    database.close();
  });
  await page.reload();
}
async function finishATask(page: Page, title: string) {
  await openMore(page);
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill(title);
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: 'Done' }).last().click();
}
const xpInAll = async (page: Page) => {
  await page.goto('/#you');
  return Number((await page.getByText(/^[\d,]+ XP in all$/).innerText()).replace(/[^\d]/g, ''));
};

test('a level rise is one level page: the friends, the lantern, Continue; it pays nothing and Plan stays', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await seedNearLevelTwo(page);
  await finishATask(page, 'Write first note');
  const level = page.getByRole('dialog', { name: 'Level 2' });
  await expect(level).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.getByRole('dialog', { name: 'Season progress' })).toHaveCount(0);
  await expect(level.locator('.level-friends [data-cast]')).toHaveCount(5);
  await expect(level.locator('.level-lantern')).toHaveCount(1);
  await expect(level.getByRole('button')).toHaveText(['Continue']);
  // Focus is on the page while it is open, and comes back to Plan after.
  await expect(level.getByRole('button', { name: 'Continue' })).toBeFocused();
  await level.getByRole('button', { name: 'Continue' }).click();
  await expect(level).toHaveCount(0);
  await expect(page).toHaveURL(/#plan$/);
  expect(await page.evaluate(() => document.getElementById('main')!.contains(document.activeElement))).toBe(true);
  // Nothing was paid for the page: the total is the level's, and another finish shows a plain toast, not a second page.
  const total = await xpInAll(page);
  await page.goto('/#plan');
  await page.waitForTimeout(500);
  expect(await xpInAll(page)).toBe(total);
  await page.goto('/#plan');
  await finishATask(page, 'Write second note');
  await expect(page.locator('.economy-toast')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('with reduced motion the friends stand still, and Escape closes the page', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: NOON });
  await seedNearLevelTwo(page);
  await finishATask(page, 'Write first note');
  const level = page.getByRole('dialog', { name: 'Level 2' });
  await expect(level.locator('.level-sheet')).toHaveClass(/is-still/);
  const moving = await level.locator('.level-friends > span').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).animationName));
  expect(moving.every(name => name === 'none')).toBe(true);
  await page.keyboard.press('Escape');
  await expect(level).toHaveCount(0);
  await expect(page).toHaveURL(/#plan$/);
});
