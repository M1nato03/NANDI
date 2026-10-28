import { expect, test, type Page } from '@playwright/test';

// Spec 34 slice 3: the trek by day and the sky by night, on Hampta Pass (content/yatra/hampta-pass.json).
const NOON = new Date('2026-10-28T12:00:00');
const NIGHT = new Date('2026-10-28T23:45:00'); // after the default shutdown, before the 01:30 bedtime
type Kind = 'train' | 'mind' | 'calm';
const row = (kind: Kind, n: number, day = '2026-10-28') => {
  const [mode, k] = kind === 'train' ? ['train', 'session'] : kind === 'mind' ? ['mind', 'board'] : ['calm', 'session'];
  return { id: `yatra-e2e-${kind}-${n}-${day}`, dayKey: day, mode, kind: k, refId: `r${n}`, inputs: {}, updatedAt: new Date(`${day}T09:00:00`).getTime() + n * 60_000, deleted: 0, deviceId: 'e2e' };
};
async function seed(page: Page, facts: ReturnType<typeof row>[], startDay = '2026-10-28') {
  await page.evaluate(async ({ facts, startDay }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(['ledger', 'settings'], 'readwrite');
      for (const fact of facts) transaction.objectStore('ledger').put(fact);
      transaction.objectStore('settings').put({ key: 'yatra.startDay', value: startDay, updatedAt: 1, deleted: 0, deviceId: 'e2e' });
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, { facts, startDay });
  await page.reload(); // raw IndexedDB writes are not seen by Dexie's live queries
}
async function openYatra(page: Page) {
  await page.goto('/?e2e#yatra');
  await expect(async () => {
    const leave = page.getByRole('button', { name: 'Leave night deck' });
    if (await leave.isVisible()) await leave.click();
    await page.evaluate(() => { if (location.hash !== '#yatra') location.hash = '#yatra'; });
    await expect(page.getByRole('heading', { name: 'Yatra', level: 1 })).toBeVisible({ timeout: 1500 });
    // After shutdown the app moves to the night deck once its settings load; stay only once Yatra holds.
    await page.waitForTimeout(800);
    await expect(page.getByRole('heading', { name: 'Yatra', level: 1 })).toBeVisible({ timeout: 100 });
  }).toPass({ timeout: 20_000 });
}
const line = (page: Page) => page.locator('.trek-journey-top strong');

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('a Train, a Mind and a Calm session each walk one stretch and light one star of their colour', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#plan');
  await seed(page, [row('train', 1)]);
  await openYatra(page);
  await expect(page.locator('.trek-head')).toHaveText('Hampta Pass');
  await expect(line(page)).toHaveText('Stretch 1 of 3 to Chika');
  await expect(page.locator('.trek-footprint')).toHaveCount(5);
  await seed(page, [row('train', 1), row('calm', 2)]);
  await expect(line(page)).toHaveText('Stretch 2 of 3 to Chika');
  await expect(page.locator('.trek-rest')).toHaveCount(1);
  // The Mind session opens the leg's landmark gate; its postcard shows once and goes to the journal.
  await seed(page, [row('train', 1), row('calm', 2), row('mind', 3)]);
  await expect(line(page)).toHaveText('At Chika. Next: Balu Ka Ghera');
  const postcard = page.getByRole('dialog', { name: 'Rani Nallah postcard' });
  await expect(postcard).toContainText('The Rani Nallah joins you at Jobra.');
  await postcard.getByRole('button', { name: 'Keep in the journal' }).click();
  await expect(page.locator('.trek-gate.open')).toHaveCount(1);
  await page.getByRole('button', { name: 'Journal · 1' }).click();
  await expect(page.getByRole('article', { name: 'Rani Nallah' })).toContainText('Source: www.indiahikes.com');
  // By night, the three stars hang over Chika in their colours and join into the leg's constellation.
  await page.clock.setSystemTime(NIGHT);
  await page.reload();
  await openYatra(page);
  await expect(page.locator('.trek-scene.is-night')).toBeVisible();
  expect(await page.locator('.trek-star').evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.kind).sort())).toEqual(['calm', 'mind', 'train']);
  await expect(page.locator('.trek-narrative')).toHaveText('Tonight holds 3 stars from your day.');
  await page.getByRole('button', { name: 'The Chika Kite, a constellation. Rename it' }).click();
  const rename = page.getByRole('dialog', { name: 'Name this constellation' });
  await rename.getByLabel('Name').fill('Our kite');
  await rename.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: 'Our kite, a constellation. Rename it' })).toBeVisible();
});

test('reaching a camp ends the day\'s walk; later sessions only light stars there', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#plan');
  await seed(page, [row('train', 1), row('train', 2), row('train', 3), row('calm', 4), row('mind', 5)]);
  await openYatra(page);
  await expect(line(page)).toHaveText('At Chika. Next: Balu Ka Ghera');
  await expect(page.locator('.trek-narrative')).toHaveText('Three stretches, one camp. Tonight, your stars gather overhead.');
  // The Mind session came after camp, so it walked nothing and opened no gate.
  await expect(page.locator('.trek-gate.open')).toHaveCount(0);
});

test('a day with no session is a warm camp day, never a miss', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#plan');
  await seed(page, [row('train', 1, '2026-10-27')], '2026-10-27');
  await openYatra(page);
  await expect(line(page)).toHaveText('Stretch 1 of 3 to Chika');
  await expect(page.locator('.trek-narrative')).toHaveText('The friends are resting by the fire. A session today walks them on.');
  await expect(page.locator('.trek-caption')).toContainText('A day on the trail');
  await expect(page.locator('.trek-fire')).toHaveCount(1);
  await expect(page.locator('main')).not.toContainText(/missed|failed|lost|broke/i);
  // At night with no session the sky is quiet, and the group sits at a trailside fire mid-leg.
  await page.clock.setSystemTime(NIGHT);
  await page.reload();
  await openYatra(page);
  await expect(page.locator('.trek-caption')).toContainText('By a trailside fire');
  await expect(page.locator('.trek-narrative')).toHaveText('The friends rested by the fire today. The trail will be here tomorrow.');
});

test('every place on the trail is drawn at 360 px and nothing sits under the tab bar', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#plan');
  await seed(page, []);
  await openYatra(page);
  await expect(page.locator('.trek-place b')).toHaveText(['Jobra', 'Chika', 'Balu Ka Ghera', 'Hampta Pass', 'Shea Goru', 'Chatru']);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const last = (await page.locator('.trek-actions').boundingBox())!;
  await page.locator('.trek-actions').scrollIntoViewIfNeeded();
  const bar = (await page.getByRole('navigation', { name: 'Main tabs' }).boundingBox())!;
  const actions = (await page.locator('.trek-actions').boundingBox())!;
  expect(actions.y + actions.height).toBeLessThanOrEqual(bar.y + 1);
  expect(last.height).toBeGreaterThan(0);
});

// Item 203: the friends are all in view at the start, stand clear of camp tents mid-leg, and night comes at dusk.
const inside = async (page: Page, selector: string) => {
  const scene = (await page.locator('.trek-scene').boundingBox())!;
  for (const box of await page.locator(selector).evaluateAll(nodes => nodes.map(node => { const rect = node.getBoundingClientRect(); return { x: rect.x, w: rect.width }; }))) {
    expect(box.x).toBeGreaterThanOrEqual(scene.x - 1);
    expect(box.x + box.w).toBeLessThanOrEqual(scene.x + scene.width + 1);
  }
};

test('on day one at Jobra all three friends and the fire are fully in view', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#plan');
  await seed(page, []);
  await openYatra(page);
  await expect(page.locator('.trek-actor')).toHaveCount(3);
  await inside(page, '.trek-actor svg');
  await inside(page, '.trek-fire');
});

test('mid-leg the group stands clear of the camp tent it left', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#plan');
  await seed(page, [row('train', 1), row('train', 2), row('train', 3), row('calm', 1, '2026-10-29')]);
  await page.clock.setSystemTime(new Date('2026-10-29T12:00:00'));
  await openYatra(page);
  await expect(line(page)).toHaveText('Stretch 1 of 3 to Balu Ka Ghera');
  const tents = await page.locator('.trek-tent').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().right));
  const rear = await page.locator('.trek-actor.kachhua svg').evaluate(node => node.getBoundingClientRect().left);
  expect(rear).toBeGreaterThan(tents[1]!); // the Chika tent
});

test("mid-leg the leg's landmark gate stands ahead of the friends, not behind Nandi", async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#plan');
  await seed(page, [row('train', 1), row('train', 2), row('train', 3), row('calm', 1, '2026-10-29')]);
  await page.clock.setSystemTime(new Date('2026-10-29T12:00:00'));
  await openYatra(page);
  await expect(line(page)).toHaveText('Stretch 1 of 3 to Balu Ka Ghera');
  const gate = await page.locator('.trek-gate').nth(1).evaluate(node => node.getBoundingClientRect().left);
  const front = await page.locator('.trek-actor.nandi svg').evaluate(node => node.getBoundingClientRect().right);
  expect(gate).toBeGreaterThan(front);
});

test('the scene turns to night at dusk, before the evening switch, with a warm hour before it', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-28T18:30:00') });
  await page.goto('/?e2e#plan');
  await seed(page, [row('train', 1)]);
  await openYatra(page);
  await expect(page.locator('.trek-scene.is-dusk')).toBeVisible();
  await page.clock.setSystemTime(new Date('2026-10-28T19:30:00'));
  await page.reload();
  await openYatra(page);
  await expect(page.locator('.trek-scene.is-night')).toBeVisible();
  await expect(page.locator('.trek-narrative')).toHaveText('Tonight holds 1 star from your day.');
  await expect(page.getByRole('button', { name: 'Breathe at camp' })).toBeVisible();
});
