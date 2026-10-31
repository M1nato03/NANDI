import { expect, test, type Page } from '@playwright/test';
import { walkIdea } from './learn-helpers';
import { todaysBoard } from './helpers/mind';
import { textAt200 } from './helpers/text';

// Spec 45c: each area is a notebook page. From Home's friend, one heading under where the friend is, the friend on a
// quiet ground, the area's real controls, and Back to Home. A sitting is a stack of pages that turn by the corner, a
// swipe or Continue, and still ends on spec 41's card.
const NOON = new Date('2026-11-04T10:00:00');
const AREAS = [
  { friend: 'Plan, Mor at the map', hash: 'plan', place: 'Mor at the map', heading: 'Plan' },
  { friend: 'Read, Chiku on the reading rock', hash: 'read', place: 'Chiku on the reading rock', heading: 'Your books' },
  { friend: 'Train, Nandi by the pack', hash: 'yatra/train', place: 'Nandi by the pack', heading: 'Train' },
  { friend: 'Play, Kapi in the branches', hash: 'yatra/mind', place: 'Kapi in the branches', heading: "Kapi's shelf" },
  { friend: 'Calm, Kachhua by the fire', hash: 'yatra/calm', place: 'Kachhua by the fire', heading: 'Breathe with Kachhua' },
] as const;
const head = (page: Page) => page.locator('.notebook-head, .notebook-title').first();

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('each friend opens a notebook page: the place, one heading, the friend on its ground, and Back to Home', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#yatra');
  for (const area of AREAS) {
    await page.getByRole('button', { name: area.friend }).click();
    await expect(page).toHaveURL(new RegExp(`#${area.hash}$`));
    await expect(head(page).locator('.eyebrow')).toHaveText(area.place);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(area.heading);
    // The friend stands on the head's ground, not on a coloured band (Calm's friend is on its breathing stage).
    if (area.hash !== 'yatra/calm') {
      await expect(head(page).locator('.notebook-ground [data-cast]')).toHaveCount(1);
      await expect(head(page)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goBack();
    await expect(page).toHaveURL(/#yatra$/);
  }
});

test('the real controls stay: a Train session starts, today\'s board opens, Calm offers Square and Slow', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#yatra/train');
  await page.getByRole('button', { name: 'Start easy, skip the test' }).click();
  await expect(page.getByRole('button', { name: 'Finish session' })).toBeVisible();
  await page.goto('/?e2e#yatra/mind');
  await todaysBoard(page).click();
  await expect(page.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
  await page.goto('/?e2e#yatra/calm');
  await expect(page.getByRole('button', { name: 'Square' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Slow' })).toBeVisible();
});

test('a sitting is pages: a folio on each, the corner and a swipe turn it like Continue, and it ends on the choice card', async ({ page }) => {
  test.setTimeout(120_000);
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#read/book/richest-man-in-babylon');
  await page.getByRole('button', { name: 'Start · Chapter 1' }).click();
  const sitting = page.locator('.idea-sitting');
  const pageSheet = sitting.locator('.idea-page');
  const screenOf = () => sitting.getByRole('list', { name: /^Screen \d+ of \d+$/ }).getAttribute('aria-label');
  await expect(pageSheet.locator('.idea-folio')).toHaveText('01');
  // A guess has no corner until it is answered: the page never turns past an open question.
  await expect(pageSheet.locator('.page-corner')).toHaveCount(0);
  await walkIdea(page, 'richest-man-in-babylon', async screen => {
    if (screen === 2) {
      // The idea's page: the corner turns it, and it is not a separate stop for a keyboard or a screen reader.
      const corner = pageSheet.locator('.page-corner');
      await expect(corner).toHaveAttribute('tabindex', '-1');
      await expect(corner).toHaveAttribute('aria-hidden', 'true');
      await corner.click();
      await expect(pageSheet.locator('.idea-folio')).toHaveText('03');
      expect(await screenOf()).toMatch(/^Screen 3 of /);
      // A swipe to the left turns the next page.
      const box = (await pageSheet.boundingBox())!;
      await page.mouse.move(box.x + box.width - 30, box.y + 120);
      await page.mouse.down();
      await page.mouse.move(box.x + 40, box.y + 125, { steps: 6 });
      await page.mouse.up();
      await expect(pageSheet.locator('.idea-folio')).toHaveText('04');
    }
  });
  const end = page.locator('.idea-end');
  await expect(end).toContainText('Idea done');
  await expect(end.getByRole('button')).toHaveText(['One more idea', "That's enough for now"]);
});

test('at 200% text every area keeps to the phone\'s width and its heading', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#plan');
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
  for (const area of AREAS) {
    await page.goto(`/?e2e#${area.hash}`);
    await textAt200(page);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(area.heading);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
