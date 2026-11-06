import { expect, test, type Page } from '@playwright/test';
import { textAt200 } from './helpers/text';

// Spec 50 §4 (Jenil's phone shot, 1 Nov): a cover title wraps at spaces only ("Babylo|n" was split), and one too big
// for its cover steps its font down instead of losing its first line at the top ("How to Win…" was cut off).
const NOON = new Date('2026-11-04T12:00:00');

/** For every cover on the page: is any word split across lines, does the title start inside the cover, and does it fit across? */
const coverReport = (page: Page) => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.book-cover')].map(cover => {
  const title = cover.querySelector<HTMLElement>('.book-cover-title')!;
  const node = title.firstChild!;
  const text = node.textContent ?? '';
  const split: string[] = [];
  for (const match of text.matchAll(/\S+/g)) {
    const range = document.createRange();
    range.setStart(node, match.index!); range.setEnd(node, match.index! + match[0].length);
    const tops = new Set([...range.getClientRects()].map(rect => Math.round(rect.top)));
    if (tops.size > 1) split.push(match[0]);
  }
  const box = cover.getBoundingClientRect(), line = title.getBoundingClientRect();
  const padTop = parseFloat(getComputedStyle(cover).paddingTop);
  return { text, split, topInside: line.top >= box.top + padTop - 1, fitsAcross: title.scrollWidth <= title.clientWidth + 1, px: parseFloat(getComputedStyle(title).fontSize) };
}));

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

// The phone's own font size (Android's text zoom) scales even pixel sizes, so the cover titles grow on the phone where
// 200% root text does not move them; `zoomed` stands in for it by making the titles a third larger.
const ZOOM = '.read-library .book-cover .book-cover-title, .read-continue .book-cover .book-cover-title { font-size: 20px; } .read-continue .cover-thumb .book-cover-title { font-size: 13px; }';
for (const [big, zoomed] of [[false, false], [true, false], [false, true]] as const) {
  test(`every Library cover keeps whole words and its whole title${big ? ' at 200% text' : ''}${zoomed ? " with the phone's text larger" : ''}`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.clock.install({ time: NOON });
    // The phone's text size is there from the first frame, so it goes in before the app starts.
    if (zoomed) await page.addInitScript(css => {
      const add = () => { if (!document.head || document.getElementById('zoom-stand-in')) return false; const style = document.createElement('style'); style.id = 'zoom-stand-in'; style.textContent = css; document.head.append(style); return true; };
      if (!add()) { const watch = new MutationObserver(() => { if (add()) watch.disconnect(); }); watch.observe(document, { childList: true, subtree: true }); }
    }, ZOOM);
    await page.goto('/?e2e#grow/read');
    await expect(page.getByRole('region', { name: 'Library' })).toBeVisible();
    if (big) await textAt200(page);
    await page.evaluate(() => document.fonts.ready);
    if (zoomed) expect(await page.evaluate(() => !!document.getElementById('zoom-stand-in'))).toBe(true);
    await expect.poll(async () => (await coverReport(page)).length).toBeGreaterThan(3);
    // The fit runs again once the display face has loaded.
    await expect.poll(async () => (await coverReport(page)).filter(cover => cover.split.length || !cover.topInside || !cover.fitsAcross)).toEqual([]);
    const report = await coverReport(page);
    expect(report.map(cover => cover.text)).toContain('How to Win Friends and Influence People');
    expect(report.every(cover => cover.px >= 7)).toBe(true);
  });
}

test('the cover is a picture only: the tile still says the full title', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#grow/read');
  await expect(page.getByRole('button', { name: /^How to Win Friends and Influence People · / })).toBeVisible();
  await expect(page.locator('.book-cover').first()).toHaveAttribute('aria-hidden', 'true');
});
