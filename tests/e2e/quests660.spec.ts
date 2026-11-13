import { expect, test, type Page } from '@playwright/test';
import { textAt200 } from './helpers/text';

// Spec 660 "Quests": the board in the courtyard card's sheet, the collapsed row, one quest start to finish, the
// Reality Check after 3 predicted quests, the safety question and Settings › Quests, Plan's and the Pause card's links.
const NOON = new Date('2026-11-13T12:00:00'); // a Friday
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(NOON); });

async function open(page: Page, route: string, ready: string) {
  await page.goto(`/?e2e#${route}`);
  await page.reload();
  await expect(page.locator(ready).first()).toBeVisible({ timeout: 15_000 });
}
const putSettings = (page: Page, rows: readonly (readonly [string, unknown])[]) => page.evaluate(async entries => {
  const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
  await new Promise<void>(resolve => {
    const tx = database.transaction('settings', 'readwrite');
    for (const [key, value] of entries) tx.objectStore('settings').put({ key, value, updatedAt: 1, deleted: 0, deviceId: 'q-e2e' });
    tx.oncomplete = () => resolve();
  });
  database.close();
}, rows);
/** Skip the one-time safety question (its own test checks it). */
const answered = (page: Page) => putSettings(page, [['quests.safetyAsked', true]]);

/** Every pick and the move in view with no scroll: above the tab bar, never under the pinned footer (spec 40 lesson). */
async function stepInView(page: Page) {
  await expect(page.locator('.quest-actions')).toBeVisible();
  const tabTop = await page.locator('.tabbar').evaluate(node => node.getBoundingClientRect().top);
  const footer = await page.locator('.quest-actions').evaluate(node => { const r = node.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; });
  expect(footer.bottom, 'footer meets the tab bar').toBeGreaterThanOrEqual(tabTop - 2);
  const moves = await page.locator('.quest-actions button').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect()).map(r => ({ top: r.top, bottom: r.bottom })));
  expect(moves.length).toBeGreaterThan(0);
  for (const move of moves) { expect(move.top).toBeGreaterThanOrEqual(0); expect(move.bottom).toBeLessThanOrEqual(tabTop + 1); }
  const picks = await page.locator('.quest-screen .ui-chip').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { label: node.textContent ?? '', top: r.top, bottom: r.bottom }; }));
  // a9 E12: at normal text every pick fits too (no scroll); at 200% only the middle scrolls and the move stays in view.
  const rootPx = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  if (rootPx < 20) for (const pick of picks) { expect(pick.top, pick.label).toBeGreaterThanOrEqual(0); expect(pick.bottom, pick.label).toBeLessThanOrEqual(footer.top + 1); }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

/**
 * b2/a9 12 Nov: an outcome opens the "How did it actually feel?" scale, which Save waits on. It is brought fully into
 * view above the pinned footer, and the disabled Save says why ("Pick how it felt").
 */
async function feltInView(page: Page) {
  await expect(page.getByTestId('quest-why')).toHaveText('Pick how it felt');
  await expect(page.locator('.quest-go')).toBeDisabled();
  await expect.poll(() => page.locator('.quest-felt').evaluate(node => {
    const r = node.getBoundingClientRect(), footer = document.querySelector('.quest-actions')!.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= footer.top + 1;
  }), { message: 'the felt scale is in view above the footer' }).toBe(true);
}

test('the collapsed row offers a quest when nothing is due, and opens its card', async ({ page }) => {
  await open(page, 'courtyard', '.courtyard-card');
  const row = page.locator('.courtyard-card-next .courtyard-card-row[data-kind="quest"]');
  await expect(row).toContainText(/(Mor|Chiku|Moti|Kapi|Nandi|Kachhua) has a quest/);
  await expect(row).toContainText(/\d+\u00a0min/);
  await row.click();
  await expect(page).toHaveURL(/#courtyard\/quest\/[a-z0-9-]+$/);
  await expect(page.getByTestId('quest-screen')).toBeVisible();
  // The next move moved into the sheet: its first section (once the safety question is answered; until then it leads).
  await answered(page);
  await open(page, 'courtyard', '.courtyard-card');
  await page.locator('.courtyard-card-handle').click();
  await expect(page.locator('.courtyard-card-section').first()).toHaveAttribute('data-section', 'move');
  await expect(page.locator('.courtyard-card-section[data-section="move"] .next-move-go')).toBeVisible();
});

test('a due move keeps the row: a running focus shows the next move, not a quest', async ({ page }) => {
  await page.goto('/?e2e#plan/focus');
  await page.getByLabel('Add a task').fill('Write the report');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Start focus' }).click();
  await page.goto('/?e2e#courtyard');
  await expect(page.locator('.courtyard-card')).toBeVisible();
  await expect(page.locator('.courtyard-card-next .next-move-go')).toBeVisible();
  await expect(page.locator('.courtyard-card-next [data-kind="quest"]')).toHaveCount(0);
});

test('the board: the safety question once (all off), 3 quests from 3 friends, swap one, the time filter', async ({ page }) => {
  await open(page, 'courtyard', '.courtyard-card');
  await page.locator('.courtyard-card-handle').click();
  const safety = page.getByTestId('quest-safety');
  await expect(safety).toBeVisible();
  await expect(safety.getByRole('checkbox')).toHaveCount(3);
  // E12 (b2 12 Nov): at 100% the question, all 3 boxes and Save / Not now fit one screen; no box under the pinned row.
  await expect.poll(() => page.evaluate(() => {
    const card = document.querySelector('.courtyard-card')!.getBoundingClientRect();
    const bar = document.querySelector('.quest-safety-actions')!.getBoundingClientRect();
    const rows = [...document.querySelectorAll('.quest-safety h3, .quest-safety-row')].map(node => node.getBoundingClientRect());
    return rows.every(box => box.top >= card.top - 1 && box.bottom <= bar.top + 1) && bar.bottom <= Math.min(card.bottom, innerHeight) + 1;
  })).toBe(true);
  for (const box of await safety.getByRole('checkbox').all()) await expect(box).not.toBeChecked();
  await safety.getByRole('button', { name: 'Not now' }).click();
  await expect(safety).toHaveCount(0);
  const board = page.getByTestId('quest-board');
  const cards = board.locator('.quest-list').first().locator('.quest-card');
  await expect(cards).toHaveCount(3);
  const friends = await cards.locator('.quest-card-meta').allTextContents();
  expect(new Set(friends.map(text => text.split(' · ')[0])).size).toBe(3);
  const first = await cards.first().getAttribute('data-quest');
  await cards.first().getByRole('button', { name: /^Swap/ }).click();
  await expect(board.locator(`.quest-card[data-quest="${first}"]`)).toHaveCount(0);
  await expect(cards).toHaveCount(3);
  await board.getByRole('group', { name: 'Time' }).getByRole('button', { name: '5\u00a0min', exact: true }).click();
  for (const meta of await cards.locator('.quest-card-meta').allTextContents()) expect(meta).toContain('5\u00a0min');
  // Asked once: a reload does not ask again.
  await open(page, 'courtyard', '.courtyard-card');
  await page.locator('.courtyard-card-handle').click();
  await expect(page.getByTestId('quest-board')).toBeVisible();
  await expect(page.getByTestId('quest-safety')).toHaveCount(0);
});

test('one quest start to finish: card → do it → what happened → a stone, and it shows on Plan while taken on', async ({ page }) => {
  await open(page, 'courtyard', '.courtyard-card');
  await answered(page);
  await open(page, 'courtyard/quest/kapi-five-red', '[data-testid="quest-screen"]');
  await expect(page.getByTestId('quest-screen').getByRole('heading', { level: 1 })).toHaveText('Spot 5 red things on your way.');
  await expect(page.getByRole('button', { name: 'Skip, no cost' })).toBeVisible();
  await stepInView(page);
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.locator('[data-step="doing"]')).toBeVisible();
  await open(page, 'plan', '.plan-screen');
  await expect(page.getByTestId('plan-quest-link')).toContainText('Spot 5 red things');
  await page.getByTestId('plan-quest-link').click();
  await expect(page).toHaveURL(/#courtyard\/quest\/kapi-five-red$/);
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'I’m back' }).or(page.getByRole('button', { name: "I'm back" })).click();
  await stepInView(page);
  await page.getByRole('button', { name: 'It went fine' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.quest-finish')).toContainText('Quest done.');
  await open(page, 'you/quests', '.you-quests');
  await expect(page.locator('.quest-stones-count')).toHaveText('1 stone on your path');
  await expect(page.getByTestId('quest-board')).toHaveCount(0);
  await open(page, 'plan', '.plan-screen');
  await expect(page.getByTestId('plan-quest-link')).toHaveCount(0);
});

test('Courage and Speak ask fear and a prediction; after 3 the Reality Check appears with the misses', async ({ page }) => {
  await open(page, 'courtyard', '.courtyard-card');
  await answered(page);
  const play = async (id: string, prediction: string, outcome: string) => {
    await open(page, `courtyard/quest/${id}`, '[data-testid="quest-screen"]');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.locator('[data-step="before"]')).toBeVisible();
    await stepInView(page);
    // A disabled "Go do it" says what it waits for, one question at a time (b2 12 Nov).
    await expect(page.getByTestId('quest-why')).toHaveText('Pick how scary it feels');
    await expect(page.getByRole('button', { name: 'Go do it' })).toBeDisabled();
    await page.getByRole('group', { name: 'How scary does it feel?' }).getByRole('button', { name: '4' }).click();
    await expect(page.getByTestId('quest-why')).toHaveText('Pick what you think will happen');
    await page.getByRole('button', { name: prediction }).click();
    await expect(page.getByTestId('quest-why')).toHaveCount(0);
    await page.getByRole('button', { name: 'Go do it' }).click();
    await page.getByRole('button', { name: /I.m back/ }).click();
    await page.getByRole('button', { name: outcome }).click();
    await feltInView(page);
    if (outcome === 'What I feared happened') await page.getByRole('button', { name: 'Still glad I tried' }).click();
    await page.getByRole('group', { name: 'How did it actually feel?' }).getByRole('button', { name: '2' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.quest-finish')).toBeVisible();
  };
  await play('courage-ask-at-home', 'They’ll ignore me', 'It went fine');
  await open(page, 'you/quests', '.you-quests');
  await expect(page.getByTestId('reality-check')).toHaveCount(0);
  await play('courage-tell-them', 'They’ll ignore me', 'What I feared happened');
  await play('speak-spin-60', 'I’ll freeze', 'Better than I thought');
  await open(page, 'you/quests', '.you-quests');
  await expect(page.getByTestId('reality-check')).toContainText('You predicted “They’ll ignore me” twice. It happened once.');
  await expect(page.getByTestId('reality-check')).toContainText('Your fear before: 4/5. How it actually felt: 2/5.');
});

test('Settings › Quests: three switches, all off on a fresh install; one on lets its kind in', async ({ page }) => {
  await open(page, 'you/quests/settings', '[data-testid="quest-settings"]');
  const switches = page.getByTestId('quest-settings').getByRole('checkbox');
  await expect(switches).toHaveCount(3);
  for (const box of await switches.all()) await expect(box).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'Talking to people I don’t know' }).check();
  await expect(page.getByRole('checkbox', { name: 'Talking to people I don’t know' })).toBeChecked();
  await expect(page.getByText('Quest photos stay on this phone. They are not in backups or shares.')).toBeVisible();
});

test('Plan\'s "+ quest" and the Pause card\'s "Or a 5-min quest?" open the board (5 min)', async ({ page }) => {
  await open(page, 'courtyard', '.courtyard-card');
  await answered(page);
  await open(page, 'plan', '.plan-screen');
  await page.getByTestId('plan-add-quest-link').click();
  await expect(page.getByTestId('quest-board')).toBeVisible();
  await open(page, 'courtyard/quests/5', '[data-testid="quest-board"]');
  await expect(page.getByRole('group', { name: 'Time' }).getByRole('button', { name: '5\u00a0min', exact: true })).toHaveAttribute('aria-pressed', 'true');
  for (const meta of await page.locator('.quest-list').first().locator('.quest-card-meta').allTextContents()) expect(meta).toContain('5\u00a0min');
});

test('E12 at 200%: the quest card and its steps keep the move in view; only the middle scrolls', async ({ page }) => {
  await open(page, 'courtyard', '.courtyard-card');
  await answered(page);
  await open(page, 'courtyard/quest/courage-honest-feedback', '[data-testid="quest-screen"]');
  await textAt200(page);
  await stepInView(page);
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.locator('[data-step="before"]')).toBeVisible();
  await stepInView(page);
  await page.getByRole('group', { name: 'How scary does it feel?' }).getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: 'It’ll be awkward' }).click();
  await page.getByRole('button', { name: 'Go do it' }).click();
  await page.getByRole('button', { name: /I.m back/ }).click();
  await stepInView(page);
  await page.getByRole('button', { name: 'What I feared happened' }).click();
  await feltInView(page);
});
