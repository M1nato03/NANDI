import { expect, test } from '@playwright/test';

for (const scheme of ['light', 'dark'] as const) {
  test(`five feature tabs and one home in ${scheme}`, async ({ page }, testInfo) => {
    await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    const tabs = page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link');
    await expect(tabs).toHaveText(['Plan', 'Train', 'Learn', 'Mind', 'You']);
    await expect(page).toHaveURL(/#plan$/);
    await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Focus timer' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Morning plan/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Shutdown/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Weekly review/ })).toBeVisible();
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Call bank 15m');
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Today' })).toContainText('Call bank');
    await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('button', { name: 'Plan: done' })).toBeVisible();
    await page.getByRole('button', { name: 'Learn: not done' }).click();
    await expect(page).toHaveURL(/#learn$/);
    await expect(page.getByRole('heading', { name: 'Learn', exact: true })).toBeVisible();
    await expect(page.getByText("Today's drop")).toBeVisible();
    await expect(page.getByText('Courses', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Review cards' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Mind: not done' }).click();
    await expect(page).toHaveURL(/#mind$/);
    await expect(page.getByRole('heading', { name: 'Mind', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Board: not done' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Case: not done' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Card reviews' })).toBeVisible();
    await expect(page.getByRole('main').getByText("Today's drop")).toHaveCount(0);
    await tabs.filter({ hasText: 'You' }).click();
    await expect(page.getByRole('heading', { name: 'You', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Settings/ })).toBeVisible();
    await expect(page.getByRole('main').getByRole('button', { name: 'Open Learn' })).toHaveCount(0);
    await tabs.filter({ hasText: 'Train' }).click();
    await expect(page.getByRole('heading', { name: 'Train', exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`tabs-${scheme}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const small = await page.locator('.tabbar a, .today-dot').evaluateAll(nodes => nodes.filter(node => { const box = node.getBoundingClientRect(); return box.width < 44 || box.height < 44; }).length);
    expect(small).toBe(0);
  });
}

test('old routes redirect to feature homes and night stays separate', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  for (const [oldRoute, newRoute] of [['now', 'plan'], ['you/train', 'train'], ['you/learn', 'learn'], ['you/mind', 'mind']] as const) {
    await page.goto(`/#${oldRoute}`);
    await expect(page).toHaveURL(new RegExp(`#${newRoute}$`));
  }
  await page.goto('/#night');
  await expect(page.getByRole('article', { name: 'Tonight card' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main tabs' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Go to card 6: That’s tonight' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/#plan$/);
});
