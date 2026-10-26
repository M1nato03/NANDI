import { expect, test, type Page } from '@playwright/test';

// Spec 29 (amended 25 Oct): Kapi's shelf holds Mind's own boards. Each type starts with a do-it-yourself how-to the
// first time, Check names a broken rule without red, and the shelf gives a daily board plus two more, then Kapi naps.
// These tests start with no how-to seen (the config marks them seen for every other spec).
test.use({ storageState: { cookies: [], origins: [] } });

// Mon 2 Nov 2026: the featured daily board is Mini Sudoku, so Crowns gets its own date-seeded shelf board.
const monday = new Date('2026-11-02T12:00:00');
const cell = (page: Page, name: RegExp) => page.getByRole('button', { name });
const boardFacts = (page: Page) => page.evaluate(async () => {
  const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const rows = await new Promise<{ kind: string; refId: string; inputs: { daily?: boolean }; updatedAt: number }[]>(resolve => { const request = database.transaction('ledger').objectStore('ledger').getAll(); request.onsuccess = () => resolve(request.result); });
  database.close();
  return rows.filter(row => row.kind === 'board').sort((a, b) => a.updatedAt - b.updatedAt).map(row => row.inputs.daily);
});

test('a first open starts with the how-to: one move per step, Kapi on the square, then the first board; it can be replayed', async ({ page }) => {
  await page.clock.setFixedTime(monday);
  await page.goto('/?e2e#mind');
  const shelf = page.getByRole('region', { name: "Kapi's shelf" });
  await expect(shelf.getByRole('button', { name: /^Crowns/ })).toContainText('Starts with a how-to');
  await shelf.getByRole('button', { name: /^Crowns/ }).click();
  const howto = page.getByRole('region', { name: 'How to play Crowns' });
  await expect(howto).toContainText('Step 1 of 4');
  await expect(howto.locator('.kapi-on-cell')).toBeVisible();
  // A tap anywhere else changes nothing.
  await cell(page, /^Row 3, column 3,/).click();
  await expect(howto).toContainText('Tap the glowing square.');
  await expect(cell(page, /^Row 3, column 3,.*: empty$/)).toBeVisible();
  // Two taps make a crown on the open square.
  await cell(page, /^Row 1, column 5,/).click();
  await cell(page, /^Row 1, column 5,/).click();
  await expect(howto).toContainText('That is it.');
  await howto.getByRole('button', { name: 'Next' }).click();
  for (const [index, name] of [[2, /^Row 2, column 3,/], [3, /^Row 1, column 1,/], [4, /^Row 2, column 3,/]] as const) {
    await expect(howto).toContainText(`Step ${index} of 4`);
    await cell(page, name).click();
    await howto.getByRole('button', { name: index < 4 ? 'Next' : 'Done' }).click();
  }
  await expect(howto).toContainText('the same four rules solve it');
  await howto.getByRole('button', { name: 'Play my first board' }).click();
  await expect(page.getByRole('group', { name: 'Crowns board' })).toBeVisible({ timeout: 30_000 });
  // No timer while playing.
  await expect(page.locator('.mind-timer')).toHaveCount(0);
  // The seen mark is written as the board opens; wait for it before reloading (slow CI runners, 10-25).
  await expect.poll(() => page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    const row = await new Promise<{ value?: unknown } | undefined>(resolve => { const request = database.transaction('settings').objectStore('settings').get('mind.tutorialSeen:crowns'); request.onsuccess = () => resolve(request.result); });
    database.close();
    return row?.value === true;
  })).toBe(true);
  await page.reload();
  await expect(page.getByRole('group', { name: 'Crowns board' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('region', { name: 'How to play Crowns' })).toHaveCount(0);
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  await expect(page.getByRole('region', { name: 'How to play Crowns' })).toContainText('Step 1 of 4');
  await page.getByRole('button', { name: 'Skip how-to' }).click();
  await expect(page.getByRole('group', { name: 'Crowns board' })).toBeVisible({ timeout: 30_000 });
});

test('Skip how-to opens the board at once and is remembered; Check names the broken rule and marks it without red', async ({ page }) => {
  await page.clock.setFixedTime(monday);
  await page.goto('/?e2e#mind/shelf/crowns');
  await page.getByRole('button', { name: 'Skip how-to' }).click();
  const grid = page.getByRole('group', { name: 'Crowns board' });
  await expect(grid).toBeVisible({ timeout: 30_000 });
  // Two crowns in the first row: nothing is marked while playing.
  for (const name of [/^Row 1, column 1,/, /^Row 1, column 3,/]) { await cell(page, name).click(); await cell(page, name).click(); }
  await expect(grid.locator('.conflict')).toHaveCount(0);
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.locator('.kapi-bubble')).toContainText('Two crowns in row 1.');
  // Each marked square says which rule it breaks (Codex B item 105).
  await expect(cell(page, /^Row 1, column 1,.*breaks: Two crowns in row 1\.$/)).toBeVisible();
  await expect(page.locator('.kapi-friend[data-moment="scratch"]')).toBeVisible();
  await expect(grid.locator('.conflict')).toHaveCount(2);
  const [outline, danger] = await grid.locator('.conflict').first().evaluate(node => [getComputedStyle(node).outlineColor, getComputedStyle(document.documentElement).getPropertyValue('--danger')]);
  expect(outline).not.toBe(danger);
  expect(outline).not.toMatch(/rgb\((1[6-9]\d|2\d\d), (\d|[1-6]\d), (\d|[1-6]\d)\)/);
  // The next move clears the marks.
  await cell(page, /^Row 1, column 3,/).click();
  await expect(grid.locator('.conflict')).toHaveCount(0);
  await page.goto('/?e2e#mind');
  await expect(page.getByRole('region', { name: "Kapi's shelf" }).getByRole('button', { name: /^Crowns/ })).not.toContainText('Starts with a how-to');
});

test('the daily board plus two more, then Kapi naps; the first is the daily board fact and the rest are side boards', async ({ page }) => {
  test.setTimeout(120_000);
  await page.clock.setFixedTime(monday);
  await page.goto('/?e2e#mind/shelf/crowns');
  await page.getByRole('button', { name: 'Skip how-to' }).click();
  for (let round = 0; round < 3; round++) {
    await expect(page.getByRole('group', { name: 'Crowns board' })).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => Boolean(window.__nandiMindTest));
    await page.evaluate(() => window.__nandiMindTest!.solveKnownSolution());
    await expect(page.getByLabel('Puzzle result')).toBeVisible();
    await expect(page.locator('.mind-board')).toHaveAttribute('data-save-state', 'saved');
    if (round < 2) await page.getByRole('button', { name: 'Another puzzle' }).click();
  }
  await expect(page.getByLabel('Puzzle result')).toContainText("That's today's puzzles. Kapi's off to nap.");
  await expect(page.getByRole('button', { name: 'Another puzzle' })).toHaveCount(0);
  expect(await boardFacts(page)).toEqual([true, false, false]);
  await page.goto('/?e2e#mind');
  const tile = page.getByRole('region', { name: "Kapi's shelf" }).getByRole('button', { name: /^Crowns/ });
  await expect(tile).toContainText('Done for today');
  await tile.click();
  await expect(page.getByText("That's today's puzzles. Kapi's off to nap.")).toBeVisible();
});

test("Kapi's case starts with its 4-step walkthrough of the grid", async ({ page }) => {
  await page.clock.setFixedTime(monday);
  await page.goto('/?e2e#mind');
  await page.getByRole('button', { name: 'Case Not done' }).click();
  const howto = page.getByRole('region', { name: 'How to play the case' });
  await expect(howto).toContainText('Step 1 of 4');
  await cell(page, /^Asha, key:/).click();
  await cell(page, /^Asha, key:/).click();
  await howto.getByRole('button', { name: 'Next' }).click();
  await cell(page, /^Ravi, lamp:/).click();
  await howto.getByRole('button', { name: 'Next' }).click();
  await cell(page, /^Ravi, book:/).click();
  await cell(page, /^Ravi, book:/).click();
  await howto.getByRole('button', { name: 'Next' }).click();
  await howto.getByRole('group', { name: 'Name the culprit' }).getByRole('button', { name: 'Ravi' }).click();
  await expect(howto).toContainText("Ravi didn't have the lamp.");
  await howto.getByRole('group', { name: 'Name the culprit' }).getByRole('button', { name: 'Meera' }).click();
  await howto.getByRole('button', { name: 'Done' }).click();
  await howto.getByRole('button', { name: "Open today's case" }).click();
  await expect(page.getByText(/^Case of the day/)).toBeVisible({ timeout: 30_000 });
  // No running timer unless pace is on; How to play replays the walkthrough (Codex B item 105).
  await expect(page.locator('.mind-case').getByText(/^Time \d/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Check my grid' }).click();
  await expect(page.getByText('Mark some boxes first, then check.')).toBeVisible();
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  await expect(page.getByRole('region', { name: 'How to play the case' })).toContainText('Step 1 of 4');
  // Skipping a replay goes back to the case, and so does finishing it (Codex B item 106).
  await page.getByRole('button', { name: 'Skip how-to' }).click();
  await expect(page.getByText(/^Case of the day/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  await cell(page, /^Asha, key:/).click(); await cell(page, /^Asha, key:/).click(); await howto.getByRole('button', { name: 'Next' }).click();
  await cell(page, /^Ravi, lamp:/).click(); await howto.getByRole('button', { name: 'Next' }).click();
  await cell(page, /^Ravi, book:/).click(); await cell(page, /^Ravi, book:/).click(); await howto.getByRole('button', { name: 'Next' }).click();
  await howto.getByRole('group', { name: 'Name the culprit' }).getByRole('button', { name: 'Meera' }).click();
  await howto.getByRole('button', { name: 'Done' }).click();
  await howto.getByRole('button', { name: "Open today's case" }).click();
  await expect(page.getByText(/^Case of the day/)).toBeVisible({ timeout: 30_000 });
});

test('the how-to takes each board’s real input: Sun & Moon taps, Sudoku and Calcudoku digits, a Number Path drag', async ({ page }) => {
  test.setTimeout(120_000);
  await page.clock.setFixedTime(monday);
  const next = async (label: 'Next' | 'Done') => page.getByRole('button', { name: label, exact: true }).click();
  // Sun & Moon: a tap cycles empty, sun, moon.
  await page.goto('/?e2e#mind/howto/sunmoon');
  for (const [name, taps, label] of [[/^Row 1, column 3:/, 2, 'Next'], [/^Row 1, column 6:/, 2, 'Next'], [/^Row 3, column 1:/, 2, 'Next'], [/^Row 1, column 2:/, 1, 'Next'], [/^Row 1, column 2:/, 2, 'Done']] as const) {
    for (let tap = 0; tap < taps; tap++) await cell(page, name).click();
    await next(label);
  }
  await expect(page.getByRole('region', { name: 'How to play Sun & Moon' })).toContainText('That is all of Sun & Moon.');
  // Mini Sudoku: pick the square, then the number; a wrong number is not taken.
  await page.goto('/?e2e#mind/howto/sudoku');
  await cell(page, /^Row 1, column 4:/).click();
  await page.locator('.mind-pad').getByRole('button', { name: '3', exact: true }).click();
  await expect(page.getByText('Not that number. Look at the rule again.')).toBeVisible();
  await expect(cell(page, /^Row 1, column 4: empty/)).toBeVisible();
  await page.locator('.mind-pad').getByRole('button', { name: '4', exact: true }).click();
  await next('Next');
  for (const [name, label] of [[/^Row 4, column 1:/, 'Next'], [/^Row 2, column 2:/, 'Done']] as const) {
    await cell(page, name).click();
    await page.locator('.mind-pad').getByRole('button', { name: '4', exact: true }).click();
    await next(label);
  }
  await expect(page.getByRole('region', { name: 'How to play Mini Sudoku' })).toContainText('Your board is 6 by 6');
  // Calcudoku: the same digits, with the groups' sums and products.
  await page.goto('/?e2e#mind/howto/calc');
  for (const [name, digit, label] of [[/^Row 1, column 3:/, '3', 'Next'], [/^Row 3, column 1:/, '3', 'Next'], [/^Row 2, column 1:/, '2', 'Next'], [/^Row 1, column 3:/, '3', 'Next'], [/^Row 2, column 3:/, '1', 'Done']] as const) {
    await cell(page, name).click();
    await page.locator('.mind-pad').getByRole('button', { name: digit, exact: true }).click();
    await next(label);
  }
  await expect(page.getByRole('region', { name: 'How to play Calcudoku' })).toContainText('That is all of Calcudoku.');
  // Number Path: a tap starts on 1, then a drag carries the line one square.
  await page.goto('/?e2e#mind/howto/path');
  await cell(page, /^Row 1, column 1, number 1/).click();
  await next('Next');
  const from = (await cell(page, /^Row 1, column 1, number 1/).boundingBox())!, to = (await cell(page, /^Row 1, column 2/).boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByRole('region', { name: 'How to play Number Path' })).toContainText('That is it.');
  await next('Next');
  for (const [name, label] of [[/^Row 1, column 3, number 2/, 'Next'], [/^Row 2, column 3/, 'Next'], [/^Row 3, column 3, number 3/, 'Done']] as const) {
    await cell(page, name).click();
    await next(label);
  }
  await expect(page.getByRole('region', { name: 'How to play Number Path' })).toContainText('That is all of Number Path.');
});

test('the largest boards fit 360 px with 20 px text, cells at least 36 px; Kapi stays still under reduced motion', async ({ page }, testInfo) => {
  test.setTimeout(150_000);
  test.skip(testInfo.project.name !== 'mobile-360x800', 'The narrow phone is the hard case');
  await page.clock.setFixedTime(monday);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?e2e#mind');
  await expect(page.locator('.kapi-friend[data-moment="swing"]')).toHaveCSS('animation-name', 'none');
  for (const [type, group] of [['crowns', 'Crowns board'], ['sudoku', 'Mini Sudoku board'], ['calc', 'Calcudoku board'], ['sunmoon', 'Sun and Moon board'], ['path', 'Number Path board']] as const) {
    await page.goto(`/?e2e#mind/board/${type}/hard`);
    await page.reload();
    await page.getByRole('button', { name: 'Skip how-to' }).click();
    await expect(page.locator('.mind-tutorial')).toHaveCount(0);
    await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
    const board = page.getByRole('group', { name: group });
    await expect(board).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => Math.min(...await board.getByRole('button').evaluateAll(nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return Math.min(box.width, box.height); }))), { message: type }).toBeGreaterThanOrEqual(36);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), type).toBe(true);
  }
});
