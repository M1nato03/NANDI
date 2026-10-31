import { expect, test, type Page } from '@playwright/test';
import { walkIdea } from './learn-helpers';

// a11y batch 2 (audit D:\nandi-gate-logs\idea-engine\a11y\audit.md §C #5, #7, #9, #10).
const NOON = new Date('2026-10-28T12:00:00');

/** 200% text for the parts the audit named (the browser cannot scale text alone, so these get double size). */
const doubleText = (page: Page) => page.addStyleTag({ content: '.trek-place b { font-size: 20px !important; } .trek-caption b { font-size: 20px !important; } .trek-caption span { font-size: 32px !important; } .yatra-focus-strip { font-size: 32px !important; } .deck-context { font-size: 28px !important; }' });
/** No word cut off: the element shows all of its text (nothing scrolled away or hidden). */
const fits = (page: Page, selector: string) => page.locator(selector).evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1));

async function seedTimedTask(page: Page, title: string) {
  await page.evaluate(async ({ title, at }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>(resolve => {
      const transaction = database.transaction('tasks', 'readwrite');
      transaction.objectStore('tasks').put({ id: 'e2e-timed', title, status: 'planned', dayKey: '2026-10-28', size: 'S', estimateMin: 15, mustOrCould: 'must', scheduledStart: at, updatedAt: at, deleted: 0, deviceId: 'e2e' });
      transaction.oncomplete = () => resolve();
    });
    database.close();
  }, { title, at: NOON.getTime() + 3_600_000 });
}

test('C7: every "spot the part" choice is at least 44 by 44 px', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#read/chapter/how-things-work/how-things-work-ch1');
  await walkIdea(page, 'how-things-work');
  await page.getByRole('button', { name: 'One more idea' }).click();
  // The second idea tries spot-the-part; walk to it.
  for (let screen = 0; screen < 6 && !(await page.locator('.step-example').count()); screen++) {
    if (await page.locator('.learn-options').count()) await page.locator('.learn-options button').first().click();
    await page.locator('.idea-sitting').getByRole('button', { name: /^(Continue|Finish the idea)$/ }).first().click();
  }
  const sizes = await page.locator('.step-example .step-part').evaluateAll(nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return [box.width, box.height]; }));
  expect(sizes.length).toBeGreaterThan(1);
  for (const [width, height] of sizes) { expect(width).toBeGreaterThanOrEqual(44); expect(height).toBeGreaterThanOrEqual(44); }
});

test('C9: at 200% text the trek captions, place signs and focus strip show every word', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#plan/focus');
  await page.getByLabel('Add a task').fill('Write the long quarterly report for the regional office');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Start focus' }).click();
  await page.goto('/?e2e#yatra');
  await expect(page.locator('.yatra-focus-strip')).toBeVisible();
  await doubleText(page);
  expect(await fits(page, '.yatra-focus-text')).toBe(true);
  expect(await fits(page, '.trek-caption')).toBe(true);
  expect(await fits(page, '.trek-place b')).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('C10: with notifications off, a timed task today shows how to turn them on; with none, nothing shows', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#plan');
  await page.evaluate(() => sessionStorage.setItem('nandi.e2eNotify', 'denied'));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Plan', level: 1 })).toBeVisible();
  await expect(page.locator('.reminders-off')).toHaveCount(0);
  await seedTimedTask(page, 'Call the bank');
  await expect(page.locator('.reminders-off')).toContainText('your timed tasks won\'t ring');
  await expect(page.locator('.reminders-off')).toContainText("browser's site settings");
});

test('C5: a full phone says so and leads to a backup; asking to keep data says what the browser answered', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#plan');
  await expect(page.getByRole('heading', { name: 'Plan', level: 1 })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('nandi:storage-full')));
  await page.getByRole('button', { name: /out of room for NANDI's data/ }).click();
  await expect(page).toHaveURL(/#you\/backup$/);
  await page.getByRole('button', { name: 'Ask to keep data on this device' }).click();
  await expect(page.getByRole('status').filter({ hasText: /keep NANDI's data|did not agree|Could not ask/ })).toBeVisible();
});
