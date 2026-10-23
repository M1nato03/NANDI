import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

type Option = { id: string; text: string; correct: boolean };
type Item = { id: string; step?: string; stem: string; type: string; options: Option[]; answer?: unknown };
type Step = { id: string; example: { spot: string }; guided: { options: Option[] }[]; hook: { options: Option[] }; takeaway: string };
const pack = JSON.parse(readFileSync('content/topics/topic.psychology.json', 'utf8')) as { body: { modules: { concepts: { id: string; items: Item[]; steps?: Step[] }[] }[] } };
const habits = pack.body.modules[0]!.concepts.find(concept => concept.id === 'habits')!;
const [stepOne, stepTwo] = habits.steps!;
const items = pack.body.modules.flatMap(module => module.concepts).flatMap(concept => concept.items);

async function answerQuestion(page: Page, pick: 'right' | 'wrong' = 'right') {
  const stem = await page.locator('.learn-drop h2').innerText();
  const item = items.find(candidate => candidate.stem === stem);
  if (!item) throw new Error(`Unknown item: ${stem}`);
  const tap = (id: string) => page.locator('.learn-drop').getByRole('button', { name: item.options.find(option => option.id === id)!.text, exact: true }).click();
  if (item.type === 'order') for (const id of item.answer as string[]) await tap(id);
  // Each pair once: the pack lists it both ways.
  else if (item.type === 'match') for (const pair of (item.answer as { left: string; right: string }[]).filter((pair, index, all) => !all.slice(0, index).some(seen => seen.left === pair.right && seen.right === pair.left))) { await tap(pair.left); await tap(pair.right); }
  else if (item.type === 'estimate') await page.locator('.learn-estimate input[type=range]').fill(String((item.answer as { value: number }).value));
  else await tap(item.options.find(option => option.correct === (pick === 'right'))!.id);
  await page.getByRole('button', { name: /^Check/ }).first().click();
  await expect(page.locator('.learn-feedback')).toBeVisible();
  return item;
}

/** Hook, idea, show me and the one guided try (spec 16 §5); `last` is the button that leaves the lesson. */
async function walkStep(page: Page, step: Step, last: 'Your turn' | 'Done', hookPick = 1) {
  const lesson = page.locator('.step-lesson');
  await expect(lesson).toHaveAttribute('data-lesson-phase', 'hook');
  await page.getByRole('button', { name: step.hook.options[hookPick]!.text, exact: true }).click();
  await page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }).click();
  await expect(lesson).toHaveAttribute('data-lesson-phase', 'teach');
  await expect(lesson.locator('.step-visual')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show hint' })).toHaveCount(0);
  await lesson.getByRole('button', { name: 'Continue' }).click();
  await expect(lesson).toHaveAttribute('data-lesson-phase', 'show');
  await page.getByRole('button', { name: step.example.spot, exact: true }).click();
  await expect(page.locator('.step-part.right')).toHaveText(step.example.spot);
  await page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }).click();
  await expect(lesson).toHaveAttribute('data-lesson-phase', 'guided-1');
  await page.getByRole('button', { name: 'Show hint' }).click();
  await expect(page.locator('.step-hint')).toBeVisible();
  await page.getByRole('button', { name: step.guided[0]!.options.find(option => option.correct)!.text, exact: true }).click();
  await page.locator('.learn-feedback').getByRole('button', { name: last }).click();
  await expect(lesson).toHaveCount(0);
}

test('a new step is taught as hook, idea, show me and one guided try; its own questions come back the next day, after the next lesson', async ({ page }) => {
  test.setTimeout(120_000);
  await page.clock.setFixedTime(new Date(2026, 9, 22, 12));
  await page.goto('/?e2e#learn/drop');
  await page.getByRole('button', { name: /Human psychology/ }).click();
  await page.getByRole('button', { name: 'Start my first drop' }).click();

  // QA 21 Oct: a focused screen with one bar for the whole drop and no tab bar or stray links.
  await expect(page.locator('.step-lesson')).toHaveAttribute('data-lesson-phase', 'hook');
  await expect(page.getByRole('navigation', { name: 'Main tabs' })).toBeHidden();
  await expect(page.locator('.learn-progress')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Open Learn' })).toHaveCount(0);
  // A brand-new learner has nothing earlier to practise, so day 1 is the lesson alone.
  await walkStep(page, stepOne!, 'Done');
  await expect(page.locator('.learn-stop')).toContainText("Today's idea · ");
  await expect(page.locator('.step-takeaway')).toHaveText(stepOne!.takeaway);
  await expect(page.locator('.learn-stop')).toContainText('1 new idea.');
  await expect(page.getByRole('navigation', { name: 'Main tabs' })).toBeVisible();

  // Day 2: step two is taught, then step one's own questions (spaced by a day), never step two's.
  await page.clock.setFixedTime(new Date(2026, 9, 23, 12));
  await page.reload();
  await walkStep(page, stepTwo!, 'Your turn', 0);
  const seen: (string | undefined)[] = [];
  for (let turn = 0; turn < 8 && !(await page.locator('.learn-stop').isVisible()); turn++) {
    await expect(page.getByRole('button', { name: 'Show hint' })).toHaveCount(0);
    await expect(page.locator('.learn-progress')).toHaveCount(1);
    seen.push((await answerQuestion(page)).step);
    // The result sheet and its button sit inside the screen, never under a bar.
    const next = page.locator('.learn-feedback').getByRole('button', { name: 'Next' });
    await expect.poll(async () => { const box = await next.boundingBox(); return box!.y + box!.height; }).toBeLessThanOrEqual(page.viewportSize()!.height);
    if (turn === 0) await page.screenshot({ path: `D:/nandi-gate-logs/shots/qa-sheet-${page.viewportSize()!.width}.png` });
    await next.click();
    await expect(page.locator('.learn-feedback')).toHaveCount(0);
  }
  expect(seen.length).toBeGreaterThan(0);
  expect(seen.every(step => step === stepOne!.id)).toBe(true);
  await expect(page.locator('.learn-stop')).toContainText(/1 new idea · \d+ questions?\./);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a missed question on a taught step offers the idea again instead of a paragraph', async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.setFixedTime(new Date(2026, 9, 22, 12));
  await page.goto('/?e2e#learn/drop');
  await page.getByRole('button', { name: /Human psychology/ }).click();
  await page.getByRole('button', { name: 'Start my first drop' }).click();
  await walkStep(page, stepOne!, 'Done', 0);
  await page.clock.setFixedTime(new Date(2026, 9, 23, 12));
  await page.reload();
  await walkStep(page, stepTwo!, 'Your turn', 0);
  const stem = await page.locator('.learn-drop h2').innerText();
  const item = habits.items.find(candidate => candidate.stem === stem)!;
  if (item.type === 'order' || item.type === 'match' || item.type === 'estimate') test.skip(true, 'first question is not a choice item');
  await answerQuestion(page, 'wrong');
  await expect(page.locator('.learn-feedback .learn-rule')).toHaveCount(0);
  await page.getByRole('button', { name: 'See the idea again' }).click();
  await expect(page.locator('.step-again .step-visual')).toBeVisible();
});
