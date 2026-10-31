import { expect, test, type Page } from '@playwright/test';

async function capture(page: Page, path: string) {
  const sizes = await page.locator('button, input, select, .tabbar a').evaluateAll(nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return { label: node.textContent?.trim() || node.getAttribute('aria-label') || node.tagName, width: box.width, height: box.height }; }).filter(box => box.width > 0 && box.height > 0));
  expect(sizes.filter(box => box.width < 43.5 || box.height < 43.5)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path, fullPage: true });
}

for (const scheme of ['light', 'dark'] as const) {
  test(`rank assessment to safety finish and history in ${scheme}`, async ({ page }, testInfo) => {
    await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/#train');
    await expect(page.getByText('Rank assessment')).toBeVisible();
    await capture(page, testInfo.outputPath(`train-assessment-${scheme}.png`));
    await page.getByRole('button', { name: 'Start placement' }).click();
    await expect(page.getByRole('heading', { name: 'Squat', exact: true })).toBeVisible();
    await expect(page.getByText('Movement 1 of 7')).toBeVisible();
    await expect(page.getByRole('img', { name: /^How to do / })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Form cues' }).getByRole('listitem')).toHaveCount(3);
    await capture(page, testInfo.outputPath(`train-placement-${scheme}.png`));
    for (let pattern = 0; pattern < 7; pattern++) {
      if (pattern === 4 || pattern === 5) await page.getByRole('spinbutton', { name: 'Clean seconds' }).fill('30');
      await page.getByRole('button', { name: 'Record test' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Hostel Bodyweight' })).toBeVisible();
    await capture(page, testInfo.outputPath(`train-today-${scheme}.png`));
    await page.getByRole('button', { name: 'Start session' }).click();
    await expect(page.getByText('Exercise 1 of 7')).toBeVisible();
    await expect(page.locator('.train-exercise')).toHaveCount(1);
    await capture(page, testInfo.outputPath(`train-workout-${scheme}.png`));
    await page.getByRole('button', { name: 'Log set' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Set saved' })).toBeVisible();
    await expect(page.getByRole('timer')).toHaveAttribute('aria-label', 'Rest 90 seconds');
    await capture(page, testInfo.outputPath(`train-rest-${scheme}.png`));
    await page.clock.fastForward(30_000);
    await page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pageshow')); });
    await expect(page.getByRole('timer')).toHaveAttribute('aria-label', /^Rest (5\d|60) seconds$/); // real time also passes on slow CI runners
    await page.reload();
    await expect(page.getByText('Exercise 1 of 7')).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Set 2 of/ })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Logged sets' })).toContainText(/Set 1 · \d+ reps/);
    await capture(page, testInfo.outputPath(`train-resumed-${scheme}.png`));
    await page.getByRole('button', { name: 'Pain or discomfort?' }).click();
    await expect(page.getByText('If pain persists, consult a qualified professional.')).toBeVisible();
    await capture(page, testInfo.outputPath(`train-safety-${scheme}.png`));
    await page.getByRole('button', { name: 'Finish session' }).click();
    await expect(page.getByRole('heading', { name: 'Session finished' })).toBeVisible();
    await capture(page, testInfo.outputPath(`train-finish-${scheme}.png`));
    await page.getByRole('button', { name: 'View history' }).click();
    await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();
    await expect(page.locator('.train-history')).toContainText('Stopped for comfort');
    await capture(page, testInfo.outputPath(`train-history-${scheme}.png`));
  });
}

test('a full exercise advances, then a later set resumes after reload', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#train');
  await page.getByRole('button', { name: 'Start placement' }).click();
  for (let pattern = 0; pattern < 7; pattern++) {
    if (pattern === 4 || pattern === 5) await page.getByRole('spinbutton', { name: 'Clean seconds' }).fill('30');
    await page.getByRole('button', { name: 'Record test' }).click();
  }
  await page.getByRole('button', { name: 'Start session' }).click();
  await expect(page.getByText('Exercise 1 of 7')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (testInfo.project.name === 'mobile-390x844') await page.screenshot({ path: testInfo.outputPath('session-390x844.png'), fullPage: true });
  await page.getByRole('button', { name: 'Log set' }).click();
  await expect(page.getByRole('timer')).toHaveAttribute('aria-label', 'Rest 90 seconds');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (testInfo.project.name === 'mobile-390x844') await page.screenshot({ path: testInfo.outputPath('rest-390x844.png'), fullPage: true });
  await expect(page.getByRole('heading', { name: /^Set 2 of/ })).toBeVisible();
  const plannedSets = Number((await page.locator('.train-target').innerText()).match(/^\d+/)?.[0]);
  for (let set = 2; set <= plannedSets; set++) await page.getByRole('button', { name: 'Log set' }).click();
  await expect(page.getByText('Exercise 2 of 7')).toBeVisible();
  await expect(page.locator('.train-exercise')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /^Set 1 of/ })).toBeVisible();
  await page.getByRole('button', { name: 'Log set' }).click();
  await expect(page.getByRole('heading', { name: /^Set 2 of/ })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Exercise 2 of 7')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Set 2 of/ })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Logged sets' })).toContainText('Set 1');
  await page.getByRole('button', { name: 'All exercises', exact: true }).click();
  await expect(page.locator('.train-all-list li')).toHaveCount(7);
  await page.getByRole('button', { name: 'Previous' }).click();
  await expect(page.getByText('Exercise 1 of 7')).toBeVisible();
  await page.getByRole('button', { name: 'Next exercise' }).click();
  await expect(page.getByText('Exercise 2 of 7')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('gym setup records starting loads that the first session uses', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-12T12:00:00') });
  await page.goto('/#train');
  await page.getByLabel('Training track').selectOption('gym');
  await page.getByLabel('Gym access').check();
  await page.getByLabel('Goblet Squat load for 12 clean reps, kg').fill('12.5');
  await page.getByRole('button', { name: 'Save assessment' }).click();
  await expect(page.getByRole('heading', { name: 'Gym Foundations A' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Start session' }).click();
  await expect(page.getByRole('heading', { name: /^Warm-up 1 of/ })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Kg' })).not.toHaveValue('0');
});
