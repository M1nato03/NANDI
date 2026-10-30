import { expect, test, type Page } from '@playwright/test';
import { walkIdea } from './learn-helpers';
import { openMore } from './helpers/plan';



const settingsOf = (page: Page, keys: string[]) => page.evaluate(async names => {
  const open = indexedDB.open('nandi');
  const db = await new Promise<IDBDatabase>(resolve => { open.onsuccess = () => resolve(open.result); });
  const get = (key: string) => new Promise<unknown>(resolve => { const request = db.transaction('settings').objectStore('settings').get(key); request.onsuccess = () => resolve((request.result as { value?: unknown } | undefined)?.value); });
  return Object.fromEntries(await Promise.all(names.map(async key => [key, await get(key)] as const)));
}, keys);

async function hello(page: Page) {
  const welcome = page.getByRole('dialog', { name: 'Welcome to NANDI' });
  await expect(welcome.getByRole('heading', { name: "Hi, I'm Nandi." })).toBeVisible();
  await expect(welcome).toContainText('Your activity is saved on this phone. It leaves only when you back it up or share it.');
  // Spec 18: the 18+ tick is required before anything else.
  await expect(welcome.getByRole('button', { name: "Let's start" })).toBeDisabled();
  await welcome.getByLabel("I'm 18 or older.").check();
  await welcome.getByRole('button', { name: "Let's start" }).click();
  return welcome;
}

test('a fresh install picks one goal and lands in its first lesson, with no topic picker, in under 90 seconds', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00'));
  const started = Date.now();
  await page.goto('/?e2e&welcome');
  const welcome = await hello(page);
  await expect(welcome.getByRole('heading', { name: 'Pick one to try first' })).toBeVisible();
  // One tap chooses and moves on.
  await welcome.getByRole('button', { name: 'Learn something' }).click();
  await expect(welcome).toContainText('From this time, NANDI turns calm');
  await welcome.getByLabel('Bedtime').fill('23:00');
  await welcome.getByRole('button', { name: 'Start your first chapter' }).click();
  await expect(welcome).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'What do you want to get sharp at?' })).toHaveCount(0);
  // Spec 33, spec 41: the first chapter of the first book, read one idea a sitting; the first idea ends on a real stop.
  await expect(page).toHaveURL(/#read\/chapter\/psychology\/psychology-ch1$/);
  await walkIdea(page, 'psychology');
  await expect(page.locator('.idea-end')).toContainText('Idea done');
  expect(Date.now() - started).toBeLessThan(90_000);
  const saved = await settingsOf(page, ['planner.bedtime', 'profile.goals', 'learn.selectedTopics', 'profile.adultConfirmedAt']);
  expect(saved).toMatchObject({ 'planner.bedtime': '23:00', 'profile.goals': ['learn'], 'learn.selectedTopics': ['psychology'] });
  expect(typeof saved['profile.adultConfirmedAt']).toBe('string');
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Welcome to NANDI' })).toHaveCount(0);
});

test("Sharpen my mind opens today's board, and Get fit starts the easy first workout in one tap", async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00'));
  await page.goto('/?e2e&welcome');
  let welcome = await hello(page);
  await welcome.getByRole('button', { name: 'Sharpen my mind' }).click();
  await welcome.getByRole('button', { name: "Try today's puzzle" }).click();
  await expect(page.getByText(/Daily board (#\d+ )?· /)).toBeVisible({ timeout: 30_000 });

  await page.evaluate(() => indexedDB.deleteDatabase('nandi'));
  await page.goto('/?e2e&welcome');
  welcome = await hello(page);
  await welcome.getByRole('button', { name: 'Get fit' }).click();
  await welcome.getByRole('button', { name: 'Start an easy first workout' }).click();
  // Straight into the first workout, on the easiest step of each move: no setup page and no second tap.
  await expect(page).toHaveURL(/#yatra\/train\/workout$/);
  await expect(page.getByText('Current exercise')).toBeVisible();
});

test("Sleep earlier opens tonight's plan; a cancelled restore brings the first run back", async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00'));
  await page.goto('/?e2e&welcome');
  let welcome = page.getByRole('dialog', { name: 'Welcome to NANDI' });
  await welcome.getByRole('button', { name: 'I have a backup to restore' }).click();
  await expect(page).toHaveURL(/#you\/backup$/);
  await page.goto('/?e2e&welcome#plan');
  await page.reload(); // only the hash changed, so load the app again like a new visit
  await expect(page.getByRole('link', { name: 'Privacy notice' })).toHaveAttribute('href', 'privacy.html');
  welcome = await hello(page);
  await welcome.getByRole('button', { name: 'Sleep earlier' }).click();
  await welcome.getByRole('button', { name: 'Plan tonight' }).click();
  await expect(page).toHaveURL(/#you\/tonight$/);
  await expect(page.getByRole('region', { name: 'Night plan setting' })).toBeVisible();
});

test('after bedtime the first run ends on the night routine, whatever was picked', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T23:45:00'));
  await page.goto('/?e2e&welcome');
  const welcome = await hello(page);
  await welcome.getByRole('button', { name: 'Learn something' }).click();
  await welcome.getByLabel('Bedtime').fill('23:00');
  await expect(welcome.getByRole('button', { name: 'Start my night routine' })).toBeVisible();
});

test('someone who already used NANDI never sees the first run', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00'));
  await page.goto('/?e2e#plan');
  await openMore(page);
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Call the bank');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await expect(page.getByText('Call the bank').first()).toBeVisible();
  await page.goto('/?e2e&welcome#plan');
  await expect(page.locator('.plan-screen')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Welcome to NANDI' })).toHaveCount(0);
});
