import { expect, test } from '@playwright/test';

// b2 (7 Nov): the first open's "Ready to work offline" notice is a toast over the page. Its arrival and its going
// shift nothing (CLS < 0.1 from just before it appears until after it has gone). The service worker is allowed here,
// since the notice only comes from it.
test('the offline-ready notice arrives and leaves without shifting the screen', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); // daytime: after shutdown the app opens the night deck
  await page.addInitScript(() => {
    const store = window as Window & { shifts?: [number, number][]; noticeAt?: number };
    store.shifts = [];
    new PerformanceObserver(list => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!entry.hadRecentInput) store.shifts!.push([entry.startTime, entry.value]);
    }).observe({ type: 'layout-shift', buffered: true });
    new MutationObserver(() => { if (store.noticeAt === undefined && document.querySelector('.offline-ready-toast')) store.noticeAt = performance.now(); })
      .observe(document, { childList: true, subtree: true });
  });
  await page.goto('/');
  const notice = page.getByRole('status', { name: 'Offline ready' });
  await expect(notice).toBeVisible({ timeout: 30_000 });
  await expect(notice).toHaveCSS('position', 'fixed');
  await expect(notice).toHaveCSS('pointer-events', 'none');
  await expect(notice).toBeHidden({ timeout: 6_000 });
  await page.waitForTimeout(500);
  const { shift, noticeAt } = await page.evaluate(() => {
    const store = window as Window & { shifts?: [number, number][]; noticeAt?: number };
    const from = (store.noticeAt ?? 0) - 50;
    return { noticeAt: store.noticeAt, shift: store.shifts!.filter(([at]) => at >= from).reduce((sum, [, value]) => sum + value, 0) };
  });
  expect(noticeAt, 'the notice was seen arriving').toBeDefined();
  expect(shift).toBeLessThan(0.1);
});
