import { expect, test } from '@playwright/test';

// gate-rem2 fixes (b2, 7 Nov): the offline notice as the top bar's overlay at 100% and 200%, and the Library at 200%
// with each tile's live title line under its cover. 360x800 @2x, light and dark.
const OUT = process.env.SHOTS_DIR ?? 'D:/nandi-gate-logs/shots-rem-fixes';
const NOON = new Date('2026-11-04T12:00:00');
const big = () => document.addEventListener('DOMContentLoaded', () => { const style = document.createElement('style'); style.textContent = 'html { font-size: 200% !important; }'; document.head.append(style); });

for (const theme of ['light', 'dark'] as const) {
  for (const large of [false, true]) {
    const size = large ? '200' : '100';
    test(`offline notice ${theme} ${size}%`, async ({ browser }) => {
      // The notice comes only from the service worker, so this context allows it; a fresh context is a first open.
      const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme,
        reducedMotion: 'reduce', baseURL: test.info().project.use.baseURL });
      try {
        const page = await ctx.newPage();
        await page.clock.setFixedTime(NOON);
        if (large) await page.addInitScript(big);
        await page.goto('/#grow');
        const notice = page.getByRole('status', { name: 'Offline ready' });
        await expect(notice).toBeVisible({ timeout: 30_000 });
        await page.screenshot({ path: `${OUT}/${theme}-notice-${size}.png`, clip: { x: 0, y: 0, width: 360, height: 220 } });
      } finally { await ctx.close(); }
    });
  }
  test(`library ${theme} 200%`, async ({ browser }) => {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      colorScheme: theme, reducedMotion: 'reduce', baseURL: test.info().project.use.baseURL });
    try {
      const page = await ctx.newPage();
      await page.clock.setFixedTime(NOON);
      await page.addInitScript(big);
      await page.goto('/?e2e#grow/read');
      const library = page.getByRole('region', { name: 'Library' });
      await expect(library).toHaveClass(/large-text/);
      await page.evaluate(() => document.fonts.ready);
      await library.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${OUT}/${theme}-library-200.png` });
      await page.screenshot({ path: `${OUT}/${theme}-library-200-full.png`, fullPage: true });
    } finally { await ctx.close(); }
  });
}
