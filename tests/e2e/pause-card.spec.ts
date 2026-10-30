import { expect, test, type Page } from '@playwright/test';

// Spec 39 and 39b, the Pause card. The phone's side (Home, opening the app, the usage log) is the e2e stand-in
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
  // Spec 39b: the card shows after 10 min a day unless "Every open" is picked.
  await expect(page.getByLabel('Every open')).not.toBeChecked();
  await expect(page.getByLabel('Minutes a day')).toHaveValue('10');
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

test('spec 39b: "I did it" shows from the start of the act (the clock is a guide), pays +2 once, and the card offers three equal ways on', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await setUp(page);
  const before = await totalXp(page);
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
  await phoneOpens(page);
  await expect(card(page).getByRole('heading')).toHaveText("If I open Instagram, I'll do 10 squats first.");
  for (const name of ['Do it in NANDI', 'Not now', 'Open Instagram anyway']) await expect(card(page).getByRole('button', { name })).toBeVisible();
  await card(page).getByRole('button', { name: 'Do my 2-min thing' }).click();
  await expect(card(page).getByRole('timer')).toHaveText('2:00');
  await expect(card(page).getByRole('button', { name: 'I did it' })).toBeVisible();
  await expect(card(page)).not.toContainText('Done shows when');
  await page.clock.fastForward(20_000); // a glass of water takes 20 seconds
  await card(page).getByRole('button', { name: 'I did it' }).click();
  await expect(card(page)).toContainText('+2 XP · 2 minutes back.');
  await expect(card(page).getByRole('button', { name: 'I did it' })).toHaveCount(0);
  await card(page).getByRole('button', { name: 'Back to my day' }).click();
  expect(await did(page)).toContain('home');
  expect(await attempts(page)).toEqual(['act_done']);
  await expect.poll(() => totalXp(page)).toBe(before + 2);
});

test('spec 39b: "Do it in NANDI" goes to the next move (a task for today, else the Read drop), pays nothing, and is logged', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await setUp(page);
  const before = await totalXp(page);
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
  // Nothing running, no Train programme, no task: today's Read drop.
  await phoneOpens(page);
  await card(page).getByRole('button', { name: 'Do it in NANDI' }).click();
  await expect(card(page)).toHaveCount(0);
  await expect(page).toHaveURL(/#read\/drop$/);
  // A task planned for today: its focus.
  await page.goto('/?e2e#plan/focus');
  await page.getByLabel('Add a task').fill('Email Riya the slides');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.goto('/?e2e#you');
  await phoneOpens(page);
  await card(page).getByRole('button', { name: 'Do it in NANDI' }).click();
  await expect(page).toHaveURL(/#plan\/focus$/);
  await expect(page.getByRole('region', { name: 'Focus task' })).toContainText('Email Riya the slides');
  expect(await attempts(page)).toEqual(['in_app', 'in_app']);
  expect((await did(page)).filter(action => action === 'clear')).toHaveLength(2);
  expect(await totalXp(page)).toBe(before);
});

test('spec 39b: a card on "every open" moves to after 10 min a day once, and Plan says so in one line', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#plan');
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>(resolve => {
      const transaction = database.transaction('settings', 'readwrite');
      for (const [key, value] of [['pause.card.on', true], ['pause.act', 'do 10 squats'], ['night.pause.apps', ['com.instagram.android']], ['night.pause.dayMode', 'open']] as const) transaction.objectStore('settings').put({ key, value, updatedAt: 1, deleted: 0, deviceId: 'e2e' });
      transaction.oncomplete = () => resolve();
    });
    database.close();
  });
  await page.reload();
  await page.getByRole('button', { name: /^Pause card/ }).click();
  await expect(page.locator('.pause-switched')).toContainText('Now shows after 10 min a day. Change it here.');
  await expect(page.locator('.pause-step')).toContainText('after 10 min a day');
  // Changing it to every open is kept, and the note goes.
  await page.getByRole('button', { name: 'Change it here.' }).click();
  await page.getByLabel('Every open').check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Turn it on' }).click();
  await expect(page.getByRole('heading', { name: 'On', exact: true })).toBeVisible();
  await expect(page.locator('.pause-switched')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.pause-step').first()).toContainText('every open');
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
  await expect(opens).toContainText('The week before the card · a day3 opens · 30 min');
  await expect(opens).toContainText('Since the card · a dayAfter your first full day');
  await expect(opens).toContainText('After "Open anyway"None yet');
});
