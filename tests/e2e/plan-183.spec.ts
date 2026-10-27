import { expect, test } from '@playwright/test';
import { openMore } from './helpers/plan';

// Item 183 (Jenil, build 91): the tab bar spans the screen, and Plan is back to spec 27's first screen.
test('the tabs share the full width of the bar equally, on every tab', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-27T12:00:00') });
  for (const tab of ['plan', 'read', 'you']) {
    await page.goto(`/#${tab}`);
    const bar = page.getByRole('navigation', { name: 'Main tabs' });
    const box = (await bar.boundingBox())!;
    const links = await bar.getByRole('link').all();
    const widths: number[] = [];
    let right = 0;
    for (const link of links) {
      const cell = (await link.boundingBox())!;
      widths.push(cell.width);
      right = Math.max(right, cell.x + cell.width);
    }
    // The last tab ends at the bar's right padding, and no tab is wider than another.
    const padding = await bar.evaluate(node => parseFloat(getComputedStyle(node).paddingRight));
    expect(Math.abs(box.x + box.width - padding - right)).toBeLessThanOrEqual(1);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
  }
});

test("Plan's first screen is Mor, the add field and the three lists; everything else waits in a closed More", async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-26T21:00:00') }); // a Monday evening: storybook and kolam both qualify
  await page.goto('/#plan');
  await page.getByLabel('Add a task').fill('Buy milk');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const today = page.getByRole('region', { name: 'Today', exact: true });
  await expect(today).toContainText('Buy milk');
  // Each row: the circle, the name, Start and Tomorrow → (spec 27). No ⋯.
  const row = today.locator('.mor-row').filter({ hasText: 'Buy milk' });
  await expect(row.getByRole('button')).toHaveCount(4);
  await expect(row.getByRole('button', { name: 'Tomorrow: Buy milk' })).toHaveText('Tomorrow →');
  await row.getByRole('button', { name: 'Tomorrow: Buy milk' }).click();
  await expect(page.locator('.mor-toast')).toContainText('Moved to Tomorrow.');
  const tomorrow = page.getByRole('region', { name: 'Tomorrow', exact: true });
  await expect(tomorrow.getByRole('button', { name: 'Today: Buy milk' })).toHaveText('← Today');
  // Nothing sits between the lists: Today, Tomorrow and Later follow the add form in that order.
  const order = await page.locator('.mor-plan > *').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label') ?? node.className.split(' ')[0]));
  expect(order.filter(name => !['mor-toast', 'small', 'mor-noted', 'mor-average'].includes(name))).toEqual(["Mor's stage", 'mor-add', 'Today', 'Tomorrow', 'Later']);
  // More is the last thing on Plan and starts closed; the older cards are inside it.
  const more = page.locator('details.plan-more');
  await expect(more).not.toHaveAttribute('open');
  expect(await page.locator('.plan-screen > *').evaluateAll(nodes => nodes.filter(node => !node.matches('.sheet-backdrop')).at(-1)?.matches('details.plan-more'))).toBe(true);
  for (const name of ['Side quests', 'Planning routines', "Tonight's kolam"]) await expect(page.getByRole('region', { name })).toBeHidden();
  await openMore(page);
  for (const name of ['Side quests', 'Planning routines', "Tonight's kolam", 'Phone ki chhutti']) await expect(page.getByRole('region', { name })).toBeVisible();
  await expect(more.getByLabel('Add with details')).toBeVisible();
});
