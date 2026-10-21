import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

type Fact = { id: string; dayKey: string; mode: string; kind: string; refId: string; inputs: Record<string, unknown>; updatedAt: number; deleted: 0; deviceId: string };
const day = '2026-10-20';
const noon = new Date(`${day}T12:00:00`).getTime();
const pack = JSON.parse(readFileSync('content/topics/topic.money-markets.json', 'utf8')) as {
  body: { modules: { concepts: { id: string; items: { stem: string; type: string; options: { id: string; text: string; correct: boolean }[]; answer?: string[] | { left: string; right: string }[] }[] }[] }[] };
};
const concepts = pack.body.modules.flatMap(module => module.concepts);
const fact = (kind: string, refId: string, mode: string, inputs: Record<string, unknown>, index: number): Fact =>
  ({ id: `${kind}:${refId}`, dayKey: day, mode, kind, refId, inputs, updatedAt: noon + index, deleted: 0, deviceId: 'gamify-e2e' });

async function seed(page: Page, rows: Fact[]) {
  await page.evaluate(async facts => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('ledger', 'readwrite');
      for (const row of facts) transaction.objectStore('ledger').put(row);
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, rows);
  await page.reload();
}

async function answerItem(page: Page, wrong = false) {
  const stem = await page.locator('.learn-drop h2').innerText();
  const item = concepts.flatMap(concept => concept.items).find(candidate => candidate.stem === stem);
  if (!item) throw new Error(`Unknown Learn item: ${stem}`);
  const tap = async (id: string) => page.locator('.learn-drop').getByRole('button', { name: item.options.find(option => option.id === id)!.text, exact: true }).click();
  if (item.type === 'order') for (const id of wrong ? [...item.answer as string[]].reverse() : item.answer as string[]) await tap(id);
  else if (item.type === 'match') {
    const pairs = item.answer as { left: string; right: string }[];
    for (const [index, pair] of pairs.entries()) { await tap(pair.left); await tap(wrong ? pairs[(index + 1) % pairs.length]!.right : pair.right); }
  } else if (item.type === 'estimate') {
    const slider = page.locator('.learn-estimate input[type=range]');
    await slider.fill(wrong ? (await slider.getAttribute('max'))! : String((item.answer as unknown as { value: number }).value));
  } else await tap(item.options.find(option => option.correct !== wrong)!.id);
  await page.getByRole('button', { name: /^Check/ }).first().click();
  const next = page.locator('.learn-feedback').getByRole('button', { name: 'Next' });
  await expect(next).toBeEnabled();
  const progress = (await page.locator('.learn-drop-head').innerText()).match(/(\d+) \/ (\d+)/);
  const reveal = page.getByRole('dialog', { name: 'Season progress' });
  if (await reveal.isVisible()) await reveal.getByRole('button', { name: 'Continue' }).click();
  try { await next.click({ timeout: 2500 }); }
  catch (error) {
    if (!await reveal.isVisible()) throw error;
    await reveal.getByRole('button', { name: 'Continue' }).click();
    await next.click();
  }
  if (progress && Number(progress[1]) < Number(progress[2])) await expect(page.locator('.learn-drop-head')).toContainText(`${Number(progress[1]) + 1} / ${progress[2]}`);
}

test('seeded daily quests complete and a badge appears under You', async ({ page }, testInfo) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto('/#you');
  const rows = Array.from({ length: 5 }, (_, index) => fact('learn-answer', `drop:daily:${day}:${index}`, 'mind', { dropId: `drop:daily:${day}`, correct: true, afterBedtime: false }, index));
  rows.push(fact('perfect-drop', day, 'gamify', {}, 6), fact('lightsout', day, 'bonuses', { metTarget: true }, 7));
  await seed(page, rows);
  const quests = page.getByRole('region', { name: 'Daily quests' });
  await expect(quests).toContainText('Daily quests');
  await expect(quests).toContainText('5 / 5');
  await expect(quests).toContainText('Focus boost');
  if (testInfo.project.name === 'mobile-360x800') {
    await quests.screenshot({ path: testInfo.outputPath('quests-light-360.png') });
    await page.emulateMedia({ colorScheme: 'dark' });
    await quests.screenshot({ path: testInfo.outputPath('quests-dark-360.png') });
    await page.emulateMedia({ colorScheme: 'light' });
  }
  await page.getByRole('button', { name: /Badges/ }).click();
  await expect(page.getByRole('heading', { name: 'Badges', exact: true })).toBeVisible();
  await expect(page.locator('.gamify-badges')).toContainText('Questions answered right');
  await expect(page.locator('.gamify-badges')).toContainText('Bronze');
  if (testInfo.project.name === 'mobile-360x800') {
    await page.screenshot({ path: testInfo.outputPath('badges-light-360.png'), fullPage: true });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({ path: testInfo.outputPath('badges-dark-360.png'), fullPage: true });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('combo appears in a drop and the topic trail opens practice', async ({ page }, testInfo) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto('/#learn/drop');
  await page.getByRole('button', { name: /Money and markets/ }).click();
  await page.getByRole('button', { name: 'Start my first drop' }).click();
  await expect(page.locator('.learn-options')).toBeVisible();
  for (let index = 0; index < 3; index++) await answerItem(page);
  await expect(page.locator('.learn-drop-head')).toContainText('3 in a row');
  await page.goto('/#learn');
  const topic = page.locator('.learn-map-topic').filter({ hasText: 'Money and markets' });
  await topic.getByRole('button', { name: /Money and markets/ }).click();
  const trail = page.getByLabel('Money and markets mastery map');
  await expect(trail.locator('.learn-trail-node')).toHaveCount(10);
  await expect(trail.locator('.learn-trail-checkpoint')).toHaveCount(2);
  await expect(trail.locator('.learn-trail-chest')).toBeVisible();
  if (testInfo.project.name === 'mobile-360x800') {
    await trail.screenshot({ path: testInfo.outputPath('trail-light-360.png') });
    await page.emulateMedia({ colorScheme: 'dark' });
    await trail.screenshot({ path: testInfo.outputPath('trail-dark-360.png') });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await trail.getByRole('button', { name: /Practice this idea:/ }).first().click();
  await expect(page.locator('.learn-drop-head')).toContainText('1 / 3');
});

test('a missed Gold review has five items and keeps Mastered state', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto('/#learn');
  await page.evaluate(async at => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('learnConcepts', 'readwrite');
      transaction.objectStore('learnConcepts').put({ id: 'inflation', mastery: 0.97, attempts: 8,
        memory: { stability: 30, difficulty: 5, interval: 30, lastReview: at - 86_400_000, dueAt: at + 86_400_000 },
        activeMisconceptions: [], updatedAt: at, deleted: 0, deviceId: 'gamify-e2e' });
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, noon);
  await page.reload();
  const topic = page.locator('.learn-map-topic').filter({ hasText: 'Money and markets' });
  await topic.getByRole('button', { name: /Money and markets/ }).click();
  const node = topic.locator('.learn-trail-node').first();
  await expect(node).toHaveAttribute('data-state', 'mastered');
  await node.getByRole('button', { name: 'Gold review' }).click();
  await expect(page.locator('.learn-drop-head')).toContainText('1 / 5');
  for (let index = 0; index < 5; index++) {
    await expect(page.locator('.learn-hint')).toHaveCount(0);
    await expect(page.locator('.learn-confidence-chips')).toHaveCount(0);
    await answerItem(page, index >= 3);
  }
  await expect(page.getByRole('heading', { name: 'Gold review complete' })).toBeVisible();
  await expect(page.locator('.learn-drop')).toContainText('Try again tomorrow');
  await page.getByRole('button', { name: 'Continue' }).click();
  const stillMastered = page.locator('.learn-map-topic').filter({ hasText: 'Money and markets' }).locator('.learn-trail-node').first();
  await expect(stillMastered).toHaveAttribute('data-state', 'mastered');
  await expect(stillMastered.getByRole('button', { name: 'Gold review' })).toBeDisabled();
});
