import { expect, test, type Page } from '@playwright/test';

// K6 (Sat batch): with reduced motion on, nothing keeps moving on the courtyard, the Yatra tab or Calm (setup and a sit).
const NOON = new Date('2026-11-13T12:00:00');
/** A transition that only repaints (colour, fill, opacity, shadow) moves nothing; one that moves a thing still fails. */
const PAINT_ONLY = ['color', 'background-color', 'border-color', 'outline-color', 'fill', 'stroke', 'opacity', 'box-shadow'];
const running = (page: Page) => page.evaluate(paintOnly => {
  const moving: string[] = [];
  const skipped: string[] = [];
  for (const animation of document.getAnimations()) {
    if (animation.playState !== 'running') continue;
    const effect = animation.effect as KeyframeEffect | null;
    const target = effect?.target as Element | null;
    const where = `${target?.tagName.toLowerCase() ?? '?'}.${target?.getAttribute('class')?.split(' ')[0] ?? ''}`;
    if (animation instanceof CSSTransition) {
      const timing = effect?.getComputedTiming();
      const line = `transition ${animation.transitionProperty} on ${where} (duration ${timing?.duration} ms, delay ${timing?.delay} ms)`;
      if (paintOnly.includes(animation.transitionProperty)) { skipped.push(line); continue; }
      moving.push(line);
    } else moving.push(`${(animation as CSSAnimation).animationName ?? animation.constructor.name} on ${where}`);
  }
  return { moving, skipped };
}, PAINT_ONLY);

async function check(page: Page) {
  // Let first-paint motion settle.
  await page.waitForTimeout(800);
  const { moving, skipped } = await running(page);
  // b2 13 Nov: say what a skipped repaint was (the brand mark's, sat-retry-785138b), so it is never a guess.
  if (skipped.length) console.log(`reduced motion, repaint-only transitions still running: ${skipped.join('; ')}`);
  expect(moving).toEqual([]);
}

for (const [name, route, ready] of [
  ['the courtyard', '/#courtyard', '.courtyard-card[data-ready]'],
  ['the Yatra tab', '/#plan', 'main .trek-strip .trek-scene'],
  ['Calm', '/#grow/calm', '.calm-screen, main h1'],
] as const) test(`reduced motion: no running animation on ${name}`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: NOON });
  await page.goto(route);
  await expect(page.locator(ready).first()).toBeVisible({ timeout: 15_000 });
  await check(page);
});

test('reduced motion: a Calm sit running has no moving breath shell', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: NOON });
  await page.goto('/#grow/calm');
  await page.locator('.calm-start').click();
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible({ timeout: 15_000 });
  await check(page);
});
