import { expect, test, type Page } from '@playwright/test';
import { textAt200 } from './helpers/text';

// Spec 571 stage 3 (E6, item 550): 200% text works on every tab top. text-200.spec checks that the text grows; this
// checks that the screens still work when it has: at 200% on a 360 × 800 phone, on each tab top and each Grow door,
// the page never scrolls sideways, no text is cut off (clipped by its box or past the screen's edge, outside a
// sideways scroller), the first action button is reachable above the tab bar, and nothing sits under the tab bar
// once scrolled to the end.
test.use({ viewport: { width: 360, height: 800 }, reducedMotion: 'reduce', colorScheme: 'light', serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date('2026-11-10T12:00:00')); });

export const TAB_TOPS = ['courtyard', 'yatra', 'grow', 'grow/read', 'grow/remember', 'grow/play', 'grow/train', 'grow/calm', 'grow/sleep', 'you', 'you/settings'];

/** Problems with the screen as it stands (200% text applied): sideways scroll and cut-off text. */
async function cutOff(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const doc = document.documentElement;
    if (doc.scrollWidth > innerWidth + 1) out.push(`page scrolls sideways: ${doc.scrollWidth} > ${innerWidth}`);
    const name = (node: Element) => `${node.tagName.toLowerCase()}.${[...node.classList].join('.')} "${(node.textContent ?? '').trim().slice(0, 28)}"`;
    // A sideways scroller (chips, shelves) may hold text past the edge on purpose.
    const inScroller = (node: Element) => { for (let up = node.parentElement; up; up = up.parentElement) { const x = getComputedStyle(up).overflowX; if (x === 'auto' || x === 'scroll') return true; } return false; };
    for (const node of document.querySelectorAll<HTMLElement>('body *')) {
      if (node.closest('svg, .sr-only, [aria-hidden="true"]') || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'OPTION'].includes(node.tagName)) continue;
      const own = [...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent!.trim());
      if (!own || !node.checkVisibility({ visibilityProperty: true, opacityProperty: true })) continue;
      const box = node.getBoundingClientRect();
      // Screen-reader-only text is a 1 px box by design.
      if (box.width <= 2 || box.height <= 2) continue;
      const style = getComputedStyle(node);
      // Book covers set their title in px inside the art (covers.spec steps it down; never clipped there).
      if (node.closest('.book-cover-title, .book-cover-author')) continue;
      const clips = style.overflowX !== 'visible' || style.textOverflow === 'ellipsis';
      if (clips && node.scrollWidth > node.clientWidth + 1 && !['auto', 'scroll'].includes(style.overflowX)) out.push(`${name(node)}: cut off (${node.scrollWidth} > ${node.clientWidth})`);
      if (!inScroller(node) && (box.right > innerWidth + 1 || box.left < -1)) out.push(`${name(node)}: past the screen edge (${box.left.toFixed(0)}..${box.right.toFixed(0)})`);
      // Clamped to a few lines with "…" (stage 3 shots: shelf titles, quest titles).
      if (style.webkitLineClamp !== 'none' && node.scrollHeight > node.clientHeight + 1) out.push(`${name(node)}: clamped (${node.scrollHeight} > ${node.clientHeight})`);
      // Spilling out of its card (stage 3 shots: a Grow door's "Remember").
      const card = node.parentElement?.closest<HTMLElement>('.card, .grow-door');
      if (card && !inScroller(node)) {
        const range = document.createRange(); range.selectNodeContents(node);
        const text = range.getBoundingClientRect(), edge = card.getBoundingClientRect();
        if (text.right > edge.right + 1 || text.left < edge.left - 1) out.push(`${name(node)}: spills out of its card (${text.left.toFixed(0)}..${text.right.toFixed(0)} vs ${edge.left.toFixed(0)}..${edge.right.toFixed(0)})`);
      }
    }
    // A friend's heading never runs under the friend (stage 3 shots: "Remember" under Moti).
    for (const stage of document.querySelectorAll<HTMLElement>('.friend-stage')) {
      const friend = stage.querySelector(':scope > svg')?.getBoundingClientRect();
      if (!friend) continue;
      for (const text of stage.querySelectorAll<HTMLElement>('.friend-stage-text h1, .friend-stage-text h2, .friend-stage-text p')) {
        const range = document.createRange(); range.selectNodeContents(text);
        for (const r of range.getClientRects()) if (r.right > friend.left + 1 && r.left < friend.right - 1 && r.bottom > friend.top + 1 && r.top < friend.bottom - 1) { out.push(`${name(text)}: runs under the friend`); break; }
      }
    }
    // A form control's value cut short (stage 3 shots: "2:" for 22:00, "Sur" for Sunday): the control narrower than
    // what its shown value needs (the shown option, or the full time with its clock).
    for (const control of document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('select, input[type="time"]')) {
      if (!control.checkVisibility() || control.closest('.sr-only')) continue;
      const shown = control.getBoundingClientRect().width;
      const value = control instanceof HTMLSelectElement ? control.selectedOptions[0]?.text ?? '' : control.value;
      // A select is measured holding only its shown option (a longer option elsewhere in the list may be cut by the
      // card's width; the one on show must not be).
      const probe = control.cloneNode(control instanceof HTMLInputElement) as HTMLInputElement | HTMLSelectElement;
      if (probe instanceof HTMLSelectElement) probe.append(new Option(value));
      probe.style.cssText += ';position:absolute;visibility:hidden;width:max-content !important;max-width:none !important;min-width:0 !important;flex:none !important';
      control.parentElement!.append(probe);
      const natural = probe.getBoundingClientRect().width;
      probe.remove();
      if (shown < natural - 1) out.push(`${control.tagName.toLowerCase()} "${value}": cut short (${shown.toFixed(0)} < ${natural.toFixed(0)})`);
    }
    return out;
  });
}

for (const route of TAB_TOPS) {
  test(`#${route} at 200% text: no sideways scroll, no cut-off text, the first action reachable, nothing lost under the tab bar`, async ({ page }) => {
    await page.goto(`/#${route}`);
    await expect(page.locator('main, .app-shell').first()).toBeVisible();
    await page.waitForTimeout(400);
    await textAt200(page);
    await page.waitForTimeout(400);
    expect(await cutOff(page), 'at the top').toEqual([]);
    // The first visible action button in the page (not the shell) can be brought above the tab bar.
    const tabTop = await page.locator('.tabbar').evaluate(node => node.getBoundingClientRect().top);
    const first = page.locator('main button:visible, main a.button:visible, .courtyard-card button:visible').first();
    if (await first.count()) {
      await first.scrollIntoViewIfNeeded();
      const box = (await first.boundingBox())!;
      expect(box.y + box.height, `${route}: first action above the tab bar`).toBeLessThanOrEqual(tabTop + 1);
    }
    // Scrolled to the end: still nothing cut off, and the last thing on the page clears the tab bar.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    expect(await cutOff(page), 'scrolled to the end').toEqual([]);
    // (The Courtyard's scene runs under the bar by design, and its card is pinned above it.)
    const last = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll<HTMLElement>('main *')].filter(node => node.checkVisibility() && node.getBoundingClientRect().height > 2 && !node.closest('.courtyard-b, .courtyard-card, .sr-only') && !node.matches('.courtyard-b-home'));
      const lowest = nodes.sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom)[0];
      return lowest ? { bottom: lowest.getBoundingClientRect().bottom, name: `${lowest.tagName.toLowerCase()}.${[...lowest.classList].join('.')}` } : { bottom: 0, name: '' };
    });
    expect(last.bottom, `${route}: the page's end (${last.name}) clears the tab bar`).toBeLessThanOrEqual(tabTop + 1);
  });
}
