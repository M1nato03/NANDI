import { expect, test, type Page } from '@playwright/test';

// Spec 37: Yatra is home. The app opens on it, with a greeting, the camp, a strip back to a running focus, then the doors.
const at = (hour: number) => new Date(`2026-10-28T${String(hour).padStart(2, '0')}:00:00`);
const tabs = (page: Page) => page.getByRole('navigation', { name: 'Main tabs' });
const greeting = (page: Page) => page.getByRole('main').getByRole('heading', { level: 1 });
const strip = (page: Page) => page.locator('.yatra-focus-strip');

test('a cold open lands on Yatra, with Yatra first and lit in the tab bar', async ({ page }) => {
  await page.clock.setFixedTime(at(10));
  await page.goto('/');
  await expect(page).toHaveURL(/#yatra$/);
  await expect(tabs(page).getByRole('link')).toHaveText(['Yatra', 'Plan', 'Read', 'You']);
  await expect(tabs(page).getByRole('link', { name: 'Yatra' })).toHaveAttribute('aria-current', 'page');
  await expect(greeting(page)).toHaveText('Good morning.');
  await expect(page.locator('.yatra-welcome .eyebrow')).toHaveText('Yatra · Hampta Pass');
  await expect(page.locator('.yatra-quiet')).toHaveText(/^(Take a breath\. Then pick one small thing\.|Nothing is due this minute\.|There is room to begin gently\.|Stay a little\. The day is yours\.|The trail can wait until you are ready\.)$/);
  // All five friends sit at the camp.
  await expect(page.locator('.trek-group [data-cast]')).toHaveCount(5);
  for (const name of ['Mor', 'Chiku', 'Kachhua', 'Kapi', 'Nandi']) await expect(page.locator(`.trek-group [data-cast="${name}"]`)).toHaveCount(1);
  // Then the doors, in order, and the trek below.
  await expect(page.getByRole('heading', { name: 'Whenever you feel ready' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Doors' }).getByRole('button')).toHaveText([/Plan my day\s*With Mor/, /Read a little\s*With Chiku/]);
  await expect(page.getByRole('list', { name: 'Corners' }).getByRole('button')).toHaveText([/Train/, /Mind/, /Calm/]);
  await expect(page.locator('.trek-journey-top')).toBeVisible();
  // No focus is open, so there is no strip.
  await expect(strip(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Plan my day: With Mor' }).click();
  await expect(page).toHaveURL(/#plan$/);
  await page.goto('/#yatra');
  await page.getByRole('button', { name: 'Read a little: With Chiku' }).click();
  await expect(page).toHaveURL(/#read$/);
});

test('a link still wins: a notification route to Plan opens Plan', async ({ page }) => {
  await page.clock.setFixedTime(at(10));
  await page.goto('/#plan');
  await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
  await expect(tabs(page).getByRole('link', { name: 'Plan' })).toHaveAttribute('aria-current', 'page');
});

for (const [hour, words, night] of [[8, 'Good morning.', false], [14, 'Good afternoon.', false], [19, 'Good evening.', false], [22, 'Good night.', true]] as const) {
  test(`at ${hour}:00 the greeting is "${words}"`, async ({ page }) => {
    await page.clock.setFixedTime(at(hour));
    await page.goto('/');
    await expect(greeting(page)).toHaveText(words);
    if (night) await expect(page.locator('.yatra-quiet')).toHaveText('The friends are by the fire tonight.');
    else await expect(page.locator('.yatra-quiet')).not.toHaveText('The friends are by the fire tonight.');
  });
}

test('a running focus shows one strip under the camp, and it opens the focus card', async ({ page }) => {
  await page.clock.install({ time: at(10) });
  await page.goto('/#plan');
  await page.getByLabel('Add a task').fill('Write the report');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const today = page.getByRole('region', { name: 'Today', exact: true });
  await today.locator('.mor-row').filter({ hasText: 'Write the report' }).getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('region', { name: 'Focus' })).toContainText('Write the report');
  await page.clock.fastForward(24 * 60_000);
  await tabs(page).getByRole('link', { name: 'Yatra' }).click();
  await expect(strip(page)).toHaveText(/^Working on 'Write the report' · 24:\d\d\s*Open$/);
  await strip(page).click();
  await expect(page).toHaveURL(/#plan$/);
  await expect(page.getByRole('region', { name: 'Focus' })).toBeVisible();
  // Once the focus is done the strip is gone.
  await page.getByRole('region', { name: 'Focus' }).getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('region', { name: 'Focus' })).toHaveCount(0);
  await tabs(page).getByRole('link', { name: 'Yatra' }).click();
  await expect(greeting(page)).toBeVisible();
  await expect(strip(page)).toHaveCount(0);
});
