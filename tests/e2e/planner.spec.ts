import { expect, test, type Page } from '@playwright/test';

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
    await page.goto('/#tasks');
    await page.getByRole('button', { name: '+ Add task' }).click();
    await page.getByPlaceholder('What needs doing?').fill('Plan project outline');
    await page.getByRole('radio', { name: 'Unplaced' }).check();
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Unplaced' })).toContainText('Plan project outline');
    for (const title of ['Keep for later', 'Drop this one']) {
      await page.getByRole('button', { name: '+ Add task' }).click();
      await page.getByPlaceholder('What needs doing?').fill(title);
      await page.getByRole('radio', { name: 'Unplaced' }).check();
      await page.getByRole('button', { name: 'Add task', exact: true }).click();
      await expect(page.getByRole('region', { name: 'Unplaced' })).toContainText(title);
    }
    await page.getByRole('button', { name: 'Morning plan' }).click();
    await expect(page.getByRole('region', { name: 'Unplaced tray' })).toContainText('Plan project outline');
    await expectLayout(page);
    const item = page.locator('.planner-item').filter({ hasText: 'Plan project outline' });
    await item.getByLabel('Start time').fill('2026-10-11T14:00');
    await item.getByLabel('Priority').selectOption('must');
    await item.getByRole('button', { name: 'Place today' }).click();
    await page.locator('.planner-item').filter({ hasText: 'Keep for later' }).getByRole('button', { name: 'Someday' }).click();
    await page.locator('.planner-item').filter({ hasText: 'Drop this one' }).getByRole('button', { name: 'Drop' }).click();
    await expect(page.getByRole('region', { name: 'Unplaced tray' })).toContainText('Tray clear.');
    await expect(page.getByRole('region', { name: 'Today priorities' })).toContainText('Plan project outline');
    await expect(page.getByRole('region', { name: 'Today priorities' })).toContainText('Musts 1/3');
    await page.getByRole('button', { name: 'Finish morning plan' }).click();
    await expect(page.getByText('Plan complete for today.')).toBeVisible();
    await page.getByRole('button', { name: '← Today' }).click();
    await expect(page.locator('.day-horizon')).toContainText('left before shutdown (23:15)');
    await page.getByRole('button', { name: 'Shutdown' }).click();
    await expectLayout(page);
    await page.getByRole('region', { name: 'Close today' }).getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('region', { name: 'Close today' })).toContainText('Today is closed.');
    await page.getByLabel('Task name').fill('Read first page');
    await page.getByLabel('First step').fill('Open the book at page one');
    await page.getByLabel('Time', { exact: true }).fill('2026-10-12T09:00');
    await page.getByLabel('Place').fill('Library');
    await page.getByRole('button', { name: 'Set first task' }).click();
    await expect(page.getByText('Tomorrow’s first task is set.')).toBeVisible();
    await page.getByRole('button', { name: 'Complete shutdown' }).click();
    await expect(page.getByText('Shutdown complete. Wind-down has started.')).toBeVisible();
    await page.getByRole('button', { name: '← Today' }).click();
    await page.getByRole('button', { name: 'Weekly review' }).click();
    await expect(page.getByRole('region', { name: 'Weekly numbers' })).toContainText('Done on first scheduled day: 1/1');
    await expect(page.getByRole('region', { name: 'Weekly numbers' })).toContainText('Rituals: plan 1 · shutdown 1');
    await expect(page.getByRole('region', { name: 'Someday items' })).toContainText('Keep for later');
    await expect(page.getByRole('region', { name: 'Someday items' })).toContainText('Moved this week');
    await expectLayout(page);
    await page.getByRole('button', { name: 'Finish review' }).click();
    await expect(page.getByText('Weekly review complete.')).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export summary' }).click();
    expect((await download).suggestedFilename()).toBe('nandi-week-2026-W41.json');
    await expect(page.getByText('Saved nandi-week-2026-W41.json.')).toBeVisible();
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Ground' }).click();
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
