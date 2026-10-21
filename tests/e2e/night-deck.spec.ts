import { expect, test } from '@playwright/test';

test('night deck hides the tab bar on a 390x844 phone', async ({ page }) => {
  test.skip(page.viewportSize()?.width !== 390);
  await page.clock.install({ time: new Date('2026-10-17T23:40:00') });
  await page.goto('/#night');
  const next = page.getByRole('region', { name: 'Now deck' }).getByRole('button', { name: 'Next', exact: true });
  await expect(next).toBeVisible();
  const nextBox = await next.boundingBox();
  expect(nextBox).not.toBeNull();
  await expect(page.getByRole('navigation', { name: 'Main tabs' })).toHaveCount(0);
});

test('night deck is six calm cards with a three item drop and a stopping point', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.clock.install({ time: new Date('2026-10-17T23:30:00') });
  await page.goto('/#night');
  const deck = page.getByRole('region', { name: 'Now deck' });
  const shot = async (number: number) => {
    if (testInfo.project.name === 'mobile-390x844') await page.screenshot({ path: testInfo.outputPath(`night-card-${number}-390x844.png`) });
  };
  await expect(deck).toHaveClass(/deck-night/);
  await expect(deck.locator('.deck-heading h1')).toContainText('Tonight');
  await expect(deck.locator('.deck-heading .deck-count')).toHaveText('1 of 6');
  await expect(deck.locator('.deck-heading .eyebrow')).toHaveCount(0);
  await expect(deck.getByText('1 of 6')).toBeVisible();
  await expect(page.getByRole('article', { name: 'Tonight card' })).toBeVisible();
  await expect(deck.getByText('Start session')).toHaveCount(0);
  await shot(1);
  const plan = page.getByRole('region', { name: 'Night plan setting' });
  // The first night offers three one-tap plans before any form.
  await expect(plan.getByRole('textbox', { name: 'Bedtime cue' })).toHaveCount(0);
  await plan.getByRole('button', { name: 'If I reach for one more scroll, then I open my night deck.' }).click();
  await expect(deck.getByText('You opened NANDI instead. That counts.')).toBeVisible();

  await deck.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Night drop card' })).toBeVisible();
  const pick = page.locator('.learn-topic-tile').first();
  // Wait for the card to load (topic pick or the drop) before deciding; isVisible() alone does not wait.
  await expect(pick.or(page.locator('.learn-drop-head'))).toBeVisible();
  if (await pick.isVisible()) {
    await pick.click();
    await page.getByRole('button', { name: 'Start my first drop' }).click();
  }
  await expect(page.locator('.learn-drop-head')).toContainText('1 / 3');
  await shot(2);
  for (let item = 0; item < 3; item++) {
    for (let attempt = 0; attempt < 12; attempt++) {
      if (await page.locator('.learn-feedback').isVisible()) break;
      if (await page.locator('.learn-confidence').isVisible()) { await page.locator('.learn-confidence').getByRole('button', { name: 'Check' }).click(); break; }
      const slider = page.locator('.learn-estimate input[type=range]');
      if (await slider.isVisible()) { await slider.fill((await slider.getAttribute('max'))!); continue; }
      await page.locator('.learn-options button:enabled').first().click();
    }
    await expect(page.locator('.learn-feedback')).toBeVisible();
    await expect(page.locator('.learn-feedback').getByRole('button', { name: 'Next' })).toBeEnabled();
    await page.locator('.learn-feedback').getByRole('button', { name: 'Next' }).dispatchEvent('click');
    if (item < 2) await expect(page.locator('.learn-drop-head')).toContainText(`${item + 2} / 3`);
  }
  await expect(page.locator('.learn-stop')).toContainText('3 questions explored');
  await page.locator('.learn-stop').getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('article', { name: 'Think card' })).toBeVisible();
  await expect(page.locator('.deck-puzzle')).toBeVisible();
  await shot(3);
  await deck.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Today, in words card' })).toBeVisible();
  await shot(4);
  await page.getByLabel('Name one small step').fill('Open the notes');
  await page.getByRole('article', { name: 'Today, in words card' }).getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('article', { name: 'Today, in words card' })).toContainText('Open the notes');

  await deck.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Phone-down move card' })).toBeVisible();
  await shot(5);
  await page.getByRole('button', { name: 'I’ll do it' }).click();
  await deck.getByRole('button', { name: 'Next', exact: true }).click();
  const stop = page.getByRole('article', { name: 'That’s tonight card' });
  await expect(stop).toContainText('That’s tonight. Phone down.');
  await expect(stop).toContainText('01:30');
  await shot(6);
  await expect(deck.getByRole('button', { name: 'Next', exact: true })).toHaveCount(0);
  await expect(stop.getByRole('button')).toHaveCount(2);
  await stop.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/#plan$/);
  await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
  await page.clock.setFixedTime(new Date('2026-10-18T04:05:00'));
  await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
  await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
});

test('hard daily offers a matching easy night practice board', async ({ page }) => {
  test.setTimeout(60_000);
  await page.clock.install({ time: new Date('2026-10-17T23:30:00') });
  await page.goto('/#night');
  const deck = page.getByRole('region', { name: 'Now deck' });
  await expect(deck).toHaveClass(/deck-night/);
  await deck.getByRole('button', { name: 'Go to card 3: Think' }).click();
  const card = page.getByRole('article', { name: 'Think card' });
  await expect(card.getByRole('heading', { name: 'Crowns' })).toBeVisible();
  await expect(card.getByText('Easy practice')).toBeVisible();
  await expect(card.getByText('hard board')).toHaveCount(0);
  const previewSeed = await card.getByRole('img', { name: 'Preview of Crowns board' }).getAttribute('data-board-seed');
  expect(previewSeed).toBeTruthy();
  await card.getByRole('button', { name: 'Play' }).click();
  const board = page.locator('.mind-board');
  await expect(page.getByRole('grid', { name: 'Crowns board' })).toBeVisible({ timeout: 30_000 });
  await expect(board.locator('.eyebrow')).toHaveText('Practice · easy');
  await expect(board).toHaveAttribute('data-board-seed', previewSeed!);
});

test('easy unsolved daily stays on the night card', async ({ page }) => {
  test.setTimeout(60_000);
  await page.clock.install({ time: new Date('2026-10-19T23:30:00') });
  await page.goto('/#night');
  const deck = page.getByRole('region', { name: 'Now deck' });
  await expect(deck).toHaveClass(/deck-night/);
  await deck.getByRole('button', { name: 'Go to card 3: Think' }).click();
  const card = page.getByRole('article', { name: 'Think card' });
  await expect(card.getByRole('heading', { name: 'Mini Sudoku' })).toBeVisible();
  await expect(card.getByText('easy board')).toBeVisible();
  await expect(card.getByText('Easy practice')).toHaveCount(0);
  const previewSeed = await card.getByRole('img', { name: 'Preview of Mini Sudoku board' }).getAttribute('data-board-seed');
  expect(previewSeed).toBeTruthy();
  await card.getByRole('button', { name: 'Play' }).click();
  const board = page.locator('.mind-board');
  await expect(page.getByRole('grid', { name: 'Mini Sudoku board' })).toBeVisible({ timeout: 30_000 });
  await expect(board.locator('.eyebrow')).toContainText('Daily board');
  await expect(board).toHaveAttribute('data-board-seed', previewSeed!);
});
