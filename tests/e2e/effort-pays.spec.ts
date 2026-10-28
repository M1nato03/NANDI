import { expect, test, type Page } from '@playwright/test';

// Spec 36 "Effort pays" + the focus guard. On the phone the guard is NightPauseService; here a test stands in for what
// it would report (sessionStorage 'nandi.e2eGuard': usage access, time in a guarded app, a pause it made).
const NOON = new Date('2026-10-28T12:00:00');
const MIN = 60_000;
const add = async (page: Page, title: string) => {
  await page.getByLabel('Add a task').fill(title);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Today' })).toContainText(title);
};
const focus = (page: Page) => page.getByRole('region', { name: 'Focus' });
/** Start, then wait until the focus is saved and showing, so a jump in time comes after it began. */
const start = async (page: Page, title: string) => {
  await page.getByRole('region', { name: 'Today', exact: true }).locator('.mor-row').filter({ hasText: title }).getByRole('button', { name: 'Start' }).click();
  await expect(focus(page)).toContainText(title);
  await expect(focus(page).locator('.mor-earned, .mor-guard-off')).toBeVisible();
};
const guard = (page: Page, look: Record<string, unknown>) => page.evaluate(value => sessionStorage.setItem('nandi.e2eGuard', JSON.stringify(value)), look);
/** NANDI looks at the guard when it comes back to the front. */
const lookAgain = (page: Page) => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
/** When the open focus began, as the app saved it (a click and the save are a moment apart). */
const focusStart = (page: Page) => page.evaluate(async () => {
  const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const rows = await new Promise<{ startedAt: number; endedAt?: number }[]>(resolve => { const request = database.transaction('focus').objectStore('focus').getAll(); request.onsuccess = () => resolve(request.result); });
  database.close();
  return rows.find(row => row.endedAt == null)!.startedAt;
});
const focusFacts = (page: Page) => page.evaluate(async () => {
  const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const rows = await new Promise<{ kind: string; deleted: number; inputs: Record<string, unknown> }[]>(resolve => { const request = database.transaction('ledger').objectStore('ledger').getAll(); request.onsuccess = () => resolve(request.result); });
  database.close();
  return rows.filter(row => row.kind === 'focus-time' && !row.deleted).map(row => row.inputs);
});

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/#plan');
  await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
});

test('a watched 25-minute focus shows +17 XP so far and the Done line says +17 focus XP', async ({ page }) => {
  await guard(page, { usageAllowed: true });
  await add(page, 'Read chapter 5');
  await start(page, 'Read chapter 5');
  await page.clock.fastForward(25 * MIN + 5_000);
  await lookAgain(page);
  await expect(focus(page).locator('.mor-clock')).toHaveText(/^25:\d\d$/);
  await expect(focus(page).locator('.mor-earned')).toHaveText('+17 XP so far');
  await focus(page).getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('.mor-noted')).toHaveText("Noted: 'Read chapter 5' took 25 minutes · +17 focus XP.");
  const [fact] = await focusFacts(page);
  expect(fact).toMatchObject({ guard: true, blocks: 1, distractedMs: 0 });
  expect(Number(fact!.paidMs)).toBeGreaterThanOrEqual(25 * MIN);
});

test('a guarded app open for 60 seconds pauses the focus as of when it opened, with the app named', async ({ page }) => {
  await guard(page, { usageAllowed: true });
  await add(page, 'Revise notes');
  await start(page, 'Revise notes');
  await expect(focus(page)).toBeVisible();
  const startedAt = await focusStart(page);
  await page.clock.fastForward(8 * MIN);
  // The guard saw Instagram come to the front at 3:00 and stay.
  await guard(page, { usageAllowed: true, pausedAt: startedAt + 3 * MIN, pausedApp: 'com.instagram.android' });
  await lookAgain(page);
  await expect(focus(page)).toContainText('Paused: you opened Instagram');
  await expect(focus(page).locator('.mor-clock')).toHaveText(/^3:0\d$/);
  await expect(focus(page).getByRole('button', { name: 'Resume' })).toBeVisible();
  // The pause is applied once; looking again changes nothing.
  await lookAgain(page);
  await expect(focus(page).locator('.mor-clock')).toHaveText(/^3:0\d$/);
});

test('time in a guarded app never pays, and the visit breaks the clean block', async ({ page }) => {
  await guard(page, { usageAllowed: true });
  await add(page, 'Write the essay');
  await start(page, 'Write the essay');
  await expect(focus(page)).toBeVisible();
  const startedAt = await focusStart(page);
  await page.clock.fastForward(30 * MIN);
  // A 5-minute visit to YouTube, 5 to 10 minutes in: 25 minutes count, and no 25-minute run was clean.
  await guard(page, { usageAllowed: true, distractedMs: 5 * MIN, spans: [[startedAt + 5 * MIN, startedAt + 10 * MIN]] });
  await lookAgain(page);
  await expect(focus(page).locator('.mor-earned')).toHaveText('+12 XP so far');
  await focus(page).getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('.mor-noted')).toHaveText("Noted: 'Write the essay' took 30 minutes · +12 focus XP.");
  const [fact] = await focusFacts(page);
  expect(fact).toMatchObject({ guard: true, blocks: 0, distractedMs: 5 * MIN });
  expect(Math.floor(Number(fact!.paidMs) / MIN)).toBe(25);
});

test('with Usage access off the focus still counts and the task still pays, but focus XP is 0, with a way to turn it on', async ({ page }) => {
  await guard(page, { usageAllowed: false });
  await add(page, 'Clean the desk');
  await start(page, 'Clean the desk');
  await page.clock.fastForward(30 * MIN);
  await lookAgain(page);
  await expect(focus(page).locator('.mor-guard-off')).toContainText("Focus check is off, so minutes don't earn XP.");
  await expect(focus(page).getByRole('button', { name: 'Turn it on' })).toBeVisible();
  await expect(focus(page).locator('.mor-earned')).toHaveCount(0);
  await focus(page).getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('.mor-noted')).toHaveText("Noted: 'Clean the desk' took 30 minutes.");
  await expect.poll(async () => (await focusFacts(page)).length).toBe(1);
  expect((await focusFacts(page))[0]).toMatchObject({ guard: false });
});

test('"Still working?" asks after 60 minutes with no touch, a tap keeps the timer, and no tap for 5 minutes pauses it at the question', async ({ page }) => {
  await guard(page, { usageAllowed: true });
  await add(page, 'Long study block');
  await start(page, 'Long study block');
  await page.clock.fastForward(61 * MIN);
  await expect(focus(page).getByRole('alert')).toContainText('Still working? Tap to keep the timer.');
  await focus(page).getByRole('button', { name: "I'm still working" }).click();
  await expect(focus(page).getByRole('alert')).toHaveCount(0);
  // No tap after the next question: it pauses itself at that question (60 minutes after the tap).
  await page.clock.fastForward(66 * MIN);
  await lookAgain(page);
  await expect(focus(page)).toContainText('Paused: no tap after "Still working?"');
  await expect(focus(page).locator('.mor-clock')).toHaveText(/^121:\d\d$/);
});
