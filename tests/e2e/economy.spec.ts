import { expect, test, type Page } from '@playwright/test';
import { openMore } from './helpers/plan';

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
/** A card back and a theme bought on an older build: their accepted purchase facts and the applied theme setting. */
async function seedOwned(page: Page) {
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(['ledger', 'settings'], 'readwrite');
      const at = new Date('2026-11-01T12:00:00').getTime();
      for (const [id, price] of [['cardback:weave', 100], ['theme:linen', 400]] as const) tx.objectStore('ledger').put({ id: `purchase:old-${id}`, dayKey: '2026-11-01', mode: 'economy', kind: 'purchase', refId: id, inputs: { itemId: id, price, accepted: true }, updatedAt: at, deleted: 0, deviceId: 'old-build' });
      tx.objectStore('settings').put({ key: 'economy.theme', value: 'theme:linen', updatedAt: at, deleted: 0, deviceId: 'old-build' });
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    database.close();
  });
  await page.reload();
}
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

test('pre-season level and the week appear before Season 1 begins (spec 47b: useful days, no streak)', async ({ page }) => {
  // The season card appears in the last week before it starts.
  await page.clock.install({ time: new Date('2026-10-27T12:00:00') });
  await page.goto('/#you');
  await seed(page, [fact('2026-10-27', 'tasks', 'done', { plannedSize: 'M', wasPlanned: true })]);
  const season = page.getByRole('region', { name: 'Your season' });
  await expect(season).toContainText('Season 1 starts Monday 2 Nov');
  await expect(season.getByRole('region', { name: 'This week' })).toContainText('1 of your 4');
  await expect(season).not.toContainText(/day streak/);
  await expect(season).toContainText('Level 1');
  await expect(season).not.toContainText('#500 of 500');
});

test('seeded week shows the level and the useful week (no rank, spec 660 §3.2); a card back and theme survive a backup round trip', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-08T12:00:00') });
  await page.goto('/#you');
  const days = ['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-08'];
  await seed(page, days.flatMap(dayFacts));
  const season = page.getByRole('region', { name: 'Your season' });
  await expect(season).toContainText(/Level \d+/);
  await expect(season).not.toContainText(/of 500/);
  // Spec 47b: Mon 2 to Sun 8 Nov, six useful days (not Sat 7).
  await expect(season.getByRole('region', { name: 'This week' }).getByRole('heading')).toHaveText('6 of your 4');
  await expect(season).toContainText('Useful days this season: 6');
  await expect(season).not.toContainText(/day streak|Hat-tricks|Stamina/);
  // Spec 660 §3.1: no Shards card on You any more; the balance is read-only in You › history.
  await expect(season).not.toContainText('Shards');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  // Spec 660 §3.2: no pace-setters, no ladder.
  await expect(season.locator('.economy-rival')).toHaveCount(0);
  await expect(season.getByRole('button', { name: 'View the ladder' })).toHaveCount(0);
  const levelText = (await season.locator('.economy-level h2').textContent())?.trim();
  // Spec 660 §3.1: the shop closed. A card back and a theme bought on an older build (their purchase facts and the
  // applied theme) stay owned and applied, and the old shop link opens You › history, read-only.
  await seedOwned(page);
  await expect(page.locator('html')).toHaveAttribute('data-economy-theme', 'linen');
  await page.goto('/#you/shop');
  const history = page.getByTestId('you-history');
  await expect(history.getByRole('heading', { name: /^Shards kept: \d/ })).toBeVisible();
  await expect(history).toContainText('Linen theme');
  await expect(history.getByRole('button', { name: /Shards$/ })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.goto('/#you/settings');
  await page.getByRole('button', { name: 'Backup and restore' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const saved = await (await download).path();
  expect(saved).not.toBeNull();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose restore file' }).click();
  await (await chooser).setFiles(saved!);
  // Jenil 24 Oct: a restore replaces today too, and the preview says so first (cj3 clock fuzz C1).
  await expect(page.getByLabel('Restore preview')).toContainText("Today’s activity, purchases, owned items, Shards and courtyard growth will be replaced by the backup’s.");
  await page.getByRole('button', { name: 'Confirm restore' }).click();
  await expect(page.getByRole('main').getByRole('status')).toContainText('Your data is ready.');
  await page.goto('/#you');
  await expect(page.getByRole('region', { name: 'Your season' })).toContainText(levelText!);
  await expect(page.locator('html')).toHaveAttribute('data-economy-theme', 'linen');
});

test('spec 660 §3.1: the shop is closed; its link opens the read-only history and nothing can be bought', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-03T12:00:00') });
  // b2 12 Nov: a new user (no Shards, nothing owned, nothing finished) sees neither the closed shop nor the history link.
  await page.goto('/#you');
  await expect(page.locator('.you-screen')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('history-link')).toHaveCount(0);
  await page.goto('/#you/shop');
  await expect(page).toHaveURL(/#you\/history$/);
  await expect(page.getByRole('region', { name: 'Past seasons' })).toContainText('No season has finished yet.');
  await expect(page.getByRole('heading', { name: /^Shards kept/ })).toHaveCount(0);
  // Someone who bought on an older build keeps what they own.
  await seedOwned(page);
  const history = page.getByTestId('you-history');
  await expect(history.getByRole('heading', { name: /^Shards kept: \d/ })).toBeVisible({ timeout: 15_000 });
  await expect(history).toContainText('The shop has closed. What you own stays yours:');
  await expect(history).toContainText(/Rest days held: \d+/);
  await expect(page.locator('.shop-item')).toHaveCount(0);
  // One link from You.
  await page.goto('/#you');
  await page.getByTestId('history-link').click();
  await expect(page).toHaveURL(/#you\/history$/);
});

test('days without a mark spend the rest bank as before, and You shows only its balance', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-07T12:00:00') });
  await page.goto('/#you');
  await seed(page, [fact('2026-11-02', 'tasks', 'done', { plannedSize: 'M', wasPlanned: true }),
    ...['2026-11-06', '2026-11-07'].flatMap(day => [fact(day, 'tasks', 'done', { plannedSize: 'M', wasPlanned: true }), fact(day, 'train', 'session', { xp: 60 }), fact(day, 'mind', 'mystery', { result: 'solved' })])]);
  await expect(page.getByRole('region', { name: 'Your season' })).toContainText('1 rest day banked'); // 4 arrive on 1 Nov, 3 missed days (3-5 Nov) use 3
  await expect(page.getByRole('region', { name: 'Your season' })).not.toContainText('Streak paused');
});

test('task completion shows an XP toast and a skippable level reveal', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-03T12:00:00') });
  await page.goto('/#plan');
  await seed(page, [fact('2026-11-03', 'train', 'session', { xp: 95 })]);
  const add = async (title: string) => {
    await openMore(page);
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill(title);
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: 'Done' }).last().click();
  };
  await add('Write first note');
  // Spec 45c: a real level rise is the level page; Continue closes it and Plan is where it was.
  await expect(page.getByRole('dialog', { name: 'Level 2' })).toContainText('Level 2');
  await page.getByRole('dialog', { name: 'Level 2' }).getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/#plan$/);
  await add('Write second note');
  await expect(page.locator('.economy-toast')).toContainText('+5 XP');
});
