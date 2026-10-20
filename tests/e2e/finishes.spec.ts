import { expect, test, type Page } from '@playwright/test';
import { featuredSpec } from '../../src/core/puzzles/daily';
import { finishLines } from '../../src/ui/shell/finish';

const day = '2026-10-20';

async function completeTask(page: Page, title: string) {
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill(title);
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: 'Done' }).last().click();
}

async function seedOtherCoreItems(page: Page) {
  const featured = featuredSpec(day);
  await page.evaluate(async ({ day, featured }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nandi');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(['sessions', 'learnDrops', 'puzzleRuns'], 'readwrite');
      tx.objectStore('sessions').put({ id: `finish-session:${day}`, dayKey: day, status: 'completed', deleted: 0 });
      tx.objectStore('learnDrops').put({ id: `drop:daily:${day}`, drop: { cursor: 1, items: [{}] } });
      tx.objectStore('puzzleRuns').put({ id: `daily:${day}:${featured.type}:${featured.diff}`, dayKey: day, type: featured.type, diff: featured.diff, result: 'solved', deleted: 0 });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    database.close();
  }, { day, featured });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Train: done' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Learn: done' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mind: done' })).toBeVisible();
}

test('a finished task gets one warm line that fades', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto('/#plan');
  await completeTask(page, 'Write a small note');
  const toast = page.locator('.finish-moment');
  await expect(toast).toBeVisible();
  const text = await toast.textContent();
  expect(finishLines.task.some(line => text?.includes(line))).toBeTruthy();
  await expect(toast).toHaveCount(0, { timeout: 5000 });
});

test('the last core item gives a single daily stopping card, even after reload', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto('/#plan');
  await seedOtherCoreItems(page);
  await completeTask(page, 'Close the last task');
  const card = page.getByRole('dialog', { name: 'Done for today' });
  await expect(card).toBeVisible({ timeout: 5000 });
  await expect(card).toContainText('The rest of the day is yours.');
  await expect(card.getByRole('button')).toHaveCount(1);
  await card.getByRole('button', { name: 'Close' }).click();
  await page.reload();
  await expect(card).toHaveCount(0);
  await completeTask(page, 'One optional extra');
  await expect(card).toHaveCount(0);
});

test('reduced motion has no finish animation class', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#plan');
  await completeTask(page, 'A steady step');
  const toast = page.locator('.finish-moment');
  await expect(toast).toBeVisible();
  await expect(toast).not.toHaveClass(/finish-bloom/);
  await expect(toast).toHaveCSS('animation-name', 'none');
});
