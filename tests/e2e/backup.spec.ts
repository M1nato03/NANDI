import { expect, test } from '@playwright/test';

interface BackupRoundTripResult {
  exportedJson: string;
  beforeCounts: Record<string, number>;
  afterCounts: Record<string, number>;
}

test('backup survives a browser export, wipe, and import', async ({ page }) => {
  await page.goto('/?e2e');
  await page.waitForFunction(() => '__nandiTest' in globalThis);
  const result = await page.evaluate(() =>
    (globalThis as unknown as { __nandiTest: { backupRoundTrip: () => Promise<BackupRoundTripResult> } })
      .__nandiTest.backupRoundTrip());
  expect(JSON.parse(result.exportedJson)).toMatchObject({ app: 'nandi', ppFormatVersion: 2 });
  expect(result.beforeCounts).toEqual(result.afterCounts);
  expect(result.afterCounts).toMatchObject({ tasks: 1, ledger: 1, settings: 3 });
});

test('restore preview keeps its first row clear on phone widths', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); // daytime: after shutdown the app opens the night deck
  const legacy = {
    cards: Array.from({ length: 40 }, (_, index) => ({ id: `card-${index}`, law: 1, due: '2026-10-02' })),
    progress: { items: { retired: { b: 99, due: '9999-12-31' } } },
  };
  await page.goto('/#you');
  await page.getByRole('button', { name: /Settings/ }).click();
  await page.getByRole('button', { name: /Backup and restore/ }).click();
  for (const width of [360, 412]) {
    await page.setViewportSize({ width, height: 800 });
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Choose restore file' }).click();
    await (await chooser).setFiles({ name: 'legacy-preview.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(legacy)) });
    const card = page.getByLabel('Restore preview');
    await expect(card).toContainText('Fri 2 Oct to Fri 2 Oct');
    await expect(card).toContainText('1 retired');
    const subtitle = card.locator('p').first();
    const firstRow = card.locator('.count-list li').first();
    await expect(firstRow).toHaveText('cards40');
    const [cardBox, subtitleBox, rowBox] = await Promise.all([card.boundingBox(), subtitle.boundingBox(), firstRow.boundingBox()]);
    expect(cardBox).not.toBeNull();
    expect(subtitleBox).not.toBeNull();
    expect(rowBox).not.toBeNull();
    expect(rowBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
    expect(rowBox!.x + rowBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width);
    expect(rowBox!.y).toBeGreaterThanOrEqual(subtitleBox!.y + subtitleBox!.height);
    expect(rowBox!.y + rowBox!.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height);
    await card.getByRole('button', { name: 'Cancel' }).click();
  }
});

test('a restore says which backup came back, and "Last backup" stays this phone\'s own (bug hunt 30 Oct)', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto('/?e2e#you/backup');
  await expect(page.getByText('No backup made on this phone yet.')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const path = await (await download).path();
  await expect(page.getByText(/^Last backup: /)).toBeVisible();
  await page.evaluate(() => new Promise(resolve => { const request = indexedDB.deleteDatabase('nandi'); request.onsuccess = request.onerror = request.onblocked = () => resolve(null); }));
  await page.goto('/?e2e#you/backup');
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose restore file' }).click();
  await (await chooser).setFiles(path);
  await page.getByLabel('Restore preview').getByRole('button', { name: 'Confirm restore' }).click();
  await expect(page.getByRole('main').getByRole('status')).toHaveText(/^Restored · backup from .+\. Your data is ready\.$/);
  await expect(page.getByText('Not yet')).toHaveCount(0);
});
