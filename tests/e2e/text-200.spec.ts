import { expect, test, type Page } from '@playwright/test';
import { textAt200 } from './helpers/text';

// b2 (6 Nov), the app-wide rem pass: the reader's text size must reach every screen, not only the question.
// On each tab and its main screens, every visible piece of HTML text at least nearly doubles at 200% text.
// (1.8, not 2: a few titles are clamp()ed to the screen width, and rounding.) SVG text is drawn art, not measured.
test.use({ viewport: { width: 360, height: 800 }, reducedMotion: 'reduce', colorScheme: 'light', serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); });

// grow/calm is the Calm sit setup; night is the Night deck; yatra/crew is Crew.
const ROUTES = ['yatra', 'plan', 'grow', 'grow/read', 'grow/play', 'grow/train', 'grow/calm', 'night', 'yatra/crew', 'you', 'you/settings', 'you/days', 'you/season', 'you/shop', 'you/badges'];

async function expectTextFollows200(page: Page) {
  await page.waitForTimeout(400);
  // Tag each visible element that holds its own text with its size at 100%.
  const tagged = await page.evaluate(() => {
    let n = 0;
    for (const node of document.querySelectorAll<HTMLElement>('body *')) {
      if (node.closest('svg') || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.tagName)) continue;
      const own = [...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent!.trim());
      if (!own) continue;
      const box = node.getBoundingClientRect();
      if (!box.width || !box.height || !node.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true })) continue;
      node.dataset.text100 = getComputedStyle(node).fontSize;
      n += 1;
    }
    return n;
  });
  expect(tagged, 'the screen shows some text').toBeGreaterThan(3);
  await textAt200(page);
  await page.waitForTimeout(300);
  const stuck = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-text100]')].flatMap(node => {
    const before = parseFloat(node.dataset.text100!), after = parseFloat(getComputedStyle(node).fontSize);
    // Cover text is a px picture (b2, gate-rem2): covers.spec.ts checks the book's title beside or under each cover is
    // live text that doubles, so the cover's own title and author are not measured here.
    if (node.closest('.book-cover-title, .book-cover-author')) return [];
    return before > 0 && after / before < 1.8 ? [`${node.tagName.toLowerCase()}.${[...node.classList].join('.')} "${node.textContent!.trim().slice(0, 30)}" ${before}px → ${after}px`] : [];
  }));
  expect(stuck, 'text that stays small at 200%').toEqual([]);
  // b2 (7 Nov): and its lines keep apart: wrapped text has a line-height of at least 1.15x the font, and no two lines collide.
  const crowded = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-text100]')].flatMap(node => {
    const style = getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return [];
    const font = parseFloat(style.fontSize);
    const line = style.lineHeight === 'normal' ? font * 1.2 : parseFloat(style.lineHeight);
    const name = `${node.tagName.toLowerCase()}.${[...node.classList].join('.')} "${node.textContent!.trim().slice(0, 24)}"`;
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
    // Book covers are cover art, set tight on purpose (1.05 title, 1.0 author) at every size; they keep the collision check.
    const art = node.closest('.book-cover-title, .book-cover-author');
    if (!art && lines.length > 1 && line < 1.15 * font) problems.push(`${name}: line-height ${line}px for ${font}px text over ${lines.length} lines`);
    for (let index = 1; index < lines.length; index++) if (lines[index]! - lines[index - 1]! < font - 0.5) problems.push(`${name}: line ${index + 1} overlaps line ${index}`);
    return problems;
  }));
  expect(crowded, 'crowded lines at 200%').toEqual([]);
}

for (const route of ROUTES) {
  test(`#${route}: every visible text follows 200% text`, async ({ page }) => {
    await page.goto(`/#${route}`);
    await expect(page.locator('main, .app-shell').first()).toBeVisible();
    await expectTextFollows200(page);
  });
}

// b2: the screens most likely to keep their own px sizes.
test('first-run Welcome follows 200% text', async ({ page }) => {
  await page.goto('/?e2e&welcome');
  await expect(page.getByRole('dialog', { name: 'Welcome to NANDI' })).toBeVisible();
  await expectTextFollows200(page);
});

test('a chapter reader follows 200% text', async ({ page }) => {
  await page.goto('/?e2e#grow/read/chapter/psychology/psychology-ch1');
  await expect(page.locator('.learn-screen, main').first()).toBeVisible();
  await expectTextFollows200(page);
});

test('the Train workout logger follows 200% text', async ({ page }) => {
  await page.goto('/#grow/train');
  await page.getByRole('button', { name: 'Start placement' }).click();
  for (let pattern = 0; pattern < 7; pattern++) {
    if (pattern === 4 || pattern === 5) await page.getByRole('spinbutton', { name: 'Clean seconds' }).fill('30');
    await page.getByRole('button', { name: 'Record test' }).click();
  }
  await page.getByRole('button', { name: 'Start session' }).click();
  await expect(page.getByText('Exercise 1 of 7')).toBeVisible();
  await expectTextFollows200(page);
});

// Spec 571 §0.20: the header's rings replaced the labelled Today dots. At 200% the brand keeps its whole word and never
// runs into the rings' slot; the rings are pictures (24 px), so they keep their size.
test('the top bar at 200% text: the brand and the rings keep apart, and the rings keep their size', async ({ page }) => {
  await page.goto('/#yatra');
  await expect(page.getByRole('navigation', { name: "Today's rings" })).toBeVisible();
  await textAt200(page);
  await page.waitForTimeout(300);
  const { brand, slot, ring } = await page.evaluate(() => {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector('.topbar .brand')!);
    const box = (rect: DOMRect) => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width });
    return { brand: box(range.getBoundingClientRect()), slot: box(document.querySelector('.today-rings-slot')!.getBoundingClientRect()), ring: box(document.querySelector('.ring-glyph')!.getBoundingClientRect()) };
  });
  const apart = brand.right <= slot.left || slot.right <= brand.left || brand.bottom <= slot.top + 0.5 || slot.bottom <= brand.top + 0.5;
  expect(apart, JSON.stringify({ brand, slot })).toBe(true);
  expect(ring.width).toBe(24);
});
