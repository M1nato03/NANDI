import { expect, test, type Page } from '@playwright/test';

// Spec 571 stage 1: Grow's five doors (R8), Remember (M3), Calm & Sleep with bedtime (§0.18 #5), You's door lines
// (§0.18 #7), every feature mounting in one place only (G-E11), and old links landing behind the right door (G7, E7).
const NOON = new Date('2026-11-06T12:00:00');
type Row = readonly [string, unknown];
const putSettings = (page: Page, rows: readonly Row[]) => page.evaluate(async entries => {
  const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
  await new Promise<void>(resolve => {
    const transaction = database.transaction('settings', 'readwrite');
    for (const [key, value] of entries) transaction.objectStore('settings').put({ key, value, updatedAt: 1, deleted: 0, deviceId: 'grow-e2e' });
    transaction.oncomplete = () => resolve();
  });
  database.close();
}, rows);
const settingOf = (page: Page, key: string) => page.evaluate(async name => {
  const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
  const value = await new Promise<unknown>(resolve => { const request = database.transaction('settings').objectStore('settings').get(name); request.onsuccess = () => resolve((request.result as { value?: unknown } | undefined)?.value); });
  database.close();
  return value;
}, key);
const tabs = (page: Page) => page.getByRole('navigation', { name: 'Main tabs' });
const lit = (page: Page) => tabs(page).locator('a[aria-current="page"]');

test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(NOON); });

test('the tab bar reads Yatra · Plan · Grow · You, and each Grow door opens its screen in one tap with Grow lit and Back to Grow', async ({ page }) => {
  await page.goto('/?e2e#yatra');
  await expect(tabs(page).getByRole('link')).toHaveText(['Yatra', 'Plan', 'Grow', 'You']);
  const doors: [testId: string, heading: string, url: RegExp][] = [
    ['door-read', 'Read', /#grow\/read$/], ['door-remember', 'Remember', /#grow\/remember$/], ['door-play', 'Play', /#grow\/play$/],
    ['door-train', 'Train', /#grow\/train$/], ['door-sleep', 'Calm & Sleep', /#grow\/sleep$/],
  ];
  for (const [testId, heading, url] of doors) {
    await tabs(page).getByRole('link', { name: 'Grow' }).click();
    await expect(page.getByRole('heading', { name: 'Grow', exact: true })).toBeVisible();
    await page.getByTestId(testId).click();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await expect(lit(page)).toHaveText('Grow');
    await page.getByRole('button', { name: 'Back to Grow' }).click();
    await expect(page).toHaveURL(/#grow$/);
  }
});

test('picks set the doors: picked ones big and first, the rest small under "Everything else is always there."', async ({ page }) => {
  await page.goto('/?e2e#grow');
  await putSettings(page, [['profile.goals', ['train', 'sleep']], ['profile.size', 'two']]);
  await page.reload();
  const big = page.getByRole('navigation', { name: 'Doors', exact: true }).locator('.grow-door');
  await expect(big).toHaveText([/Train/, /Calm & Sleep/]);
  await expect(page.getByText('Everything else is always there.')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'More doors' }).locator('.grow-door')).toHaveText([/Read/, /Remember/, /Play/]);
  // Nothing is hidden, and every door is a full tap target (E5).
  const boxes = await page.locator('.grow-door').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
  expect(boxes).toHaveLength(5);
  expect(boxes.every(height => height >= 48)).toBe(true);
});

test('each feature mounts in one place only (G-E11); elsewhere it is a link', async ({ page }) => {
  // Moti's card, card reviews, how learning holds and the bedtime settings each have ONE home.
  const homes: Record<string, string> = { 'moti-review': 'grow/remember', 'card-reviews': 'grow/remember', 'learning-holding': 'grow/remember', 'bedtime-settings': 'grow/sleep' };
  const routes = ['yatra', 'plan', 'grow', 'grow/read', 'grow/remember', 'grow/play', 'grow/train', 'grow/sleep', 'grow/calm', 'you', 'you/settings'];
  const found: Record<string, string[]> = Object.fromEntries(Object.keys(homes).map(id => [id, []]));
  for (const route of routes) {
    await page.goto(`/?e2e#${route}`);
    await expect(page.locator('main h1').first()).toBeVisible();
    await page.waitForTimeout(400); // live queries settle
    for (const id of Object.keys(homes)) if (await page.getByTestId(id).count()) found[id]!.push(route);
  }
  expect(found).toEqual(Object.fromEntries(Object.entries(homes).map(([id, home]) => [id, [home]])));
  // The old places keep a way there.
  await page.goto('/?e2e#you/settings');
  await page.getByTestId('bedtime-link').click();
  await expect(page).toHaveURL(/#grow\/sleep$/);
  await page.goto('/?e2e#you');
  await page.getByTestId('door-link-remember').click();
  await expect(page).toHaveURL(/#grow\/remember$/);
});

test('Calm & Sleep keeps the bedtime settings (same keys), and links to Calm and the kolam', async ({ page }) => {
  await page.goto('/?e2e#grow/sleep');
  await expect(page.getByRole('heading', { name: 'Calm & Sleep', exact: true })).toBeVisible();
  await page.getByLabel('Bedtime target').fill('22:45');
  await expect.poll(() => settingOf(page, 'planner.bedtime')).toBe('22:45');
  await page.getByTestId('calm-link').click();
  await expect(page.getByRole('heading', { name: 'Calm', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to Calm & Sleep' })).toBeVisible();
  await expect(lit(page)).toHaveText('Grow');
});

test('old links land behind the right door with Grow lit (G7, E7)', async ({ page }) => {
  const table: [old: string, url: RegExp, heading: string][] = [
    ['read', /#grow\/read$/, 'Read'], ['learn', /#grow\/read$/, 'Read'], ['mind', /#grow\/play$/, 'Play'],
    ['yatra/train', /#grow\/train$/, 'Train'], ['train', /#grow\/train$/, 'Train'], ['yatra/calm', /#grow\/calm$/, 'Calm'],
  ];
  for (const [old, url, heading] of table) {
    await page.goto(`/?e2e#${old}`);
    await expect(page).toHaveURL(url);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await expect(lit(page)).toHaveText('Grow');
  }
  await page.goto('/?e2e#yatra/days');
  await expect(page).toHaveURL(/#you\/days$/);
  await expect(lit(page)).toHaveText('You');
});

test('Read no longer shows Moti; Play no longer shows card reviews; the dot reads Grow (E2: a door is one tap from Grow)', async ({ page }) => {
  await page.goto('/?e2e#grow/read');
  await expect(page.getByRole('heading', { name: 'Read', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Review with Moti' })).toHaveCount(0);
  await page.goto('/?e2e#grow/play');
  await expect(page.getByRole('heading', { name: 'Play', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Card reviews' })).toHaveCount(0);
  await page.goto('/?e2e#grow/remember');
  await expect(page.getByRole('heading', { name: 'Card reviews' })).toBeVisible();
  await expect(page.getByTestId('moti-review')).toBeVisible();
  const dot = page.getByRole('button', { name: /^Grow: / });
  await expect(dot).toBeVisible();
  await dot.click();
  await expect(page).toHaveURL(/#grow$/);
});

/** Buttons in main painted in the area's solid button colour (E1: at most one per screen). */
const filledButtons = (page: Page) => page.evaluate(() => {
  const main = document.getElementById('main')!;
  const probe = document.createElement('div');
  probe.style.background = 'var(--button)';
  main.appendChild(probe);
  const solid = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return [...main.querySelectorAll('button')].filter(button => button.offsetParent && getComputedStyle(button).backgroundColor === solid).map(button => button.textContent?.trim());
});
/** Words of main's text inside the first screen (E3). */
const wordsAboveFold = (page: Page) => page.evaluate(() => {
  const walker = document.createTreeWalker(document.getElementById('main')!, NodeFilter.SHOW_TEXT);
  let words = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || !parent.offsetParent || parent.closest('[aria-hidden="true"]')) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    const box = range.getBoundingClientRect();
    if (box.height && box.top < window.innerHeight) words += (node.textContent ?? '').split(/\s+/).filter(word => /\w/.test(word)).length;
  }
  return words;
});

test('E1, E3, E5 on Grow, Remember and You: one solid button at most, ≤ 25 words above the fold on Grow, 48 px targets', async ({ page }) => {
  for (const route of ['grow', 'grow/remember', 'grow/sleep', 'you']) {
    await page.goto(`/?e2e#${route}`);
    await expect(page.locator('main h1').first()).toBeVisible();
    await page.waitForTimeout(400);
    expect((await filledButtons(page)).length, route).toBeLessThanOrEqual(1);
  }
  await page.goto('/?e2e#grow');
  await expect(page.getByTestId('door-sleep')).toBeVisible();
  expect(await wordsAboveFold(page)).toBeLessThanOrEqual(25);
  await page.goto('/?e2e#you');
  const links = await page.getByRole('navigation', { name: 'Your doors' }).getByRole('button').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
  expect(links).toHaveLength(5);
  expect(links.every(height => height >= 48)).toBe(true);
});
