import { expect, test } from '@playwright/test';

// Small follow-ups after stage 1 (a9's post-ship check of build 120, via b2, 7 Nov).
test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date('2026-11-06T12:00:00')); });

test('Remember › cards on a fresh install says there are no cards, not "that\'s enough for today"', async ({ page }) => {
  await page.goto('/?e2e#grow/remember/cards');
  await expect(page.getByRole('heading', { name: 'Card reviews', exact: true })).toBeVisible();
  await expect(page.getByText('No cards to review.')).toBeVisible();
  await expect(page.getByText("That's enough for today")).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Finish reviews' })).toHaveCount(0);
});

test('Read\'s library shelves start on the 16 px page gutter, not at the screen edge', async ({ page }) => {
  await page.goto('/?e2e#grow/read');
  const first = page.locator('.read-shelf-row').first().locator('li').first();
  await expect(first).toBeVisible();
  const box = await first.boundingBox();
  expect(box && box.x, JSON.stringify(box)).toBeGreaterThanOrEqual(15.5);
});

test('Welcome names where bedtime lives now', async ({ page }) => {
  await page.goto('/?e2e&welcome');
  const welcome = page.getByRole('dialog', { name: 'Welcome to NANDI' });
  await welcome.getByLabel("I'm 18 or older.").check();
  await welcome.getByRole('button', { name: "Let's start" }).click();
  await welcome.getByRole('button', { name: 'Learn something', exact: true }).click();
  await welcome.getByRole('button', { name: 'Continue' }).click();
  await expect(welcome.getByText('You can change it any time in Calm & Sleep.')).toBeVisible();
});
