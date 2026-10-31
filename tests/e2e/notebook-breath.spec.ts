import { expect, test, type Page } from '@playwright/test';

// Spec 45a: the square breath before the first page of the day, and the same square in Calm.
const MORNING = new Date('2026-10-31T09:00:00');

async function put(page: Page, rows: [string, unknown][]) {
  await page.evaluate(async entries => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>(resolve => {
      const transaction = database.transaction('settings', 'readwrite');
      for (const [key, value] of entries) transaction.objectStore('settings').put({ key, value, updatedAt: Date.now(), deleted: 0, deviceId: 'e2e' });
      transaction.oncomplete = () => resolve();
    });
    database.close();
  }, rows);
}
async function setting(page: Page, key: string) {
  return page.evaluate(async name => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    const row = await new Promise<{ value: unknown } | undefined>(resolve => { const request = database.transaction('settings').objectStore('settings').get(name); request.onsuccess = () => resolve(request.result as { value: unknown } | undefined); });
    database.close();
    return row?.value ?? null;
  }, key);
}
async function ledgerCount(page: Page) {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    const count = await new Promise<number>(resolve => { const request = database.transaction('ledger').objectStore('ledger').count(); request.onsuccess = () => resolve(request.result); });
    database.close();
    return count;
  });
}
/** A phone that has been through the first run, with these settings; the app is then opened by a link (no breath). */
async function ready(page: Page, rows: [string, unknown][] = []) {
  await page.clock.install({ time: MORNING });
  await page.goto('/?e2e#you');
  await put(page, [['welcome.done', '2026-10-30'], ...rows]);
}
/** A fresh load of `url`, once the app has decided whether this open breathes ('shown' or 'skipped'). */
async function load(page: Page, url: string, decided: 'shown' | 'skipped' = 'skipped') {
  await page.goto(url);
  await page.reload(); // a hash change alone is not a new load
  await expect(page.locator('html')).toHaveAttribute('data-opening-breath', decided);
}
/** An ordinary open: no route in the address, no notification, no widget, no Pause card waiting. */
const open = async (page: Page, decided: 'shown' | 'skipped' = 'shown') => {
  await page.goto('/?e2e');
  await expect(page.locator('html')).toHaveAttribute('data-opening-breath', decided);
};
const breath = (page: Page) => page.getByRole('dialog', { name: 'Breathe with the square.' });
const word = (page: Page) => breath(page).locator('.square-word');
const count = (page: Page) => breath(page).locator('.square-count');

test('an ordinary open breathes first; Skip goes to the page, and it stays away until the next planning day', async ({ page }) => {
  await ready(page);
  const before = await ledgerCount(page);
  await open(page);
  await expect(breath(page)).toBeVisible();
  await expect(breath(page).getByText('Before the first page')).toBeVisible();
  await expect(breath(page).getByText('Follow the dot. Skip anytime.')).toBeVisible();
  await expect(word(page)).toHaveText('Breathe in');
  await expect(count(page)).toHaveText('5');
  await expect(breath(page).getByText('Let your tongue rest on the roof of your mouth.')).toBeVisible();
  await expect(breath(page).getByRole('button', { name: 'Holds: on' })).toBeVisible();
  await page.clock.runFor(2_000);
  await expect(count(page)).toHaveText('3');
  await page.clock.runFor(3_000);
  await expect(word(page)).toHaveText('Hold');
  await page.clock.runFor(5_000);
  await expect(word(page)).toHaveText('Breathe out');
  expect(await setting(page, 'notebook.breath.lastShownDay')).toBe('2026-10-31');
  await breath(page).getByRole('button', { name: 'Skip →' }).click();
  await expect(breath(page)).toHaveCount(0);
  await expect(page.locator('#main h1')).toBeFocused();
  expect(await ledgerCount(page)).toBe(before);
  await open(page, 'skipped');
  await expect(breath(page)).toHaveCount(0);
  // 04:00 starts a new planning day.
  await page.clock.setSystemTime(new Date('2026-11-01T04:01:00'));
  await open(page);
  await expect(breath(page)).toBeVisible();
});

test('two rounds, then One more round for three seconds; pressed, exactly one more round, then the page', async ({ page }) => {
  await ready(page, [['notebook.breath.holds', false]]);
  await open(page);
  await expect(breath(page).getByRole('button', { name: 'Holds: off' })).toBeVisible();
  await page.clock.runFor(5_000);
  await expect(word(page)).toHaveText('Breathe out');
  await expect(count(page)).toHaveText('6');
  await page.clock.runFor(6_000);
  await expect(breath(page).getByText('Let your shoulders drop.')).toBeVisible();
  await page.clock.runFor(11_000);
  const again = breath(page).getByRole('button', { name: 'One more round' });
  await expect(again).toBeVisible();
  await again.click();
  await expect(word(page)).toHaveText('Breathe in');
  await expect(breath(page).getByText('Sit tall, or lean back. Whichever is easier.')).toBeVisible();
  await page.clock.runFor(10_500);
  await expect(word(page)).toHaveText('Breathe out');
  await page.clock.runFor(1_500);
  await expect(breath(page)).toHaveCount(0);
  await expect(page.locator('#main h1')).toBeVisible();
});

test('left alone, the offer passes and the page comes', async ({ page }) => {
  await ready(page, [['notebook.breath.holds', false]]);
  await open(page);
  await expect(breath(page)).toBeVisible();
  await page.clock.runFor(22_000);
  await expect(breath(page).getByRole('button', { name: 'One more round' })).toBeVisible();
  await expect(word(page)).toHaveText('That was two rounds.');
  await page.clock.runFor(3_500);
  await expect(breath(page)).toHaveCount(0);
});

test('Skip works before the first count, in each hold, in the offer and in the extra round', async ({ page }) => {
  await ready(page, [['notebook.breath.opening', 'every']]);
  for (const at of [0, 6_000, 16_000, 41_000, -1]) {
    await open(page);
    await expect(breath(page)).toBeVisible();
    if (at > 0) await page.clock.runFor(at);
    if (at === -1) {
      await page.clock.runFor(41_000);
      await breath(page).getByRole('button', { name: 'One more round' }).click();
      await page.clock.runFor(2_000);
    }
    await breath(page).getByRole('button', { name: 'Skip →' }).click();
    await expect(breath(page)).toHaveCount(0);
  }
});

test('a link, a waiting Pause card, the night route and the first run skip it, and do not use up the day', async ({ page }) => {
  await page.clock.install({ time: MORNING });
  await page.goto('/?e2e#you');
  // The first run is not done yet: no breath.
  await open(page, 'skipped');
  await expect(breath(page)).toHaveCount(0);
  await put(page, [['welcome.done', '2026-10-30']]);
  // A link to a place.
  await load(page, '/?e2e#plan');
  await expect(breath(page)).toHaveCount(0);
  // The phone brought NANDI up for a Pause card.
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ pendingPackage: 'com.instagram.android', pendingReason: 'open' })));
  await open(page, 'skipped');
  await expect(breath(page)).toHaveCount(0);
  await page.evaluate(() => sessionStorage.removeItem('nandi.e2ePause'));
  expect(await setting(page, 'notebook.breath.lastShownDay')).toBeNull();
  // The ordinary open still gets the day's breath.
  await open(page);
  await expect(breath(page)).toBeVisible();
});

test('after bedtime the app opens on the night route without the breath', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-31T23:50:00') });
  await page.goto('/?e2e#you');
  await put(page, [['welcome.done', '2026-10-30']]);
  await open(page, 'skipped');
  await expect(breath(page)).toHaveCount(0);
  expect(await setting(page, 'notebook.breath.lastShownDay')).toBeNull();
});

test('Settings: Off means no breath; Every open brings it back after a minute away', async ({ page }) => {
  await ready(page);
  await page.goto('/?e2e#you/settings');
  const choice = page.getByLabel('Breath when you open NANDI');
  await expect(choice).toHaveValue('daily');
  await choice.selectOption('off');
  await expect.poll(() => setting(page, 'notebook.breath.opening')).toBe('off');
  await open(page, 'skipped');
  await expect(breath(page)).toHaveCount(0);
  await page.goto('/?e2e#you/settings');
  await page.getByLabel('Breath when you open NANDI').selectOption('every');
  await expect.poll(() => setting(page, 'notebook.breath.opening')).toBe('every');
  await open(page);
  await breath(page).getByRole('button', { name: 'Skip →' }).click();
  await expect(breath(page)).toHaveCount(0);
  const away = (state: 'hidden' | 'visible') => page.evaluate(value => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
  await away('hidden');
  await page.clock.runFor(61_000);
  await away('visible');
  await expect(breath(page)).toBeVisible();
  // Hidden while it shows: it is put away, not shown again on return.
  await away('hidden');
  await expect(breath(page)).toHaveCount(0);
  await away('visible');
  await page.clock.runFor(1_500);
  await expect(breath(page)).toHaveCount(0);
});

test('a backup round trip keeps the three settings, so the breath still shows once that day', async ({ page }) => {
  await ready(page, [['notebook.breath.holds', false]]);
  await open(page);
  await expect(breath(page)).toBeVisible();
  await breath(page).getByRole('button', { name: 'Skip →' }).click();
  await page.goto('/?e2e#you');
  type Hook = Window & { __nandiTest?: { backupRoundTrip: () => Promise<unknown> } };
  await page.waitForFunction(() => !!(window as Hook).__nandiTest);
  await page.evaluate(() => (window as Hook).__nandiTest!.backupRoundTrip());
  expect(await setting(page, 'notebook.breath.holds')).toBe(false);
  expect(await setting(page, 'notebook.breath.lastShownDay')).toBe('2026-10-31');
  await open(page, 'skipped');
  await expect(breath(page)).toHaveCount(0);
});

test('reduced motion: the dot and the shell stay still, the words and the darker side still change', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await open(page);
  await expect(breath(page)).toBeVisible();
  const dot = breath(page).locator('.square-dot');
  await expect(dot).toHaveCSS('animation-name', 'none');
  await expect(breath(page).locator('.square-lines path.active')).toHaveAttribute('d', /^M24 24/);
  await page.clock.runFor(5_000);
  await expect(word(page)).toHaveText('Hold');
  await expect(breath(page).locator('.square-lines path.active')).toHaveAttribute('d', /^M196 24/);
  await expect(dot).toHaveCSS('animation-name', 'none');
  await expect(breath(page).getByRole('button', { name: 'Skip →' })).toBeVisible();
});

test('Calm: Square or Slow within Paced; the chosen length still ends the sit, Stop still works, and the pay is the same', async ({ page }) => {
  await ready(page);
  await page.goto('/?e2e#yatra/calm');
  await expect(page.getByRole('button', { name: 'Paced' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Square' }).click();
  await expect(page.getByRole('button', { name: 'Holds: on' })).toBeVisible();
  await page.getByRole('button', { name: /^Other/ }).click();
  await page.getByRole('dialog', { name: 'Other lengths' }).getByRole('button', { name: '1 min' }).click();
  const before = await ledgerCount(page);
  await page.getByRole('button', { name: 'Start 1 minute' }).click();
  const square = page.locator('.calm-square .square-breath');
  await expect(square).toBeVisible();
  await expect(square.locator('.square-word')).toHaveText('Breathe in');
  await page.clock.runFor(5_000);
  await expect(square.locator('.square-word')).toHaveText('Hold');
  await page.clock.runFor(56_000);
  await expect(page.getByRole('button', { name: 'Stop' })).toHaveCount(0);
  await expect.poll(() => ledgerCount(page)).toBe(before + 1);
  const calm = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    const rows = await new Promise<{ mode: string; inputs: { minutes: number; way: string } }[]>(resolve => { const request = database.transaction('ledger').objectStore('ledger').getAll(); request.onsuccess = () => resolve(request.result); });
    database.close();
    return rows.filter(row => row.mode === 'calm').map(row => ({ minutes: row.inputs.minutes, way: row.inputs.way }));
  });
  expect(calm).toEqual([{ minutes: 1, way: 'paced' }]);
  // Stop under a minute saves nothing.
  await page.getByRole('button', { name: 'Start 1 minute' }).click();
  await page.clock.runFor(5_000);
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByRole('button', { name: 'Start 1 minute' })).toBeVisible();
  expect(await ledgerCount(page)).toBe(before + 1);
  // Slow uses the saved in-and-out pattern, without the square.
  await page.getByRole('button', { name: 'Slow' }).click();
  await page.getByRole('button', { name: 'Start 1 minute' }).click();
  await expect(page.locator('.calm-phase')).toHaveText('Breathe in');
  await expect(page.locator('.square-breath')).toHaveCount(0);
  await page.getByRole('button', { name: 'Stop' }).click();
});
