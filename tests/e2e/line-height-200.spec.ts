import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { openItemDemo, settleQuestionFit } from './helpers/e12-question-fit';
import { questionFitExtremes } from './helpers/e12-items';
import { textAt200 } from './helpers/text';

// a9 post-ship check of build 120, via b2 (7 Nov): at 200% text the question area's lines overlapped, because its
// font sizes followed the reader's size (rem) while three line-heights stayed px. At 200%: every line-height is at
// least 1.15x its font size, and no two lines of one element overlap.
test.use({ viewport: { width: 360, height: 800 }, reducedMotion: 'reduce', colorScheme: 'light', serviceWorkers: 'block' });

/** Elements matching `selector` whose wrapped lines sit under 1.15x the font apart in line-height, or collide. */
const crowded = (page: Page, selector: string) => page.locator(selector).evaluateAll(nodes => nodes.flatMap(node => {
  const style = getComputedStyle(node);
  const font = parseFloat(style.fontSize);
  const line = style.lineHeight === 'normal' ? font * 1.2 : parseFloat(style.lineHeight);
  const name = `${node.tagName.toLowerCase()}.${[...node.classList].join('.')} "${(node.textContent ?? '').trim().slice(0, 24)}"`;
  const problems: string[] = [];
  // The text's lines, top to bottom, from its text only (a checkbox or an input beside it is not a line). A glyph
  // box is taller than the font (about 1.3x for DM Sans), so boxes of neighbouring lines touch at any line-height
  // under that; what matters is the line pitch. Rects less than half a font apart sit on the same line.
  const tops: number[] = [];
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  for (let text = walker.nextNode(); text; text = walker.nextNode()) {
    if (!text.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(text);
    for (const rect of range.getClientRects()) if (rect.width > 0) tops.push(rect.top);
  }
  const lines: number[] = [];
  for (const top of tops.sort((a, b) => a - b)) if (!lines.length || top - lines.at(-1)! >= font / 2) lines.push(top);
  // Wrapped text keeps a line-height of at least 1.15x its font (a single line has no neighbour to crowd), and no
  // two lines sit closer than one font size, where their letters would collide.
  if (lines.length > 1 && line < 1.15 * font) problems.push(`${name}: line-height ${line}px for ${font}px text over ${lines.length} lines`);
  for (let index = 1; index < lines.length; index++) if (lines[index]! - lines[index - 1]! < font - 0.5) problems.push(`${name}: line ${index + 1} overlaps line ${index}`);
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
