import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const money = JSON.parse(readFileSync('content/topics/topic.money-markets.json', 'utf8')) as { body: { modules: { concepts: { id: string }[] }[] } };
const conceptId = money.body.modules[0]!.concepts[0]!.id;

async function openNightDrop(page: Page) {
  await page.goto('/?e2e#night');
  await page.getByRole('region', { name: 'Now deck' }).getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Night drop card' })).toBeVisible();
}

async function pickAnswer(page: Page) {
  for (let attempt = 0; attempt < 12; attempt++) {
    if (await page.locator('.learn-confidence').isVisible()) return;
    await page.locator('.learn-options button:enabled').first().click();
  }
  await expect(page.locator('.learn-confidence')).toBeVisible();
}

test('after bedtime the night drop has only due reviews, then stops calmly when none are due', async ({ page }) => {
  test.setTimeout(90_000);
  const now = new Date(2026, 9, 18, 2, 0).getTime();
  await page.clock.setFixedTime(new Date(now));
  await page.goto('/?e2e#learn');
  await page.waitForFunction(() => !!window.__nandiTest);
  await page.evaluate(async ({ id, due }) => window.__nandiTest!.seedLearnNight(id, due), { id: conceptId, due: now - 1 });
  await openNightDrop(page);
  await expect(page.locator('.learn-drop-head')).toBeVisible();
  const modes = await page.evaluate(async () => {
    const request = indexedDB.open('nandi');
    const database = await new Promise<IDBDatabase>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    const row = await new Promise<{ drop: { items: { mode: string }[] } }>((resolve, reject) => {
      const tx = database.transaction('learnDrops'); const query = tx.objectStore('learnDrops').get('drop:night:2026-10-17');
      query.onsuccess = () => resolve(query.result); query.onerror = () => reject(query.error);
    });
    database.close(); return row.drop.items.map(item => item.mode);
  });
  expect(modes.length).toBeGreaterThan(0);
  expect(modes.every(mode => mode !== 'new')).toBe(true);

  await page.evaluate(() => window.__nandiTest!.wipeData());
  await page.evaluate(async ({ id, due }) => window.__nandiTest!.seedLearnNight(id, due), { id: conceptId, due: now + 86_400_000 });
  await openNightDrop(page);
  await expect(page.locator('.learn-stop')).toContainText('Nothing to review tonight. Sleep is the best study.');
});

test('confidence defaults to fairly sure and a changed tap survives reload', async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.setFixedTime(new Date(2026, 9, 19, 12));
  await page.goto('/?e2e#learn/drop');
  await page.getByRole('button', { name: /Money and markets/ }).click();
  await page.getByRole('button', { name: 'Start my first drop' }).click();
  await expect(page.locator('.learn-options')).toBeVisible();
  await pickAnswer(page);
  await expect(page.getByRole('button', { name: 'Fairly sure', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.locator('.learn-feedback')).toBeVisible();
  await expect(page.locator('.learn-feedback').getByRole('button', { name: 'Next' })).toBeEnabled();
  await page.reload();
  await page.waitForFunction(() => !!window.__nandiTest);
  expect(await page.evaluate(() => window.__nandiTest!.learnConfidence())).toBe('fairly-sure');
  await page.locator('.learn-feedback').getByRole('button', { name: 'Next' }).click();
  await pickAnswer(page);
  await page.getByRole('button', { name: 'Sure', exact: true }).click();
  await expect(page.locator('.learn-feedback')).toBeVisible();
  await expect(page.locator('.learn-feedback').getByRole('button', { name: 'Next' })).toBeEnabled();
  await page.reload();
  await page.waitForFunction(() => !!window.__nandiTest);
  expect(await page.evaluate(() => window.__nandiTest!.learnConfidence())).toBe('certain');
});

test('Learn shows empty learning figures', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); // daytime: after shutdown the app opens the night deck
  await page.goto('/?e2e#learn');
  const figures = page.getByRole('region', { name: 'How your learning is holding' });
  await expect(figures).toContainText('30-day recall: Builds after your first 30 days');
  await expect(figures).not.toContainText('When you feel sure');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('owner flag with a note updates the count and survives reload', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); // daytime: after shutdown the app opens the night deck
  test.setTimeout(90_000);
  await page.goto('/?e2e#you/settings');
  await page.getByText('About this app').click();
  await page.getByRole('button', { name: 'Review content' }).click();
  await expect(page.getByRole('heading', { name: 'Review content' })).toBeVisible();
  await expect(page.getByText('0 flagged')).toBeVisible();
  const first = page.locator('.content-review-item').first();
  await expect(first).toContainText('Correct answer:');
  await expect(first).toContainText('Source:');
  await first.getByRole('button', { name: 'Flag', exact: true }).click();
  await first.getByRole('textbox', { name: 'What needs a look?' }).fill('Check the source and feedback.');
  await first.getByRole('button', { name: 'Save flag' }).click();
  await expect(page.getByText('1 flagged')).toBeVisible();
  await page.reload();
  await expect(page.getByText('1 flagged')).toBeVisible();
  await expect(page.locator('.content-review-item').first()).toContainText('Check the source and feedback.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
