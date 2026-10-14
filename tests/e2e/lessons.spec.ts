/// <reference lib="dom" />
import { expect, test } from '@playwright/test';

for (const scheme of ['light', 'dark'] as const) {
  test(`Daily Drop lesson, reviews, reload and stop in ${scheme}`, async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.clock.setFixedTime(new Date('2026-10-11T12:00:00'));
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/?e2e#you/learn');
    await page.getByRole('button', { name: 'Start lesson', exact: true }).click();
    const lesson = page.locator('.mind-lesson');
    await expect(lesson.getByLabel('guess screen')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`lesson-guess-${scheme}.png`), fullPage: true });
    await lesson.locator('.mind-lesson-options button').first().click();
    await expect(lesson).toHaveAttribute('data-save-state', 'saved');
    await expect(lesson.getByText('Saved', { exact: true })).toBeVisible();
    await page.reload();
    await expect(lesson.getByLabel('guess screen')).toBeVisible();
    await expect(lesson.locator('.mind-lesson-options button').first()).toBeVisible();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
    await page.context().setOffline(true);
    await page.reload();
    await expect(lesson.getByLabel('guess screen')).toBeVisible();
    await page.context().setOffline(false);
    await lesson.getByRole('button', { name: /Sure · 90%/ }).click();
    const steps = [
      ['reveal', 'Continue'], ['source', 'Continue'], ['story', 'Continue'],
    ] as const;
    for (const [step, next] of steps) {
      await expect(lesson.getByLabel(`${step} screen`)).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`lesson-${step}-${scheme}.png`), fullPage: true });
      await lesson.getByRole('button', { name: next }).click();
    }
    for (const step of ['transfer', 'why'] as const) {
      await expect(lesson.getByLabel(`${step} screen`)).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`lesson-${step}-${scheme}.png`), fullPage: true });
      await lesson.locator('.mind-lesson-options button').first().click();
      await lesson.getByRole('button', { name: 'Continue' }).click();
    }
    await expect(lesson.getByLabel('plan screen')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`lesson-plan-${scheme}.png`), fullPage: true });
    await lesson.getByRole('button', { name: 'Skip' }).click();
    await expect(lesson.getByLabel('done screen')).toBeVisible();
    await expect(lesson).toContainText('2 cards added to your deck');
    await page.screenshot({ path: testInfo.outputPath(`lesson-done-${scheme}.png`), fullPage: true });
    const controls = await lesson.evaluate(root => [...root.querySelectorAll<HTMLButtonElement>('button')].every(button => button.getBoundingClientRect().width >= 44 && button.getBoundingClientRect().height >= 44));
    expect(controls).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await lesson.getByRole('button', { name: 'Done' }).click();

    await page.getByRole('button', { name: 'Review due cards' }).click();
    for (let i = 0; i < 20; i++) {
      if (await page.getByRole('heading', { name: 'Reviews complete.' }).isVisible()) break;
      const card = page.getByLabel('Review card');
      await expect(card).toBeVisible();
      if (i === 0) await page.screenshot({ path: testInfo.outputPath(`review-recall-${scheme}.png`), fullPage: true });
      if (await card.getByRole('button', { name: 'Reveal answer' }).isVisible()) {
        await card.getByRole('button', { name: 'Reveal answer' }).click();
        await card.getByRole('button', { name: 'Got it' }).click();
      } else {
        const options = card.locator('.mind-lesson-options button');
        await expect(options.first()).toBeVisible();
        if (i === 3) await page.screenshot({ path: testInfo.outputPath(`review-item-${scheme}.png`), fullPage: true });
        await options.first().click();
        await card.getByRole('button', { name: 'Continue' }).click();
      }
    }
    await expect(page.getByRole('heading', { name: 'Reviews complete.' })).toBeVisible();
    await page.getByRole('button', { name: 'Back to Learn' }).click();
    await expect(page.getByRole('heading', { name: "Today's learning complete." })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open daily board' })).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath(`learning-complete-${scheme}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
