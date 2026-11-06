import { expect, test } from '@playwright/test';
import { questionFitExtremes, type QuestionFitFixture } from './helpers/e12-items';
import { expectAnswersShown, expectCheckFits, expectPageFits, FIT_NOON, openItemDemo, pickDemoAnswer, settleQuestionFit } from './helpers/e12-question-fit';
import { textAt200 } from './helpers/text';

// Computed from all 9 schema-valid bundled topic packs (678 items) using questionFitExtremes(), not hand-picked.
// Shortest/longest by stem.length, ties by id. Keep this explicit list reviewable and audit it against the packs.
// No service worker here: its one-time "Ready to work offline" notice (4 s, in the page flow) would land mid-measure.
// The last test below stands in for that notice and checks the fit follows it.
test.use({ serviceWorkers: 'block' });

const fixtures: QuestionFitFixture[] = [
  { type: 'choose', size: 'shortest', id: 'variable-rewards-9', stemLength: 36 },
  { type: 'choose', size: 'longest', id: 'index-funds-9', stemLength: 129 },
  { type: 'estimate', size: 'shortest', id: 'company-trade-rule-12', stemLength: 80 },
  { type: 'estimate', size: 'longest', id: 'ceiling-fans-13', stemLength: 228 },
  { type: 'order', size: 'shortest', id: 'planning-fallacy-13', stemLength: 43 },
  { type: 'order', size: 'longest', id: 'babylon-gold-i4', stemLength: 104 },
  { type: 'match', size: 'shortest', id: 'emergency-fund-11', stemLength: 36 },
  { type: 'match', size: 'longest', id: 'babylon-know-i4', stemLength: 65 },
  { type: 'why', size: 'shortest', id: 'htsw-interest-i2', stemLength: 31 },
  { type: 'why', size: 'longest', id: 'sky-colours-14', stemLength: 168 },
  { type: 'true-not-quite', size: 'shortest', id: 'htwf-arguments-i5', stemLength: 44 },
  { type: 'true-not-quite', size: 'longest', id: 'confirmation-bias-15', stemLength: 152 },
  { type: 'scenario', size: 'shortest', id: 'htwf-listening-i1', stemLength: 48 },
  { type: 'scenario', size: 'longest', id: 'anchoring-9', stemLength: 188 },
];

test.use({ viewport: { width: 360, height: 800 }, reducedMotion: 'reduce', colorScheme: 'light' });

const FIRST_ANSWER = '.learn-options > button, .learn-estimate input[type="range"]';
async function firstAnswerInsideMiddle(page: import('@playwright/test').Page) {
  return page.evaluate(selector => {
    const middle = document.querySelector('.learn-q')?.getBoundingClientRect();
    const first = document.querySelector(selector)?.getBoundingClientRect();
    return !!middle && !!first && first.top >= middle.top - 1 && first.bottom <= middle.bottom + 1;
  }, FIRST_ANSWER);
}
test.beforeAll(() => { expect(fixtures).toEqual(questionFitExtremes()); });
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(FIT_NOON); });

for (const fixture of fixtures) {
  test(`${fixture.type}, ${fixture.size}: ${fixture.id} fits before and after a pick`, async ({ page }) => {
    await openItemDemo(page, fixture);
    // These checks happen before Playwright clicks anything (a click could otherwise hide a scroll regression).
    await expectPageFits(page);
    await expectAnswersShown(page);
    await expectCheckFits(page, false);
    // Nothing is below the fold at normal text, so there is no "more below" cue.
    await expect(page.locator('.learn-more-cue')).toHaveCount(0);
    const options = page.locator(fixture.type === 'estimate' ? '.learn-estimate input[type="range"]' : '.learn-options');
    await expect.poll(async () => {
      const stem = await page.locator('.learn-stem').boundingBox();
      const answers = await options.boundingBox();
      const height = await page.evaluate(() => innerHeight);
      return !!stem && !!answers && answers.y >= height / 2 && stem.y + stem.height / 2 < answers.y;
    }, { message: 'Answers start in the lower half, below the stem centre' }).toBe(true);
    await pickDemoAnswer(page, fixture);
    await expectCheckFits(page, true);
    await expectPageFits(page);
  });
}

for (const fixture of fixtures.filter(item => item.size === 'longest')) {
  test(`${fixture.type}, longest: ${fixture.id} keeps Check in view at 200% text`, async ({ page }) => {
    await openItemDemo(page, fixture);
    // b2 (6 Nov): every text in the question area follows the reader's size. The answers (or the estimate's value),
    // the stem and Check must each be at least 1.8x their normal size at 200% text.
    const sizes = () => page.evaluate(() => {
      const px = (selector: string) => { const node = document.querySelector(selector); return node ? parseFloat(getComputedStyle(node).fontSize) : 0; };
      return { answer: px('.learn-options button') || px('.learn-estimate-value'), stem: px('.learn-stem'), check: px('.learn-check button') };
    });
    const normal = await sizes();
    await textAt200(page);
    const large = await sizes();
    for (const part of ['answer', 'stem', 'check'] as const) {
      expect(normal[part], `${part} has a size`).toBeGreaterThan(0);
      expect(large[part] / normal[part], `${part} at 200% text (${normal[part]}px → ${large[part]}px)`).toBeGreaterThanOrEqual(1.8);
    }
    await settleQuestionFit(page);
    await expectPageFits(page);
    await expectCheckFits(page, false);
    // At large text, scroll the middle to the last answer while the page and Check stay put.
    const middle = page.locator('.learn-q');
    await expect(middle).toHaveCSS('overflow-y', 'auto');
    // b2 (6 Nov): while the middle holds more below, a fade and a chevron (no words) sit on its bottom edge.
    const overflows = await middle.evaluate(node => node.scrollHeight - node.clientHeight > 2);
    if (overflows) {
      await expect(page.locator('.learn-more-cue svg')).toBeVisible();
      await expect(middle).toHaveClass(/more-below/);
      // b2 (6 Nov): the chip is a real button (48x48 hit box, named, no words) that brings the first answer up.
      const cue = page.getByRole('button', { name: 'Answers below' });
      const box = await cue.boundingBox();
      expect(box && box.width >= 48 && box.height >= 48, JSON.stringify(box)).toBe(true);
      await cue.click();
      // This file runs with reduced motion, so the scroll is instant: one read straight after the tap, no polling.
      expect(await firstAnswerInsideMiddle(page), 'the first answer sits fully inside the middle after the tap').toBe(true);
      await expect(page.locator(FIRST_ANSWER).first()).toBeFocused();
    }
    await middle.evaluate(node => { node.scrollTop = node.scrollHeight; });
    await settleQuestionFit(page);
    // At the end of the middle there is nothing more below, so the cue goes.
    await expect(page.locator('.learn-more-cue')).toHaveCount(0);
    await expectPageFits(page);
    await expectCheckFits(page, false);
    await pickDemoAnswer(page, fixture);
    await expectCheckFits(page, true);
    await expectPageFits(page);
  });
}

test.describe('with motion on', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('the "Answers below" chip scrolls the middle smoothly to the first answer at 200% text', async ({ page }) => {
    await openItemDemo(page, fixtures.find(item => item.id === 'anchoring-9')!);
    await textAt200(page);
    await settleQuestionFit(page);
    await page.getByRole('button', { name: 'Answers below' }).click();
    await expect.poll(() => firstAnswerInsideMiddle(page), { message: 'the first answer ends up fully inside the middle' }).toBe(true);
    await expect(page.locator(FIRST_ANSWER).first()).toBeFocused();
  });
  test('with NANDI’s own Reduce motion on, the chip scrolls at once even though the phone allows motion', async ({ page }) => {
    await page.goto('/#you');
    await page.getByRole('button', { name: /Settings/ }).click();
    await page.getByLabel('Motion').selectOption('reduce');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
    await openItemDemo(page, fixtures.find(item => item.id === 'anchoring-9')!);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
    await textAt200(page);
    await settleQuestionFit(page);
    await page.getByRole('button', { name: 'Answers below' }).click();
    // One read straight after the tap, no polling: a smooth scroll would still be on its way.
    expect(await firstAnswerInsideMiddle(page), 'the first answer sits fully inside the middle at once').toBe(true);
  });
});

test('the fit follows the page when something above the question comes and goes', async ({ page }) => {
  await page.clock.setFixedTime(FIT_NOON);
  await openItemDemo(page, fixtures.find(item => item.type === 'match' && item.size === 'longest')!);
  const checkBottom = () => page.locator('.learn-check').evaluate(node => Math.round(node.getBoundingClientRect().bottom));
  const before = await checkBottom();
  // Stand-in for the one-time "Ready to work offline" notice, which sits in the page flow above the question.
  await page.evaluate(() => { const note = document.createElement('div'); note.id = 'e12-note'; note.style.height = '80px'; document.querySelector('main')!.prepend(note); });
  await expectPageFits(page);
  await expectCheckFits(page, false);
  await page.evaluate(() => document.getElementById('e12-note')!.remove());
  await expect.poll(checkBottom, { message: 'Check returns to the bottom once the notice goes' }).toBe(before);
  await expectAnswersShown(page);
});
