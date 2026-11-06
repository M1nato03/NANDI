import { expect, test } from '@playwright/test';
import { bundledItems } from './helpers/e12-items';

// a9 via b2 (7 Nov): "Tap a term, then its match" reads the two columns as terms and matches, so no column may hold
// both sides of a pair. Every bundled match item, at the fitted question size.
test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date('2026-11-06T12:00:00')); });

const matches = bundledItems.filter(item => item.type === 'match');

test('there are match items to check', () => { expect(matches.length).toBeGreaterThan(10); });

for (const item of matches) {
  test(`${item.id}: each column holds one side of every pair`, async ({ page }) => {
    if (item.type !== 'match') return;
    await page.goto(`/?e2e&item=${encodeURIComponent(item.id)}#grow/read/item-demo`);
    await expect(page.locator('.learn-fit .learn-stem')).toHaveText(item.stem);
    const buttons = page.locator('.learn-options.learn-match > button');
    await expect(buttons).toHaveCount(item.options.length);
    const placed = await buttons.evaluateAll(nodes => nodes.map(node => ({ text: node.textContent!.trim(), x: Math.round(node.getBoundingClientRect().left) })));
    const columns = [...new Set(placed.map(button => button.x))].sort((a, b) => a - b);
    expect(columns, 'two columns').toHaveLength(2);
    const columnOf = (id: string) => placed.find(button => button.text === item.options.find(option => option.id === id)!.text)!.x;
    for (const pair of item.answer) expect(columnOf(pair.left), `${pair.left} and ${pair.right} sit in different columns`).not.toBe(columnOf(pair.right));
    // Three in each column.
    for (const x of columns) expect(placed.filter(button => button.x === x)).toHaveLength(item.options.length / 2);
  });
}
