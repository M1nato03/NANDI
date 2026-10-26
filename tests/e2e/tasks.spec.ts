import { expect, test, type Page } from '@playwright/test';
import { openMore } from './helpers/plan';

test('large task preview, grouped progress, and whole-task drop', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#plan');
  await openMore(page);
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').click();
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Complete the app work');
  await page.getByLabel('Minutes').fill('500');
  await page.getByLabel('Must', { exact: true }).check();
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  const preview = page.getByRole('dialog', { name: 'Split preview' });
  await expect(preview).toContainText('9 steps of about 56 min');
  await expect(page.getByRole('region', { name: 'Today' })).not.toContainText('Complete the app work');
  await preview.getByLabel('Number of steps').selectOption('10');
  await expect(preview).toContainText('10 steps of about 50 min');
  await preview.getByLabel('Number of steps').selectOption('9');
  await preview.getByLabel('Step 2 name').fill('Prepare the app release');
  await preview.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('main').getByRole('status')).toContainText('Split task saved.');
  const parent = page.getByRole('region', { name: 'Today' }).locator('.task-group');
  await expect(parent).toHaveCount(1);
  await expect(parent.locator('summary')).toContainText('0 of 9 steps done');
  await parent.locator('summary').click();
  await expect(parent.locator('.task-row')).toHaveCount(9);
  await expect(parent).toContainText('Prepare the app release');
  await parent.locator('.task-row').first().getByRole('button', { name: /^Done: / }).click();
  const remainingParent = page.locator('.task-group');
  await expect(remainingParent.locator('summary')).toContainText('1 of 9 steps done');
  await remainingParent.getByRole('button', { name: 'Drop whole task' }).click();
  await expect(remainingParent).toContainText('Drop this task and its remaining steps?');
  await remainingParent.getByRole('button', { name: 'Confirm drop' }).click();
  await expect(page.getByRole('main').getByRole('status')).toContainText('Split task dropped.');
  await expect(remainingParent).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('region', { name: 'Today' })).not.toContainText('Complete the app work');
});

async function expectLargeControls(page: Page) {
  const sizes = await page.locator('button, input, select, summary, .tabbar a').evaluateAll((nodes) => nodes.filter((node) => { const rect = node.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; }).map((node) => { const rect = node.getBoundingClientRect(); return { name: node.textContent?.trim() || node.getAttribute('aria-label') || node.tagName, width: rect.width, height: rect.height }; }));
  expect(sizes.filter((item) => item.width < 44 || item.height < 44)).toEqual([]);
}

for (const scheme of ['light', 'dark'] as const) {
  test(`task focus and backup round trip in ${scheme}`, async ({ page, context }, testInfo) => {
    await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/?e2e#plan');
    await page.waitForFunction(() => '__nandiTest' in globalThis);
    await openMore(page);
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').click();
    await expectLargeControls(page);
    await openMore(page);
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Write outline');
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Today' })).toContainText('Write outline');
    await openMore(page);
    await page.getByRole('button', { name: 'Focus timer with breaks' }).click();
    await expect(page.getByRole('region', { name: 'Focus task' })).toContainText('Write outline');
    await page.getByRole('button', { name: 'Start focus' }).click();
    await page.clock.fastForward(65_000);
    await page.evaluate("document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pageshow'));");
    await expect(page.locator('.timer-ring')).toContainText('23:');
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.clock.fastForward(60_000);
    await page.getByRole('button', { name: 'Resume' }).click();
    await page.clock.fastForward(60_000);
    await page.evaluate("document.dispatchEvent(new Event('visibilitychange'));");
    await expect(page.locator('.timer-ring')).toContainText('22:');
    await page.getByRole('region', { name: 'Focus task' }).getByRole('button', { name: 'Finish' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Planned 30 min' })).toContainText('Took 2 min');
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Plan' }).click();
    await openMore(page);
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').click();
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Keep this task');
    await page.getByRole('radio', { name: 'Unplaced' }).check();
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await openMore(page);
    await expect(page.getByPlaceholder('Add a task, e.g. call bank 15m')).toBeVisible();
    await expect.poll(async () => (await page.evaluate(() => window.__nandiTest!.shellCounts())).tasks).toBe(2);
    await page.reload();
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Plan' }).click();
    // Spec 27: a task with no time sits on Today.
    await expect(page.getByRole('region', { name: 'Today', exact: true })).toContainText('Keep this task');
    await page.screenshot({ path: testInfo.outputPath(`tasks-${scheme}.png`), fullPage: true });
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'You' }).click();
    await page.getByRole('button', { name: /Settings/ }).click();
    await page.getByRole('button', { name: /Backup and restore/ }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export backup' }).click();
    const saved = await (await downloadPromise).path();
    expect(saved).not.toBeNull();
    await page.evaluate(() => (globalThis as unknown as { __nandiTest: { wipeData: () => Promise<void> } }).__nandiTest.wipeData());
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Choose restore file' }).click();
    await (await chooser).setFiles(saved!);
    await page.getByRole('button', { name: 'Confirm restore' }).click();
    await expect(page.getByRole('main').getByRole('status')).toContainText('Restore complete');
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Plan' }).click();
    await expect(page.getByRole('region', { name: 'Today', exact: true })).toContainText('Keep this task');
    expect(await page.evaluate(() => (globalThis as unknown as { document: { documentElement: { scrollWidth: number } }; innerWidth: number }).document.documentElement.scrollWidth <= (globalThis as unknown as { innerWidth: number }).innerWidth)).toBe(true);
    await page.evaluate(() => (globalThis as unknown as { navigator: { serviceWorker: { ready: Promise<unknown> } } }).navigator.serviceWorker.ready);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('region', { name: 'Today', exact: true })).toContainText('Keep this task');
  });

  test(`the move sheet never refuses and keeps large controls in ${scheme}`, async ({ page }) => {
    // Spec 27 retired the postponing ladder: the same task moves again and again with no step, reason or Someday.
    await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/#plan');
    await page.getByLabel('Add a task').fill('Review notes');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expectLargeControls(page);
    for (const day of ['12', '13', '14', '15']) {
      await page.locator('.mor-row').filter({ hasText: 'Review notes' }).locator('.task-title-button').click();
      await page.getByRole('dialog').getByRole('button', { name: 'Another day…' }).click();
      const sheet = page.getByRole('dialog', { name: 'Move Review notes' });
      await expectLargeControls(page);
      await expect(sheet).not.toContainText(/first step|quick reason|Someday/i);
      await sheet.getByLabel('Day').fill(`2026-10-${day}`);
      await sheet.getByRole('button', { name: 'Move to this day' }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
    await expect(page.getByRole('region', { name: 'Later', exact: true })).toContainText('Review notes');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
