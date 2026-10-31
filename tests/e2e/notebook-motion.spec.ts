import { expect, test, type Page } from '@playwright/test';

// Spec 45a: a route change fades the new page in; the bars stay put, focus lands on the new heading after it.
const NOON = new Date('2026-10-31T12:00:00');
const tabs = (page: Page) => page.getByRole('navigation', { name: 'Main tabs' });
const motion = (page: Page) => page.locator('html').getAttribute('data-route-motion');

test('a tab change fades the new page in, then focus is on the new heading; Back does the same', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#plan');
  await expect(page.locator('#main h1')).toBeVisible();
  await tabs(page).getByRole('link', { name: 'Read' }).click();
  expect(await motion(page)).toBe('fade');
  await expect(page.locator('#main h1')).toBeFocused();
  await expect(tabs(page)).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#plan$/);
  expect(await motion(page)).toBe('fade');
  await expect(page.locator('#main h1')).toBeFocused();
});

test('the first route, and every change with reduced motion, are immediate', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?e2e#plan');
  await expect(page.locator('#main h1')).toBeVisible();
  expect(await motion(page)).not.toBe('fade');
  await tabs(page).getByRole('link', { name: 'You' }).click();
  await expect(page.getByRole('heading', { name: 'You', level: 1 })).toBeVisible();
  expect(await motion(page)).toBe('none');
  await expect(page.locator('#main h1')).toBeFocused();
});

test('rapid route changes: the latest wins, with no stale page left behind', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#plan');
  await expect(page.locator('#main h1')).toBeVisible();
  await page.evaluate(() => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Main tabs"] a')];
    for (const name of ['Read', 'Yatra', 'You']) links.find(link => link.textContent?.includes(name))!.click();
  });
  await expect(page).toHaveURL(/#you$/);
  await expect(page.getByRole('heading', { name: 'You', level: 1 })).toBeVisible();
  await expect(page.locator('#main h1')).toHaveCount(1);
  await expect(page.locator('#main h1')).toBeFocused();
});

test('with a dialog open, a route change does not fade', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#yatra/calm');
  await page.getByRole('button', { name: /^Other/ }).click();
  await expect(page.getByRole('dialog', { name: 'Other lengths' })).toBeVisible();
  await page.evaluate(() => { location.hash = '#plan'; });
  await expect(page).toHaveURL(/#plan$/);
  expect(await motion(page)).toBe('none');
});
