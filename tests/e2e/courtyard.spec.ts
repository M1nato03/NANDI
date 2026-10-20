import { expect, test, type Page } from '@playwright/test';

type Fact = { id: string; dayKey: string; mode: string; kind: string; refId: string; inputs: Record<string, unknown>; updatedAt: number; deleted: 0; deviceId: string };
let count = 0;
const fact = (day: string, mode: string, kind: string, inputs: Record<string, unknown> = {}): Fact => ({
  id: `${kind}:courtyard-e2e-${++count}`, dayKey: day, mode, kind, refId: `courtyard-e2e-${count}`, inputs,
  updatedAt: new Date(`${day}T12:00:00`).getTime() + count, deleted: 0, deviceId: 'courtyard-e2e',
});
const daysBefore = (day: string, n: number) => Array.from({ length: n }, (_, i) => new Date(Date.parse(`${day}T12:00:00Z`) - i * 86_400_000).toISOString().slice(0, 10));
async function seed(page: Page, facts: Fact[]) {
  await page.evaluate(async rows => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('ledger', 'readwrite');
      for (const row of rows) transaction.objectStore('ledger').put(row);
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, facts);
  await page.reload();
}

test('the courtyard grows from practice days and opens from Plan', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto('/#plan');
  // Seven training days, today included, and one finished task today.
  await seed(page, [...daysBefore('2026-10-20', 7).map(day => fact(day, 'train', 'session', { xp: 100 })), fact('2026-10-20', 'tasks', 'done', { wasPlanned: true })]);
  const banner = page.getByRole('button', { name: /Open the courtyard/ });
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('2 friends are busy with you today.');
  await expect(page.locator('.courtyard-banner [data-cast="Nandi"]')).toHaveAttribute('data-pose', 'cheer');
  await expect(page.locator('.courtyard-banner [data-cast="Kapi"]')).toHaveAttribute('data-pose', 'idle');
  await banner.click();
  await expect(page.getByRole('heading', { name: 'Courtyard', exact: true })).toBeVisible();
  const nandi = page.getByRole('region', { name: 'Nandi card' });
  await expect(nandi).toContainText('7 practice days · stage 2 of 5 · done today');
  await expect(nandi).toContainText('7 more days of training add dumbbells.');
  await page.getByRole('button', { name: /^Kachhua, Sleep/ }).click();
  const kachhua = page.getByRole('region', { name: 'Kachhua card' });
  await expect(kachhua).toContainText('0 practice days · stage 0 of 5');
  await expect(kachhua).toContainText('3 more days of on-time nights add a sleeping mat.');
  await expect(page.getByRole('region', { name: 'Neem tree' })).toContainText('7 active days · stage 2 of 5');
});

test('the courtyard sleeps at night and the storybook tells the week', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-19T12:00:00'));
  await page.goto('/#plan');
  await seed(page, [...daysBefore('2026-10-18', 5).map(day => fact(day, 'mind', 'board', { daily: true })), fact('2026-10-14', 'bonuses', 'lightsout', { metTarget: true })]);
  // Monday: Plan offers the story of the week that just ended.
  await page.getByRole('button', { name: /Your week as a story/ }).click();
  await expect(page.getByRole('heading', { name: 'Your week as a story' })).toBeVisible();
  const book = page.locator('.storybook');
  await expect(book).toContainText('12 Oct – 18 Oct');
  await page.getByRole('button', { name: 'Turn the page' }).click();
  await expect(book).toContainText('5');
  await expect(book.locator('[data-cast="Kapi"]')).toBeVisible();
  await page.getByRole('button', { name: 'Turn the page' }).click();
  await expect(book.locator('[data-cast="Kachhua"]')).toBeVisible();
  await page.getByRole('button', { name: 'Turn the page' }).click();
  await page.getByRole('button', { name: 'The end' }).click();
  await expect(page.getByRole('heading', { name: 'Storybooks' })).toBeVisible();
  await expect(page.getByRole('button', { name: /12 Oct – 18 Oct/ })).toContainText('2 friends in this story');
});

test('every friend sleeps after bedtime', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T02:30:00'));
  await page.goto('/#you/courtyard');
  const leave = page.getByRole('button', { name: 'Leave night deck' });
  await expect(leave).toBeVisible();
  await leave.click();
  await page.evaluate(() => { location.hash = '#you/courtyard'; });
  await expect(page.locator('div.courtyard-night')).toBeVisible();
  await expect(page.locator('.courtyard-screen .courtyard-caption')).toHaveText('The courtyard is asleep. See you in the morning.');
  for (const name of ['Nandi', 'Moti', 'Chiku', 'Kapi', 'Mor', 'Kachhua']) await expect(page.locator(`.courtyard [data-cast="${name}"]`)).toHaveAttribute('data-pose', 'rest');
});
