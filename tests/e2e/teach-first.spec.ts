import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

type Option = { id: string; text: string; correct: boolean };
type Item = { id: string; step?: string; stem: string; type: string; options: Option[]; answer?: unknown };
const pack = JSON.parse(readFileSync('content/topics/topic.psychology.json', 'utf8')) as { body: { modules: { concepts: { id: string; items: Item[]; steps?: { id: string; example: { spot: string }; guided: { options: Option[] }[]; hook: { options: Option[] }; takeaway: string }[] }[] }[] } };
const habits = pack.body.modules[0]!.concepts.find(concept => concept.id === 'habits')!;
const [stepOne, stepTwo] = habits.steps!;

async function answerQuestion(page: Page) {
  const stem = await page.locator('.learn-drop h2').innerText();
  const item = pack.body.modules.flatMap(module => module.concepts).flatMap(concept => concept.items).find(candidate => candidate.stem === stem);
  if (!item) throw new Error(`Unknown item: ${stem}`);
  const tap = (id: string) => page.locator('.learn-drop').getByRole('button', { name: item.options.find(option => option.id === id)!.text, exact: true }).click();
  if (item.type === 'order') for (const id of item.answer as string[]) await tap(id);
  else if (item.type === 'match') for (const pair of item.answer as { left: string; right: string }[]) { await tap(pair.left); await tap(pair.right); }
  else if (item.type === 'estimate') await page.locator('.learn-estimate input[type=range]').fill(String((item.answer as { value: number }).value));
  else await tap(item.options.find(option => option.correct)!.id);
  await page.getByRole('button', { name: /^Check/ }).first().click();
  await expect(page.locator('.learn-feedback')).toBeVisible();
  return item;
}

test('a new step is taught in order: hook, idea, show me, two guided tries with hints, then its own questions, then reviews', async ({ page }) => {
  test.setTimeout(120_000);
  await page.clock.setFixedTime(new Date(2026, 9, 22, 12));
  await page.goto('/?e2e#learn/drop');
  await page.getByRole('button', { name: /Human psychology/ }).click();
  await page.getByRole('button', { name: 'Start my first drop' }).click();

  const lesson = page.locator('.step-lesson');
  await expect(lesson).toHaveAttribute('data-lesson-phase', 'hook');
  await expect(page.getByRole('button', { name: 'Show hint' })).toHaveCount(0);
  await page.getByRole('button', { name: stepOne!.hook.options[1]!.text, exact: true }).click();
  await expect(page.locator('.learn-feedback')).toBeVisible();
  await page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }).click();

  await expect(lesson).toHaveAttribute('data-lesson-phase', 'teach');
  await expect(lesson.locator('.step-visual')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show hint' })).toHaveCount(0);
  await lesson.getByRole('button', { name: 'Continue' }).click();

  await expect(lesson).toHaveAttribute('data-lesson-phase', 'show');
  await page.getByRole('button', { name: stepOne!.example.spot, exact: true }).click();
  await expect(page.locator('.step-part.right')).toHaveText(stepOne!.example.spot);
  await page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }).click();

  for (const [index, guided] of stepOne!.guided.entries()) {
    await expect(lesson).toHaveAttribute('data-lesson-phase', `guided-${index + 1}`);
    await page.getByRole('button', { name: 'Show hint' }).click();
    await expect(page.locator('.step-hint')).toBeVisible();
    await page.getByRole('button', { name: guided.options.find(option => option.correct)!.text, exact: true }).click();
    await page.locator('.learn-feedback').getByRole('button', { name: index === stepOne!.guided.length - 1 ? 'Your turn' : 'Continue' }).click();
  }

  // Your turn: only this step's own questions, and no hint button outside the lesson.
  await expect(page.locator('.step-lesson')).toHaveCount(0);
  for (let turn = 0; turn < 6 && !(await page.locator('.learn-stop').isVisible()); turn++) {
    await expect(page.getByRole('button', { name: 'Show hint' })).toHaveCount(0);
    const item = await answerQuestion(page);
    expect(item.step).toBe(stepOne!.id);
    await page.locator('.learn-feedback').getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('.learn-feedback')).toHaveCount(0);
  }
  await expect(page.locator('.learn-stop')).toContainText(`Today's idea · ${habits.steps![0]!.id === stepOne!.id ? 'A cue starts a habit' : ''}`);
  await expect(page.locator('.step-takeaway')).toHaveText(stepOne!.takeaway);

  // The next day teaches step two before any review of step one.
  await page.clock.setFixedTime(new Date(2026, 9, 23, 12));
  await page.reload();
  await expect(page.locator('.step-lesson')).toHaveAttribute('data-lesson-phase', 'hook');
  await page.getByRole('button', { name: stepTwo!.hook.options[0]!.text, exact: true }).click();
  await page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }).click();
  await page.locator('.step-lesson').getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: stepTwo!.example.spot, exact: true }).click();
  await page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }).click();
  for (const [index, guided] of stepTwo!.guided.entries()) {
    await page.getByRole('button', { name: guided.options.find(option => option.correct)!.text, exact: true }).click();
    await page.locator('.learn-feedback').getByRole('button', { name: index === stepTwo!.guided.length - 1 ? 'Your turn' : 'Continue' }).click();
  }
  await expect(page.locator('.step-lesson')).toHaveCount(0);
  const seen: (string | undefined)[] = [];
  for (let turn = 0; turn < 8 && !(await page.locator('.learn-stop').isVisible()); turn++) {
    seen.push((await answerQuestion(page)).step);
    await page.locator('.learn-feedback').getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('.learn-feedback')).toHaveCount(0);
  }
  const firstOther = seen.findIndex(step => step !== stepTwo!.id);
  expect(seen[0]).toBe(stepTwo!.id);
  if (firstOther >= 0) expect(seen.slice(firstOther).every(step => step !== stepTwo!.id)).toBe(true);
  expect(seen.every(step => step === stepOne!.id || step === stepTwo!.id)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a missed review of a taught step offers the idea again instead of a paragraph', async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.setFixedTime(new Date(2026, 9, 22, 12));
  await page.goto('/?e2e#learn/drop');
  await page.getByRole('button', { name: /Human psychology/ }).click();
  await page.getByRole('button', { name: 'Start my first drop' }).click();
  await page.getByRole('button', { name: stepOne!.hook.options[0]!.text, exact: true }).click();
  await page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }).click();
  await page.locator('.step-lesson').getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: stepOne!.example.spot, exact: true }).click();
  await page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }).click();
  for (const [index, guided] of stepOne!.guided.entries()) {
    await page.getByRole('button', { name: guided.options.find(option => option.correct)!.text, exact: true }).click();
    await page.locator('.learn-feedback').getByRole('button', { name: index === stepOne!.guided.length - 1 ? 'Your turn' : 'Continue' }).click();
  }
  await expect(page.locator('.step-lesson')).toHaveCount(0);
  const stem = await page.locator('.learn-drop h2').innerText();
  const item = habits.items.find(candidate => candidate.stem === stem)!;
  const wrong = item.options.find(option => !option.correct)!;
  if (item.type === 'order' || item.type === 'match' || item.type === 'estimate') test.skip(true, 'first your-turn item is not a choice item');
  await page.locator('.learn-drop').getByRole('button', { name: wrong.text, exact: true }).click();
  await page.getByRole('button', { name: /^Check/ }).first().click();
  await expect(page.locator('.learn-feedback .learn-rule')).toHaveCount(0);
  await page.getByRole('button', { name: 'See the idea again' }).click();
  await expect(page.locator('.step-again .step-visual')).toBeVisible();
});
