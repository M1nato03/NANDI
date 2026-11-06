import { expect, test } from '@playwright/test';

// Spec 571 C7 (stage 1: the tab switch): switching to Grow and into a door draws without layout jumps.
test('switching to Grow and into a door shifts nothing on screen (CLS < 0.1)', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-06T12:00:00'));
  await page.goto('/?e2e#yatra');
  await expect(page.locator('main h1').first()).toBeVisible();
  await page.evaluate(() => {
    const store = window as Window & { shift?: number };
    store.shift = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!entry.hadRecentInput) store.shift! += entry.value;
    }).observe({ type: 'layout-shift', buffered: false });
  });
  const tabs = page.getByRole('navigation', { name: 'Main tabs' });
  await tabs.getByRole('link', { name: 'Grow' }).click();
  await expect(page.getByTestId('door-remember')).toBeVisible();
  await page.getByTestId('door-remember').click();
  await expect(page.getByRole('heading', { name: 'Remember', exact: true })).toBeVisible();
  await page.waitForTimeout(800);
  const shift = await page.evaluate(() => (window as Window & { shift?: number }).shift ?? 0);
  expect(shift).toBeLessThan(0.1);
});
