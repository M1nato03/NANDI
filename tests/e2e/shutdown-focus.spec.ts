/// <reference lib="dom" />
import { expect, test } from '@playwright/test';

for (const scheme of ['light', 'dark'] as const) {
  test(`shutdown closes ${scheme === 'dark' ? 'paused' : 'running'} focus and preserves its time offline in ${scheme}`, async ({ page, context }, testInfo) => {
    await page.clock.install({ time: new Date('2026-10-14T12:00:00') });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/#plan');
    await expect(page.getByRole('status', { name: 'Offline ready' })).toBeVisible({ timeout: 30_000 });
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Finish the project outline');
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Today' })).toContainText('Finish the project outline');
    await page.goto('/#now/focus');
    await page.getByRole('button', { name: 'Start focus', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
    await page.clock.fastForward(120_000);
    if (scheme === 'dark') {
      await page.getByRole('button', { name: 'Pause', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
      await page.clock.fastForward(120_000);
    }
    await page.goto('/#plan/shutdown');
    await page.getByRole('region', { name: 'Close today' }).getByRole('button', { name: 'Done', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Close today' })).toContainText('Today is closed.');
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('region', { name: 'Close today' })).toContainText('Today is closed.');
    await page.screenshot({ path: testInfo.outputPath(`shutdown-focus-${scheme}.png`), fullPage: true });
    await page.goto('/#now');
    await expect(page.getByRole('article', { name: 'Plan your day card' })).toBeVisible();
    await page.clock.fastForward(300_000);
    for (let step = 0; step < 8; step++) await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('article', { name: 'The day is yours card' })).toContainText('2 minutes on your focus timer');
    await page.goto('/#you');
    await expect(page.getByLabel("Today's progress")).toContainText('1 tasks done');
  });
}
