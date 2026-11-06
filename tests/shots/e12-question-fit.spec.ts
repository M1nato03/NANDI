import { test, type Browser } from '@playwright/test';
import { questionFitExtremes, type QuestionFitFixture } from '../e2e/helpers/e12-items';
import { FIT_NOON, openItemDemo, settleQuestionFit } from '../e2e/helpers/e12-question-fit';
import { textAt200 } from '../e2e/helpers/text';

// Spec 571 §0.20 (E12): 28 normal-text shots, plus the 7 longest stems at 200% in light. No shots are taken here
// until the builder runs Playwright. Context setup mirrors stage1-571.spec.ts, including a fixed noon and @2x.
const OUT = process.env.SHOTS_DIR ?? 'D:/nandi-gate-logs/shots-571-e12';
const fixtures = questionFitExtremes();

async function shot(browser: Browser, theme: 'light' | 'dark', fixture: QuestionFitFixture, big = false) {
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    colorScheme: theme, reducedMotion: 'reduce', baseURL: test.info().project.use.baseURL });
  try {
    const page = await context.newPage();
    await page.clock.setFixedTime(FIT_NOON);
    await page.goto('/?e2e#yatra');
    await openItemDemo(page, fixture);
    if (big) await textAt200(page);
    await settleQuestionFit(page);
    await page.screenshot({ path: `${OUT}/e12-${theme}-${fixture.type}-${fixture.size}-${fixture.id}${big ? '-200-text' : ''}.png`, fullPage: false });
  } finally { await context.close(); }
}

for (const theme of ['light', 'dark'] as const) {
  for (const fixture of fixtures) {
    test(`E12 ${theme}: ${fixture.type} ${fixture.size} (${fixture.id})`, async ({ browser }) => {
      await shot(browser, theme, fixture);
    });
  }
}

for (const fixture of fixtures.filter(item => item.size === 'longest')) {
  test(`E12 light 200%: ${fixture.type} longest (${fixture.id})`, async ({ browser }) => {
    await shot(browser, 'light', fixture, true);
  });
}
