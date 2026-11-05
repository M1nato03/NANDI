import { expect, test, type Page } from '@playwright/test';
import { walkIdea } from './learn-helpers';

// Spec 54: the jar is the Yatra trail filling from real things. A plan for a camp ahead, the finish line, the payout
// card with Share, and "Trail done for today." at the 60-minute cap.
const NOON = new Date('2026-11-05T12:00:00');
const TODAY = '2026-11-05';

async function seed(page: Page, settings: [string, unknown][], ledger: Record<string, unknown>[] = []) {
  await page.evaluate(async ([rows, facts]) => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>(resolve => {
      const transaction = database.transaction(['settings', 'ledger'], 'readwrite');
      for (const [key, value] of rows) transaction.objectStore('settings').put({ key, value, updatedAt: 1, deleted: 0, deviceId: 'jar' });
      for (const fact of facts) transaction.objectStore('ledger').put(fact);
      transaction.oncomplete = () => resolve();
    });
    database.close();
  }, [settings, ledger] as const);
  await page.reload();
}
const session = (n: number) => ({ id: `jar-session-${n}`, mode: 'train', kind: 'session', refId: `s${n}`, dayKey: TODAY, inputs: { workingSets: 6, status: 'completed' }, updatedAt: NOON.getTime() - 3_600_000 + n, deleted: 0, deviceId: 'jar' });
const watchFinish = (page: Page) => page.addInitScript(() => {
  const seen: string[] = [];
  (window as Window & { jarLines?: string[] }).jarLines = seen;
  new MutationObserver(() => document.querySelectorAll('.finish-jar').forEach(node => { if (!seen.includes(node.textContent ?? '')) seen.push(node.textContent ?? ''); })).observe(document, { childList: true, subtree: true, characterData: true });
});
const jarLines = (page: Page) => page.evaluate(() => (window as Window & { jarLines?: string[] }).jarLines ?? []);

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
  });
});

test('a plan for a camp ahead fills from a finished idea: +5 on the finish line and on the plan bar', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await watchFinish(page);
  await page.goto('/?e2e#yatra');
  await seed(page, [['yatra.startDay', TODAY], ['yatra.jarFrom', TODAY]]);
  await page.getByRole('button', { name: 'Add a plan to a camp ahead' }).click();
  const sheet = page.getByRole('dialog', { name: 'A plan for a camp ahead' });
  await sheet.getByLabel("What it's for").fill('movie night with Dev');
  await sheet.getByRole('button', { name: 'Save' }).click();
  const plan = page.getByRole('region', { name: 'Your plan on the trail' });
  await expect(plan).toContainText('movie night with Dev');
  await expect(plan.locator('.jar-plan-minutes')).toHaveText(/^0 m of /);
  await page.goto('/?e2e#read/chapter/how-things-work/how-things-work-ch1');
  await walkIdea(page, 'how-things-work');
  await expect.poll(() => jarLines(page)).toContain('+5 min into the jar · idea read');
  await page.goto('/?e2e#yatra');
  await expect(plan.locator('.jar-plan-minutes')).toHaveText(/^5 m of /);
});

test('reaching the plan camp shows the payout card; Share shows the image first, then sends it', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#yatra');
  await seed(page, [['yatra.startDay', TODAY], ['yatra.jarFrom', TODAY], ['yatra.plan', { line: 'movie night with Dev', camp: 1, setAt: NOON.getTime() - 7_200_000, needMinutes: 30 }]], [session(1), session(2), session(3)]);
  const payout = page.getByRole('region', { name: 'Plan reached' });
  await expect(payout).toContainText(/You reached .+: movie night with Dev/);
  await payout.getByRole('button', { name: 'Share' }).click();
  const sheet = page.getByRole('dialog', { name: 'Share this camp' });
  // The share shows the camp only; the plan line stays on the person's own card.
  await expect(sheet.getByRole('img')).toHaveAttribute('alt', /^Camp reached: /, { timeout: 20_000 });
  await expect(sheet.getByRole('img')).not.toHaveAttribute('alt', /movie night/);
  const shared = page.waitForEvent('download');
  await sheet.getByRole('button', { name: 'Share' }).click();
  expect((await shared).suggestedFilename()).toBe('nandi-trail-camp.png');
  await payout.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('button', { name: 'Add the next plan?' })).toBeVisible();
});

test('at the 60-minute cap the finish line says "Trail done for today."', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await watchFinish(page);
  await page.goto('/?e2e#yatra');
  await seed(page, [['yatra.startDay', TODAY], ['yatra.jarFrom', TODAY]], [1, 2, 3, 4, 5, 6].map(session));
  await page.goto('/?e2e#read/chapter/how-things-work/how-things-work-ch1');
  await walkIdea(page, 'how-things-work');
  await expect.poll(() => jarLines(page)).toContain('Trail done for today.');
});
