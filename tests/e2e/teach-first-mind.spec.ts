import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { deriveEconomy } from '../../src/core/economy/deriveEconomy';
import type { LedgerRow } from '../../src/data/types';
import { walkLesson } from './learn-helpers';

type Option = { id: string; text: string; correct: boolean };
type Item = { id: string; stem: string; type: string; options: Option[]; answer?: unknown };
const pack = JSON.parse(readFileSync('content/topics/topic.psychology.json', 'utf8')) as { body: { modules: { concepts: { id: string; items: Item[] }[] }[] } };
const items = pack.body.modules.flatMap(module => module.concepts).flatMap(concept => concept.items);
const day = '2026-10-22';

async function answerQuestion(page: Page) {
  const stem = await page.locator('.learn-drop h2').innerText();
  const item = items.find(candidate => candidate.stem === stem);
  if (!item) throw new Error(`Unknown item: ${stem}`);
  const tap = (id: string) => page.locator('.learn-drop').getByRole('button', { name: item.options.find(option => option.id === id)!.text, exact: true }).click();
  if (item.type === 'order') for (const id of item.answer as string[]) await tap(id);
  else if (item.type === 'match') for (const pair of item.answer as { left: string; right: string }[]) { await tap(pair.left); await tap(pair.right); }
  else if (item.type === 'estimate') await page.locator('.learn-estimate input[type=range]').fill(String((item.answer as { value: number }).value));
  else await tap(item.options.find(option => option.correct)!.id);
  await page.getByRole('button', { name: /^Check/ }).first().click();
  await expect(page.locator('.learn-feedback')).toBeVisible();
}

const ledger = (page: Page) => page.evaluate(async () => {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('nandi');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const rows = await new Promise<unknown[]>((resolve, reject) => {
    const request = database.transaction('ledger').objectStore('ledger').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return rows;
}) as Promise<LedgerRow[]>;

// Codex engine read (10-22): a new user's teach-first drop has no reviews due, so it ends after the
// lesson (and, before spec 16 §5, its 2 scored answers). Finishing it must still fill the day's Mind slot.
test('a new user finishing a teach-first drop fills the Mind slot', async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.setFixedTime(new Date(2026, 9, 22, 12));
  await page.goto('/?e2e#learn/drop');
  await page.getByRole('button', { name: /Human psychology/ }).click();
  await page.getByRole('button', { name: 'Start my first drop' }).click();
  // Spec 16 §5: the lesson's own questions come back from tomorrow, so the drop may end right after it.
  await walkLesson(page, 'psychology');
  let answered = 0;
  for (; answered < 8 && !(await page.locator('.learn-stop').isVisible()); answered++) {
    await answerQuestion(page);
    await page.locator('.learn-feedback').getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('.learn-feedback')).toHaveCount(0);
  }
  await expect(page.locator('.learn-stop')).toBeVisible();
  expect(answered).toBeLessThan(5);
  await expect.poll(async () => (await ledger(page)).some(row => row.mode === 'gamify' && row.kind === 'learn-drop' && row.refId === day)).toBe(true);
  const today = deriveEconomy(await ledger(page), undefined, [], day).days.find(entry => entry.dayKey === day);
  expect(today).toMatchObject({ mindSlot: true });
});
