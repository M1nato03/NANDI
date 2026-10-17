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
  test(`weekly side quests in ${scheme}`, async ({ page }, testInfo) => {
    await page.clock.install({ time: new Date(2026, 9, 11, 12) });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/#plan');
    const section = page.getByRole('region', { name: 'Side quests' });
    await expect(section.locator('.quest-row')).toHaveCount(3);
    await expect(section.locator('.quest-list')).toHaveCSS('grid-template-columns', /\d+px/);
    await expect(section.locator('progress')).toHaveCount(0);
    await section.locator('.quest-disclosure').first().click();
    await expect(section.locator('.quest-detail')).toBeVisible();
    await section.locator('.quest-disclosure').first().click();
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
    await expect(row).toContainText('0 of 2');
    await row.getByRole('button', { name: 'Add 1 to Read two chapters' }).click();
    await expect(section.getByRole('status')).toHaveText('Quest saved.');
    await expect(row).toContainText('1 of 2');
    await row.locator('.quest-disclosure').click();
    await row.getByRole('button', { name: 'Subtract 1 from Read two chapters' }).click();
    await expect(row).toContainText('0 of 2');
    await row.getByRole('button', { name: 'Add 1 to Read two chapters' }).click();
    await expect(row).toContainText('1 of 2');
    await row.locator('.quest-disclosure').click();
    await row.getByRole('button', { name: 'Add 1 to Read two chapters' }).click();
    await expect(section.getByRole('status')).toHaveText('Quest saved.');
    await expect(row.locator('.quest-check')).toBeVisible();
    await checkLayout(page);
    if (scheme === 'dark' && testInfo.project.name === 'mobile-390x844') await section.screenshot({ path: testInfo.outputPath('side-quests-390x844.png') });
    await page.reload();
    const restored = page.getByRole('region', { name: 'Side quests' });
    await expect(restored.locator('.quest-row')).toHaveCount(4);
    await expect(restored.locator('.quest-row').filter({ hasText: 'Read two chapters' }).locator('.quest-check')).toBeVisible();
    await expect(restored.getByRole('button', { name: 'Swap one suggestion' })).toBeDisabled();
    await expect(page.getByRole('region', { name: 'Side quests' })).toBeVisible();
    await checkLayout(page);
  });
}
