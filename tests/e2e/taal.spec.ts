import { expect, test, type Page } from '@playwright/test';

// Spec 24 #3 Taal week (cj5-train §7 #1). Wed 4 Nov 2026; the default program days are Mon, Wed, Fri.
async function placed(page: Page) {
  await page.goto('/#train');
  await page.getByRole('button', { name: 'Start placement' }).click();
  for (let pattern = 0; pattern < 7; pattern++) {
    if (pattern === 4 || pattern === 5) await page.getByRole('spinbutton', { name: 'Clean seconds' }).fill('30');
    await page.getByRole('button', { name: 'Record test' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Hostel Bodyweight' })).toBeVisible();
}

test('the week shows claps and rest beats, and a low readiness answer offers equal choices', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-04T12:00:00'));
  await placed(page);
  const week = page.getByRole('list', { name: 'This week' });
  await expect(week.getByRole('listitem')).toHaveCount(7);
  await expect(week.getByRole('listitem', { name: 'Mon: training day' })).toBeVisible();
  await expect(week.getByRole('listitem', { name: 'Tue: rest' })).toBeVisible();
  await expect(week.getByRole('listitem', { name: 'Wed: training day, today' })).toBeVisible();
  await expect(page.getByText('0 of 3 sessions this week.')).toBeVisible();
  // No choice is offered until an answer is low; then the full session joins three others as equals (Codex B item 100).
  await expect(page.getByRole('button', { name: 'Rest today' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start session' })).toBeVisible();
  await page.getByRole('button', { name: 'Not much sleep' }).click();
  const choices = page.locator('.train-readiness-choices button');
  await expect(choices).toHaveText(['Full session', 'Minimum session', 'Move to Thu', 'Rest today']);
  for (const choice of await choices.all()) await expect(choice).toHaveClass(/secondary/);
  await expect(page.getByRole('button', { name: 'Start session' })).toHaveCount(0);
  await expect(page.getByText('Any of these counts.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Move to Thu' }).click();
  await expect(page.getByText('Moved to Thu.')).toBeVisible();
  await expect(week.getByRole('listitem', { name: 'Wed: rest day, today' })).toBeVisible();
  await expect(week.getByRole('listitem', { name: 'Thu: training day' })).toBeVisible();
  await expect(page.locator('.taal-card').getByText("Rest is today's beat.")).toBeVisible();
  // One move a week, and today is a rest beat now, so neither choice is offered again.
  await expect(page.getByRole('button', { name: /^Move to / })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Rest today' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('list', { name: 'This week' }).getByRole('listitem', { name: 'Thu: training day' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a past rest beat fills on its own; future beats wait', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-04T12:00:00'));
  await placed(page);
  const week = page.getByRole('list', { name: 'This week' });
  // Tue 3 Nov has ended without a session, so its rest beat is filled; Mon's clap stays open, never crossed out.
  await expect(week.getByRole('listitem', { name: 'Tue: rest' })).toHaveClass(/taal-filled/);
  await expect(week.getByRole('listitem', { name: 'Mon: training day' })).not.toHaveClass(/taal-filled/);
  await expect(week.getByRole('listitem', { name: 'Thu: rest day' })).not.toHaveClass(/taal-filled/);
});

test('the week rolls over at 04:00 on a screen left open, and the closed week reads its line on the rhythm sheet', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-04T12:00:00'));
  await placed(page);
  await expect(page.getByRole('list', { name: 'This week' }).getByRole('listitem', { name: 'Wed: training day, today' })).toBeVisible();
  // Mon 9 Nov 04:30: the app comes back to the same screen; the new week shows without a reload (Codex B item 100).
  await page.clock.setFixedTime(new Date('2026-11-09T04:30:00'));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByRole('list', { name: 'This week' }).getByRole('listitem', { name: 'Mon: training day, today' })).toBeVisible();
  await page.locator('.taal-sheet > summary').click();
  await expect(page.locator('.taal-sheet')).toContainText('This week closed at 0. That counts.');
});
