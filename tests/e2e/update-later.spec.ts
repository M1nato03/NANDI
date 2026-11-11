import { expect, test, type Page } from '@playwright/test';

// Jenil 10 Nov: "After once I clicked later for updates I am not seeing it". The Android updater is native, so the e2e
// build takes a stand-in (window.__nandiFakeUpdater, VITE_E2E only): installed 122, version.json offers 124.
async function withUpdate(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as Record<string, unknown>).__nandiFakeUpdater = {
      installed: { versionCode: 122, versionName: '0.1.0' },
      latest: { versionCode: 124, versionName: '0.1.0', sha256: 'a'.repeat(64), url: 'https://nandi-updates.nandi11.workers.dev/nandi-124.apk', builtAt: '2026-11-10T09:14:39Z', commit: '5c818a5', notes: '' },
    };
  });
}

test('after Later, Settings still offers the update, and a check by hand brings the banner back', async ({ page }) => {
  await withUpdate(page);
  await page.clock.install({ time: new Date('2026-11-10T12:00:00') });
  await page.goto('/#you/settings');
  const banner = page.getByRole('region', { name: 'Android update' });
  await expect(banner).toContainText('New version ready');
  await banner.getByRole('button', { name: 'Later' }).click();
  await expect(banner).toHaveCount(0);
  // The update is still named on its own button in Settings (it used to say only "New version ready.").
  await expect(page.getByRole('button', { name: 'Update to 0.1.0 (124)' })).toBeVisible();
  await expect(page.getByText('New version ready.')).toHaveCount(0);

  // Next open: the app does not re-check within its interval, so Settings shows Check for updates; asking by hand
  // finds 124 again and ends the Later.
  await page.reload();
  await expect(page.getByRole('region', { name: 'Android update' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Check for updates' }).click();
  await expect(page.getByRole('button', { name: 'Update to 0.1.0 (124)' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Android update' })).toContainText('New version ready');
});

test('up to date: Settings says so and offers no update', async ({ page }) => {
  // A fixed noon: on the real clock after bedtime the night deck opens over Settings (gate-s40f ran at 04:20).
  await page.clock.install({ time: new Date('2026-11-10T12:00:00') });
  await page.addInitScript(() => {
    (window as unknown as Record<string, unknown>).__nandiFakeUpdater = {
      installed: { versionCode: 124, versionName: '0.1.0' },
      latest: { versionCode: 124, versionName: '0.1.0', sha256: 'a'.repeat(64), url: 'https://nandi-updates.nandi11.workers.dev/nandi-124.apk', builtAt: '2026-11-10T09:14:39Z', commit: '5c818a5', notes: '' },
    };
  });
  await page.goto('/#you/settings');
  await expect(page.getByText('Current version: 0.1.0 (124)')).toBeVisible();
  await page.getByRole('button', { name: 'Check for updates' }).click();
  await expect(page.getByText("You're up to date.")).toBeVisible();
  await expect(page.getByRole('button', { name: /^Update to/ })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Android update' })).toHaveCount(0);
});
