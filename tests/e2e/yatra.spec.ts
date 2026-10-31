import { expect, test, type Page } from '@playwright/test';

// Spec 34 Yatra: Train, Kapi's shelf and Calm in one tab; every old route lands in the right corner.
const NOON = new Date('2026-10-28T12:00:00');
const calmRows = (page: Page) => page.evaluate(async () => {
  const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const rows = await new Promise<{ mode: string; kind: string; inputs: Record<string, unknown> }[]>(resolve => { const request = database.transaction('ledger').objectStore('ledger').getAll(); request.onsuccess = () => resolve(request.result); });
  database.close();
  return rows.filter(row => row.mode === 'calm');
});

test('Yatra\'s camp: Nandi, Kapi and Kachhua open their corners, with Yatra lit in the tab bar', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await page.goto('/#plan');
  const tabs = page.getByRole('navigation', { name: 'Main tabs' });
  await expect(tabs.getByRole('link')).toHaveText(['Yatra', 'Plan', 'Read', 'You']);
  await tabs.getByRole('link', { name: 'Yatra' }).click();
  await expect(page).toHaveURL(/#yatra$/);
  // Spec 45b: the corners are the friends at camp.
  await expect(page.locator('.notebook-home h1')).toBeVisible();
  for (const [name, url, heading] of [['Nandi by the pack: Train', /#yatra\/train$/, null], ['Kapi in the branches: Play', /#yatra\/mind$/, "Kapi's shelf"], ['Kachhua by the fire: Calm', /#yatra\/calm$/, 'Breathe with Kachhua']] as const) {
    await page.goto('/#yatra');
    await page.getByRole('button', { name }).click();
    await expect(page).toHaveURL(url);
    await expect(tabs.getByRole('link', { name: 'Yatra' })).toHaveAttribute('aria-current', 'page');
    if (heading) await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await page.getByRole('button', { name: /^Back to / }).click();
    await expect(page).toHaveURL(/#yatra$/);
  }
});

test('every old Train, Mind and Games route lands in its Yatra corner; You and Read no longer hold them', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  for (const [from, to] of [['train', 'yatra/train'], ['train/history', 'yatra/train/history'], ['you/train', 'yatra/train'], ['mind', 'yatra/mind'], ['mind/case', 'yatra/mind/case'], ['you/mind', 'yatra/mind'], ['read/games', 'yatra/mind'], ['read/games/practice', 'yatra/mind/practice'], ['learn/games', 'yatra/mind']] as const) {
    await page.goto(`/#${from}`);
    await expect(page).toHaveURL(new RegExp(`#${to.replaceAll('/', '\\/')}$`));
  }
  await page.goto('/#you');
  await expect(page.getByRole('heading', { name: 'You', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Train/ })).toHaveCount(0);
  await page.goto('/#read');
  await expect(page.getByRole('heading', { name: 'Your books', level: 1 })).toBeVisible();
  await expect(page.getByText('Games', { exact: true })).toHaveCount(0);
});

test('Calm: the breath leads in and out, a full minute saves one quiet row, and stopping early saves nothing', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/#yatra/calm');
  await expect(page.getByText('A quiet few minutes with your breath.')).toBeVisible();
  await expect(page.locator('.calm-phase')).toHaveText('4 in, 6 out');
  // Stopping early saves nothing and says nothing about it.
  await page.locator('.calm-other').click();
  await page.getByRole('dialog', { name: 'Other lengths' }).getByRole('button', { name: '1 min', exact: true }).click();
  await page.getByRole('button', { name: 'Start 1 minute' }).click();
  await expect(page.locator('.calm-phase')).toHaveText('Breathe in');
  await page.clock.runFor(5_000);
  await expect(page.locator('.calm-phase')).toHaveText('Breathe out');
  await expect(page.locator('.calm-stage')).toHaveAttribute('data-phase', 'out');
  await page.getByRole('button', { name: 'Stop' }).click();
  expect(await calmRows(page)).toEqual([]);
  // A changed breath is kept, and a full minute saves one row.
  await page.locator('.calm-settings summary').click();
  await page.getByLabel('Breathe out (seconds)').selectOption('8');
  await expect(page.locator('.calm-phase')).toHaveText('4 in, 8 out');
  await page.getByRole('button', { name: 'Start 1 minute' }).click();
  await page.clock.runFor(61_000);
  await expect(page.locator('.calm-phase')).toHaveText('A quiet minute, together.');
  await expect(page.getByRole('button', { name: 'Start 1 minute' })).toBeVisible();
  const rows = await calmRows(page);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ kind: 'session', inputs: { minutes: 1, in: 4, out: 8 } });
  await page.reload();
  await expect(page.locator('.calm-phase')).toHaveText('4 in, 8 out');
});

test("Kapi's shelf leads with today's case, visible without a scroll", async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await page.goto('/#yatra/mind');
  const card = page.getByRole('region', { name: "Today's case" });
  await expect(card).toContainText("Today's case");
  const open = card.getByRole('button', { name: 'Open the case' });
  await expect(open).toBeEnabled();
  const box = (await open.boundingBox())!;
  expect(box.y + box.height).toBeLessThan(page.viewportSize()!.height - 64);
  await open.click();
  await expect(page).toHaveURL(/#yatra\/mind\/case$/);
});
