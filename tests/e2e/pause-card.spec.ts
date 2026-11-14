import { expect, test, type Page } from '@playwright/test';
import { textAt200 } from './helpers/text';

// Spec 39 and 39b, the Pause card. The phone's side (Home, opening the app, the usage log) is the e2e stand-in
// in platform/nightPause.ts: sessionStorage 'nandi.e2ePause' says what the phone reports and logs what NANDI asked.
const NOON = new Date('2026-11-04T12:00:00');
const card = (page: Page) => page.getByRole('dialog', { name: 'Pause card' });
const totalXp = async (page: Page) => {
  await page.goto('/?e2e#you');
  return Number((await page.getByText(/^[\d,]+\sXP in all$/).innerText()).replace(/[^\d]/g, ''));
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
  await expect(page.getByText("If I open Instagram, I’ll … first.")).toBeVisible();
  await page.getByLabel("If I open Instagram, I’ll … first.").fill('do 10 squats');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByLabel('All day until bedtime')).toBeChecked();
  // Spec 39b: the card shows after 10 min a day unless "Every open" is picked.
  await expect(page.getByLabel('Every open')).not.toBeChecked();
  await expect(page.getByLabel('Minutes a day')).toHaveValue('10');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'See it once' }).click();
  await expect(card(page)).toContainText("If I open Instagram, I’ll do 10 squats first.");
  await expect(card(page).getByRole('button', { name: 'Open Instagram anyway' })).toBeVisible();
  await card(page).getByRole('button', { name: 'Not now' }).click();
  await expect(card(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Turn it on' }).click();
  await expect(page.getByRole('heading', { name: 'On', exact: true })).toBeVisible();
  await page.goto('/?e2e#plan');
  await expect(page.getByRole('button', { name: /^Pause card/ })).toContainText('On · Instagram');
});

test('Jenil 14 Nov: the card has three ways; "I did it" comes after Start, pays +2 once, and "Back to NANDI" lands on the Courtyard', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await setUp(page);
  const before = await totalXp(page);
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
  await phoneOpens(page);
  await expect(card(page).getByRole('heading')).toHaveText("If I open Instagram, I’ll do 10 squats first.");
  // Three ways and nothing else: no "I did it" before the 2 minutes, no in-app move, no home or quest link.
  await expect(card(page).getByRole('button')).toHaveText([/^Start the 2\s+minutes$/, 'Open Instagram anyway', 'Not now']);
  await card(page).getByRole('button', { name: /^Start the 2 minutes: / }).click();
  await expect(card(page).getByRole('timer')).toHaveText('2:00');
  await expect(card(page).getByRole('button')).toHaveText(['I did it', 'Open Instagram anyway', 'Not now']);
  await page.clock.fastForward(20_000); // a glass of water takes 20 seconds
  await card(page).getByRole('button', { name: 'I did it' }).click();
  await expect(card(page).getByRole('heading')).toHaveText('Done: Do 10 squats.');
  await expect(card(page).locator('.pause-earned')).toHaveText('+2 XP');
  await expect(card(page).getByRole('button', { name: 'I did it' })).toHaveCount(0);
  await card(page).getByRole('button', { name: 'Back to NANDI' }).click();
  await expect(card(page)).toHaveCount(0);
  await expect(page).toHaveURL(/#courtyard$/);
  expect(await did(page)).toEqual(['clear']);
  expect(await attempts(page)).toEqual(['act_done']);
  await expect.poll(() => totalXp(page)).toBe(before + 2);
});

test('spec 39b: a card on "every open" moves to after 10 min a day once, and Plan says so in one line', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#plan');
  // The app has made its database once Plan shows.
  await expect(page.getByRole('button', { name: /^Pause card/ })).toBeVisible();
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

test('Jenil 14 Nov: "Not now" lands on NANDI\'s Courtyard, pays nothing, and the card stays away after a reload; "Open anyway" opens the app with the 10-minute quiet', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await setUp(page);
  const before = await totalXp(page);
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
  await page.goto('/?e2e#grow');
  await phoneOpens(page);
  await card(page).getByRole('button', { name: 'Not now' }).click();
  await expect(card(page)).toHaveCount(0);
  await expect(page).toHaveURL(/#courtyard$/);
  // b2 14 Nov: focus lands where any new screen puts it, on the Courtyard's heading.
  await expect(page.locator('#main h1')).toHaveText('Courtyard');
  await expect(page.locator('#main h1')).toBeFocused();
  // The pending card is cleared, not the phone's home screen: nothing leaves NANDI.
  expect(await did(page)).toEqual(['clear']);
  await page.reload();
  await page.evaluate(() => window.dispatchEvent(new Event('nandi:night-pause')));
  await expect(page.locator('.courtyard-b')).toBeVisible();
  await expect(card(page)).toHaveCount(0);
  await phoneOpens(page);
  await card(page).getByRole('button', { name: 'Open Instagram anyway' }).click();
  // Spec 54: the setup's quiet time is chosen; a why is optional and skipped here.
  await expect(card(page).getByRole('group', { name: 'How long?' }).getByRole('button', { name: '10 min' })).toHaveAttribute('aria-pressed', 'true');
  await card(page).getByRole('button', { name: 'Open for 10 min' }).click();
  await expect(card(page)).toHaveCount(0);
  expect((await did(page)).at(-1)).toBe('open:com.instagram.android:600000');
  expect(await attempts(page)).toEqual(['backed_out', 'opened_anyway']);
  expect(await totalXp(page)).toBe(before);
});

test('in the 2 minutes the same two ways: "Not now" lands on the Courtyard, "Open anyway" asks how long', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await setUp(page);
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
  await page.goto('/?e2e#grow');
  await phoneOpens(page);
  await card(page).getByRole('button', { name: 'Start the 2 minutes: do 10 squats' }).click();
  await card(page).getByRole('button', { name: 'Not now' }).click();
  await expect(card(page)).toHaveCount(0);
  await expect(page).toHaveURL(/#courtyard$/);
  expect(await attempts(page)).toEqual(['backed_out']);
  await phoneOpens(page);
  await card(page).getByRole('button', { name: 'Start the 2 minutes: do 10 squats' }).click();
  await card(page).getByRole('button', { name: 'Open Instagram anyway' }).click();
  await expect(card(page).getByRole('group', { name: 'How long?' })).toBeVisible();
});

test('a9 14 Nov: when "Not now" can\'t be saved, the card stays with one line and the screen under it doesn\'t move', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await setUp(page);
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
  await page.goto('/?e2e#grow');
  await phoneOpens(page);
  // Every ledger write fails, as a full or broken store would (until the next page load).
  await page.evaluate(() => {
    const store = IDBObjectStore.prototype as unknown as Record<string, unknown>;
    for (const name of ['add', 'put'] as const) {
      const original = store[name] as (this: IDBObjectStore, ...args: unknown[]) => IDBRequest;
      store[name] = function (this: IDBObjectStore, ...args: unknown[]) { if (this.name === 'ledger') throw new DOMException('Test', 'QuotaExceededError'); return original.apply(this, args); };
    }
  });
  await card(page).getByRole('button', { name: 'Not now' }).click();
  await expect(card(page).getByRole('status')).toHaveText('That didn’t work. You can leave NANDI normally.');
  await expect(card(page)).toBeVisible();
  await expect(page).toHaveURL(/#grow$/);
  expect(await did(page)).toEqual([]);
});

test('an older setup with no 2-minute thing: the same three ways, and the picks come after Start', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#plan');
  await expect(page.getByRole('button', { name: /^Pause card/ })).toBeVisible();
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>(resolve => {
      const transaction = database.transaction('settings', 'readwrite');
      for (const [key, value] of [['night.pause.enabled', true], ['night.pause.apps', ['com.instagram.android']], ['night.pause.dayMode', 'open']] as const) transaction.objectStore('settings').put({ key, value, updatedAt: 1, deleted: 0, deviceId: 'e2e' });
      transaction.oncomplete = () => resolve();
    });
    database.close();
  });
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
  await page.reload();
  await phoneOpens(page);
  await expect(card(page).getByRole('button')).toHaveText([/^Start the 2\s+minutes$/, 'Open Instagram anyway', 'Not now']);
  await card(page).getByRole('button', { name: /^Start the 2\s+minutes$/ }).click();
  const picks = card(page).getByRole('group', { name: 'Pick a 2-minute thing' });
  await expect(picks.getByRole('button')).toHaveCount(4);
  await picks.getByRole('button').first().click();
  await expect(card(page).getByRole('timer')).toHaveText('2:00');
  await expect(card(page).getByRole('button', { name: 'I did it' })).toBeVisible();
});

test('E12 at 200% text (b2 14 Nov): every way stays on screen without scrolling; in the 2 minutes only the middle scrolls', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await setUp(page);
  await textAt200(page);
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
  await page.goto('/?e2e#grow');
  await phoneOpens(page);
  for (const name of [/^Start the 2 minutes/, 'Open Instagram anyway', 'Not now']) await expect(card(page).getByRole('button', { name })).toBeInViewport({ ratio: 1 });
  await card(page).getByRole('button', { name: 'Start the 2 minutes: do 10 squats' }).click();
  for (const name of ['I did it', 'Open Instagram anyway', 'Not now']) await expect(card(page).getByRole('button', { name })).toBeInViewport({ ratio: 1 });
  // The plan and the clock are the part that scrolls, inside the slip, which stays within the screen; at 360x800 the
  // 2 minutes at 200% are taller than that, so the middle does scroll there.
  const slipBottom = await page.locator('.pause-slip').evaluate(node => node.getBoundingClientRect().bottom);
  expect(slipBottom).toBeLessThanOrEqual(page.viewportSize()!.height);
  await expect(page.locator('.pause-act .pause-middle')).toHaveCSS('overflow-y', 'auto');
  if (page.viewportSize()!.height <= 800) expect(await page.locator('.pause-act .pause-middle').evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true);
  await card(page).getByRole('button', { name: 'Not now' }).click();
  await expect(card(page)).toHaveCount(0);
  await expect(page).toHaveURL(/#courtyard$/);
});

test('spec 54: "Open anyway" asks how long and why; the chosen time goes to the phone, the why stays private in You', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await setUp(page);
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
  await phoneOpens(page);
  await card(page).getByRole('button', { name: 'Open Instagram anyway' }).click();
  await card(page).getByRole('group', { name: 'How long?' }).getByRole('button', { name: '20 min' }).click();
  await card(page).getByRole('group', { name: /^Why\?/ }).getByRole('button', { name: 'Just scrolling' }).click();
  await card(page).getByRole('button', { name: 'Open for 20 min' }).click();
  await expect(card(page)).toHaveCount(0);
  expect((await did(page)).at(-1)).toBe('open:com.instagram.android:1200000');
  await page.goto('/?e2e#you');
  await expect(page.locator('.you-reasons')).toHaveText('Your reasons this week: 1 just scrolling');
});

test('spec 54: at 200% text the "Open anyway" taps scroll down to Back, and Back returns to the card', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await setUp(page);
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
  await phoneOpens(page);
  await card(page).getByRole('button', { name: 'Open Instagram anyway' }).click();
  await textAt200(page);
  const back = card(page).getByRole('button', { name: 'Back' });
  await back.scrollIntoViewIfNeeded();
  await expect(back).toBeInViewport();
  await back.click();
  await expect(card(page).getByRole('button', { name: 'Open Instagram anyway' })).toBeVisible();
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

test('the old day pause is kept and asks once for a line; until then its card keeps the three ways (the picks come after Start)', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#plan');
  // The app has made its database once Plan shows.
  await expect(page.getByRole('button', { name: /^Pause card/ })).toBeVisible();
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
  // Jenil 14 Nov: no picks on the card itself; they come after Start (the test above).
  await expect(card(page).getByRole('group', { name: 'Pick a 2-minute thing' })).toHaveCount(0);
  await card(page).getByRole('button', { name: 'Open Instagram anyway' }).click();
  await card(page).getByRole('button', { name: 'Open for 10 min' }).click();
  await page.goto('/?e2e#plan/pause');
  await expect(page.getByRole('heading', { name: 'Write your line' })).toBeVisible();
  await page.getByRole('group', { name: 'Quick picks' }).getByRole('button', { name: 'step outside for 2 minutes' }).click();
  await page.getByRole('button', { name: 'Save my line' }).click();
  await expect(page.getByText("If I open Instagram, I’ll step outside for 2 minutes first.")).toBeVisible();
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
  await expect(opens).toContainText('After “Open anyway”None yet');
});

test('a9 14 Nov: the night card at 200% text scrolls; during the breath "Go to Instagram anyway" can be reached, and after it all four ways', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#plan');
  await expect(page.getByRole('button', { name: /^Pause card/ })).toBeVisible();
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>(resolve => {
      const transaction = database.transaction('settings', 'readwrite');
      for (const [key, value] of [['night.pause.enabled', true], ['night.pause.apps', ['com.instagram.android']]] as const) transaction.objectStore('settings').put({ key, value, updatedAt: 1, deleted: 0, deviceId: 'e2e' });
      transaction.oncomplete = () => resolve();
    });
    database.close();
  });
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
  await page.reload();
  await textAt200(page);
  await page.evaluate(() => {
    sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ pendingPackage: 'com.instagram.android', pendingReason: 'night' }));
    window.dispatchEvent(new Event('nandi:night-pause'));
  });
  const night = page.getByRole('dialog', { name: 'Night pause' });
  await expect(night).toBeVisible();
  const anyway = night.getByRole('button', { name: 'Go to Instagram anyway' });
  await anyway.scrollIntoViewIfNeeded();
  await expect(anyway).toBeInViewport();
  await page.clock.runFor(6_000);
  await expect(night.getByRole('timer')).toHaveText('The breath is yours.');
  const ways = night.getByRole('button');
  await expect(ways).toHaveCount(4);
  for (const way of await ways.all()) {
    await way.scrollIntoViewIfNeeded();
    await expect(way).toBeInViewport();
  }
  await night.getByRole('heading', { name: 'Take one breath' }).scrollIntoViewIfNeeded();
  await expect(night.getByRole('heading', { name: 'Take one breath' })).toBeInViewport();
});
