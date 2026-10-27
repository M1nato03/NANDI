import { expect, test } from '@playwright/test';

// Spec 34: four tabs; Read's heading is "Your books".
const tabs = ['Plan', 'Read', 'Yatra', 'You'];
const headings: Record<string, string> = { Plan: 'Plan', Read: 'Your books', Yatra: 'Yatra', You: 'You' };
interface TestHook { shellCounts: () => Promise<Record<string, number>>; wipeData: () => Promise<void> }

test('visible controls meet tap size and tabs do not scroll sideways in both themes', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); // daytime: after shutdown the app opens the night deck
  await page.goto('/');
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const name of tabs) {
      await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name }).click();
      await expect(page.getByRole('main').getByRole('heading', { name: headings[name], exact: true })).toBeVisible();
      // One pass in the page (a round trip per control made this test slow enough to time out under load).
      const tooSmall = await page.locator('button, a, select, input').evaluateAll(nodes => nodes.flatMap(node => {
        const box = node.getBoundingClientRect();
        const visible = box.width > 0 && box.height > 0 && getComputedStyle(node).visibility !== 'hidden';
        return visible && (box.width < 44 || box.height < 44) ? [`${Math.round(box.width)}x${Math.round(box.height)} ${node.outerHTML}`] : [];
      }));
      expect(tooSmall, `${scheme} ${name}: controls under 44 px`).toEqual([]);
      expect(await page.evaluate(() => (globalThis as unknown as { document: { documentElement: { scrollWidth: number } } }).document.documentElement.scrollWidth), `${scheme} ${name} horizontal scroll`).toBeLessThanOrEqual(page.viewportSize()!.width);
    }
  }
});

test('theme and reduced motion survive reload', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); // daytime: after shutdown the app opens the night deck
  await page.goto('/#you');
  await page.getByRole('button', { name: /Settings/ }).click();
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
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); // daytime: after shutdown the app opens the night deck
  await page.goto('/?e2e#you/backup');
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
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); // daytime: after shutdown the app opens the night deck
  await page.goto('/?e2e#you');
  await page.waitForFunction(() => '__nandiTest' in globalThis);
  await page.getByRole('button', { name: /Settings/ }).click();
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
  await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'You' }).click();
  await page.getByRole('button', { name: /Settings/ }).click();
  await expect(page.getByLabel('Theme')).toHaveValue('dark');
});
