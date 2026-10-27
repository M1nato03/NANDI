import { writeFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

// Spec 35 Calm v1.1: longer sits, three ways to sit, bells, sounds, the wall clock and the dim screen.
const NOON = new Date('2026-10-28T12:00:00');
const MIN = 60_000;

const calmRows = (page: Page) => page.evaluate(async () => {
  const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const rows = await new Promise<{ mode: string; kind: string; inputs: Record<string, unknown> }[]>((resolve, reject) => { const request = database.transaction('ledger').objectStore('ledger').getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  database.close();
  return rows.filter(row => row.mode === 'calm');
});

async function openCalm(page: Page) {
  await page.clock.install({ time: NOON });
  await page.goto('/#yatra/calm');
  await expect(page.getByRole('heading', { name: 'Breathe with Kachhua' })).toBeVisible();
}
/** Picks a length from the chips, or from the Other sheet. */
async function pick(page: Page, length: number | 'open') {
  if (typeof length === 'number' && [3, 5, 10, 20, 30, 60].includes(length)) { await page.getByRole('button', { name: `${length} min`, exact: true }).click(); return; }
  await page.locator('.calm-other').click();
  const sheet = page.getByRole('dialog', { name: 'Other lengths' });
  if (length === 'open') await sheet.getByRole('button', { name: 'Until I stop' }).click();
  else if ([1, 15, 45].includes(length)) await sheet.getByRole('button', { name: `${length} min`, exact: true }).click();
  else { await sheet.getByLabel(/^Custom/).fill(String(length)); await sheet.getByRole('button', { name: `Use ${length} min` }).click(); }
  await expect(sheet).toHaveCount(0);
}
const startButton = (page: Page) => page.locator('.calm-start');
/** A long sit dims the screen: a tap wakes it, then Stop. */
async function stop(page: Page) {
  const dim = page.locator('.calm-dim');
  if (await dim.count()) { await dim.click(); await expect(dim).toHaveCount(0); }
  await page.getByRole('button', { name: 'Stop' }).click();
}
const doneText = (minutes: number) => minutes === 1 ? 'A quiet minute, together.' : `${minutes} quiet minutes, together.`;

test('the setup fits one 360x800 screen: the stage, three rows and Start, with no scroll', async ({ page }) => {
  await openCalm(page);
  const fits = async () => page.evaluate(() => {
    const tabs = document.querySelector('.tabbar')!.getBoundingClientRect().top;
    const parts = ['.calm-stage', '.calm-ways', '.calm-row', '.calm-sounds', '.calm-start'].map(selector => document.querySelector(selector)!.getBoundingClientRect());
    return { scrolled: window.scrollY, inView: parts.every(rect => rect.top >= 0 && rect.bottom <= tabs) };
  });
  expect(await fits()).toEqual({ scrolled: 0, inView: true });
  // The chosen chip stays in view in its sliding row, and the page never scrolls sideways.
  await page.locator('.calm-other').click();
  await page.getByRole('dialog', { name: 'Other lengths' }).getByRole('button', { name: 'Until I stop' }).click();
  await page.getByRole('button', { name: 'Soft noise', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Soft noise', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('.calm-start')).toHaveText('Start, until I stop');
  expect(await fits()).toEqual({ scrolled: 0, inView: true });
  for (const name of ['Other · until I stop', 'Soft noise']) {
    const box = await page.getByRole('button', { name, exact: true }).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('every chip, Custom 1 and 120, and the Other lengths run on the wall clock and end with the done line', async ({ page }) => {
  test.setTimeout(120_000);
  await openCalm(page);
  for (const minutes of [3, 5, 10, 20, 30, 60, 1, 15, 45, 120]) {
    await pick(page, minutes);
    await expect(startButton(page)).toHaveText(`Start ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
    await startButton(page).click();
    await page.clock.fastForward(minutes * MIN - 2_000);
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
    await page.clock.fastForward(3_000);
    await expect(page.locator('.calm-phase')).toHaveText(doneText(minutes));
  }
  const rows = await calmRows(page);
  expect(rows.map(row => row.inputs.minutes)).toEqual([3, 5, 10, 20, 30, 60, 1, 15, 45, 120]);
  // The last choice is remembered.
  await page.reload();
  await expect(startButton(page)).toHaveText('Start 120 minutes');
  await expect(page.locator('.calm-other')).toHaveText('Other · 120 min');
});

test('Until I stop counts up and counts when stopped; under a minute saves nothing; a 30-minute sit walks one stretch', async ({ page }) => {
  await openCalm(page);
  await pick(page, 'open');
  await expect(startButton(page)).toHaveText('Start, until I stop');
  await expect(page.getByText('Keep NANDI open. The sound and bells play here.')).toBeVisible();
  await startButton(page).click();
  await page.clock.fastForward(59_000);
  await stop(page);
  expect(await calmRows(page)).toEqual([]);
  await expect(page.locator('.calm-phase')).not.toHaveText(/together/);
  await startButton(page).click();
  await page.clock.fastForward(2 * MIN + 5_000);
  await expect(page.getByLabel('Time sat')).toHaveText(/^2:(0[5-9]|1\d)$/);
  await stop(page);
  await expect(page.locator('.calm-phase')).toHaveText('2 quiet minutes, together.');
  // Stop at exactly a minute: it counts, as 1.
  await pick(page, 5);
  await page.getByRole('button', { name: 'Quiet', exact: true }).click();
  await startButton(page).click();
  await page.clock.fastForward(MIN);
  await stop(page);
  await expect(page.locator('.calm-phase')).toHaveText('A quiet minute, together.');
  expect((await calmRows(page)).map(row => row.inputs)).toEqual([{ minutes: 2, way: 'paced', in: 4, out: 6 }, { minutes: 1, way: 'quiet' }]);
});

test('a 30-minute sit is one row of 30 minutes, and Yatra moves one stretch for it', async ({ page }) => {
  await openCalm(page);
  await pick(page, 30);
  await page.getByRole('button', { name: 'Scan', exact: true }).click();
  await startButton(page).click();
  await expect(page.locator('.calm-line')).toHaveText('Notice your feet on the floor.');
  await page.clock.fastForward(5 * MIN + 1_000);
  await expect(page.locator('.calm-line')).toHaveText('Let your legs feel heavy.');
  await page.clock.fastForward(25 * MIN);
  await expect(page.locator('.calm-phase')).toHaveText('30 quiet minutes, together.');
  expect((await calmRows(page)).map(row => row.inputs)).toEqual([{ minutes: 30, way: 'scan' }]);
  await page.goto('/#yatra');
  await expect(page.locator('.trek-rail i.filled')).toHaveCount(1);
});

test('interval bells are off by default and ring at 5, 10 and 15 minutes when set', async ({ page }) => {
  await openCalm(page);
  await pick(page, 20);
  await startButton(page).click();
  await page.clock.fastForward(16 * MIN);
  await expect(page.locator('.calm-stage')).toHaveAttribute('data-bells', '0');
  await stop(page);
  for (const [every, at, rung] of [[5, 11, '2'], [10, 11, '1'], [15, 16, '1']] as const) {
    await page.locator('.calm-settings summary').click();
    await page.getByLabel('Interval bell').selectOption(String(every));
    await page.locator('.calm-settings summary').click();
    await startButton(page).click();
    await page.clock.fastForward(every * MIN - 1_000);
    await expect(page.locator('.calm-stage')).toHaveAttribute('data-bells', '0');
    await page.clock.fastForward(at * MIN - every * MIN + 1_000);
    await expect(page.locator('.calm-stage')).toHaveAttribute('data-bells', rung);
    await stop(page);
  }
});

test('the time left is right after the page was hidden for 5 minutes, and an end passed meanwhile finishes on return', async ({ page }) => {
  await openCalm(page);
  await pick(page, 20);
  await startButton(page).click();
  await page.clock.fastForward(2 * MIN);
  const visibility = (state: 'hidden' | 'visible') => page.evaluate(value => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value }); document.dispatchEvent(new Event('visibilitychange')); }, state);
  await visibility('hidden');
  await page.clock.fastForward(5 * MIN);
  await visibility('visible');
  await expect(page.getByLabel('Time left')).toHaveText(/^(12:[45]\d|13:00)$/);
  await visibility('hidden');
  await page.clock.fastForward(14 * MIN);
  await visibility('visible');
  await expect(page.locator('.calm-phase')).toHaveText('20 quiet minutes, together.');
  expect((await calmRows(page)).map(row => row.inputs.minutes)).toEqual([20]);
});

test('the screen dims after 20 seconds without a touch, and a tap wakes it', async ({ page }) => {
  await openCalm(page);
  await pick(page, 10);
  await startButton(page).click();
  await page.clock.fastForward(19_000);
  await expect(page.locator('.calm-dim')).toHaveCount(0);
  await page.clock.fastForward(2_000);
  const dim = page.getByRole('button', { name: 'Wake the screen' });
  await expect(dim).toBeVisible();
  await expect(dim).toContainText(/9:[23]\d/);
  await dim.click();
  await expect(page.locator('.calm-dim')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
});

test('a paced sit of 10 minutes or more fades its guide after 3 minutes', async ({ page }) => {
  await openCalm(page);
  await page.locator('.calm-settings summary').click();
  await pick(page, 5);
  await expect(page.getByLabel(/Let the guide fade/)).toHaveCount(0);
  await pick(page, 10);
  await expect(page.getByLabel(/Let the guide fade/)).toBeChecked();
  await startButton(page).click();
  await page.clock.fastForward(MIN);
  await expect(page.locator('.calm-stage')).toHaveAttribute('data-phase', /in|out/);
  await page.clock.fastForward(2 * MIN + 1_000);
  await expect(page.locator('.calm-phase')).toHaveClass(/faded/);
  await expect(page.locator('.calm-stage')).not.toHaveAttribute('data-phase', /./);
});

/** A short, quiet, valid WAV of about `bytes` bytes. */
function wavFile(bytes: number): Buffer {
  const samples = Math.floor((bytes - 44) / 2), header = Buffer.alloc(44), data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) data.writeInt16LE(Math.round(Math.sin(i / 44_100 * 2 * Math.PI * 220) * 600), i * 2);
  header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8); header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(44_100, 24);
  header.writeUInt32LE(88_200, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

test('Your sound: a file is kept on the phone, plays through an audio element, and is removed; a 51 MB file is refused', async ({ page }, testInfo) => {
  await openCalm(page);
  await expect(page.getByText('Your sounds stay on this phone.')).toHaveCount(0);
  await page.getByLabel('Add your sound').setInputFiles({ name: 'Morning raga.wav', mimeType: 'audio/wav', buffer: wavFile(1024 * 1024) });
  const mine = page.getByRole('button', { name: 'Morning raga', exact: true });
  await expect(mine).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Your sounds stay on this phone.')).toBeVisible();
  await startButton(page).click();
  await expect.poll(() => page.locator('audio.calm-user-audio').evaluate(node => (node as HTMLAudioElement).paused)).toBe(false);
  await stop(page);
  await page.getByRole('button', { name: 'Rename or remove Morning raga' }).click();
  await page.getByRole('dialog', { name: /Your sound/ }).getByRole('button', { name: 'Remove' }).click();
  await expect(mine).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'None', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const big = testInfo.outputPath('Too big.wav');
  await writeFile(big, Buffer.alloc(51 * 1024 * 1024));
  await page.getByLabel('Add your sound').setInputFiles(big);
  await expect(page.getByRole('alert')).toHaveText('This file is over 50 MB.');
  await expect(page.getByRole('button', { name: 'Too big', exact: true })).toHaveCount(0);
  // Not in backups: the backup screen says so.
  await page.goto('/#you/backup');
  await expect(page.getByText('Your own Calm sounds stay on this phone and are not in backups.')).toBeVisible();
});
