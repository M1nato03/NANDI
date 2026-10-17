/// <reference lib="dom" />
import { expect, test } from '@playwright/test';

for (const scheme of ['light', 'dark'] as const) {
  test(`drone track resumes, adds reviews and stops in ${scheme}`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.clock.setFixedTime(new Date('2026-10-12T12:00:00'));
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/?e2e#you/mind');
    await page.getByText('Courses and past lessons').click();
    const tracks = page.getByLabel('Learning tracks');
    await tracks.getByRole('button', { name: 'Pick this track' }).click();
    await expect(tracks).toContainText('Drone technology');
    await expect(tracks.getByLabel('Learning budget')).toContainText('15 / 25 min');
    await page.screenshot({ path: testInfo.outputPath(`track-picked-${scheme}.png`), fullPage: true });
    await tracks.getByRole('button', { name: 'Start today’s unit' }).click();
    const unit = page.getByLabel('Track unit');
    await expect(unit).toContainText('Lift and thrust');
    await expect(unit).toHaveAttribute('data-save-state', 'saved');
    await page.reload();
    await expect(unit).toContainText('Lift and thrust');
    await expect(unit).toHaveAttribute('data-save-state', 'saved');
    await page.screenshot({ path: testInfo.outputPath(`track-points-${scheme}.png`), fullPage: true });
    await unit.getByRole('button', { name: 'Start three-question check' }).click();
    for (let index = 0; index < 3; index++) {
      const question = unit.locator('.track-question').nth(index);
      await question.locator('input[type="radio"]').first().check();
      await expect(unit).toHaveAttribute('data-save-state', 'saved');
      await question.getByRole('combobox').selectOption('65');
      await expect(unit).toHaveAttribute('data-save-state', 'saved');
    }
    await unit.getByRole('button', { name: 'See recall cards' }).click();
    await expect(unit).toContainText('Three recall cards');
    await page.screenshot({ path: testInfo.outputPath(`track-cards-${scheme}.png`), fullPage: true });
    const controls = await unit.evaluate(root => [...root.querySelectorAll<HTMLButtonElement>('button')].every(button => button.getBoundingClientRect().width >= 44 && button.getBoundingClientRect().height >= 44));
    expect(controls).toBe(true);
    await unit.getByRole('button', { name: 'Finish unit' }).click();
    await page.getByText('Courses and past lessons').click();
    await expect(tracks.getByRole('heading', { name: 'Done for today' })).toBeVisible();
    await expect(tracks.getByLabel('Learning budget')).toContainText('15 / 25 min');
    await page.screenshot({ path: testInfo.outputPath(`track-stop-${scheme}.png`), fullPage: true });
    await page.reload();
    await page.getByText('Courses and past lessons').click();
    await expect(tracks.getByRole('heading', { name: 'Done for today' })).toBeVisible();
    await page.getByRole('button', { name: 'Review due cards' }).click();
    await expect(page.getByLabel('Review card')).toContainText('What do rotors push to make lift?');
    await page.screenshot({ path: testInfo.outputPath(`track-review-${scheme}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
