import { expect, test, type Browser } from '@playwright/test';
import { FIT_NOON, openItemDemo, settleQuestionFit } from '../e2e/helpers/e12-question-fit';
import { questionFitExtremes } from '../e2e/helpers/e12-items';
import { textAt200 } from '../e2e/helpers/text';

// Follow-ups after stage 1 (b2, 7 Nov): the offline notice in the top bar (Yatra and a question screen; light, dark,
// 200%), Match columns, the 200% line spacing, Read's shelf gutter and Remember's empty cards. 360x800 @2x.
const OUT = process.env.SHOTS_DIR ?? 'D:/nandi-gate-logs/shots-post-571';

async function context(browser: Browser, theme: 'light' | 'dark', serviceWorkers: 'allow' | 'block') {
  return browser.newContext({ serviceWorkers, viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    colorScheme: theme, reducedMotion: 'reduce', baseURL: test.info().project.use.baseURL });
}

for (const theme of ['light', 'dark'] as const) {
  for (const big of [false, true]) {
    for (const [name, url] of [['yatra', '/#yatra'], ['question', '/?e2e&item=anchoring-9#grow/read/item-demo']] as const) {
      test(`notice ${theme} ${name}${big ? ' 200%' : ''}`, async ({ browser }) => {
        const ctx = await context(browser, theme, 'allow');
        try {
          const page = await ctx.newPage();
          await page.clock.setFixedTime(FIT_NOON);
          if (big) await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const style = document.createElement('style'); style.textContent = 'html { font-size: 200% !important; }'; document.head.append(style); }));
          await page.goto(url);
          await expect(page.getByRole('status', { name: 'Offline ready' })).toBeVisible({ timeout: 30_000 });
          await page.screenshot({ path: `${OUT}/notice-${theme}-${name}${big ? '-200' : ''}.png` });
        } finally { await ctx.close(); }
      });
    }
  }
  test(`match + line spacing ${theme}`, async ({ browser }) => {
    const ctx = await context(browser, theme, 'block');
    try {
      const page = await ctx.newPage();
      await page.clock.setFixedTime(FIT_NOON);
      for (const fixture of questionFitExtremes().filter(item => item.type === 'match' || (item.size === 'longest' && ['choose', 'scenario'].includes(item.type)))) {
        await openItemDemo(page, fixture);
        await page.screenshot({ path: `${OUT}/q-${theme}-${fixture.type}-${fixture.size}-${fixture.id}.png` });
        if (fixture.size === 'longest') {
          await textAt200(page);
          await settleQuestionFit(page);
          await page.screenshot({ path: `${OUT}/q-${theme}-${fixture.type}-${fixture.id}-200.png` });
          await page.evaluate(() => document.querySelectorAll('style').forEach(style => { if (style.textContent?.includes('200%')) style.remove(); }));
        }
      }
      await page.goto('/?e2e#grow/read');
      await expect(page.locator('.read-shelf-row').first()).toBeVisible();
      await page.screenshot({ path: `${OUT}/read-shelf-${theme}.png` });
      await page.goto('/?e2e#grow/remember/cards');
      await expect(page.getByText('No cards to review.')).toBeVisible();
      await page.screenshot({ path: `${OUT}/remember-cards-empty-${theme}.png` });
    } finally { await ctx.close(); }
  });
}
