import { expect, test, type Page } from '@playwright/test';

// Spec 575 §6 gate 4 (taps from the Yatra tab): a landmark names itself on tap; finishing a trail shows "Next: …" and
// the next trail's first place; walking already carried past the end shows the M1 line, once.
const NOON = new Date('2026-10-28T12:00:00');
const day = (n: number) => `2026-10-${String(20 + n).padStart(2, '0')}`;
const row = (kind: 'train' | 'mind' | 'calm', n: number, dayKey: string) => {
  const [mode, k] = kind === 'train' ? ['train', 'session'] : kind === 'mind' ? ['mind', 'board'] : ['calm', 'session'];
  return { id: `t575-${kind}-${n}-${dayKey}`, dayKey, mode, kind: k, refId: `r${n}`, inputs: kind === 'train' ? { xp: 60, workingSets: 6 } : {}, updatedAt: new Date(`${dayKey}T09:00:00`).getTime() + n * 60_000, deleted: 0, deviceId: 'e2e' };
};
const trail = (id: string, name: string, places: number) => {
  const ids = Array.from({ length: places }, (_, i) => `${id}-p${i}`);
  return {
    id, name, region: 'Test',
    places: ids.map((place, i) => ({ id: place, name: `${name} ${i}`, kind: i === 0 ? 'start' : 'camp', regionLine: 'Test', altitudeM: 2000 + i * 100, altitudeRangeM: [2000 + i * 100, 2000 + i * 100] })),
    legs: ids.slice(1).map((to, i) => ({ id: `${ids[i]}-${to}`, from: ids[i], to, landmark: { id: `${id}-mark-${i}`, name: `${name} mark ${i}`, kind: 'river' }, terrain: { zone: 'kullu-forest', features: [] }, postcard: { lines: ['One.', 'Two.'] }, sources: ['https://example.org/a'], constellation: `${name} kite ${i}` })),
  };
};
/** Legacy walk (no jarFrom): three sessions a day reach one place a day. */
const days = (count: number, extra = 0) => [...Array.from({ length: count * 3 }, (_, i) => row(i % 3 === 0 ? 'mind' : 'train', i, day(Math.floor(i / 3)))), ...Array.from({ length: extra }, (_, i) => row('calm', 100 + i, day(count)))];
async function seed(page: Page, facts: ReturnType<typeof row>[]) {
  await page.evaluate(async facts => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(['ledger', 'settings'], 'readwrite');
      for (const fact of facts) transaction.objectStore('ledger').put(fact);
      transaction.objectStore('settings').put({ key: 'yatra.startDay', value: '2026-10-20', updatedAt: 1, deleted: 0, deviceId: 'e2e' });
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, facts);
  await page.reload();
}
/** The switch line is marked seen in a settings row as it shows; wait for that write before reloading. */
const seenRow = (page: Page, trailId: string) => expect.poll(() => page.evaluate(async key => {
  const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const value = await new Promise<unknown>(resolve => { const request = database.transaction('settings').objectStore('settings').get(key); request.onsuccess = () => resolve(request.result?.value); });
  database.close();
  return value;
}, `yatra.trailSwitchSeen.${trailId}`)).toBe(true);
async function openYatra(page: Page) {
  await page.evaluate(() => { location.hash = '#yatra'; });
  await expect(page.locator('.trek-strip .home-title h2')).toBeVisible({ timeout: 15_000 });
}
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: NOON });
  await page.goto('/?e2e#plan');
});

test('a landmark is a button: a tap names it in a caption outside the art', async ({ page }) => {
  await openYatra(page);
  await page.getByRole('button', { name: 'Rani Nallah' }).click();
  await expect(page.locator('.trek-landmark-caption')).toHaveText('Rani Nallah');
  await expect(page.locator('.trek-scene svg text')).toHaveCount(0);
});

test('finishing trail 1 shows "Next: …" once, then trail 2 from its first place', async ({ page }) => {
  await page.evaluate(trails => sessionStorage.setItem('nandi.e2eTrails', JSON.stringify(trails)), [trail('one', 'Trail One', 6), trail('two', 'Trail Two', 7)]);
  await seed(page, days(5));
  await openYatra(page);
  await expect(page.locator('.trek-switch-line')).toHaveText('Next: Trail Two');
  await expect(page.locator('.trek-journey-top strong')).toHaveText('At Trail Two 0. Next: Trail Two 1');
  // Trail One's five postcards stay in the Journal count.
  await expect(page.getByRole('button', { name: 'Journal · 5' })).toBeVisible();
  await seenRow(page, 'two');
  await page.reload();
  await openYatra(page);
  await expect(page.locator('.trek-journey-top strong')).toHaveText('At Trail Two 0. Next: Trail Two 1');
  await expect(page.locator('.trek-switch-line')).toHaveCount(0);
});

test('M1: walking already past the end shows "Your walking carried you on to …" once', async ({ page }) => {
  await page.evaluate(trails => sessionStorage.setItem('nandi.e2eTrails', JSON.stringify(trails)), [trail('one', 'Trail One', 6), trail('two', 'Trail Two', 7)]);
  await seed(page, days(6, 0));
  await openYatra(page);
  await expect(page.locator('.trek-switch-line')).toHaveText('Your walking carried you on to Trail Two.');
  await expect(page.locator('.trek-journey-top strong')).toHaveText('At Trail Two 1. Next: Trail Two 2');
  await seenRow(page, 'two');
  await page.reload();
  await openYatra(page);
  await expect(page.locator('.trek-switch-line')).toHaveCount(0);
});
