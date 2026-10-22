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
export async function walkLesson(page: Page, topicId: string) {
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
  await expect(lesson).toHaveCount(0);
  return step;
}
