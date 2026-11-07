import { expect, test } from '@playwright/test';

test('owner panel opens from five taps on the version line and asks for a PIN', async ({ page }, testInfo) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto('/#you/settings');
  await page.getByText('About this app').click();
  const version = page.locator('.about-app p.small').first();
  for (let i = 0; i < 5; i++) await version.click();
  await expect(page.getByRole('heading', { name: 'Set an owner PIN' })).toBeVisible();
  await page.getByLabel('PIN').fill('2468');
  await page.getByRole('button', { name: 'Save PIN' }).click();
  const panel = page.getByRole('region', { name: 'Owner panel' });
  await expect(panel.getByRole('heading', { name: 'How NANDI is doing' })).toBeVisible();
  await expect(panel).toContainText('Opens today');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Owner panel' })).toBeVisible();
  await page.getByLabel('PIN').fill('1111');
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(page.getByText('That PIN does not match.')).toBeVisible();
  await page.getByLabel('PIN').fill('2468');
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(panel).toContainText('Learn accuracy (7 d)');
  await page.screenshot({ path: testInfo.outputPath('owner-panel.png'), fullPage: true });
});

// b2 (7 Nov): the owner-only text size check reads plain numbers. With the CSS root at 200% (the path our 200% tests
// take), rem doubles but 16px text stays 16px; on a phone that scales text through WebView text zoom instead, the
// 16px text would grow too. That difference is what Jenil reads out at the largest font.
for (const [label, big, expected] of [
  ['100%', false, ['16px', '16px', '16px', '24px / 16px']],
  ['root 200%', true, ['32px', '32px', '16px', '48px / 32px']],
] as const) {
  test(`owner panel text size check at ${label}`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
    if (big) await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const style = document.createElement('style'); style.textContent = 'html { font-size: 200% !important; }'; document.head.append(style); }));
    await page.goto('/#you/settings');
    await page.getByText('About this app').click();
    const version = page.locator('.about-app p.small').first();
    for (let i = 0; i < 5; i++) await version.click();
    await page.getByLabel('PIN').fill('2468');
    await page.getByRole('button', { name: 'Save PIN' }).click();
    const check = page.getByRole('region', { name: 'Text size check' });
    await expect(check.locator('dd')).toHaveText([...expected]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}
