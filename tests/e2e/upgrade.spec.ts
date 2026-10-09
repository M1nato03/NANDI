import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('PWA Upgrade', () => {
  // We need determinism, so we use a single worker for this test or isolate it.
  test.describe.configure({ mode: 'serial' });

  test('Upgrade flow keeps data and works offline', async ({ page, context }) => {
    // 1. Load build A
    await page.goto('/#ground?e2e=1');
    await expect(page.locator('h1', { hasText: 'Ground' })).toBeVisible();

    // Verify it's NANDI 0.1.0
    const versionTextLocator = page.locator('p', { hasText: /NANDI 0\.1\.0/ });
    await expect(versionTextLocator).toBeVisible();

    // Write some data (via window.__nandiTest.seedShell)
    await page.evaluate(async () => {
      // @ts-ignore
      if (!window.__nandiTest) throw new Error('No e2e hook found');
      // @ts-ignore
      await window.__nandiTest.seedShell();
    });

    let count = await page.evaluate(async () => {
      // @ts-ignore
      return (await window.__nandiTest.shellCounts()).tasks;
    });
    expect(count).toBeGreaterThan(0);

    // 2. Switch served files to build B (different build id)
    execSync('npx tsx scripts/build-e2e-b.ts', { stdio: 'inherit' });

    // 3. Reload
    await page.reload();

    // 4. "Update available" appears
    const updateBar = page.locator('div', { hasText: 'Update available' }).locator('visible=true').first();
    await expect(updateBar).toBeVisible({ timeout: 15000 });

    // 5. Click Update
    await page.locator('button', { hasText: 'Update' }).first().click();

    // Wait for the app to reload (the Update button calls updateSW(true) which reloads the page)
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // 6. The new build id shows
    const newVersionTextLocator = page.locator('p', { hasText: /NANDI 0\.2\.0/ });
    await expect(newVersionTextLocator).toBeVisible();

    // 7. The data is still there
    let countAfter = await page.evaluate(async () => {
      // @ts-ignore
      return (await window.__nandiTest.shellCounts()).tasks;
    });
    expect(countAfter).toBe(count);

    // 8. context.setOffline(true) + reload still renders
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('h1', { hasText: 'Ground' })).toBeVisible();
    await expect(newVersionTextLocator).toBeVisible();

    // Restore dist-e2e to build A for other tests
    execSync('npx vite build --outDir dist-e2e', { env: { ...process.env, VITE_E2E: '1' }, stdio: 'ignore' });
  });
});
