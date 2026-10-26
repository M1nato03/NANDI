import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { openIdeas, seedTaughtTopics } from './learn-helpers';

const pack = JSON.parse(readFileSync('content/topics/topic.money-markets.json', 'utf8')) as {
  body: { modules: { concepts: { id: string; rule: string; steps?: unknown[]; items: { stem: string; type: string; options: { id: string; text: string; feedback: string; correct: boolean }[]; answer?: string[] | { left: string; right: string }[] }[] }[] }[] };
};
const concepts = pack.body.modules.flatMap(module => module.concepts);

async function answerItem(page: Page, wrong: boolean, advance = true) {
  const stem = await page.locator('.learn-drop h2').innerText();
  const concept = concepts.find(row => row.items.some(item => item.stem === stem));
  const item = concept?.items.find(row => row.stem === stem);
  if (!item || !concept) throw new Error(`Unknown item: ${stem}`);
  const tap = async (id: string) => page.locator('.learn-drop').getByRole('button', { name: item.options.find(option => option.id === id)!.text, exact: true }).click();
  if (item.type === 'order') {
    const ids = item.answer as string[];
    for (const id of wrong ? [...ids].reverse() : ids) await tap(id);
  } else if (item.type === 'match') {
    // Each pair once (the pack lists it both ways); a miss pairs each term with the next pair's partner.
    const pairs = (item.answer as { left: string; right: string }[]).filter((pair, index, all) => !all.slice(0, index).some(seen => seen.left === pair.right && seen.right === pair.left));
    for (const [index, pair] of pairs.entries()) { await tap(pair.left); await tap(wrong ? pairs[(index + 1) % pairs.length]!.right : pair.right); }
  } else if (item.type === 'estimate') {
    // Drag-to-guess: the right value, or the top end of the slider for a miss.
    const slider = page.locator('.learn-estimate input[type=range]');
    await slider.fill(wrong ? (await slider.getAttribute('max'))! : String((item.answer as unknown as { value: number }).value));
  } else {
    const option = item.options.find(row => row.correct !== wrong);
    if (!option) throw new Error('No matching option');
    await tap(option.id);
  }
  await page.getByRole('button', { name: /^Check/ }).first().click();
  const feedback = page.locator('.learn-feedback');
  await expect(feedback).toBeVisible();
  // A taught idea (spec 14) offers "See the idea again" instead of the one-line rule.
  if (!concept.steps) await expect(feedback).toContainText(concept.rule);
  if (item.type !== 'order' && item.type !== 'match') await expect(feedback).toContainText(item.options.find(option => item.type === 'estimate' ? option.correct : option.correct !== wrong)!.feedback);
  // The answer is saved after the feedback appears; Next turns on once the save finished.
  await expect(feedback.getByRole('button', { name: 'Next' })).toBeEnabled();
  if (advance) {
    const number = Number((await page.locator('.learn-drop-head').innerText()).match(/(\d+) \/ 5/)?.[1]);
    await feedback.getByRole('button', { name: 'Next' }).click();
    if (number < 5) await expect(page.locator('.learn-drop-head')).toContainText(`${number + 1} / 5`);
    else await expect(page.getByRole('heading', { name: "That's today's drop" })).toBeVisible();
  }
}

test('topic pick, daily drop, resume and mastery map', async ({ page }, testInfo) => {
  await page.clock.setFixedTime(new Date('2026-10-16T12:00:00'));
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/?e2e#learn/drop');
  await seedTaughtTopics(page, ['money-markets']);
  await page.reload();
  const learnCard = page.locator('.learn-drop');
  await expect(learnCard.getByRole('heading', { name: 'What do you want to get sharp at?' })).toBeVisible();
  await learnCard.getByRole('button', { name: /Money and markets/ }).click();
  await learnCard.getByRole('button', { name: 'Start my first drop' }).click();
  await expect(learnCard.locator('.learn-options')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('learn-item-390x844.png') });
  await answerItem(page, false, false);
  await page.reload();
  await expect(page.locator('.learn-feedback')).toContainText('Exactly.');
  await page.locator('.learn-feedback').getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('.learn-drop-head')).toContainText('2 / 5');
  await answerItem(page, true);
  const thirdStem = await learnCard.locator('h2').innerText();
  await page.reload();
  await expect(learnCard.locator('h2')).toHaveText(thirdStem);
  for (let i = 0; i < 3; i++) await answerItem(page, false);
  await expect(learnCard.getByRole('heading', { name: "That's today's drop" })).toBeVisible();
  await expect(learnCard).toContainText('Next review:');
  await page.screenshot({ path: testInfo.outputPath('learn-stop-390x844.png') });
  await learnCard.getByRole('button', { name: 'Continue' }).click();
  // Spec 33: the drop hands back to Read; an idea's map and Practice live on its book page.
  await expect(page).toHaveURL(/#read$/);
  await expect(page.getByRole('heading', { name: 'Your books', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Read: done' })).toBeVisible();
  const node = await openIdeas(page, 'money-markets', 'Inflation');
  await expect(page.locator('.read-chapter').first().locator('.learn-idea-row')).toHaveCount(3);
  await expect(page.locator('.learn-idea-row')).toHaveCount(10);
  await expect(page.locator('.learn-idea-row:not([data-state="new"])')).not.toHaveCount(0);
  await expect(page.locator('.learn-idea-row[data-state="new"]')).not.toHaveCount(0);
  if (testInfo.project.name === 'mobile-390x844') await page.screenshot({ path: testInfo.outputPath('book-ideas-390x844.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const title = await node.locator('strong').innerText();
  await node.getByRole('button', { name: `Practice this idea: ${title}` }).click();
  await expect(page.locator('.learn-drop-head')).toContainText('1 / 3');
  await expect(page.locator('.learn-drop .eyebrow')).toContainText(title);
  await page.getByRole('button', { name: /Practice · Leave/ }).click();
  await expect(page.getByRole('heading', { name: 'Money, Plainly', level: 1 })).toBeVisible();
});
