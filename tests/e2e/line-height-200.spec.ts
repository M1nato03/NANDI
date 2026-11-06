import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { openItemDemo, settleQuestionFit } from './helpers/e12-question-fit';
import { questionFitExtremes } from './helpers/e12-items';
import { textAt200 } from './helpers/text';

// a9 post-ship check of build 120, via b2 (7 Nov): at 200% text the question area's lines overlapped, because its
// font sizes followed the reader's size (rem) while three line-heights stayed px. At 200%: every line-height is at
// least 1.15x its font size, and no two lines of one element overlap.
test.use({ viewport: { width: 360, height: 800 }, reducedMotion: 'reduce', colorScheme: 'light', serviceWorkers: 'block' });

/** Elements matching `selector` whose line-height is under 1.15x the font size, or whose wrapped lines overlap. */
const crowded = (page: Page, selector: string) => page.locator(selector).evaluateAll(nodes => nodes.flatMap(node => {
  const style = getComputedStyle(node);
  const font = parseFloat(style.fontSize);
  const line = style.lineHeight === 'normal' ? font * 1.2 : parseFloat(style.lineHeight);
  const name = `${node.tagName.toLowerCase()}.${[...node.classList].join('.')} "${(node.textContent ?? '').trim().slice(0, 24)}"`;
  const problems: string[] = [];
  if (line < 1.15 * font) problems.push(`${name}: line-height ${line}px for ${font}px text`);
  // The text's own line boxes, top to bottom; a line that starts above the one before it ends means they overlap.
  const range = document.createRange();
  range.selectNodeContents(node);
  const lines = [...range.getClientRects()].filter(rect => rect.width > 0).map(rect => ({ top: Math.round(rect.top * 10) / 10, bottom: Math.round(rect.bottom * 10) / 10 }))
    .sort((a, b) => a.top - b.top).filter((rect, index, all) => index === 0 || rect.top !== all[index - 1]!.top);
  for (let index = 1; index < lines.length; index++) if (lines[index]!.top < lines[index - 1]!.bottom - 0.5) problems.push(`${name}: line ${index + 1} overlaps line ${index}`);
  return problems;
}));

for (const fixture of questionFitExtremes().filter(item => item.size === 'longest')) {
  test(`${fixture.type} (${fixture.id}) at 200% text: the stem and every answer row keep their lines apart`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-06T12:00:00'));
    await openItemDemo(page, fixture);
    await textAt200(page);
    await settleQuestionFit(page);
    for (const selector of ['.learn-stem', '.learn-ask', '.learn-options > button', '.learn-estimate-value', '.learn-hint']) expect(await crowded(page, selector), selector).toEqual([]);
  });
}

type Option = { text: string; correct: boolean };
type Step = { hook: { options: Option[] }; example: { spot: string }; guided: { options: Option[] }[]; takeaway: string };
const habits = (JSON.parse(readFileSync('content/topics/topic.psychology.json', 'utf8')) as { body: { modules: { concepts: { id: string; steps?: Step[] }[] }[] } })
  .body.modules[0]!.concepts.find(concept => concept.id === 'habits')!;

test('a lesson\'s teach text and its takeaway keep their lines apart at 200% text', async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.setFixedTime(new Date(2026, 9, 22, 12));
  await page.goto('/?e2e#grow/read/drop');
  await page.getByRole('button', { name: /Human psychology/ }).click();
  await page.getByRole('button', { name: 'Start my first drop' }).click();
  const lesson = page.locator('.step-lesson');
  await expect(lesson).toHaveAttribute('data-lesson-phase', 'hook');
  await textAt200(page);
  await page.getByRole('button', { name: habits.steps![0]!.hook.options[1]!.text, exact: true }).click();
  await page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }).click();
  await expect(lesson).toHaveAttribute('data-lesson-phase', 'teach');
  expect(await crowded(page, '.step-teach-text'), 'teach text').toEqual([]);
  expect(await crowded(page, '.step-teach h2'), 'teach title').toEqual([]);
  // On to the stop screen, where the takeaway shows (the rest of the lesson, as teach-first walks it).
  const step = habits.steps![0]!;
  await lesson.getByRole('button', { name: 'Continue' }).click();
  await expect(lesson).toHaveAttribute('data-lesson-phase', 'show');
  await page.getByRole('button', { name: step.example.spot, exact: true }).click();
  await page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }).click();
  await expect(lesson).toHaveAttribute('data-lesson-phase', 'guided-1');
  await page.getByRole('button', { name: step.guided[0]!.options.find(option => option.correct)!.text, exact: true }).click();
  await page.locator('.learn-feedback').getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('.step-takeaway')).toHaveText(step.takeaway);
  expect(await crowded(page, '.learn-drop .step-takeaway'), 'takeaway').toEqual([]);
});
