import { expect, test } from '@playwright/test';
import { seedRecapWeek } from './recap-seed';

for (const scheme of ['light', 'dark'] as const) {
  test(`night plan and weekly recap in ${scheme}`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-16T04:10:00') });
    await page.emulateMedia({ colorScheme: scheme });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
    });
    await page.goto('/#you');
    await expect(page.getByRole('region', { name: 'This week in words' })).toContainText('What your time became');
    await seedRecapWeek(page, '2026-10-15');
    const download = page.waitForEvent('download');
    await page.getByRole('region', { name: 'This week in words' }).getByRole('button', { name: 'Share my week' }).click();
    const preview = page.getByRole('dialog', { name: 'Weekly recap preview' });
    await expect(preview.getByRole('img')).toBeVisible({ timeout: 20_000 });
    await preview.getByRole('button', { name: 'Share' }).click();
    expect((await download).suggestedFilename()).toBe('nandi-week-2026-10-12.png');
    await page.getByRole('link', { name: 'You' }).click();
    await page.getByRole('button', { name: /Settings/ }).click();
    const setting = page.getByRole('region', { name: 'Night plan setting' });
    await expect(setting).toBeVisible();
    await setting.getByLabel('Choose a bedtime cue').selectOption('getting into bed with my phone');
    await setting.getByLabel('Choose a replacement').selectOption('read 5 pages');
    await setting.getByRole('button', { name: 'Save night plan' }).click();
    await expect(setting).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Settings', exact: true, level: 1 })).toBeVisible();

    await page.clock.setFixedTime(new Date('2026-10-13T01:00:00'));
    await page.goto('/#night');
    await expect(page.getByRole('article', { name: 'Tonight card' })).toBeVisible();
    await page.clock.setFixedTime(new Date('2026-10-13T01:31:00'));
    await page.goto('/#night');
    await expect(page.getByRole('article', { name: 'Tonight card' })).toBeVisible();

    const controls = page.getByRole('button');
    for (const control of await controls.all()) {
      if (!await control.isVisible()) continue;
      const box = await control.boundingBox();
      if (box) { expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44); }
    }
  });
}
