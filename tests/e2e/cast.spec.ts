import { expect, test } from '@playwright/test';

test('cast gallery shows all poses in both themes', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto('/#you/settings');
  await page.getByText('About this app').click();
  await page.getByRole('button', { name: 'Meet the cast' }).click();
  await expect(page.getByRole('heading', { name: 'Meet the cast' })).toBeVisible();
  await expect(page.locator('.cast-gallery-pose')).toHaveCount(24);
  for (const name of ['Nandi', 'Moti', 'Chiku', 'Kapi', 'Mor', 'Kachhua']) await expect(page.locator(`[data-cast="${name}"]`)).toHaveCount(4);
  for (const theme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await page.screenshot({ path: testInfo.outputPath(`cast-${theme}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('opening plays once and a tap skips it', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-20T12:00:00') });
  await page.goto('/#plan');
  const opening = page.getByRole('button', { name: 'Skip opening animation' });
  await expect(opening).toBeVisible();
  await opening.click();
  await expect(opening).toHaveCount(0);
  await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Learn' }).click();
  await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Plan' }).click();
  await expect(opening).toHaveCount(0);
});

test('reduced motion skips opening', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#plan');
  await expect(page.getByRole('button', { name: 'Skip opening animation' })).toHaveCount(0);
});

test('Chiku stays beside a Learn question', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto('/#learn/drop');
  await page.getByRole('button', { name: /Money and markets/ }).click();
  await page.getByRole('button', { name: 'Start my first drop' }).click();
  await expect(page.locator('.learn-drop [data-cast="Chiku"]')).toBeVisible();
  const overlap = await page.evaluate(() => {
    const character = document.querySelector('.learn-drop [data-cast="Chiku"]')!.getBoundingClientRect();
    const question = document.querySelector('.learn-drop h2')!.getBoundingClientRect();
    return character.bottom > question.top && character.top < question.bottom;
  });
  expect(overlap).toBe(false);
});
