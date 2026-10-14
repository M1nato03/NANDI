/// <reference lib="dom" />
import { expect, test } from '@playwright/test';

for (const scheme of ['light', 'dark'] as const) {
  test(`meditation pauses, survives offline reload and finishes once in ${scheme}`, async ({ page, context }, testInfo) => {
    await page.clock.install({ time: new Date('2026-10-13T08:00:00') });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/#you/mind/meditate');
    await expect(page.getByRole('status', { name: 'Offline ready' })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('radio', { name: '2 minutes', exact: true }).check();
    await page.getByRole('button', { name: 'Start meditation' }).click();
    await expect(page.getByRole('timer')).toHaveText('2:00');
    await page.clock.fastForward(40_000);
    await page.getByRole('button', { name: 'Pause meditation' }).click();
    await expect(page.getByRole('button', { name: 'Resume meditation' })).toBeEnabled();
    await expect(page.getByRole('timer')).toHaveText('1:20');
    await page.clock.fastForward(120_000);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('timer')).toHaveText('1:20');
    await expect(page.getByRole('button', { name: 'Resume meditation' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`meditation-paused-${scheme}.png`), fullPage: true });
    const finishBox = await page.getByRole('button', { name: 'Finish now' }).boundingBox();
    const navBox = await page.getByRole('navigation', { name: 'Main tabs' }).boundingBox();
    expect(finishBox!.y + finishBox!.height).toBeLessThanOrEqual(navBox!.y);
    const targets = await page.locator('button, .meditation-durations label').evaluateAll(elements => elements.every(element => { const box = element.getBoundingClientRect(); return box.width >= 44 && box.height >= 44; }));
    expect(targets).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Resume meditation' }).click();
    await page.clock.fastForward(81_000);
    await expect(page.getByText(/Practice saved · 2:00/)).toBeVisible();
    await page.reload();
    await expect(page.getByText(/Practice saved · 2:00/)).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`meditation-done-${scheme}.png`), fullPage: true });
    await page.goto('/#you');
    await expect(page.getByLabel("Today's progress")).toContainText('2m 0s meditated');
  });
}

test('a running meditation is first in Now and continues across navigation', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-13T08:00:00') });
  await page.goto('/#you/mind/meditate');
  await page.getByRole('button', { name: 'Start meditation' }).click();
  await expect(page.getByRole('button', { name: 'Pause meditation' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Now' }).click();
  await expect(page.getByRole('article', { name: 'Settle card' })).toBeVisible();
  await page.clock.fastForward(30_000);
  await page.getByRole('button', { name: 'Continue meditation' }).click();
  await expect(page.getByRole('timer')).toHaveText('4:30');
  await page.getByRole('button', { name: 'Finish now' }).click();
  await expect(page.getByText(/Practice saved · 0:30/)).toBeVisible();
  await page.goto('/#you');
  await expect(page.getByLabel("Today's progress")).toContainText('0m 30s meditated');
});
