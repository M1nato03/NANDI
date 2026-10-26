import { expect, test } from '@playwright/test';

// Spec 31, living friends: one shared set of small moments for every friend, never in the way.
test('Meet the cast: tapping a pose card plays its natural moment, once per tap', async ({ page }) => {
  await page.goto('/?e2e#you/cast');
  const card = page.getByRole('button', { name: 'Kapi cheer: play' });
  await card.click();
  await expect(card.locator('svg')).toHaveAttribute('data-moment', 'hop');
  await page.getByRole('button', { name: 'Kachhua rest: play' }).click();
  await expect(page.getByRole('button', { name: 'Kachhua rest: play' }).locator('svg')).toHaveAttribute('data-moment', 'settle');
});

test('a friend mid-hop never blocks a tap on what lies under it', async ({ page }) => {
  await page.goto('/?e2e#you/cast');
  const card = page.getByRole('button', { name: 'Nandi cheer: play' });
  await card.click();
  const first = await card.locator('.cast-move').evaluate(node => { (node as HTMLElement).dataset.mark = 'first'; return true; });
  expect(first).toBe(true);
  // The svg takes no pointer events, so a second tap mid-animation still reaches the card and restarts the hop.
  await card.click();
  await expect(card.locator('svg')).toHaveCSS('pointer-events', 'none');
  await expect(card.locator('svg')).toHaveAttribute('data-moment', 'hop');
  await expect(card.locator('.cast-move[data-mark="first"]')).toHaveCount(0);
});

test('reduced motion: no friend moves anywhere, only the pose', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.setFixedTime(new Date('2026-11-03T12:00:00'));
  for (const route of ['you/cast', 'learn', 'plan']) {
    await page.goto(`/?e2e#${route}`);
    if (route === 'you/cast') await page.getByRole('button', { name: 'Mor cheer: play' }).click();
    const names = await page.locator('.cast-svg, .cast-svg *').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).animationName).filter(name => name !== 'none'));
    expect(names, route).toEqual([]);
  }
});

test('six friends hopping together move only by transform and opacity (no layout work)', async ({ page }) => {
  await page.goto('/?e2e#you/cast');
  const props = await page.evaluate(() => {
    const seen = new Set<string>();
    for (const sheet of [...document.styleSheets]) {
      let rules: CSSRuleList;
      try { rules = sheet.cssRules; } catch { continue; }
      for (const rule of [...rules]) {
        if (!(rule instanceof CSSKeyframesRule) || !/^cast-/.test(rule.name)) continue;
        for (const frame of [...rule.cssRules] as CSSKeyframeRule[]) for (const name of [...frame.style]) seen.add(name);
      }
    }
    return [...seen];
  });
  expect(props.length).toBeGreaterThan(0);
  expect(props.filter(name => !['transform', 'opacity'].includes(name))).toEqual([]);
});

