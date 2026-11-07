import { expect, type Page } from '@playwright/test';
import { bundledItems, type QuestionFitFixture } from './e12-items';

export const FIT_NOON = new Date('2026-11-06T12:00:00');

export async function settleQuestionFit(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

export async function openItemDemo(page: Page, fixture: QuestionFitFixture) {
  const item = bundledItems.find(item => item.id === fixture.id);
  if (!item) throw new Error(`Missing bundled item ${fixture.id}`);
  expect(item.type).toBe(fixture.type);
  expect(item.stem.length).toBe(fixture.stemLength);
  await page.goto(`/?e2e&item=${encodeURIComponent(item.id)}#grow/read/item-demo`);
  // Match the shot harness: finish the first open's offline-ready reload before measuring or adding 200% text.
  await page.reload();
  await expect(page.locator('.learn-fit .learn-stem')).toHaveText(item.stem);
  await expect(page.locator('.learn-drop-head')).toHaveText('1 / 1');
  await settleQuestionFit(page);
  return item;
}

export async function expectPageFits(page: Page) {
  await expect.poll(() => page.evaluate(() => {
    const root = document.scrollingElement;
    return !!root && root.scrollHeight <= innerHeight + 1 && root.scrollWidth <= innerWidth + 1 && scrollY === 0;
  }), { message: 'The page fits the viewport without scrolling' }).toBe(true);
}

export async function expectAnswersShown(page: Page) {
  // Jenil's E12 complaint: nothing may hint "there is more below". At 360x800 the whole middle (stem and every answer)
  // shows without scrolling it; only 200% text may scroll the middle.
  await expect.poll(() => page.evaluate(() => {
    const middle = document.querySelector<HTMLElement>('.learn-fit > .learn-q');
    if (!middle) return 'no middle';
    const over = middle.scrollHeight - middle.clientHeight;
    return over <= 1 ? 'fits' : `over by ${over}: inner ${innerHeight}, visual ${visualViewport?.height}, scale ${visualViewport?.scale}, middle ${middle.clientHeight}, fit ${middle.parentElement!.style.getPropertyValue('--fit-h')}, top ${Math.round(middle.parentElement!.getBoundingClientRect().top)}, ${[...middle.children].map(child => `${child.className.split(' ')[0]} ${Math.round(child.getBoundingClientRect().height)}`).join(', ')}`;
  }), { message: 'The stem and every answer show without scrolling the middle' }).toBe('fits');
}

export async function expectCheckFits(page: Page, enabled: boolean) {
  // Covers the new-item Check, review pair and gold confidence chips without scrolling any of them into view.
  // In page mode (large text) the "Answers below" chevron rides on the row's top edge; it is not a Check control.
  const buttons = page.locator('.learn-check button:not(.learn-more-cue button)');
  await expect.poll(() => buttons.count()).toBeGreaterThan(0);
  await expect.poll(() => buttons.evaluateAll(nodes => nodes.length > 0 && nodes.every(node => {
    const box = node.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight;
  })), { message: 'Every Check control is fully inside the viewport' }).toBe(true);
  for (const button of await buttons.all()) {
    if (enabled) await expect(button).toBeEnabled();
    else await expect(button).toBeDisabled();
  }
}

export async function pickDemoAnswer(page: Page, fixture: QuestionFitFixture) {
  const item = bundledItems.find(item => item.id === fixture.id)!;
  const options = page.locator('.learn-options');
  const tap = async (id: string) => {
    const option = item.options.find(option => option.id === id);
    if (!option) throw new Error(`Missing option ${id} in ${item.id}`);
    await options.getByRole('button', { name: option.text, exact: true }).click();
  };
  if (item.type === 'order') {
    for (const id of item.answer) await tap(id);
  } else if (item.type === 'match') {
    const used = new Set<string>();
    for (const pair of item.answer) {
      const key = [pair.left, pair.right].sort().join('|');
      if (used.has(key)) continue;
      used.add(key);
      await tap(pair.left);
      await tap(pair.right);
    }
  } else if (item.type === 'estimate') {
    const slider = page.getByRole('slider', { name: 'Your guess' });
    const before = await slider.inputValue();
    await slider.press('ArrowRight');
    await expect(slider).not.toHaveValue(before);
  } else await options.getByRole('button').first().click();
  await settleQuestionFit(page);
}
