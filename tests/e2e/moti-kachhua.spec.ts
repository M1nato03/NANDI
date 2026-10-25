import { expect, test, type Page } from '@playwright/test';

// Spec 26: Moti's haveli and matka, and Kachhua's kolam by the clock.
const readLedger = (page: Page) => page.evaluate(async () => {
  const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const rows = await new Promise<{ id: string; kind: string; refId: string; inputs: Record<string, unknown> }[]>(resolve => { const request = database.transaction('ledger').objectStore('ledger').getAll(); request.onsuccess = () => resolve(request.result); });
  database.close();
  return rows;
});
const seedLedger = (page: Page, rows: Record<string, unknown>[]) => page.evaluate(async facts => {
  const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  await new Promise<void>((resolve, reject) => { const tx = database.transaction('ledger', 'readwrite'); for (const fact of facts) tx.objectStore('ledger').put(fact); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
  database.close();
}, rows);

test("Moti's haveli: a decoy shows its fix and costs nothing, the pieces in order light the diya, and the cap makes it quiet", async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-03T12:00:00'));
  await page.goto('/?e2e&cap=1#learn/haveli-demo');
  const haveli = page.getByRole('region', { name: "Moti's haveli" });
  await expect(haveli.getByRole('region', { name: 'Psychology room' })).toBeVisible();
  await haveli.getByRole('button', { name: 'Habits' }).click();
  await haveli.getByRole('button', { name: 'Give it exactly 21 days, and' }).click();
  await expect(haveli.locator('.haveli-fix')).toContainText('Fix line 1.');
  await expect(haveli.locator('.moti-friend[data-moment="hmm"]')).toBeVisible();
  await expect(haveli.locator('.haveli-slots li.filled')).toHaveCount(0);
  for (const piece of ['Give it weeks, and', 'do not worry about', 'one missed day.']) await haveli.getByRole('button', { name: piece, exact: true }).click();
  await expect(haveli.getByLabel('Habits: lit today')).toBeVisible();
  await expect(haveli).toContainText('The haveli is quiet for today.');
  await expect(haveli.getByRole('button', { name: 'Anchoring' })).toBeDisabled();
  const facts = await readLedger(page);
  expect(facts.filter(row => row.kind === 'card' && row.refId === '2026-11-03:haveli:habits')).toHaveLength(1);
  // Nothing dims: the next day the diya is simply unlit again, never darkened.
  await page.clock.setFixedTime(new Date('2026-11-04T12:00:00'));
  await page.reload();
  await expect(page.getByRole('region', { name: "Moti's haveli" }).getByRole('button', { name: 'Habits' })).toBeEnabled();
});

test("Moti's matka: on Sunday three sealed first guesses from 5-21 days ago, the exact copy, then the stop; not on Saturday", async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-07T12:00:00')); // Saturday
  await page.goto('/?e2e#learn');
  await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeVisible();
  const lesson = (n: number, dayKey: string) => ({ id: `learn-lesson:habits-s${n}`, dayKey, mode: 'learn', kind: 'learn-lesson', refId: `habits-s${n}`, inputs: { hookCorrect: n % 2 === 0, conceptId: 'habits' }, updatedAt: 1, deleted: 0, deviceId: 'e2e' });
  await seedLedger(page, [lesson(1, '2026-10-26'), lesson(2, '2026-10-27'), lesson(3, '2026-10-28'), lesson(4, '2026-11-05')]);
  await page.reload();
  await expect(page.getByRole('button', { name: /^Moti's matka/ })).toHaveCount(0);
  await page.clock.setFixedTime(new Date('2026-11-08T12:00:00')); // Sunday
  await page.reload();
  await page.getByRole('button', { name: "Moti's matka · 3 sealed guesses" }).click();
  const matka = page.getByRole('region', { name: "Moti's matka" });
  for (let i = 0; i < 3; i++) {
    await expect(matka).toContainText('Moti sealed this in the matka before your lesson.');
    await matka.getByRole('button', { name: 'Not sure' }).click();
    await expect(matka.locator('.matka-reveal')).toContainText(/^Fair answer\. Sealed: your first guess (landed|missed)\. Answers this week: done\.$/);
    if (i === 0) await expect(matka).toContainText('Hindsight bias: Fischhoff 1975; Fischhoff & Beyth 1975.');
    await matka.getByRole('button', { name: i < 2 ? 'Next' : 'Done' }).click();
  }
  await expect(matka).toContainText('Matka closed for this week. See you next Sunday.');
  const facts = await readLedger(page);
  expect(facts.filter(row => row.kind === 'matka')).toHaveLength(3);
  expect(facts.filter(row => row.kind === 'card' && row.refId.includes(':matka:'))).toHaveLength(3);
  // The 26-28 Oct facts (11-13 days old) are eligible; the 5 Nov fact (3 days) is not yet.
  expect(facts.filter(row => row.kind === 'matka').map(row => row.inputs.sourceFactId)).not.toContain('learn-lesson:habits-s4');
});

test("Kachhua's kolam: the size follows the clock, Draw it for me completes it, and after bedtime the end is two exact lines", async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-03T12:00:00') });
  await page.goto('/?e2e#kolam');
  await expect(page.getByRole('region', { name: "Tonight's kolam" })).toHaveAttribute('data-size', '5');
  await page.goto('/?e2e#plan');
  await expect(page.getByRole('region', { name: "Tonight's kolam" })).toHaveCount(0);
  await page.clock.setSystemTime(new Date('2026-11-04T02:30:00')); // the night of 3 Nov, after the 01:30 bedtime
  await page.reload();
  await expect(page.getByRole('region', { name: "Tonight's kolam" }).getByRole('button', { name: 'Trace it' })).toBeVisible();
  await page.getByRole('region', { name: "Tonight's kolam" }).getByRole('button', { name: 'Trace it' }).click();
  const kolam = page.getByRole('region', { name: "Tonight's kolam" });
  // The night's kolam was picked at noon and stays the same size all night.
  await expect(kolam).toHaveAttribute('data-size', '5');
  await kolam.getByRole('button', { name: 'Draw it for me' }).click();
  await page.clock.runFor(20_000);
  await expect(kolam).toHaveAttribute('data-done', 'yes');
  await expect(kolam.locator('.kolam-end p')).toHaveText(['The line is complete.', "That's enough for tonight. Put the phone down."]);
  const facts = await readLedger(page);
  expect(facts.filter(row => row.kind === 'kolam')).toHaveLength(1);
});

test('a late first open draws a 3 by 3 kolam; a fast finger only tucks Kachhua in, a slow one draws', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-05T23:30:00') });
  await page.goto('/?e2e#kolam');
  const kolam = page.getByRole('region', { name: "Tonight's kolam" });
  await expect(kolam).toHaveAttribute('data-size', '3');
  const board = kolam.locator('.kolam-board');
  const box = (await board.boundingBox())!;
  // The line starts at its first lattice point; a quick swipe across the board adds nothing.
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.1);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.9, { steps: 2 });
  await page.mouse.up();
  await expect(board).toHaveAttribute('aria-label', /, 0% traced$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
