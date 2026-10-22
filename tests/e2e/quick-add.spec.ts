import { expect, test } from '@playwright/test';

// Live QA (build 67): the 2nd and 3rd task typed in a row were silently dropped, because the add form
// closed after the first add while the box kept focus. Type three in a row without leaving the box.
test('quick add keeps adding when tasks are typed in a row with Enter', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T10:00:00'));
  await page.goto('/#plan');
  const box = page.getByPlaceholder('Add a task, e.g. call bank 15m');
  await box.click();
  for (const title of ['Call bank 15m', 'Buy dal and rice 20m', 'Email the warden 10m']) {
    await box.pressSequentially(title);
    await box.press('Enter');
    await expect(box).toHaveValue('');
  }
  for (const title of ['Call bank', 'Buy dal and rice', 'Email the warden']) await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
});
