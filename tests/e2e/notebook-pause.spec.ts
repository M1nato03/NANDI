import { expect, test, type Page } from '@playwright/test';
import { textAt200 } from './helpers/text';

// Spec 45c, decision 8: the Pause card is a paper slip. The plan, a quiet "Start the 2 minutes" link into the act, three
// full-width ways of one weight ("I did it", the named in-app move (spec 52 D), "Open <app> anyway") and "Not now" as a small link.
// Routes, ledger outcomes and pay are spec 39b's. The phone's side is the e2e stand-in in platform/nightPause.ts.
const NOON = new Date('2026-11-04T12:00:00');
const slip = (page: Page) => page.getByRole('dialog', { name: 'Pause card' });
const did = (page: Page) => page.evaluate(() => (JSON.parse(sessionStorage.getItem('nandi.e2ePause') ?? '{}') as { did?: string[] }).did ?? []);
const attempts = (page: Page) => page.evaluate(async () => {
  const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
  const rows = await new Promise<{ mode: string; inputs: { outcome: string } }[]>(resolve => { const request = database.transaction('ledger').objectStore('ledger').getAll(); request.onsuccess = () => resolve(request.result); });
  database.close();
  return rows.filter(row => row.mode === 'pause').map(row => row.inputs.outcome);
});
const totalXp = async (page: Page) => {
  await page.goto('/?e2e#you');
  return Number((await page.getByText(/^[\d,]+ XP in all$/).innerText()).replace(/[^\d]/g, ''));
};

/** The card on, Instagram picked, the line "do 10 squats", every open: written as the setup would. */
async function cardOn(page: Page) {
  await page.goto('/?e2e#you');
  await expect(page.getByText(/XP in all$/)).toBeVisible();
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>(resolve => {
      const transaction = database.transaction('settings', 'readwrite');
      for (const [key, value] of [['pause.card.on', true], ['pause.act', 'do 10 squats'], ['night.pause.apps', ['com.instagram.android']], ['night.pause.dayMode', 'open']] as const) transaction.objectStore('settings').put({ key, value, updatedAt: 1, deleted: 0, deviceId: 'e2e' });
      transaction.oncomplete = () => resolve();
    });
    database.close();
    sessionStorage.setItem('nandi.e2ePause', '{}');
  });
  await page.reload();
}
async function phoneOpens(page: Page) {
  await page.evaluate(() => {
    const raw = sessionStorage.getItem('nandi.e2ePause');
    sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ ...(raw ? JSON.parse(raw) : {}), pendingPackage: 'com.instagram.android', pendingReason: 'open' }));
    window.dispatchEvent(new Event('nandi:night-pause'));
  });
  await expect(slip(page)).toBeVisible();
}

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('the slip: the plan, the Start link, three equal full-width ways and a small Not now, each a 44 px target', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.install({ time: NOON });
  await cardOn(page);
  await phoneOpens(page);
  await expect(slip(page).getByRole('heading')).toHaveText("If I open Instagram, I'll do 10 squats first.");
  const ways = slip(page).locator('.pause-ways > button');
  // Spec 52 D: the in-app way names Home's next move (here, the first chapter of the book Continue offers).
  await expect(ways).toHaveText(['I did it', /^Read on: .+, ch\. 1$/, 'Open Instagram anyway']);
  const boxes = await ways.evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { width: Math.round(r.width), height: Math.round(r.height), weight: getComputedStyle(node).fontWeight, size: getComputedStyle(node).fontSize }; }));
  expect(new Set(boxes.map(box => JSON.stringify(box))).size).toBe(1);
  const card = (await slip(page).locator('.pause-card').boundingBox())!;
  expect(boxes[0]!.width).toBeGreaterThan(card.width - 64);
  for (const target of [slip(page).getByRole('button', { name: 'Start the 2 minutes: do 10 squats' }), slip(page).getByRole('button', { name: 'Not now' }), ...await ways.all()]) {
    expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  // At 200% text the slip scrolls; every way is still reachable and nothing is cut at the side.
  await textAt200(page);
  await expect(slip(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // The slip is taller than the phone now: the top is reachable, and so is every way out below.
  await expect(slip(page).locator('.pause-card')).toHaveCSS('font-size', '32px');
  for (const way of [...await ways.all(), slip(page).getByRole('button', { name: 'Not now', exact: true })]) {
    await way.scrollIntoViewIfNeeded();
    await expect(way).toBeInViewport();
  }
  await slip(page).locator('.eyebrow').scrollIntoViewIfNeeded();
  await expect(slip(page).locator('.eyebrow')).toBeInViewport();
});

test('"I did it" on the slip is the act\'s own outcome: act_done, +2 once, then Done', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await cardOn(page);
  const before = await totalXp(page);
  await phoneOpens(page);
  await slip(page).getByRole('button', { name: 'I did it' }).click();
  await expect(slip(page).getByRole('heading')).toHaveText('Done: Do 10 squats.');
  await expect(slip(page).locator('.pause-earned')).toHaveText('+2 XP');
  await expect(slip(page)).not.toContainText(/minutes back|time back/);
  await expect(slip(page).getByRole('button', { name: 'I did it' })).toHaveCount(0);
  await slip(page).getByRole('button', { name: 'Back to my day' }).click();
  expect(await did(page)).toEqual(['clear', 'home']);
  expect(await attempts(page)).toEqual(['act_done']);
  await expect.poll(() => totalXp(page)).toBe(before + 2);
});

test('"Start the 2 minutes" opens the act with "I did it" at once and the clock only a guide', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await cardOn(page);
  await phoneOpens(page);
  await slip(page).getByRole('button', { name: 'Start the 2 minutes: do 10 squats' }).click();
  await expect(slip(page).getByRole('heading')).toHaveText('Do 10 squats');
  await expect(slip(page).getByRole('timer')).toHaveText('2:00');
  await expect(slip(page).getByRole('button', { name: 'I did it' })).toBeVisible();
  await page.clock.fastForward(15_000);
  await slip(page).getByRole('button', { name: 'I did it' }).click();
  await expect(slip(page).getByRole('heading')).toHaveText('Done: Do 10 squats.');
  await expect(slip(page).locator('.pause-earned')).toHaveText('+2 XP');
  expect(await attempts(page)).toEqual(['act_done']);
});

test('the named in-app move goes where Home\'s next move goes; "Open anyway" opens the app; "Not now" goes Home and the app\'s own page stays', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await cardOn(page);
  const before = await totalXp(page);
  await phoneOpens(page);
  await slip(page).getByRole('button', { name: /^Read on: / }).click();
  await expect(slip(page)).toHaveCount(0);
  // Spec 571: the chapter route now sits under Grow.
  await expect(page).toHaveURL(/#grow\/read\/chapter\/psychology\/psychology-ch1$/);
  await page.goto('/?e2e#you');
  await phoneOpens(page);
  await slip(page).getByRole('button', { name: 'Open Instagram anyway' }).click();
  // Spec 54: how long (the setup's 10 min chosen) and an optional why, then open.
  await slip(page).getByRole('button', { name: 'Open for 10 min' }).click();
  await expect(slip(page)).toHaveCount(0);
  expect((await did(page)).at(-1)).toBe('open:com.instagram.android:600000');
  await phoneOpens(page);
  await slip(page).getByRole('button', { name: 'Not now' }).click();
  await expect(slip(page)).toHaveCount(0);
  expect((await did(page)).slice(-2)).toEqual(['clear', 'home']);
  // The page NANDI was on is still the one showing behind.
  await expect(page).toHaveURL(/#you$/);
  expect(await attempts(page)).toEqual(['in_app', 'opened_anyway', 'backed_out']);
  expect(await totalXp(page)).toBe(before);
});

test('a phone that opens NANDI for the slip shows the slip, not the opening breath', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await cardOn(page);
  await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ pendingPackage: 'com.instagram.android', pendingReason: 'open' })));
  await page.goto('/?e2e');
  await expect(slip(page)).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Breathe with the square.' })).toHaveCount(0);
  await expect(slip(page).locator('.pause-ways > button')).toHaveCount(3);
});
