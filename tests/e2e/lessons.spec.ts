/// <reference lib="dom" />
import { expect, test } from '@playwright/test';

for (const scheme of ['light', 'dark'] as const) {
  test(`course lesson, reviews, reload and stop in ${scheme}`, async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.clock.setFixedTime(new Date('2026-10-11T12:00:00'));
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/?e2e#you/mind');
    await page.getByText('Courses and past lessons').click();
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
    await page.getByRole('button', { name: 'Finish reviews' }).click();
    await page.getByRole('button', { name: 'Board: not done' }).click();
    await expect(page.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => Boolean((window as Window & { __nandiMindTest?: unknown }).__nandiMindTest));
    await page.evaluate(() => (window as Window & { __nandiMindTest?: { solveKnownSolution: () => void } }).__nandiMindTest!.solveKnownSolution());
    await expect(page.getByLabel('Puzzle result')).toBeVisible();
    await expect(page.locator('.mind-board')).toHaveAttribute('data-save-state', 'saved');
    await page.getByRole('button', { name: 'Back to Mind' }).click();
    // The first board can be the intro; if the daily board is still open, solve it too.
    await expect(page.getByRole('button', { name: /^Board: / })).toBeVisible();
    if (await page.getByRole('button', { name: 'Board: not done' }).isVisible()) {
      await page.getByRole('button', { name: 'Board: not done' }).click();
      await expect(page.locator('.mind-grid')).toBeVisible({ timeout: 30_000 });
      await page.waitForFunction(() => Boolean((window as Window & { __nandiMindTest?: unknown }).__nandiMindTest));
      await page.evaluate(() => (window as Window & { __nandiMindTest?: { solveKnownSolution: () => void } }).__nandiMindTest!.solveKnownSolution());
      await expect(page.getByLabel('Puzzle result')).toBeVisible();
      await expect(page.locator('.mind-board')).toHaveAttribute('data-save-state', 'saved');
      await page.getByRole('button', { name: 'Back to Mind' }).click();
    }
    await expect(page.getByRole('button', { name: 'Case: not done' })).toBeVisible();
    await page.getByRole('button', { name: 'Case: not done' }).click();
    await expect(page.getByRole('heading', { name: 'Who was where?' })).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => Boolean(window.__nandiCaseTest));
    await page.evaluate(() => window.__nandiCaseTest!.solveTodaysCase());
    await expect(page.getByRole('heading', { name: 'Case closed.' })).toBeVisible();
    await expect(page.locator('.mind-case')).toHaveAttribute('data-save-state', 'saved');
    await expect(page.locator('.mind-case').getByRole('status')).toHaveText('Saved.');
    await expect(page.locator('.mind-case').getByRole('status')).toBeVisible();
    await page.getByRole('button', { name: 'Back to Mind' }).click();
    await expect(page.getByRole('button', { name: 'Case: done' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Board: done' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`practice-status-${scheme}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
