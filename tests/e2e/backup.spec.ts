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
  expect(JSON.parse(result.exportedJson)).toMatchObject({ app: 'nandi', ppFormatVersion: 1 });
  expect(result.beforeCounts).toEqual(result.afterCounts);
  expect(result.afterCounts).toMatchObject({ tasks: 1, ledger: 1, settings: 3 });
});
