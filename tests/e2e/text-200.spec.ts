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
      if (!box.width || !box.height || getComputedStyle(node).visibility === 'hidden') continue;
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
    return before > 0 && after / before < 1.8 ? [`${node.tagName.toLowerCase()}.${[...node.classList].join('.')} "${node.textContent!.trim().slice(0, 30)}" ${before}px → ${after}px`] : [];
  }));
  expect(stuck, 'text that stays small at 200%').toEqual([]);
  // b2 (7 Nov): and its lines keep apart: line-height at least 1.15x the font, no two line boxes of one element overlapping.
  const crowded = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-text100]')].flatMap(node => {
    const style = getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return [];
    const font = parseFloat(style.fontSize);
    const line = style.lineHeight === 'normal' ? font * 1.2 : parseFloat(style.lineHeight);
    const name = `${node.tagName.toLowerCase()}.${[...node.classList].join('.')} "${node.textContent!.trim().slice(0, 24)}"`;
    const problems: string[] = [];
    if (line < 1.15 * font) problems.push(`${name}: line-height ${line}px for ${font}px text`);
    const range = document.createRange();
    range.selectNodeContents(node);
    const lines = [...range.getClientRects()].filter(rect => rect.width > 0).map(rect => ({ top: Math.round(rect.top * 10) / 10, bottom: Math.round(rect.bottom * 10) / 10 }))
      .sort((a, b) => a.top - b.top).filter((rect, index, all) => index === 0 || rect.top !== all[index - 1]!.top);
    for (let index = 1; index < lines.length; index++) if (lines[index]!.top < lines[index - 1]!.bottom - 0.5) problems.push(`${name}: line ${index + 1} overlaps line ${index}`);
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
