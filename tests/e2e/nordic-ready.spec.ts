import { expect, test, type Page } from '@playwright/test';

async function capture(page: Page, path: string) {
  const sizes = await page.locator('.train-screen button, .train-screen input, .train-workout button').evaluateAll(nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return { label: node.textContent?.trim() || node.getAttribute('aria-label') || node.tagName, width: box.width, height: box.height }; }).filter(box => box.width > 0 && box.height > 0));
  expect(sizes.filter(box => box.width < 44 || box.height < 44)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path, fullPage: true });
}

async function openHinge(page: Page, name: string) {
  await page.getByRole('button', { name: 'All exercises', exact: true }).click();
  await page.locator('.train-all-list button', { hasText: name }).click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

// Spec 17: slow SL-RDL 3x8 brings the ready card; "I'm ready" makes the next hinge session a 2x3 banded Nordic.
for (const scheme of ['light', 'dark'] as const) {
  test(`slow SL-RDL 3x8, the ready card, then a 2x3 banded Nordic in ${scheme}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.clock.install({ time: new Date('2026-10-23T12:00:00') });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/?e2e#plan');
    await page.waitForFunction(() => !!window.__nandiTest);
    await page.evaluate(async () => window.__nandiTest!.seedNordicSlow());
    await page.goto('/?e2e#train');
    await expect(page.getByRole('heading', { name: 'Hostel Bodyweight' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ready for a harder hamstring move?' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Start session' }).click();
    await expect(page.getByText('Exercise 1 of 7')).toBeVisible();
    await openHinge(page, 'Slow single-leg RDL');
    await expect(page.getByRole('list', { name: 'Form cues' })).toContainText('Lower for a slow count of 3.');
    await capture(page, testInfo.outputPath(`nordic-slow-${scheme}.png`));
    for (let set = 1; set <= 3; set++) {
      await expect(page.getByRole('heading', { name: `Set ${set} of 3` })).toBeVisible();
      await page.getByRole('spinbutton', { name: 'Reps' }).fill('8');
      await page.getByRole('button', { name: 'Log set' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Set saved' })).toBeVisible();
    }
    await page.getByRole('button', { name: 'Finish session' }).click();
    await expect(page.getByRole('heading', { name: 'Session finished' })).toBeVisible();

    await page.goto('/?e2e#train');
    const card = page.getByRole('region', { name: 'Ready for a harder hamstring move?' });
    await expect(card).toBeVisible();
    const ready = card.getByRole('button', { name: "I'm ready" });
    await expect(ready).toBeDisabled();
    await capture(page, testInfo.outputPath(`nordic-card-${scheme}.png`));
    for (const label of ['I have a resistance band', 'I have a secure ankle hold (a partner, or a heavy sofa that will not move)']) await card.getByRole('checkbox', { name: label }).check();
    await expect(ready).toBeDisabled();
    await card.getByRole('checkbox', { name: 'I have a mat or folded towel for my knees' }).check();
    await expect(ready).toBeEnabled();
    await ready.click();
    await expect(card).toHaveCount(0);

    await page.getByRole('button', { name: 'Start session' }).click();
    await expect(page.getByText('Exercise 1 of 7')).toBeVisible();
    await openHinge(page, 'Banded Nordic Curl');
    await expect(page.locator('.train-target')).toHaveText('2 × 3 reps');
    await expect(page.getByRole('heading', { name: 'Set 1 of 2' })).toBeVisible();
    await expect(page.getByText('Stop if you feel a sharp pull at the back of the thigh or pain behind the knee.')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Form cues' })).toContainText('Loop a band to help you on the way down.');
    await capture(page, testInfo.outputPath(`nordic-intro-${scheme}.png`));
  });
}
