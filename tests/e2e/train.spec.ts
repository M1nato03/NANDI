import { expect, test, type Page } from '@playwright/test';

async function capture(page: Page, path: string) {
  const sizes = await page.locator('button, input, select, .tabbar a').evaluateAll(nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return { label: node.textContent?.trim() || node.getAttribute('aria-label') || node.tagName, width: box.width, height: box.height }; }).filter(box => box.width > 0 && box.height > 0));
  expect(sizes.filter(box => box.width < 44 || box.height < 44)).toEqual([]);
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
    await expect(page.getByText('squat · test 1 of 3')).toBeVisible();
    await capture(page, testInfo.outputPath(`train-placement-${scheme}.png`));
    for (let pattern = 0; pattern < 7; pattern++) {
      if (pattern === 4 || pattern === 5) await page.getByRole('spinbutton', { name: 'Clean seconds' }).fill('30');
      await page.getByRole('button', { name: 'Record test' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Hostel Bodyweight' })).toBeVisible();
    await capture(page, testInfo.outputPath(`train-today-${scheme}.png`));
    await page.getByRole('button', { name: 'Start session' }).click();
    await expect(page.getByText('Session in progress')).toBeVisible();
    await capture(page, testInfo.outputPath(`train-workout-${scheme}.png`));
    await page.locator('.train-exercise').first().getByRole('button', { name: 'Log set' }).first().click();
    await expect(page.getByRole('status').filter({ hasText: 'Set saved' })).toBeVisible();
    await expect(page.getByRole('timer')).toHaveAttribute('aria-label', 'Rest 90 seconds');
    await page.clock.fastForward(30_000);
    await page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pageshow')); });
    await expect(page.getByRole('timer')).toHaveAttribute('aria-label', 'Rest 60 seconds');
    await page.reload();
    await expect(page.getByText('Session in progress')).toBeVisible();
    await expect(page.locator('.train-exercise').first().getByRole('button', { name: 'Done' })).toHaveCount(1);
    await capture(page, testInfo.outputPath(`train-resumed-${scheme}.png`));
    await page.locator('.train-exercise').first().getByRole('button', { name: 'Pain' }).last().click();
    await expect(page.getByText('If pain persists, consult a qualified professional.')).toBeVisible();
    await capture(page, testInfo.outputPath(`train-safety-${scheme}.png`));
    await page.getByRole('button', { name: 'Finish session' }).click();
    await expect(page.getByRole('heading', { name: 'Session finished' })).toBeVisible();
    await capture(page, testInfo.outputPath(`train-finish-${scheme}.png`));
    await page.getByRole('button', { name: 'View history' }).click();
    await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();
    await expect(page.locator('.train-history')).toContainText('safety');
    await capture(page, testInfo.outputPath(`train-history-${scheme}.png`));
  });
}
