import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';

type Option = { id: string; text: string; correct: boolean };
type Step = { id: string; hook: { stem: string; options: Option[] }; example: { spot: string }; guided: { stem: string; options: Option[] }[] };
type Pack = { body: { modules: { concepts: { id: string; steps?: Step[] }[] }[] } };

const readPack = (topicId: string) => JSON.parse(readFileSync(`content/topics/topic.${topicId}.json`, 'utf8')) as Pack;
export const stepsOf = (topicId: string): Step[] => readPack(topicId).body.modules.flatMap(module => module.concepts.flatMap(concept => concept.steps ?? []));

/** A learner who was already taught every step of these topics (a week ago), so a drop is quiz items only. */
export async function seedTaughtTopics(page: Page, topicIds: string[]) {
  await page.waitForFunction(() => !!window.__nandiTest);
  const stepIds = topicIds.flatMap(id => stepsOf(id).map(step => step.id));
  await page.evaluate(ids => window.__nandiTest!.seedTaughtSteps(ids), stepIds);
}

/** Walks one lesson the way a learner does: hook guess, idea, show me, the one guided try (spec 16 §5), then "Your turn" or "Done". */
export async function walkLesson(page: Page, topicId: string, inChapter = false) {
  const lesson = page.locator('.step-lesson');
  await expect(lesson).toHaveAttribute('data-lesson-phase', 'hook');
  const hookStem = await lesson.locator('h2').innerText();
  const step = stepsOf(topicId).find(candidate => candidate.hook.stem === hookStem);
  if (!step) throw new Error(`Unknown lesson hook: ${hookStem}`);
  await page.getByRole('button', { name: step.hook.options.find(option => option.correct)!.text, exact: true }).click();
  await page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }).click();
  await expect(lesson).toHaveAttribute('data-lesson-phase', 'teach');
  await lesson.getByRole('button', { name: 'Continue' }).click();
  await expect(lesson).toHaveAttribute('data-lesson-phase', 'show');
  await page.getByRole('button', { name: step.example.spot, exact: true }).click();
  await page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }).click();
  await expect(lesson).toHaveAttribute('data-lesson-phase', 'guided-1');
  await page.getByRole('button', { name: step.guided[0]!.options.find(option => option.correct)!.text, exact: true }).click();
  await page.locator('.learn-feedback').getByRole('button', { name: /^(Your turn|Done)$/ }).click();
  // In a chapter (spec 33) the next lesson follows at once, or the chapter's check.
  if (inChapter) await expect.poll(async () => (await lesson.count()) === 0 || (await lesson.getAttribute('data-lesson-phase')) === 'hook' && (await lesson.locator('h2').first().innerText()) !== hookStem).toBe(true);
  else await expect(lesson).toHaveCount(0);
  return step;
}

type AnyItem = { stem: string; type: string; options: Option[]; answer?: unknown };
const itemsOf = (topicId: string): AnyItem[] => (JSON.parse(readFileSync(`content/topics/topic.${topicId}.json`, 'utf8')) as { body: { modules: { concepts: { items: AnyItem[] }[] }[] } })
  .body.modules.flatMap(module => module.concepts.flatMap(concept => concept.items));
/** Answers the question on screen right (any item type) and moves on: used for chapter checks (spec 33). */
export async function answerRight(page: Page, topicId: string) {
  const stem = await page.locator('.learn-drop h2').innerText();
  const item = itemsOf(topicId).find(candidate => candidate.stem === stem);
  if (!item) throw new Error(`Unknown item: ${stem}`);
  const tap = (id: string) => page.locator('.learn-drop').getByRole('button', { name: item.options.find(option => option.id === id)!.text, exact: true }).click();
  if (item.type === 'order') for (const id of item.answer as string[]) await tap(id);
  else if (item.type === 'match') {
    const pairs = (item.answer as { left: string; right: string }[]).filter((pair, index, all) => !all.slice(0, index).some(seen => seen.left === pair.right && seen.right === pair.left));
    for (const pair of pairs) { await tap(pair.left); await tap(pair.right); }
  } else if (item.type === 'estimate') await page.locator('.learn-estimate input[type=range]').fill(String((item.answer as { value: number }).value));
  else await tap(item.options.find(option => option.correct)!.id);
  await page.getByRole('button', { name: /^Check/ }).first().click();
  await page.locator('.learn-feedback').getByRole('button').last().click();
  await expect(page.locator('.learn-drop h2').filter({ hasText: stem })).toHaveCount(0);
}
