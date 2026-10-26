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
  // The svg takes no pointer events, so a second tap mid-animation still reaches the card.
  await card.click();
  await expect(card.locator('svg')).toHaveCSS('pointer-events', 'none');
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
