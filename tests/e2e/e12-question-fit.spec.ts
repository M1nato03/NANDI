import { expect, test, type Page } from '@playwright/test';
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
test.beforeAll(() => { expect(fixtures).toEqual(questionFitExtremes()); });
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(FIT_NOON); });

for (const fixture of fixtures) {
  test(`${fixture.type}, ${fixture.size}: ${fixture.id} fits before and after a pick`, async ({ page }) => {
    await openItemDemo(page, fixture);
    // These checks happen before Playwright clicks anything (a click could otherwise hide a scroll regression).
    await expectPageFits(page);
    await expectAnswersShown(page);
    await expectCheckFits(page, false);
    // Nothing is below the fold at normal text, so there is no "more below" cue, and the fitted layout stays (b2, 7 Nov).
    await expect(page.locator('.learn-more-cue')).toHaveCount(0);
    await expect(page.locator('.learn-drop.learn-page')).toHaveCount(0);
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

// Large text (b2, 7 Nov): a question that can't fit the fitted middle turns the page into the scroller. The stem and
// the answers scroll together; only the bottom action row (Check) stays pinned. No auto-scroll on load.
async function textAt200FromLoad(page: Page) {
  await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = 'html { font-size: 200% !important; }';
    document.head.append(style);
  }));
}
const geometry = (page: Page) => page.evaluate(selector => {
  const box = (query: string) => { const rect = document.querySelector(query)?.getBoundingClientRect(); return rect ? { top: rect.top, bottom: rect.bottom } : undefined; };
  const stem = document.querySelector('.learn-stem');
  return { vh: innerHeight, scrollY, row: box('.learn-check'), stem: box('.learn-stem'), first: box(selector),
    line: stem ? parseFloat(getComputedStyle(stem).lineHeight) : 0, wide: document.documentElement.scrollWidth > innerWidth + 1 };
}, FIRST_ANSWER);
async function firstAnswerInView(page: Page) {
  const { first, row } = await geometry(page);
  return !!first && !!row && first.top >= -1 && first.bottom <= row.top + 1;
}

for (const fixture of fixtures.filter(item => item.size === 'longest')) {
  test(`${fixture.type}, longest: ${fixture.id} at 200% text: the page scrolls and Check stays pinned`, async ({ page }) => {
    await openItemDemo(page, fixture);
    // b2 (6 Nov): every text in the question area follows the reader's size. The answers (or the estimate's value),
    // the stem and Check must each be at least 1.8x their normal size at 200% text.
    const sizes = () => page.evaluate(() => {
      const px = (selector: string) => { const node = document.querySelector(selector); return node ? parseFloat(getComputedStyle(node).fontSize) : 0; };
      return { answer: px('.learn-options button') || px('.learn-estimate-value'), stem: px('.learn-stem'), check: px('.learn-check button') };
    });
    const normal = await sizes();
    await textAt200FromLoad(page);
    await openItemDemo(page, fixture);
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('32px');
    const large = await sizes();
    for (const part of ['answer', 'stem', 'check'] as const) {
      expect(normal[part], `${part} has a size`).toBeGreaterThan(0);
      expect(large[part] / normal[part], `${part} at 200% text (${normal[part]}px → ${large[part]}px)`).toBeGreaterThanOrEqual(1.8);
    }
    const drop = page.locator('.learn-drop');
    await expect(drop).toHaveClass(/learn-page/);
    // On load: no auto-scroll, and the stem's first line is on screen above the pinned row.
    const loaded = await geometry(page);
    expect(loaded.scrollY, 'no auto-scroll on load').toBe(0);
    expect(!!loaded.stem && !!loaded.row && loaded.stem.top >= 0 && loaded.stem.top + loaded.line <= loaded.row.top, JSON.stringify(loaded)).toBe(true);
    expect(loaded.wide, 'no sideways scroll').toBe(false);
    await expectCheckFits(page, false);
    // More below the row: a fade and the chevron sit on the row's top edge; the chevron brings the first answer into view.
    await expect(drop).toHaveClass(/page-more/);
    const cue = page.getByRole('button', { name: 'Answers below' });
    await expect(cue).toBeVisible();
    const box = await cue.boundingBox();
    expect(box && box.width >= 48 && box.height >= 48, JSON.stringify(box)).toBe(true);
    // b2: the fit checks leave the chevron out, so it gets its own: fully on screen whenever it shows.
    expect(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 360 && box.y + box.height <= 800, JSON.stringify(box)).toBe(true);
    // b2 (7 Nov): the chevron's disc sits on the plain-tint band (the 40px above the row), never over full-contrast text.
    const band = await page.evaluate(() => {
      const row = document.querySelector('.learn-check')!.getBoundingClientRect();
      const disc = document.querySelector('.learn-more-cue svg')!.getBoundingClientRect();
      return { rowTop: row.top, discTop: disc.top, discBottom: disc.bottom, fade: getComputedStyle(document.querySelector('.learn-check')!, '::before').height };
    });
    expect(band.fade, JSON.stringify(band)).toBe('64px');
    expect(band.discBottom <= band.rowTop && band.discTop >= band.rowTop - 44, JSON.stringify(band)).toBe(true);
    await cue.click();
    // This file runs with reduced motion, so the scroll is instant: one read straight after the tap, no polling.
    expect(await firstAnswerInView(page), JSON.stringify(await geometry(page))).toBe(true);
    await expect(page.locator(FIRST_ANSWER).first()).toBeFocused();
    await expectCheckFits(page, false);
    // With the stem's top at the top of the screen, at least 70% of the screen above the row is for reading.
    await page.evaluate(() => { const stem = document.querySelector('.learn-stem')!; window.scrollTo(0, window.scrollY + stem.getBoundingClientRect().top); });
    const reading = await geometry(page);
    expect(reading.row ? reading.row.top / reading.vh : 0, JSON.stringify(reading)).toBeGreaterThanOrEqual(0.7);
    await expectCheckFits(page, false);
    // At the page's end nothing is below, so the cue goes; Check is still in view.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await settleQuestionFit(page);
    await expect(page.locator('.learn-more-cue')).toHaveCount(0);
    await expectCheckFits(page, false);
    // A pick never flips the layout back.
    await pickDemoAnswer(page, fixture);
    await expect(drop).toHaveClass(/learn-page/);
    await expectCheckFits(page, true);
  });
}

test.describe('with motion on', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('the "Answers below" chip scrolls the page smoothly to the first answer at 200% text', async ({ page }) => {
    await textAt200FromLoad(page);
    await openItemDemo(page, fixtures.find(item => item.id === 'anchoring-9')!);
    await page.getByRole('button', { name: 'Answers below' }).click();
    await expect.poll(() => firstAnswerInView(page), { message: 'the first answer ends up fully in view above Check' }).toBe(true);
    await expect(page.locator(FIRST_ANSWER).first()).toBeFocused();
  });
  test('with NANDI’s own Reduce motion on, the chip scrolls at once even though the phone allows motion', async ({ page }) => {
    await page.goto('/#you');
    await page.getByRole('button', { name: /Settings/ }).click();
    await page.getByLabel('Motion').selectOption('reduce');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
    await textAt200FromLoad(page);
    await openItemDemo(page, fixtures.find(item => item.id === 'anchoring-9')!);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
    await page.getByRole('button', { name: 'Answers below' }).click();
    // One read straight after the tap, no polling: a smooth scroll would still be on its way.
    expect(await firstAnswerInView(page), 'the first answer is fully in view at once').toBe(true);
  });
});

test('a text size change before any pick moves the question to page scroll; after a pick it waits for the next item', async ({ page }) => {
  const fixture = fixtures.find(item => item.id === 'anchoring-9')!;
  await openItemDemo(page, fixture);
  const drop = page.locator('.learn-drop');
  await expect(drop).not.toHaveClass(/learn-page/);
  await textAt200(page);
  await settleQuestionFit(page);
  await expect(drop).toHaveClass(/learn-page/);
  // Back to 100% before a pick: the fitted layout returns.
  await page.evaluate(() => document.querySelectorAll('style').forEach(style => { if (style.textContent?.includes('200%')) style.remove(); }));
  await settleQuestionFit(page);
  await expect(drop).not.toHaveClass(/learn-page/);
  await expectPageFits(page);
  // After a pick the layout holds still, even when the text size changes.
  await pickDemoAnswer(page, fixture);
  await textAt200(page);
  await settleQuestionFit(page);
  await expect(drop).not.toHaveClass(/learn-page/);
});

test('the fit follows the page when something above the question comes and goes', async ({ page }) => {
  await page.clock.setFixedTime(FIT_NOON);
  await openItemDemo(page, fixtures.find(item => item.type === 'match' && item.size === 'longest')!);
  const checkBottom = () => page.locator('.learn-check').evaluate(node => Math.round(node.getBoundingClientRect().bottom));
  const before = await checkBottom();
  // Stand-in for the one-time "Ready to work offline" notice, which sits in the page flow above the question.
  await page.evaluate(() => { const note = document.createElement('div'); note.id = 'e12-note'; note.style.height = '80px'; document.querySelector('main')!.prepend(note); });
  // With 80 px less room the question may turn to page scroll (nothing is picked yet); Check stays in view either way.
  await settleQuestionFit(page);
  await expectCheckFits(page, false);
  await page.evaluate(() => document.getElementById('e12-note')!.remove());
  await expect.poll(checkBottom, { message: 'Check returns to the bottom once the notice goes' }).toBe(before);
  await expect(page.locator('.learn-drop.learn-page')).toHaveCount(0);
  await expectPageFits(page);
  await expectAnswersShown(page);
});
