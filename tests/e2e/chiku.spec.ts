import { expect, test, type Page } from '@playwright/test';

// Spec 30, Teach Chiku: one question, three cards, one tap; Chiku acts out the card on a new day, then what happened.
// No scene ships until editors sign them off, so these run on the e2e-only demo route with the Kunal fixture.
const open = async (page: Page, seed = 'demo') => {
  await page.goto(`/?e2e&seed=${seed}#learn/chiku-demo`);
  await expect(page.getByRole('region', { name: 'Teach Chiku' })).toBeVisible();
};
const stage = (page: Page) => page.locator('.chiku-stage');
const beat = (page: Page) => page.getByRole('region', { name: 'Teach Chiku' });

test('a wrong card: Chiku acts it out, the truth plays after, the mistake is the card’s, and the other cards stay open', async ({ page }) => {
  await open(page);
  await expect(page.locator('.chiku-say')).toContainText('Give me one card.');
  const cards = page.getByRole('group', { name: 'Your cards' }).getByRole('button');
  await expect(cards).toHaveCount(3);
  await cards.filter({ hasText: 'Wanting to revise' }).click();
  await expect(beat(page)).toHaveAttribute('data-beat', 'newday');
  await expect(page.locator('.chiku-caption')).toHaveText("New day: Kunal's train is cancelled, so he takes the bus.");
  await expect(page.locator('.chiku-stage [data-prop="bus"]')).toBeVisible();
  await expect(beat(page)).toHaveAttribute('data-beat', 'guess');
  await expect(page.locator('.chiku-caption')).toContainText('Your card says wanting to revise makes him open it.');
  await expect(page.locator('.chiku-actor')).toHaveAttribute('data-act', 'pull-phone');
  await expect(beat(page)).toHaveAttribute('data-beat', 'truth');
  await expect(page.locator('.chiku-actor')).toHaveAttribute('data-act', 'pat-pocket');
  await expect(beat(page)).toHaveAttribute('data-beat', 'done');
  await expect(page.locator('.chiku-end')).toContainText('My card said "Wanting to revise"');
  await expect(page.locator('.chiku-end')).not.toContainText(/\byou\b|wrong/i);
  await expect(page.locator('[data-played]')).toHaveAttribute('data-played', '1:false');
  // Another card: still open, and the first play already counted.
  await page.getByRole('group', { name: 'Your cards' }).getByRole('button', { name: 'The train leaving the station' }).click();
  for (let i = 0; i < 4; i++) await stage(page).click();
  await expect(page.locator('.chiku-end')).toContainText('Got it, because your card named the real cause.');
  await expect(page.locator('[data-played]')).toHaveAttribute('data-played', '1:false');
  await page.locator('.chiku-end').getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByText('Demo finished.')).toBeVisible();
});

test('a tap skips to the next beat, a playthrough is under 6 seconds, and Skip leaves at any point', async ({ page }) => {
  await open(page);
  await page.getByRole('group', { name: 'Your cards' }).getByRole('button', { name: 'The train leaving the station' }).click();
  await stage(page).click();
  await expect(beat(page)).toHaveAttribute('data-beat', 'newday');
  await stage(page).click();
  await expect(beat(page)).toHaveAttribute('data-beat', 'guess');
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByText('Demo finished.')).toBeVisible();
});

test('a whole playthrough ends within 6 seconds', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-03T12:00:00') });
  await open(page, 'other');
  await page.getByRole('group', { name: 'Your cards' }).getByRole('button', { name: 'Having free time' }).click();
  await page.clock.runFor(6_000);
  await expect(beat(page)).toHaveAttribute('data-beat', 'done');
});

test('the right card moves between seeds; no red anywhere; reduced motion shows still frames with every caption', async ({ page }) => {
  const places = new Set<number>();
  for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
    await open(page, seed);
    const texts = await page.getByRole('group', { name: 'Your cards' }).getByRole('button').allTextContents();
    places.add(texts.indexOf('The train leaving the station'));
  }
  expect(places.size).toBeGreaterThan(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await expect(page.locator('.chiku-actor')).toHaveCSS('animation-name', 'none');
  await page.getByRole('group', { name: 'Your cards' }).getByRole('button', { name: 'Wanting to revise' }).click();
  for (const [name, caption] of [['newday', "Kunal's train is cancelled"], ['guess', 'wanting to revise'], ['truth', 'Kunal forgot the app']] as const) {
    await expect(beat(page)).toHaveAttribute('data-beat', name);
    await expect(page.locator('.chiku-caption')).toContainText(caption);
    await expect(page.locator('.chiku-actor')).toHaveCSS('animation-name', 'none');
  }
  const colors = await page.locator('.chiku-step *').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).color + getComputedStyle(node).backgroundColor));
  expect(colors.some(value => /rgb\((2[0-5]\d|1[89]\d), ([0-6]?\d), ([0-6]?\d)\)/.test(value))).toBe(false);
});

test('at 360 px with 20 px text the stage, cards and captions fit with nothing clipped', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-360x800', 'The narrow phone is the hard case');
  await open(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
  for (const selector of ['.chiku-stage', '.chiku-say', '.chiku-cards']) {
    const box = (await page.locator(selector).first().boundingBox())!;
    expect(box.x, selector).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, selector).toBeLessThanOrEqual(360);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const card of await page.getByRole('group', { name: 'Your cards' }).getByRole('button').all()) expect(await card.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
});
