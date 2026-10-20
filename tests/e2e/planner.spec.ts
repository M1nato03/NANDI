import { expect, test, type Page } from '@playwright/test';

import { mkdirSync } from 'node:fs';

const screenshotDir = 'screenshots/rituals-plain';
function capture(page: Page, name: string) {
  mkdirSync(screenshotDir, { recursive: true });
  return page.screenshot({ path: `${screenshotDir}/${name}.png` });
}

async function expectLayout(page: Page) {
  expect(await page.evaluate(() => (globalThis as unknown as { document: { documentElement: { scrollWidth: number } }; innerWidth: number }).document.documentElement.scrollWidth <= (globalThis as unknown as { innerWidth: number }).innerWidth)).toBe(true);
  const small = await page.locator('button, input, select, summary, .tabbar a').evaluateAll((nodes) => nodes.filter((node) => {
    const box = node.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
  }).map((node) => node.getAttribute('aria-label') || node.textContent?.trim() || node.tagName));
  expect(small).toEqual([]);
}

for (const scheme of ['light', 'dark'] as const) {
  test(`planner rituals, review, settings and layout in ${scheme}`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/#plan');
    const rituals = page.getByRole('region', { name: 'Planning routines' });
    await expect(rituals.getByRole('heading', { name: 'Rituals' })).toBeVisible();
    await expect(rituals.locator('.ritual-buttons button')).toHaveCount(3);
    await expect(rituals).toContainText('2 min');
    await expect(rituals).toContainText('5 min');
    await expect(rituals).toContainText('Sundays');
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').click();
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Plan project outline');
    await page.getByRole('radio', { name: 'Unplaced' }).check();
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await page.getByText('Tap to see what is waiting. Nothing here is late.').click();
    await expect(page.getByRole('region', { name: 'Unplaced' })).toContainText('Plan project outline');
    for (const title of ['Keep for later', 'Drop this one']) {
      await page.getByPlaceholder('Add a task, e.g. call bank 15m').click();
      await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill(title);
      await page.getByRole('radio', { name: 'Unplaced' }).check();
      await page.getByRole('button', { name: 'Add task', exact: true }).click();
      await expect(page.getByRole('region', { name: 'Unplaced' })).toContainText(title);
    }
    // Rituals stay folded until the first one is used; after that they open by themselves.
    await page.locator('.plan-rituals-fold > summary').click();
    await page.getByRole('button', { name: 'Morning plan' }).click();
    await expect(page.getByRole('region', { name: 'Not scheduled yet' })).toContainText('Plan project outline');
    await expect(page.getByRole('region', { name: 'Time for today' })).toContainText('Today you have about');
    if (scheme === 'light' && page.viewportSize()?.width === 390) {
      await page.getByRole('region', { name: 'Not scheduled yet' }).evaluate((element) => element.scrollIntoView({ block: 'start' }));
      await capture(page, 'morning-sample-390x844');
    }
    await expectLayout(page);
    const item = page.locator('.planner-item').filter({ hasText: 'Plan project outline' });
    await item.getByLabel('Start time').fill('2026-10-11T14:00');
    await item.getByLabel('Priority').selectOption('must');
    await item.getByRole('button', { name: 'Place today' }).click();
    await page.locator('.planner-item').filter({ hasText: 'Keep for later' }).getByRole('button', { name: 'Someday' }).click();
    await page.locator('.planner-item').filter({ hasText: 'Drop this one' }).getByRole('button', { name: 'Drop', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Not scheduled yet' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Top 3 for today' })).toContainText('Plan project outline');
    await expect(page.getByRole('region', { name: 'Top 3 for today' })).toContainText('1/3');
    await page.getByRole('button', { name: 'Finish morning plan' }).click();
    await expect(page.getByText('Plan complete for today.')).toBeVisible();
    await page.getByRole('button', { name: 'Back to Plan' }).click();
    await expect(page.getByRole('region', { name: 'Today' })).toContainText('Plan project outline');
    await page.getByRole('button', { name: 'Shutdown' }).click();
    await expectLayout(page);
    await page.getByRole('region', { name: 'Close today' }).getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('region', { name: 'Close today' })).toContainText('Nothing left open.');
    await page.getByLabel('Task name').fill('Read first page');
    await page.getByLabel('Time (optional)').fill('2026-10-12T09:00');
    await page.getByText('More details').click();
    await page.getByLabel('First 10 minutes').fill('Open the book at page one');
    await page.getByLabel('Place').fill('Library');
    await expect(page.getByRole('button', { name: 'Complete shutdown' })).toBeEnabled();
    if (scheme === 'light' && page.viewportSize()?.width === 390) {
      await page.getByRole('region', { name: "Tomorrow's first step" }).evaluate((element) => element.scrollIntoView({ block: 'start' }));
      await capture(page, 'shutdown-sample-390x844');
    }
    await page.getByRole('button', { name: 'Complete shutdown' }).click();
    await expect(page.getByText('Shutdown complete. Wind-down has started.')).toBeVisible();
    await page.getByRole('button', { name: 'Back to Plan' }).click();
    await page.getByRole('button', { name: 'Weekly review' }).click();
    await expect(page.getByRole('region', { name: 'This week, in words' })).toContainText('You finished 1 task.');
    await expect(page.getByRole('region', { name: 'What helped' })).toContainText('You finished 1 of 1 task on the day you first planned it.');
    await page.getByText('Numbers', { exact: true }).click();
    await expect(page.locator('.planner-numbers')).toContainText('morning plan 1 · shutdown 1');
    await expect(page.getByRole('region', { name: 'Someday items' })).toContainText('Keep for later');
    await expect(page.getByRole('region', { name: 'Someday items' })).toContainText('Moved this week');
    if (scheme === 'light' && page.viewportSize()?.width === 390) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await capture(page, 'review-sample-390x844');
    }
    await expectLayout(page);
    await page.getByRole('button', { name: 'Finish review' }).click();
    await expect(page.getByText('Weekly review complete.')).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export summary' }).click();
    expect((await download).suggestedFilename()).toBe('nandi-week-2026-W41.json');
    await expect(page.getByText('Saved nandi-week-2026-W41.json.')).toBeVisible();
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'You' }).click();
    await page.getByRole('button', { name: /Settings/ }).click();
    await page.getByLabel('Shutdown time').fill('22:45');
    await expect(page.getByText('Planner settings saved.')).toBeVisible();
    await page.getByLabel('Bedtime target').fill('23:30');
    await expect(page.getByText('Shutdown nudge: 22:45.')).toBeVisible();
    await expectLayout(page);
    await page.reload();
    await expect(page.getByLabel('Shutdown time')).toHaveValue('22:45');
    await expect(page.getByLabel('Bedtime target')).toHaveValue('23:30');
    await expectLayout(page);
  });
}

test('empty rituals show a gentle start and fit a phone', async ({ page }) => {
  test.skip(page.viewportSize()?.width !== 390, 'Screenshot target is 390x844');
  await page.clock.install({ time: new Date('2026-10-18T08:00:00') });
  for (const [route, name] of [
    ['plan/morning', 'morning-empty-390x844'],
    ['plan/shutdown', 'shutdown-empty-390x844'],
    ['plan/review', 'review-empty-390x844'],
  ] as const) {
    await page.goto(`/#${route}`);
    if (route === 'plan/morning') {
      await expect(page.getByRole('region', { name: 'Time for today' })).toContainText('Today you have about 6 h free');
      await expect(page.getByRole('region', { name: 'Not scheduled yet' })).toHaveCount(0);
    }
    if (route === 'plan/shutdown') {
      await expect(page.getByRole('region', { name: 'Close today' })).toContainText('Nothing left open.');
      await expect(page.getByRole('button', { name: 'Complete shutdown' })).toBeDisabled();
      await capture(page, name);
      await page.getByRole('button', { name: "Skip tomorrow's step" }).click();
      await expect(page.getByRole('button', { name: 'Complete shutdown' })).toBeEnabled();
    }
    if (route === 'plan/review') await expect(page.getByRole('region', { name: 'This week, in words' })).toContainText("A quiet week. That's data, not a verdict.");
    await expectLayout(page);
    if (route !== 'plan/shutdown') await capture(page, name);
  }
});
