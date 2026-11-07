import { expect, test, type Page } from '@playwright/test';

// b2 (7 Nov, option A): the first open's "Ready to work offline" notice sits over the brand side of the top bar.
// The service worker is allowed here, since the notice only comes from it; every test is a fresh first open.
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date('2026-10-20T12:00:00')); }); // daytime

const notice = (page: Page) => page.getByRole('status', { name: 'Offline ready' });

/** Records layout shifts from the very start, the notice's first appearance, and (optionally) 200% text. */
async function open(page: Page, url: string, big: boolean) {
  await page.addInitScript(large => {
    const store = window as Window & { shifts?: [number, number][]; noticeAt?: number };
    store.shifts = [];
    new PerformanceObserver(list => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!entry.hadRecentInput) store.shifts!.push([entry.startTime, entry.value]);
    }).observe({ type: 'layout-shift', buffered: true });
    new MutationObserver(() => { if (store.noticeAt === undefined && document.querySelector('.offline-ready-toast')) store.noticeAt = performance.now(); })
      .observe(document, { childList: true, subtree: true });
    if (large) document.addEventListener('DOMContentLoaded', () => { const style = document.createElement('style'); style.textContent = 'html { font-size: 200% !important; }'; document.head.append(style); });
  }, big);
  await page.goto(url);
  if (!url.includes('#night')) await expect(notice(page)).toBeVisible({ timeout: 30_000 });
}

/** Buttons and links (the Today dots among them) that the visible notice's box touches. */
const covered = (page: Page) => notice(page).evaluate(element => {
  const box = element.getBoundingClientRect();
  return [...document.querySelectorAll<HTMLElement>('button, a[href], [role="button"]')].filter(node => {
    const style = getComputedStyle(node), rect = node.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
      && box.left < rect.right && box.right > rect.left && box.top < rect.bottom && box.bottom > rect.top;
  }).map(node => node.getAttribute('aria-label') ?? node.textContent?.trim());
});

/** WCAG contrast of the notice's text on its own (opaque) background. */
const contrast = (page: Page) => notice(page).evaluate(element => {
  const parse = (value: string) => (value.match(/[\d.]+/g) ?? []).map(Number);
  const style = getComputedStyle(element);
  const [r1, g1, b1] = parse(style.color), [r2, g2, b2, a2 = 1] = parse(style.backgroundColor);
  const lum = (r: number, g: number, b: number) => [r, g, b].map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i]!, 0);
  const [hi, lo] = [lum(r1!, g1!, b1!), lum(r2!, g2!, b2!)].sort((a, b) => b - a);
  return { ratio: (hi! + 0.05) / (lo! + 0.05), alpha: a2 };
});

const SCREENS: [string, string][] = [['Yatra', '/#yatra'], ['Plan', '/#plan'], ['Grow', '/#grow'], ['You', '/#you'],
  ['a question screen', '/?e2e&item=anchoring-9#grow/read/item-demo']];

for (const scheme of ['light', 'dark'] as const) {
  for (const big of [false, true]) {
    for (const [name, url] of SCREENS) {
      test(`${name}, ${scheme}${big ? ', 200% text' : ''}: the notice covers no button, link or Today dot and reads at 4.5:1`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await open(page, url, big);
        await expect(notice(page)).toHaveCSS('pointer-events', 'none');
        // It lives in the top bar, beside the brand, and keeps to one line there.
        await expect(page.locator('.topbar .brand-slot .offline-ready-toast')).toHaveCount(1);
        expect(await covered(page)).toEqual([]);
        // The overlay owns the whole bar (gate-rem2): never a pill half over the dots when they wrap at 200% text.
        const bar = (await page.locator('.topbar').boundingBox())!, box = (await notice(page).boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(bar.width - 33);
        expect(box.y).toBeGreaterThanOrEqual(bar.y - 0.5);
        expect(box.y + box.height).toBeLessThanOrEqual(bar.y + bar.height + 0.5);
        const { ratio, alpha } = await contrast(page);
        expect(alpha, 'an opaque background').toBe(1);
        expect(ratio, 'text contrast').toBeGreaterThanOrEqual(4.5);
      });
    }
  }
}

test('the notice arrives and leaves without shifting the screen (CLS < 0.1)', async ({ page }) => {
  await open(page, '/', false);
  await expect(notice(page)).toBeHidden({ timeout: 6_000 });
  // The brand and the Today dots it covered are back.
  await expect(page.locator('.topbar .brand')).toHaveCSS('visibility', 'visible');
  for (const dots of await page.locator('.topbar > .today-dots').all()) await expect(dots).toHaveCSS('visibility', 'visible');
  await page.waitForTimeout(500);
  const { shift, noticeAt } = await page.evaluate(() => {
    const store = window as Window & { shifts?: [number, number][]; noticeAt?: number };
    const from = (store.noticeAt ?? 0) - 50;
    return { noticeAt: store.noticeAt, shift: store.shifts!.filter(([at]) => at >= from).reduce((sum, [, value]) => sum + value, 0) };
  });
  expect(noticeAt, 'the notice was seen arriving').toBeDefined();
  expect(shift).toBeLessThan(0.1);
});

test('on a question screen the notice waits behind a live economy toast, so the two never show at once', async ({ page }) => {
  await open(page, '/?e2e&item=anchoring-9#grow/read/item-demo', false);
  // A stand-in for the XP toast, in its own class and slot, while the notice is up.
  await page.evaluate(() => { const toast = document.createElement('div'); toast.className = 'economy-toast'; toast.textContent = '+5 XP'; document.body.append(toast); });
  // Hidden by visibility, so it also leaves the accessibility tree: find it by its class.
  await expect(page.locator('.offline-ready-toast')).toHaveCSS('visibility', 'hidden');
  await page.evaluate(() => document.querySelector('.economy-toast')?.remove());
  await expect(notice(page)).toHaveCSS('visibility', 'visible');
});

test('a first open on Night keeps the notice for the first screen with the top bar, and shows it there once', async ({ page }) => {
  await open(page, '/#night', false);
  // Long enough for the service worker to be ready and for the old 4 s to have run out unseen.
  await expect.poll(() => page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())?.active), { timeout: 30_000 }).toBe(true);
  await page.waitForTimeout(6_000);
  await expect(notice(page)).toHaveCount(0);
  await page.evaluate(() => { location.hash = '#yatra'; });
  await expect(notice(page)).toBeVisible({ timeout: 10_000 });
  await expect(notice(page)).toBeHidden({ timeout: 6_000 });
  await page.evaluate(() => { location.hash = '#plan'; });
  await page.waitForTimeout(1_500);
  await expect(notice(page)).toHaveCount(0);
});
