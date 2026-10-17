import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const pack = JSON.parse(readFileSync('content/topics/topic.money-markets.json', 'utf8')) as {
  body: { modules: { concepts: { id: string; rule: string; items: { stem: string; type: string; options: { id: string; text: string; feedback: string; correct: boolean }[]; answer?: string[] | { left: string; right: string }[] }[] }[] }[] };
};
const concepts = pack.body.modules.flatMap(module => module.concepts);

async function answerItem(page: Page, wrong: boolean, advance = true) {
  const stem = await page.locator('.learn-drop h2').innerText();
  const concept = concepts.find(row => row.items.some(item => item.stem === stem));
  const item = concept?.items.find(row => row.stem === stem);
  if (!item || !concept) throw new Error(`Unknown item: ${stem}`);
  const tap = async (id: string) => page.getByRole('article', { name: 'Learn card' }).getByRole('button', { name: item.options.find(option => option.id === id)!.text, exact: true }).click();
  if (item.type === 'order') {
    const ids = item.answer as string[];
    for (const id of wrong ? [...ids].reverse() : ids) await tap(id);
  } else if (item.type === 'match') {
    const pairs = item.answer as { left: string; right: string }[];
    for (const pair of pairs) { await tap(pair.left); await tap(wrong ? pair.left : pair.right); }
  } else {
    const option = item.options.find(row => row.correct !== wrong);
    if (!option) throw new Error('No matching option');
    await tap(option.id);
  }
  const feedback = page.locator('.learn-feedback');
  await expect(feedback).toBeVisible();
  await expect(feedback).toContainText(concept.rule);
  if (item.type !== 'order' && item.type !== 'match') await expect(feedback).toContainText(item.options.find(option => option.correct !== wrong)!.feedback);
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
  await page.goto('/#now');
  await page.getByRole('button', { name: 'Go to card 5: Learn' }).click();
  const learnCard = page.getByRole('article', { name: 'Learn card' });
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
  const thirdStem = await learnCard.locator('.learn-drop h2').innerText();
  await page.reload();
  await expect(learnCard.locator('.learn-drop h2')).toHaveText(thirdStem);
  for (let i = 0; i < 3; i++) await answerItem(page, false);
  await expect(learnCard.getByRole('heading', { name: "That's today's drop" })).toBeVisible();
  await expect(learnCard).toContainText('Next review:');
  await page.screenshot({ path: testInfo.outputPath('learn-stop-390x844.png') });
  await learnCard.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('article', { name: 'A little extra card' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'You' }).click();
  await page.getByRole('button', { name: 'Open Learn' }).click();
  await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Today' })).toContainText('Done for today');
  await expect(page.getByRole('region', { name: 'Today' })).toContainText('Night drop');
  const topic = page.locator('.learn-map-topic').filter({ hasText: 'Money and markets' });
  const expand = topic.getByRole('button', { name: /Money and markets/ });
  await expect(expand).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByLabel('Money and markets mastery map')).toHaveCount(0);
  if (testInfo.project.name === 'mobile-390x844') {
    await page.getByRole('heading', { name: 'Topics' }).evaluate(element => element.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: 'screenshots/learn-collapsed-390x844.png' });
  }
  await expand.click();
  const map = page.getByLabel('Money and markets mastery map');
  await expect(map.locator('.learn-idea-row')).toHaveCount(10);
  await expect(map.getByRole('heading', { name: /New/ })).toBeVisible();
  await expect(map.getByRole('heading', { name: /Learning|Strong/ })).toBeVisible();
  await expect(map.locator('.learn-idea-row:not([data-state="new"])')).not.toHaveCount(0);
  await expect(map.locator('.learn-idea-row[data-state="new"]')).not.toHaveCount(0);
  if (testInfo.project.name === 'mobile-390x844') {
    await topic.evaluate(element => element.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: 'screenshots/learn-expanded-390x844.png' });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const firstIdea = map.locator('.learn-idea-row').first();
  const title = await firstIdea.locator('strong').innerText();
  await firstIdea.getByRole('button', { name: `Practice this idea: ${title}` }).click();
  await expect(page.locator('.learn-drop-head')).toContainText('1 / 3');
  await expect(page.locator('.learn-drop .eyebrow')).toContainText(title);
  await page.getByRole('button', { name: /Practice · Leave/ }).click();
  await expect(page.getByRole('region', { name: 'Today' })).toContainText('Done for today');
});
