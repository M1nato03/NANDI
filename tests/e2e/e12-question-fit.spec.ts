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
test.beforeAll(() => { expect(fixtures).toEqual(questionFitExtremes()); });
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(FIT_NOON); });

for (const fixture of fixtures) {
  test(`${fixture.type}, ${fixture.size}: ${fixture.id} fits before and after a pick`, async ({ page }) => {
    await openItemDemo(page, fixture);
    // These checks happen before Playwright clicks anything (a click could otherwise hide a scroll regression).
    await expectPageFits(page);
    await expectAnswersShown(page);
    await expectCheckFits(page, false);
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
    await textAt200(page);
    await settleQuestionFit(page);
    await expectPageFits(page);
    await expectCheckFits(page, false);
    // At large text, scroll the middle to the last answer while the page and Check stay put.
    const middle = page.locator('.learn-q');
    await expect(middle).toHaveCSS('overflow-y', 'auto');
    await middle.evaluate(node => { node.scrollTop = node.scrollHeight; });
    await settleQuestionFit(page);
    await expectPageFits(page);
    await expectCheckFits(page, false);
    await pickDemoAnswer(page, fixture);
    await expectCheckFits(page, true);
    await expectPageFits(page);
  });
}

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
