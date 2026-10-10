import { expect, test } from '@playwright/test';

const tabs = ['Today', 'Tasks', 'Train', 'Mind', 'Ground'];
interface TestHook { shellCounts: () => Promise<Record<string, number>>; wipeData: () => Promise<void> }

test('visible controls meet tap size and tabs do not scroll sideways in both themes', async ({ page }) => {
  await page.goto('/');
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const name of tabs) {
      await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name }).click();
      await expect(page.getByRole('main').getByRole('heading', { name, exact: true })).toBeVisible();
      const controls = page.locator('button, a, select, input');
      for (let index = 0; index < await controls.count(); index++) {
        const control = controls.nth(index);
        if (!await control.isVisible()) continue;
        const box = await control.boundingBox();
        expect(box?.width, `${scheme} ${name}: ${await control.evaluate(node => node.outerHTML)} width`).toBeGreaterThanOrEqual(44);
        expect(box?.height, `${scheme} ${name}: ${await control.evaluate(node => node.outerHTML)} height`).toBeGreaterThanOrEqual(44);
      }
      expect(await page.evaluate(() => (globalThis as unknown as { document: { documentElement: { scrollWidth: number } } }).document.documentElement.scrollWidth), `${scheme} ${name} horizontal scroll`).toBeLessThanOrEqual(page.viewportSize()!.width);
    }
  }
});

test('theme and reduced motion survive reload', async ({ page }) => {
  await page.goto('/#ground');
  await page.getByLabel('Motion').selectOption('reduce');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
  await page.getByLabel('Theme').selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.getByLabel('Motion')).toHaveValue('reduce');
  await expect(page.getByLabel('Theme')).toHaveValue('light');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('legacy fixture previews and imports through the restore picker', async ({ page }) => {
  await page.goto('/?e2e#ground/backup');
  await page.waitForFunction(() => '__nandiTest' in globalThis);
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose restore file' }).click();
  await (await chooserPromise).setFiles('legacy/data/fixture-legacy-export.json');
  const preview = page.getByLabel('Restore preview');
  await expect(preview).toContainText('Legacy export');
  for (const [name, count] of Object.entries({ cards: 3, ratings: 2, deckProg: 3, puzzleRuns: 2, flags: 1, settings: 8 })) {
    await expect(preview.locator('.count-list li').filter({ has: page.locator('span', { hasText: new RegExp(`^${name}$`) }) }).locator('strong')).toHaveText(String(count));
  }
  await preview.getByRole('button', { name: 'Confirm restore' }).click();
  await expect(page.getByRole('main').getByRole('status')).toHaveText('Restore complete. Your data is ready.');
  const counts = await page.evaluate(() => (globalThis as unknown as { __nandiTest: TestHook }).__nandiTest.shellCounts());
  expect(counts).toMatchObject({ cards: 3, ratings: 2, deckProg: 3, puzzleRuns: 2, flags: 1 });
  expect(counts.settings).toBeGreaterThanOrEqual(8);
});

test('theme survives backup, wipe, and picker restore', async ({ page }) => {
  await page.goto('/?e2e#ground');
  await page.waitForFunction(() => '__nandiTest' in globalThis);
  await page.getByLabel('Theme').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: /Backup and restore/ }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const download = await downloadPromise;
  const file = await download.path();
  expect(file).not.toBeNull();
  await page.evaluate(() => (globalThis as unknown as { __nandiTest: TestHook }).__nandiTest.wipeData());
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose restore file' }).click();
  await (await chooserPromise).setFiles(file!);
  await expect(page.getByLabel('Restore preview')).toContainText('NANDI backup');
  await page.getByLabel('Restore preview').getByRole('button', { name: 'Confirm restore' }).click();
  await expect(page.getByRole('main').getByRole('status')).toHaveText('Restore complete. Your data is ready.');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Ground' }).click();
  await expect(page.getByLabel('Theme')).toHaveValue('dark');
});
