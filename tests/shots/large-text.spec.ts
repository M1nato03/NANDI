import { expect, test } from '@playwright/test';
import { FIT_NOON, openItemDemo, settleQuestionFit } from '../e2e/helpers/e12-question-fit';
import { questionFitExtremes } from '../e2e/helpers/e12-items';

// Large text page scroll (b2, 7 Nov): the longest item of each of the 7 types at 200% text from load, light and dark,
// 360x800 @2x. Two shots each: as it opens (no auto-scroll) and after "Answers below".
const OUT = process.env.SHOTS_DIR ?? 'D:/nandi-gate-logs/shots-large-text';

for (const theme of ['light', 'dark'] as const) {
  test(`large text ${theme}`, async ({ browser }) => {
    test.setTimeout(180_000);
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      colorScheme: theme, reducedMotion: 'reduce', baseURL: test.info().project.use.baseURL });
    try {
      const page = await ctx.newPage();
      await page.clock.setFixedTime(FIT_NOON);
      await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const style = document.createElement('style'); style.textContent = 'html { font-size: 200% !important; }'; document.head.append(style); }));
      for (const fixture of questionFitExtremes().filter(item => item.size === 'longest')) {
        await openItemDemo(page, fixture);
        await expect(page.locator('.learn-drop')).toHaveClass(/learn-page/);
        await page.screenshot({ path: `${OUT}/${theme}-${fixture.type}-1-open.png` });
        await page.getByRole('button', { name: 'Answers below' }).click();
        await settleQuestionFit(page);
        await page.screenshot({ path: `${OUT}/${theme}-${fixture.type}-2-answers.png` });
      }
    } finally { await ctx.close(); }
  });
}
