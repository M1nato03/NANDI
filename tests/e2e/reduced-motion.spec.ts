import { expect, test, type Page } from '@playwright/test';

// K6 (Sat batch): with reduced motion on, nothing keeps moving on the courtyard, the Yatra tab or Calm.
const NOON = new Date('2026-11-13T12:00:00');
const running = (page: Page) => page.evaluate(() => document.getAnimations()
  // A one-off transition (a colour easing in on a state change) ends by itself; K6 is about motion that keeps going.
  .filter(animation => animation.playState === 'running' && animation.constructor.name !== 'CSSTransition')
  .map(animation => {
    const target = (animation.effect as KeyframeEffect | null)?.target as Element | null;
    return `${(animation as CSSAnimation).animationName ?? animation.constructor.name} on ${target?.tagName.toLowerCase() ?? '?'}.${target?.getAttribute('class')?.split(' ')[0] ?? ''}`;
  }));

for (const [name, route, ready] of [
  ['the courtyard', '/#courtyard', '.courtyard-card[data-ready]'],
  ['the Yatra tab', '/#plan', 'main .trek-strip .trek-scene'],
  ['Calm', '/#grow/calm', '.calm-screen, main h1'],
] as const) test(`reduced motion: no running animation on ${name}`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: NOON });
  await page.goto(route);
  await expect(page.locator(ready).first()).toBeVisible({ timeout: 15_000 });
  // Let first-paint motion settle.
  await page.waitForTimeout(800);
  expect(await running(page)).toEqual([]);
});
