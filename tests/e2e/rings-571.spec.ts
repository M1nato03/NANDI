import { expect, test, type Page } from '@playwright/test';

// Spec 571 §0.20, the header rings (stage 2 commit 6 UI). b2 call 3: on a fresh install the rings' slot is there and
// empty until reconcile writes economy.v10From, then the rings appear in it, and the top bar never changes size.
test.use({ viewport: { width: 360, height: 800 }, colorScheme: 'light', serviceWorkers: 'block' });
const NOON = new Date('2026-11-10T12:00:00');

/** Every size the top bar and the rings' slot had from the first frame, and whether the slot was ever empty first. */
async function watchBar(page: Page) {
  await page.addInitScript(() => {
    const store = window as Window & { bar?: string[]; emptyFirst?: boolean };
    store.bar = [];
    const look = () => {
      const bar = document.querySelector('.topbar'), slot = document.querySelector('.today-rings-slot');
      if (!bar || !slot) return;
      const a = bar.getBoundingClientRect(), b = slot.getBoundingClientRect();
      const size = `${a.width}x${a.height} ${b.width}x${b.height}`;
      if (store.bar!.at(-1) !== size) store.bar!.push(size);
      if (store.emptyFirst === undefined) store.emptyFirst = !slot.querySelector('.today-rings');
    };
    new MutationObserver(look).observe(document, { childList: true, subtree: true, attributes: true });
  });
}

test('fresh install: the slot is there and empty before v10From, the rings arrive in it, and the bar never changes size', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await watchBar(page);
  await page.goto('/?e2e');
  const rings = page.getByRole('navigation', { name: "Today’s rings" });
  await expect(rings).toBeVisible({ timeout: 15_000 });
  await expect(rings.getByRole('button')).toHaveCount(3);
  const { bar, emptyFirst } = await page.evaluate(() => { const store = window as Window & { bar?: string[]; emptyFirst?: boolean }; return { bar: store.bar!, emptyFirst: store.emptyFirst }; });
  expect(emptyFirst, 'the slot was there before the rings').toBe(true);
  expect(bar, 'one size from the first frame to the rings').toHaveLength(1);
  // Nothing is lit on a new phone, and no ring shows a ghost mark.
  await expect(page.locator('.today-rings .ring-mark')).toHaveCount(0);
  await expect(rings.getByRole('button', { name: 'Mind: any two.' })).toBeVisible();
});

test('a tap shows the ring’s one line and a way to its area; Mind opens Read', async ({ page }) => {
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e');
  const mind = page.getByRole('button', { name: 'Mind: any two.' });
  await mind.click();
  const line = page.locator('.today-rings-line');
  await expect(line).toContainText('Mind: any two.');
  await line.getByRole('button', { name: 'Open Read' }).click();
  await expect(page).toHaveURL(/#grow\/read$/);
  await expect(line).toBeHidden();
});

test('inside the night window every ring shows the moon and says the rings rest', async ({ page }) => {
  // The default bedtime is 01:30, so 02:30 is inside the window (it ends at 05:00).
  await page.clock.install({ time: new Date('2026-11-11T02:30:00') });
  await page.goto('/?e2e#yatra');
  // After bedtime the app opens the night deck (no top bar there); the rings are one tap behind it, on a tab route.
  const leave = page.getByRole('button', { name: 'Leave night deck' });
  const rings = page.getByRole('navigation', { name: "Today’s rings" });
  // As yatra-trek's openYatra: stay only once the tab route holds (the deck can take over once settings load).
  await expect(async () => {
    if (await leave.isVisible()) await leave.click();
    await page.evaluate(() => { if (location.hash !== '#yatra') location.hash = '#yatra'; });
    await expect(rings).toBeVisible({ timeout: 1500 });
    await page.waitForTimeout(800);
    await expect(rings).toBeVisible({ timeout: 100 });
  }).toPass({ timeout: 20_000 });
  await expect(rings.locator('.ring-mark-moon')).toHaveCount(3);
  for (const button of await rings.getByRole('button').all()) await expect(button).toHaveAccessibleName('Rings rest for the night.');
  await rings.getByRole('button').first().click();
  await expect(page.locator('.today-rings-line')).toHaveText('Rings rest for the night.');
});
