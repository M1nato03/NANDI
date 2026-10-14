import { expect, test, type Page } from '@playwright/test';

async function checkLayout(page: Page) {
  const small = await page.locator('button, input, select, .tabbar a').evaluateAll(nodes => nodes
    .map(node => ({ label: node.textContent?.trim() || node.getAttribute('aria-label'), rect: node.getBoundingClientRect() }))
    .filter(item => item.rect.width > 0 && item.rect.height > 0 && (item.rect.width < 44 || item.rect.height < 44))
    .map(item => item.label));
  expect(small).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const scheme of ['light', 'dark'] as const) {
  test(`weekly side quests in ${scheme}`, async ({ page }) => {
    await page.clock.install({ time: new Date(2026, 9, 11, 12) });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/#plan');
    const section = page.getByRole('region', { name: 'Side quests' });
    await expect(section.locator('.quest-row')).toHaveCount(3);
    await checkLayout(page);
    await section.getByRole('button', { name: 'Swap one suggestion' }).click();
    await expect(section.getByRole('status')).toHaveText('Quest saved.');
    await expect(section.locator('.quest-row')).toHaveCount(3);
    await expect(section.getByRole('button', { name: 'Swap one suggestion' })).toBeDisabled();
    await section.getByRole('button', { name: 'Add custom quest' }).click();
    await section.getByLabel('Quest title').fill('Read two chapters');
    await section.getByLabel('Kind').selectOption('total');
    await section.getByLabel('Target').fill('2');
    await section.getByLabel('Unit').fill('chapters');
    await section.getByLabel('Step').fill('1');
    await checkLayout(page);
    await section.getByRole('button', { name: 'Save custom quest' }).click();
    await expect(section.getByRole('status')).toHaveText('Quest saved.');
    const row = section.locator('.quest-row').filter({ hasText: 'Read two chapters' });
    await expect(row).toContainText('0 / 2 chapters');
    await row.getByRole('button', { name: 'Add 1 to Read two chapters' }).click();
    await expect(section.getByRole('status')).toHaveText('Quest saved.');
    await expect(row).toContainText('1 / 2 chapters');
    await row.getByRole('button', { name: 'Add 1 to Read two chapters' }).click();
    await expect(section.getByRole('status')).toHaveText('Quest saved.');
    await expect(row).toContainText('Done');
    await checkLayout(page);
    await page.reload();
    const restored = page.getByRole('region', { name: 'Side quests' });
    await expect(restored.locator('.quest-row')).toHaveCount(4);
    await expect(restored.locator('.quest-row').filter({ hasText: 'Read two chapters' })).toContainText('Done');
    await expect(restored.getByRole('button', { name: 'Swap one suggestion' })).toBeDisabled();
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Now' }).click();
    for (let index = 0; index < 7; index++) await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('article', { name: 'A little extra card' })).toContainText('1 of 4 side quests done this week');
    await checkLayout(page);
  });
}
