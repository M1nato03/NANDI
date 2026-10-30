import { expect, test, type Page } from '@playwright/test';

// Spec 39, the Pause card. The phone's side (which app came to the front, Home, opening the app) is the e2e stand-in
// in platform/nightPause.ts: sessionStorage 'nandi.e2ePause' says what the phone reports and logs what NANDI asked.
const NOON = new Date('2026-11-04T12:00:00');
const card = (page: Page) => page.getByRole('dialog', { name: 'Pause card' });
const totalXp = async (page: Page) => {
  await page.goto('/?e2e#you');
  return Number((await page.getByText(/^[\d,]+ XP in all$/).innerText()).replace(/[^\d]/g, ''));
};
async function setUp(page: Page) {
  await page.goto('/?e2e#plan');
  await page.getByRole('button', { name: /^Pause card/ }).click();
  await page.getByLabel('Instagram').check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('group', { name: 'Quick picks' }).getByRole('button', { name: 'do 10 squats' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Turn it on' }).click();
  await expect(page.getByRole('heading', { name: 'On', exact: true })).toBeVisible();
}
/** The phone reports a picked app at the front; NANDI looks, as it does on resume. */
async function phoneOpens(page: Page, packageName = 'com.instagram.android') {
  await page.evaluate(name => {
    const raw = sessionStorage.getItem('nandi.e2ePause');
    sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ ...(raw ? JSON.parse(raw) : {}), pendingPackage: name, pendingReason: 'open' }));
    window.dispatchEvent(new Event('nandi:night-pause'));
  }, packageName);
  await expect(card(page)).toBeVisible();
}
/** The screen goes off or another app opens, then NANDI is back in front; `front` is what the usage log saw meanwhile. */
async function away(page: Page, front: string[]) {
  await page.evaluate(apps => {
    const fake = JSON.parse(sessionStorage.getItem('nandi.e2ePause') ?? '{}');
    sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ ...fake, frontApps: apps }));
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, front);
}
const did = (page: Page) => page.evaluate(() => (JSON.parse(sessionStorage.getItem('nandi.e2ePause') ?? '{}') as { did?: string[] }).did ?? []);
const attempts = (page: Page) => page.evaluate(async () => {
  const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
  const rows = await new Promise<{ mode: string; inputs: { outcome: string } }[]>(resolve => { const request = database.transaction('ledger').objectStore('ledger').getAll(); request.onsuccess = () => resolve(request.result); });
  database.close();
  return rows.filter(row => row.mode === 'pause').map(row => row.inputs.outcome);
});

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('setup: pick apps (nothing ticked), write the line, keep all day, see it once, turn it on; Plan says so', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#plan');
  await expect(page.getByRole('button', { name: /^Pause card/ })).toContainText('Off');
  await page.getByRole('button', { name: /^Pause card/ }).click();
  await expect(page.getByText('Step 1 of 3')).toBeVisible();
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
  await page.getByLabel('Instagram').check();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText("If I open Instagram, I'll … first.")).toBeVisible();
  await page.getByLabel("If I open Instagram, I'll … first.").fill('do 10 squats');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByLabel('All day until bedtime')).toBeChecked();
  await expect(page.getByLabel('Every open')).toBeChecked();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'See it once' }).click();
  await expect(card(page)).toContainText("If I open Instagram, I'll do 10 squats first.");
  await expect(card(page).getByRole('button', { name: 'Open Instagram anyway' })).toBeVisible();
  await card(page).getByRole('button', { name: 'Not now' }).click();
  await expect(card(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Turn it on' }).click();
  await expect(page.getByRole('heading', { name: 'On', exact: true })).toBeVisible();
  await page.goto('/?e2e#plan');
  await expect(page.getByRole('button', { name: /^Pause card/ })).toContainText('On · Instagram');
});

test('the card: do my 2-min thing, Done only when the 2 minutes are up, +2 XP; the phone can go down, but another app stops it', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await setUp(page);
  const before = await totalXp(page);
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
  await phoneOpens(page);
  await expect(card(page)).toContainText('Instagram');
  await expect(card(page)).toContainText('Your plan:');
  await expect(card(page).getByRole('heading')).toHaveText("If I open Instagram, I'll do 10 squats first.");
  // Opening another app mid-act stops it (the phone's usage log says WhatsApp came to the front).
  await card(page).getByRole('button', { name: 'Do my 2-min thing' }).click();
  await away(page, ['com.whatsapp']);
  await expect(card(page)).toContainText('The 2 minutes stopped when another app opened.');
  await expect(card(page).getByRole('button', { name: 'Do my 2-min thing' })).toBeVisible();
  // With the screen off (the phone down for the squats) it keeps counting, and Done shows at 0:00.
  await page.evaluate(() => { const fake = JSON.parse(sessionStorage.getItem('nandi.e2ePause') ?? '{}'); sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ ...fake, frontApps: [] })); });
  await card(page).getByRole('button', { name: 'Do my 2-min thing' }).click();
  await expect(card(page).getByRole('timer')).toHaveText('2:00');
  await expect(card(page)).toContainText('Put the phone down or keep NANDI open; opening another app stops it.');
  await expect(card(page).getByRole('button', { name: 'Done' })).toHaveCount(0);
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.clock.fastForward(121_000);
  // Home pressed, then the phone put down: the home screen is in the log, and it does not stop the act.
  await page.evaluate(() => { const fake = JSON.parse(sessionStorage.getItem('nandi.e2ePause') ?? '{}'); sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ ...fake, launcher: 'com.sec.android.app.launcher' })); });
  await away(page, ['app.nandi.personal', 'com.sec.android.app.launcher', 'com.android.systemui']);
  await expect(card(page).getByRole('timer')).toHaveText('0:00');
  await card(page).getByRole('button', { name: 'Done' }).click();
  await expect(card(page)).toContainText('+2 XP · 2 minutes back.');
  await card(page).getByRole('button', { name: 'Back to my day' }).click();
  expect(await did(page)).toContain('home');
  expect(await attempts(page)).toEqual(['act_done']);
  await expect.poll(() => totalXp(page)).toBe(before + 2);
});

test('"Not now" goes Home and pays nothing; "Open anyway" opens the app with the 10-minute quiet', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await setUp(page);
  const before = await totalXp(page);
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
  await phoneOpens(page);
  await card(page).getByRole('button', { name: 'Not now' }).click();
  await expect(card(page)).toHaveCount(0);
  expect(await did(page)).toEqual(['clear', 'home']);
  await phoneOpens(page);
  await card(page).getByRole('button', { name: 'Open Instagram anyway' }).click();
  await expect(card(page)).toHaveCount(0);
  expect((await did(page)).at(-1)).toBe('open:com.instagram.android:600000');
  expect(await attempts(page)).toEqual(['backed_out', 'opened_anyway']);
  expect(await totalXp(page)).toBe(before);
});

test('off for today from Plan, and on again', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await setUp(page);
  await page.getByRole('button', { name: 'Off for today' }).click();
  await expect(page.getByRole('heading', { name: 'Off for today' })).toBeVisible();
  await page.goto('/?e2e#plan');
  await expect(page.getByRole('button', { name: /^Pause card/ })).toContainText('Off for today');
  await page.getByRole('button', { name: /^Pause card/ }).click();
  await page.getByRole('button', { name: 'On again today' }).click();
  await expect(page.getByRole('heading', { name: 'On', exact: true })).toBeVisible();
});

test('the old day pause is kept and asks once for a line; until then the card offers quick picks', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#plan');
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>(resolve => {
      const transaction = database.transaction('settings', 'readwrite');
      transaction.objectStore('settings').put({ key: 'night.pause.enabled', value: true, updatedAt: 1, deleted: 0, deviceId: 'e2e' });
      transaction.objectStore('settings').put({ key: 'night.pause.dayMode', value: 'open', updatedAt: 1, deleted: 0, deviceId: 'e2e' });
      transaction.oncomplete = () => resolve();
    });
    database.close();
  });
  await page.reload();
  await expect(page.getByRole('button', { name: /^Pause card/ })).toContainText('On ·');
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
  await phoneOpens(page);
  await expect(card(page).getByRole('heading')).toHaveText('Take 2 minutes first.');
  await expect(card(page).getByRole('group', { name: 'Pick a 2-minute thing' }).getByRole('button')).toHaveCount(4);
  await card(page).getByRole('button', { name: 'Open Instagram anyway' }).click();
  await page.goto('/?e2e#plan/pause');
  await expect(page.getByRole('heading', { name: 'Write your line' })).toBeVisible();
  await page.getByRole('group', { name: 'Quick picks' }).getByRole('button', { name: 'step outside for 2 minutes' }).click();
  await page.getByRole('button', { name: 'Save my line' }).click();
  await expect(page.getByText("If I open Instagram, I'll step outside for 2 minutes first.")).toBeVisible();
});

test('the opens log: the week before the card is read at once, and today counts as it goes', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await setUp(page);
  // The phone's usage log: each of the 7 days before, Instagram opened 3 times for 10 minutes; today twice for 5.
  const usage: { type: string; at: number; pkg?: string; cls?: string }[] = [];
  const open = (start: Date, minutes: number) => {
    usage.push({ type: 'fg', at: start.getTime(), pkg: 'com.instagram.android', cls: 'Main' }, { type: 'bg', at: start.getTime() + minutes * 60_000, pkg: 'com.instagram.android', cls: 'Main' });
  };
  for (let back = 8; back >= 1; back -= 1) {
    const day = new Date(NOON); day.setDate(day.getDate() - back);
    usage.push({ type: 'on', at: new Date(day).setHours(20, 0, 0, 0) });
    if (back === 8) continue;
    for (const hour of [9, 13, 18]) open(new Date(new Date(day).setHours(hour, 0, 0, 0)), 10);
  }
  open(new Date(new Date(NOON).setHours(9, 0, 0, 0)), 5);
  open(new Date(new Date(NOON).setHours(10, 0, 0, 0)), 5);
  await page.evaluate(events => sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ usage: events })), usage);
  await page.reload();
  const opens = page.locator('.pause-opens');
  await expect(opens.getByRole('heading', { name: 'Your opens' })).toBeVisible();
  await expect(opens).toContainText('Today so far2 opens · 10 min');
  await expect(opens).toContainText('The week before the card3 opens a day · 30 min a day');
  await expect(opens).toContainText('Last 7 daysAfter your first full day');
});
