import { expect, test, type Page } from '@playwright/test';

// b2 14 Nov (walkthrough w02): over a scene of friends the economy toast drops its own friend and the scene stays whole;
// no camp label is left without its friend. (cast.css: the one-friend rule hides the cast only where no scene is shown.)
const NOON = new Date('2026-11-10T12:00:00');
const hiddenCasts = (page: Page, scope: string) => page.evaluate(selector => [...document.querySelectorAll<SVGElement>(`${selector} .cast-svg`)]
  .filter(node => { const style = getComputedStyle(node); return style.visibility === 'hidden' || style.opacity === '0'; }).length, scope);

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('a fresh user\'s 6-minute focus: while its toast shows, all five camp friends are visible and the toast has no friend', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#yatra');
  await expect(page.locator('main .trek-strip .trek-scene')).toBeVisible({ timeout: 15_000 });
  await page.getByLabel('Add a task').fill('Water the plants');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('region', { name: 'Today', exact: true }).locator('.mor-row').filter({ hasText: 'Water the plants' }).getByRole('button', { name: 'Start' }).click();
  await page.clock.fastForward(6 * 60_000);
  await page.getByRole('region', { name: 'Focus' }).getByRole('button', { name: 'Done' }).click();
  const toast = page.locator('.economy-toast');
  await expect(toast).toBeVisible();
  await expect(page.locator('main .trek-strip .camp-friend')).toHaveCount(5);
  expect(await hiddenCasts(page, 'main .trek-strip')).toBe(0);
  // Every label sits with its friend: each camp button holds both.
  for (const friend of await page.locator('main .trek-strip .camp-friend').all()) {
    await expect(friend.locator('.cast-svg')).toBeVisible();
    await expect(friend.locator('.camp-label')).toBeVisible();
  }
  await expect(toast.locator('.cast-svg')).toBeHidden();
  // One Mor in Plan still holds (J3).
  await expect(page.locator('main [data-cast="Mor"]:not(.courtyard-banner *)')).toHaveCount(1);
});

test('on the Courtyard a toast leaves the courtyard friends visible and drops its own friend', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#courtyard');
  await expect(page.locator('.courtyard-b .cast-svg').first()).toBeVisible({ timeout: 15_000 });
  const before = await page.locator('.courtyard-b .cast-svg').count();
  // The toast's markup as FinishMoment draws it (the rule under test is CSS).
  await page.evaluate(() => { const toast = document.createElement('div'); toast.className = 'economy-toast'; toast.innerHTML = '<svg class="cast-svg" data-cast="Mor" width="38" height="38"></svg><span>+5 XP</span>'; document.body.append(toast); });
  expect(await hiddenCasts(page, '.courtyard-b')).toBe(0);
  await expect(page.locator('.courtyard-b .cast-svg')).toHaveCount(before);
  await expect(page.locator('body > .economy-toast .cast-svg')).toBeHidden();
});
