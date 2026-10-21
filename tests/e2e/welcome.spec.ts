import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { walkLesson } from './learn-helpers';

type Item = { stem: string; type: string; options: { id: string; text: string; correct: boolean }[]; answer?: unknown };
const pack = JSON.parse(readFileSync('content/topics/topic.money-markets.json', 'utf8')) as { body: { modules: { concepts: { items: Item[] }[] }[] } };
const items = pack.body.modules.flatMap(module => module.concepts.flatMap(concept => concept.items));

async function answerRight(page: Page) {
  const stem = await page.locator('.learn-drop h2').innerText();
  const item = items.find(row => row.stem === stem);
  if (!item) throw new Error(`Unknown item: ${stem}`);
  const tap = (id: string) => page.locator('.learn-drop').getByRole('button', { name: item.options.find(option => option.id === id)!.text, exact: true }).click();
  if (item.type === 'order') for (const id of item.answer as string[]) await tap(id);
  else if (item.type === 'match') for (const pair of item.answer as { left: string; right: string }[]) { await tap(pair.left); await tap(pair.right); }
  else if (item.type === 'estimate') {
    const value = (item.answer as { value: number }).value;
    await page.locator('.learn-estimate input[type=range]').fill(String(value));
  } else await tap(item.options.find(option => option.correct)!.id);
  await page.getByRole('button', { name: /^Check/ }).first().click();
  await expect(page.locator('.learn-feedback').getByRole('button', { name: 'Next' })).toBeEnabled();
  await page.locator('.learn-feedback').getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('.learn-feedback')).toHaveCount(0);
}

test('a fresh install reaches its first finished drop in under 90 seconds', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00'));
  const started = Date.now();
  await page.goto('/?e2e&welcome');
  const welcome = page.getByRole('dialog', { name: 'Welcome to NANDI' });
  await expect(welcome.getByRole('heading', { name: "Hi, I'm Nandi." })).toBeVisible();
  await welcome.getByRole('button', { name: "Let's start" }).click();
  await welcome.getByRole('button', { name: 'Learn something' }).click();
  await welcome.getByRole('button', { name: 'Sleep earlier' }).click();
  await welcome.getByRole('button', { name: 'Get fit' }).click();
  // A third pick replaces the oldest one.
  await expect(welcome.getByRole('button', { name: 'Learn something' })).toHaveAttribute('aria-pressed', 'false');
  await welcome.getByRole('button', { name: 'Learn something' }).click();
  await expect(welcome.getByRole('button', { name: 'Sleep earlier' })).toHaveAttribute('aria-pressed', 'false');
  await welcome.getByRole('button', { name: 'Next' }).click();
  await welcome.getByLabel('Bedtime').fill('23:00');
  await welcome.getByRole('button', { name: 'Start a 2-minute drop' }).click();
  await expect(welcome).toHaveCount(0);
  const drop = page.locator('.learn-drop');
  await expect(drop.getByRole('heading', { name: 'What do you want to get sharp at?' })).toBeVisible();
  await drop.getByRole('button', { name: /Money and markets/ }).click();
  await drop.getByRole('button', { name: 'Start my first drop' }).click();
  // Spec 14: a new learner's first drop opens with a short lesson, then that idea's own questions.
  await walkLesson(page, 'money-markets');
  for (let i = 0; i < 6 && !(await page.locator('.learn-stop').isVisible()); i++) await answerRight(page);
  await expect(page.getByRole('heading', { name: "That's today's drop" })).toBeVisible();
  expect(Date.now() - started).toBeLessThan(90_000);
  const saved = await page.evaluate(async () => {
    const open = indexedDB.open('nandi');
    const db = await new Promise<IDBDatabase>(resolve => { open.onsuccess = () => resolve(open.result); });
    const get = (key: string) => new Promise<unknown>(resolve => { const request = db.transaction('settings').objectStore('settings').get(key); request.onsuccess = () => resolve((request.result as { value?: unknown } | undefined)?.value); });
    return { bedtime: await get('planner.bedtime'), goals: await get('profile.goals') };
  });
  expect(saved).toEqual({ bedtime: '23:00', goals: ['train', 'learn'] });
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Welcome to NANDI' })).toHaveCount(0);
});

test('someone who already used NANDI never sees the first run', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00'));
  await page.goto('/?e2e#plan');
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Call the bank');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await expect(page.getByText('Call the bank').first()).toBeVisible();
  await page.goto('/?e2e&welcome#plan');
  await expect(page.locator('.plan-screen')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Welcome to NANDI' })).toHaveCount(0);
});
