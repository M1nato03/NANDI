import { expect, test, type Page } from '@playwright/test';

// Spec 37: Yatra is home. Spec 45b: it is a notebook page: the useful days, the camp's heading, the five
// friends at camp (each a way to its area), then one next move (a running focus takes it).
const at = (hour: number) => new Date(`2026-10-28T${String(hour).padStart(2, '0')}:00:00`);
const tabs = (page: Page) => page.getByRole('navigation', { name: 'Main tabs' });
const heading = (page: Page) => page.getByRole('main').getByRole('heading', { level: 1 });
const strip = (page: Page) => page.locator('.next-move-go');

test('a cold open lands on Yatra, with Yatra first and lit in the tab bar', async ({ page }) => {
  await page.clock.setFixedTime(at(10));
  await page.goto('/');
  await expect(page).toHaveURL(/#yatra$/);
  await expect(tabs(page).getByRole('link')).toHaveText(['Yatra', 'Plan', 'Read', 'You']);
  await expect(tabs(page).getByRole('link', { name: 'Yatra' })).toHaveAttribute('aria-current', 'page');
  await expect(heading(page)).toHaveText('Camp at Jobra');
  await expect(page.locator('.home-week')).toHaveText(/^A fresh week/);
  // All five friends sit at the camp, each a button to its area.
  await expect(page.locator('.trek-group [data-cast]')).toHaveCount(5);
  for (const name of ['Mor', 'Chiku', 'Kachhua', 'Kapi', 'Nandi']) await expect(page.locator(`.trek-group [data-cast="${name}"]`)).toHaveCount(1);
  await expect(page.locator('.camp-friend')).toHaveCount(5);
  // Then exactly one next move, and the trek below it.
  await expect(strip(page)).toHaveCount(1);
  await expect(strip(page)).toContainText('Read one idea');
  await expect(page.locator('.trek-journey-top')).toBeVisible();
  await page.getByRole('button', { name: 'Plan, Mor at the map' }).click();
  await expect(page).toHaveURL(/#plan$/);
  await page.goto('/#yatra');
  await page.getByRole('button', { name: 'Read, Chiku on the reading rock' }).click();
  await expect(page).toHaveURL(/#read$/);
});

test('a link still wins: a notification route to Plan opens Plan', async ({ page }) => {
  await page.clock.setFixedTime(at(10));
  await page.goto('/#plan');
  await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
  await expect(tabs(page).getByRole('link', { name: 'Plan' })).toHaveAttribute('aria-current', 'page');
});

for (const [hour, words, night] of [[8, 'Camp at Jobra', false], [14, 'Camp at Jobra', false], [17, 'Camp at Jobra', false], [19, 'At Jobra', true], [22, 'At Jobra', true]] as const) {
  test(`at ${hour}:00 the heading is "${words}"`, async ({ page }) => {
    await page.clock.setFixedTime(at(hour));
    await page.goto('/');
    await expect(heading(page)).toHaveText(words);
    if (night) await expect(page.locator('.trek-scene.is-night')).toBeVisible();
    else await expect(page.locator('.trek-scene.is-night')).toHaveCount(0);
  });
}

test('a running focus is the one next move, and it opens the focus card', async ({ page }) => {
  await page.clock.install({ time: at(10) });
  await page.goto('/#plan');
  await page.getByLabel('Add a task').fill('Write the report');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const today = page.getByRole('region', { name: 'Today', exact: true });
  await today.locator('.mor-row').filter({ hasText: 'Write the report' }).getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('region', { name: 'Focus' })).toContainText('Write the report');
  await page.clock.fastForward(24 * 60_000);
  await tabs(page).getByRole('link', { name: 'Yatra' }).click();
  await expect(strip(page)).toHaveText(/^Working on 'Write the report'\s*24:\d\d on the clock\s*↗$/);
  await strip(page).click();
  await expect(page).toHaveURL(/#plan$/);
  await expect(page.getByRole('region', { name: 'Focus' })).toBeVisible();
  // Once the focus is done, the move is Read again.
  await page.getByRole('region', { name: 'Focus' }).getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('region', { name: 'Focus' })).toHaveCount(0);
  await tabs(page).getByRole('link', { name: 'Yatra' }).click();
  await expect(heading(page)).toBeVisible();
  await expect(strip(page)).toContainText('Read one idea');
});

test('a focus left running is held at "Still working?" when the app next opens on Yatra, and its XP stops there', async ({ page }) => {
  await page.clock.install({ time: at(10) });
  await page.goto('/#plan');
  await page.evaluate(() => sessionStorage.setItem('nandi.e2eGuard', JSON.stringify({ usageAllowed: true })));
  await page.getByLabel('Add a task').fill('Write the report');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('region', { name: 'Today', exact: true }).locator('.mor-row').filter({ hasText: 'Write the report' }).getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('region', { name: 'Focus' }).locator('.mor-earned')).toBeVisible();
  // NANDI is closed with the focus running, and opened again at 21:00 with no link, so it lands on Yatra, not Plan.
  await page.goto('about:blank');
  await page.clock.setSystemTime(at(21));
  await page.goto('/');
  await expect(page).toHaveURL(/#yatra$/);
  await expect(strip(page)).toHaveText(/^Paused 'Write the report'\s*6\d:\d\d on the clock\s*↗$/);
  // The pause holds: the clock does not move on.
  await page.clock.fastForward(5 * 60_000);
  await expect(strip(page)).toHaveText(/6\d:\d\d on the clock/);
  await strip(page).click();
  const card = page.getByRole('region', { name: 'Focus' });
  await expect(card).toContainText('Paused: no tap after "Still working?"');
  // 60 minutes, two clean 25-minute runs: 30 + 10, and no more.
  await expect(card.locator('.mor-earned')).toHaveText('+40 XP so far');
});
