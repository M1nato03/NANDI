import { expect, test } from '@playwright/test';
import { todaysBoard } from './helpers/mind';
import { openMore } from './helpers/plan';

for (const scheme of ['light', 'dark'] as const) {
  test(`four tabs (spec 34), opening on Yatra (spec 37), in ${scheme}`, async ({ page }, testInfo) => {
    await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    const tabs = page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link');
    await expect(tabs).toHaveText(['Yatra', 'Plan', 'Read', 'You']);
    // Spec 37: the app opens on Yatra; Plan is one tap away.
    await expect(page).toHaveURL(/#yatra$/);
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Plan' }).click();
    await expect(page).toHaveURL(/#plan$/);
    await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
    // Spec 27: routines and the focus timer with breaks sit in Plan's More fold.
    await openMore(page);
    await expect(page.getByRole('button', { name: 'Focus timer with breaks' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Morning plan/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Shutdown/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Weekly review/ })).toBeVisible();
    await openMore(page);
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Call bank 15m');
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Today', exact: true })).toContainText('Call bank');
    await page.getByRole('region', { name: 'Today', exact: true }).getByRole('button', { name: /^Done: Call bank/ }).click();
    await expect(page.getByRole('button', { name: 'Plan: done' })).toBeVisible();
    await page.getByRole('button', { name: 'Read: not done' }).click();
    await expect(page).toHaveURL(/#read$/);
    await expect(page.getByRole('heading', { name: 'Your books', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Continue' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Courses' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Review cards' })).toHaveCount(0);
    // Spec 34: Kapi's shelf is Yatra's Mind corner.
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Yatra' }).click();
    await page.getByRole('button', { name: /^Mind: / }).click();
    await expect(page).toHaveURL(/#yatra\/mind$/);
    await expect(page.getByRole('heading', { name: "Kapi's shelf", exact: true })).toBeVisible();
    await expect(todaysBoard(page)).toBeVisible();
    await expect(page.getByRole('button', { name: /^(?:Open|Continue) the case$/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Card reviews' })).toBeVisible();
    await expect(page.getByRole('main').getByText("Today's drop")).toHaveCount(0);
    await tabs.filter({ hasText: 'You' }).click();
    await expect(page.getByRole('heading', { name: 'You', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Settings/ })).toBeVisible();
    await expect(page.getByRole('main').getByRole('button', { name: 'Open Learn' })).toHaveCount(0);
    // Spec 34: Train is Yatra's Train corner now.
    await tabs.filter({ hasText: 'Yatra' }).click();
    await page.getByRole('button', { name: /^Train: / }).click();
    await expect(page.getByRole('heading', { name: 'Train', exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`tabs-${scheme}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const small = await page.locator('.tabbar a, .today-dot').evaluateAll(nodes => nodes.filter(node => { const box = node.getBoundingClientRect(); return box.width < 43.5 || box.height < 43.5; }).length);
    expect(small).toBe(0);
  });
}

test('old routes redirect to feature homes and night stays separate', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  for (const [oldRoute, newRoute] of [['now', 'plan'], ['you/train', 'yatra/train'], ['you/learn', 'read'], ['you/mind', 'yatra/mind'], ['train', 'yatra/train'], ['read/games', 'yatra/mind'], ['mind/case', 'yatra/mind/case']] as const) {
    await page.goto(`/#${oldRoute}`);
    await expect(page).toHaveURL(new RegExp(`#${newRoute}$`));
  }
  await page.goto('/#night');
  await expect(page.getByRole('article', { name: 'Tonight card' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main tabs' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Go to card 6: That’s tonight' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/#plan$/);
});
