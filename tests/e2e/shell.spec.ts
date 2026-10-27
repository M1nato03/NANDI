import { expect, test } from '@playwright/test';

// Spec 33: three tabs; Read's heading is "Your books".
const names = ['Plan', 'Read', 'Yatra', 'You'];
const heading: Record<string, string> = { Plan: 'Plan', Read: 'Your books', Yatra: 'Yatra', You: 'You' };

test('day one shows a calm You before Season 1', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#you');
  // Day one stays calm: level, streak and the week; the season card waits for its last week.
  await expect(page.getByRole('region', { name: 'Your season' })).toContainText('Level 1');
  await expect(page.getByRole('region', { name: 'Your season' })).not.toContainText('Season 1 starts');
  await expect(page.getByRole('region', { name: 'Your season' })).not.toContainText('Shards');
  await page.goto('/#mind');
  await expect(page.getByRole('main')).toContainText("Kapi's shelf");
});

test('offline ready notice clears visible buttons and dismisses', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); // daytime: after shutdown the app opens the night deck
  await page.goto('/');
  const toast = page.getByRole('status', { name: 'Offline ready' });
  await expect(toast).toBeVisible({ timeout: 30_000 });
  const overlappingButtons = await toast.evaluate(element => {
    const notice = element.getBoundingClientRect();
    return [...document.querySelectorAll('button')].filter(button => {
      const style = getComputedStyle(button);
      const rect = button.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
        && notice.left < rect.right && notice.right > rect.left && notice.top < rect.bottom && notice.bottom > rect.top;
    }).map(button => button.getAttribute('aria-label') ?? button.textContent?.trim());
  });
  expect(overlappingButtons).toEqual([]);
  await expect(toast).toHaveCSS('pointer-events', 'none');
  await expect(toast).toBeHidden({ timeout: 5_000 });
});

test('the three tabs remain reachable after reload in both themes', async ({ page }, testInfo) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); // daytime: after shutdown the app opens the night deck
  await page.goto('/');
  for (const scheme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const name of names) {
      await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name }).click();
      await expect(page.getByRole('main').getByRole('heading', { name: heading[name], exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByRole('main').getByRole('heading', { name: heading[name], exact: true })).toBeVisible();
      expect(await page.evaluate(() => (globalThis as unknown as { document: { documentElement: { scrollWidth: number } }; innerWidth: number }).document.documentElement.scrollWidth <= (globalThis as unknown as { innerWidth: number }).innerWidth)).toBe(true);
    }
    await page.screenshot({ path: testInfo.outputPath(`you-${scheme}.png`), fullPage: true });
  }
});

test('generator check displays five boards and the case from both threads', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); // daytime: after shutdown the app opens the night deck
  test.setTimeout(90000);
  await page.goto('/#you/settings');
  await page.getByText('About this app').click();
  await page.getByRole('button', { name: 'Puzzle generator check' }).click();
  await expect(page.getByRole('main').getByRole('status')).toHaveText('Match', { timeout: 60000 });
  const speed = page.getByRole('heading', { name: 'Number Path (hard) speed' }).locator('..');
  await expect(speed).toContainText('20 boards', { timeout: 60000 });
  await expect(speed).toContainText(/p50: .* ms/, { timeout: 60_000 });
  await expect(speed).toContainText(/p95: .* ms · 300 ms budget · (within budget|over budget)/, { timeout: 60_000 });
  await expect(speed).toContainText(/max: .* ms/, { timeout: 60_000 });
  for (const source of ['Main thread results', 'Worker results']) {
    const region = page.getByLabel(source);
    await expect(region.locator('article')).toHaveCount(6);
    await expect(region.getByRole('heading', { name: 'Case of the day' })).toBeVisible();
    await expect(region.locator('pre')).toHaveCount(5);
  }
});

test('backup downloads, previews, and restores only after confirmation', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); // daytime: after shutdown the app opens the night deck
  await page.goto('/?e2e#you');
  await page.waitForFunction(() => '__nandiTest' in globalThis);
  await page.evaluate(() => (globalThis as unknown as { __nandiTest: { seedShell: () => Promise<void> } }).__nandiTest.seedShell());
  await page.getByRole('button', { name: /Settings/ }).click();
  await page.getByRole('button', { name: /Backup and restore/ }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^nandi-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await download.path();
  expect(path).not.toBeNull();
  // lastBackupAt is written after the download starts; wait for the confirmation before counting rows.
  await expect(page.getByRole('main').getByRole('status')).toContainText('Saved to Downloads');
  const before = await page.evaluate(() => (globalThis as unknown as { __nandiTest: { shellCounts: () => Promise<Record<string, number>> } }).__nandiTest.shellCounts());
  await page.evaluate(() => (globalThis as unknown as { __nandiTest: { removeShellTask: () => Promise<void> } }).__nandiTest.removeShellTask());
  expect((await page.evaluate(() => (globalThis as unknown as { __nandiTest: { shellCounts: () => Promise<Record<string, number>> } }).__nandiTest.shellCounts())).tasks).toBe(0);
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose restore file' }).click();
  await (await chooserPromise).setFiles(path!);
  const preview = page.getByLabel('Restore preview');
  await expect(preview).toBeVisible();
  await expect(preview.getByText('tasks')).toBeVisible();
  await expect(preview.getByText(/Wed 7 Oct/)).toBeVisible();
  expect((await page.evaluate(() => (globalThis as unknown as { __nandiTest: { shellCounts: () => Promise<Record<string, number>> } }).__nandiTest.shellCounts())).tasks).toBe(0);
  await preview.getByRole('button', { name: 'Confirm restore' }).click();
  await expect(page.getByRole('main').getByRole('status')).toHaveText('Restore complete. Your data is ready.');
  const after = await page.evaluate(() => (globalThis as unknown as { __nandiTest: { shellCounts: () => Promise<Record<string, number>> } }).__nandiTest.shellCounts());
  // Device-local settings (offline-ready flag, lastBackupAt, reconcile markers) may be written in the
  // background at any time, so settings may only grow; every other table must match exactly.
  const { settings: settingsAfter = 0, ...restAfter } = after;
  const { settings: settingsBefore = 0, ...restBefore } = before;
  expect(restAfter).toEqual(restBefore);
  expect(settingsAfter).toBeGreaterThanOrEqual(settingsBefore);
});

test('offline reload still opens every tab', async ({ page, context }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); // daytime: after shutdown the app opens the night deck
  await page.goto('/');
  await page.evaluate(async () => { await (globalThis as unknown as { navigator: { serviceWorker: { ready: Promise<unknown> } } }).navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  for (const name of names) {
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name }).click();
    await expect(page.getByRole('main').getByRole('heading', { name: heading[name], exact: true })).toBeVisible();
  }
  // The self-hosted display font must come from the precache, not fall back offline.
  const fontLoaded = await page.evaluate(async () => {
    const doc = (globalThis as unknown as { document: { fonts: { load: (f: string) => Promise<unknown[]>; check: (f: string) => boolean } } }).document;
    await doc.fonts.load('800 32px "Bricolage Grotesque"');
    return doc.fonts.check('800 32px "Bricolage Grotesque"');
  });
  expect(fontLoaded).toBe(true);
});
