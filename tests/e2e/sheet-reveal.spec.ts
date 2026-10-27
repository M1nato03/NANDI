import { expect, test } from '@playwright/test';
import { stepsOf } from './learn-helpers';

// Batch 3 (d): the sticky result sheet sat over the last option, often the right one with its check mark.
// anchoring-s2's hook was one of the 20 steps where that happened at 360x800.
test('after a missed hook guess the right answer stays in view, not under the result sheet', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 22, 12));
  await page.goto('/?e2e#learn/drop');
  const steps = stepsOf('psychology');
  const at = steps.findIndex(step => step.id === 'anchoring-s2');
  await page.waitForFunction(() => !!window.__nandiTest);
  // Taught a week ago up to the step before, so today's lesson is anchoring-s2.
  await page.evaluate(ids => window.__nandiTest!.seedTaughtSteps(ids), steps.slice(0, at).map(step => step.id));
  await page.reload();
  await page.getByRole('button', { name: /Human psychology/ }).click();
  await page.getByRole('button', { name: 'Start my first drop' }).click(); // exact: a classic's title also says Start
  const lesson = page.locator('.step-lesson');
  await expect(lesson).toHaveAttribute('data-lesson-phase', 'hook');
  const step = steps[at]!;
  await expect(lesson.locator('h2')).toHaveText(step.hook.stem);
  await page.getByRole('button', { name: step.hook.options.find(option => !option.correct)!.text, exact: true }).click();
  const sheet = page.locator('.learn-feedback');
  await expect(sheet).toBeVisible();
  const right = page.locator('.right-option, .step-lesson button.right').first();
  const target = (await right.count()) ? right : page.getByRole('button', { name: step.hook.options.find(option => option.correct)!.text, exact: true });
  await expect.poll(async () => {
    const [a, b] = [await target.boundingBox(), await sheet.boundingBox()];
    // The right answer ends above the top of the sheet.
    return !!a && !!b && a.y + a.height <= b.y + 1;
  }, { timeout: 5_000 }).toBe(true);
});
