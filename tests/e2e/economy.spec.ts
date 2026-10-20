import { expect, test, type Page } from '@playwright/test';

type Fact = { id: string; dayKey: string; mode: string; kind: string; refId: string; inputs: Record<string, unknown>; updatedAt: number; deleted: 0; deviceId: string };
let count = 0;
const fact = (day: string, mode: string, kind: string, inputs: Record<string, unknown> = {}): Fact => ({
  id: `${kind}:economy-e2e-${++count}`, dayKey: day, mode, kind, refId: `economy-e2e-${count}`, inputs,
  updatedAt: new Date(`${day}T12:00:00`).getTime() + count, deleted: 0, deviceId: 'economy-e2e',
});
const dayFacts = (day: string): Fact[] => [
  ...Array.from({ length: 20 }, () => fact(day, 'tasks', 'done', { plannedSize: 'L', postpones: 1, wasPlanned: true })),
  fact(day, 'train', 'session', { xp: 100 }), fact(day, 'mind', 'mystery', { result: 'solved', afterBedtime: false }),
  fact(day, 'mind', 'board', { daily: true, afterBedtime: false }), fact(day, 'mind', 'lesson', { afterBedtime: false }),
  ...Array.from({ length: 20 }, () => fact(day, 'mind', 'card', { afterBedtime: false })),
  fact(day, 'mind', 'learn-drop', { afterBedtime: false }), fact(day, 'bonuses', 'lightsout', { metTarget: true }),
];
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

test('pre-season level and streak appear before Season 1 begins', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-19T12:00:00') });
  await page.goto('/#you');
  await seed(page, [fact('2026-10-19', 'tasks', 'done', { plannedSize: 'M', wasPlanned: true })]);
  const season = page.getByRole('region', { name: 'Your season' });
  await expect(season).toContainText('Season 1 starts Monday 2 Nov');
  await expect(season).toContainText('1 day streak');
  await expect(season).toContainText('Level 1');
  await expect(season).not.toContainText('#500 of 500');
});

test('seeded week shows rank and Clean Week; rest day and theme survive a backup round trip', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-08T12:00:00') });
  await page.goto('/#you');
  const days = ['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-08'];
  await seed(page, days.flatMap(dayFacts));
  const season = page.getByRole('region', { name: 'Your season' });
  await expect(season).toContainText(/Level \d+/);
  await expect(season).toContainText(/#\d+ of 500/);
  await expect(season).toContainText('6 of 4 Hat-tricks');
  await expect(season).toContainText('8 day streak');
  await expect(season).toContainText('Shards');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  const rankText = (await season.locator('.economy-season-card strong').textContent())?.trim();
  await season.getByRole('button', { name: 'View the ladder' }).click();
  await expect(page.locator('.ladder-seat.you')).toContainText(rankText!.split(' ')[0]!);
  expect(await page.locator('.ladder-seat').filter({ hasText: /SP/ }).count()).toBeGreaterThan(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.goto('/#you/shop');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: '50 Shards', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Yours. Ready to use.');
  await page.getByRole('button', { name: '400 Shards' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-economy-theme', 'linen');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-economy-theme', 'linen');
  await page.goto('/#you/settings');
  await page.getByRole('button', { name: 'Backup and restore' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const saved = await (await download).path();
  expect(saved).not.toBeNull();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose restore file' }).click();
  await (await chooser).setFiles(saved!);
  await page.getByRole('button', { name: 'Confirm restore' }).click();
  await expect(page.getByRole('main').getByRole('status')).toContainText('Restore complete');
  await page.goto('/#you');
  await expect(page.getByRole('region', { name: 'Your season' })).toContainText(rankText!);
  await expect(page.locator('html')).toHaveAttribute('data-economy-theme', 'linen');
});

test('short balance leaves a theme unavailable', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-03T12:00:00') });
  await page.goto('/#you/shop');
  await expect(page.getByRole('button', { name: '400 Shards' })).toBeDisabled();
  await expect(page.getByText(/more Shards/).first()).toBeVisible();
});

test('missed days use the rest bank before a streak pauses', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-07T12:00:00') });
  await page.goto('/#you');
  await seed(page, [fact('2026-11-02', 'tasks', 'done', { plannedSize: 'M', wasPlanned: true }),
    ...['2026-11-06', '2026-11-07'].flatMap(day => [fact(day, 'tasks', 'done', { plannedSize: 'M', wasPlanned: true }), fact(day, 'train', 'session', { xp: 60 }), fact(day, 'mind', 'mystery', { result: 'solved' })])]);
  await expect(page.getByRole('region', { name: 'Your season' })).toContainText('0 rest days banked');
  await expect(page.getByRole('region', { name: 'Your season' })).not.toContainText('Streak paused');
});

test('task completion shows an XP toast and a skippable level reveal', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-03T12:00:00') });
  await page.goto('/#plan');
  await seed(page, [fact('2026-11-03', 'train', 'session', { xp: 95 })]);
  const add = async (title: string) => {
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill(title);
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: 'Done' }).last().click();
  };
  await add('Write first note');
  await expect(page.getByRole('dialog', { name: 'Season progress' })).toContainText('Level 2');
  await page.getByRole('button', { name: 'Skip reveal' }).click();
  await add('Write second note');
  await expect(page.locator('.economy-toast')).toContainText('+5 XP');
});
