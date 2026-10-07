import { expect, test } from '@playwright/test';

const names = ['Today', 'Tasks', 'Train', 'Mind', 'Ground'];

test('five tabs remain reachable after reload in both themes', async ({ page }, testInfo) => {
  await page.goto('/');
  for (const scheme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const name of names) {
      await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name }).click();
      await expect(page.getByRole('main').getByRole('heading', { name, exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByRole('main').getByRole('heading', { name, exact: true })).toBeVisible();
      expect(await page.evaluate(() => (globalThis as unknown as { document: { documentElement: { scrollWidth: number } }; innerWidth: number }).document.documentElement.scrollWidth <= (globalThis as unknown as { innerWidth: number }).innerWidth)).toBe(true);
    }
    await page.screenshot({ path: testInfo.outputPath(`ground-${scheme}.png`), fullPage: true });
  }
});

test('generator check displays five boards and the case from both threads', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/#mind');
  await page.getByRole('button', { name: 'Generator check' }).click();
  await expect(page.getByRole('status')).toHaveText('Match', { timeout: 60000 });
  const speed = page.getByRole('heading', { name: 'Number Path (hard) speed' }).locator('..');
  await expect(speed).toContainText('20 boards', { timeout: 60000 });
  await expect(speed).toContainText(/p50: .* ms/);
  await expect(speed).toContainText(/p95: .* ms · 300 ms budget · (within budget|over budget)/);
  await expect(speed).toContainText(/max: .* ms/);
  for (const source of ['Main thread results', 'Worker results']) {
    const region = page.getByLabel(source);
    await expect(region.locator('article')).toHaveCount(6);
    await expect(region.getByRole('heading', { name: 'Case of the day' })).toBeVisible();
    await expect(region.locator('pre')).toHaveCount(5);
  }
});

test('backup downloads, previews, and restores only after confirmation', async ({ page }) => {
  await page.goto('/?e2e#ground');
  await page.waitForFunction(() => '__nandiTest' in globalThis);
  await page.evaluate(() => (globalThis as unknown as { __nandiTest: { seedShell: () => Promise<void> } }).__nandiTest.seedShell());
  await page.getByRole('button', { name: /Backup and restore/ }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^nandi-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await download.path();
  expect(path).not.toBeNull();
  const before = await page.evaluate(() => (globalThis as unknown as { __nandiTest: { shellCounts: () => Promise<Record<string, number>> } }).__nandiTest.shellCounts());
  await page.evaluate(() => (globalThis as unknown as { __nandiTest: { removeShellTask: () => Promise<void> } }).__nandiTest.removeShellTask());
  expect((await page.evaluate(() => (globalThis as unknown as { __nandiTest: { shellCounts: () => Promise<Record<string, number>> } }).__nandiTest.shellCounts())).tasks).toBe(0);
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose restore file' }).click();
  await (await chooserPromise).setFiles(path!);
  const preview = page.getByLabel('Restore preview');
  await expect(preview).toBeVisible();
  await expect(preview.getByText('tasks')).toBeVisible();
  await expect(preview.getByText('2026-10-07')).toBeVisible();
  expect((await page.evaluate(() => (globalThis as unknown as { __nandiTest: { shellCounts: () => Promise<Record<string, number>> } }).__nandiTest.shellCounts())).tasks).toBe(0);
  await preview.getByRole('button', { name: 'Confirm restore' }).click();
  await expect(page.getByRole('status')).toHaveText('Restore complete. Your data is ready.');
  expect(await page.evaluate(() => (globalThis as unknown as { __nandiTest: { shellCounts: () => Promise<Record<string, number>> } }).__nandiTest.shellCounts())).toEqual(before);
});

test('offline reload still opens every tab', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => { await (globalThis as unknown as { navigator: { serviceWorker: { ready: Promise<unknown> } } }).navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  for (const name of names) {
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name }).click();
    await expect(page.getByRole('main').getByRole('heading', { name, exact: true })).toBeVisible();
  }
});
