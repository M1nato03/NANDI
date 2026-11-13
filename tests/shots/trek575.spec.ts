import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

// Spec 575 shots (a9's checklist §7): every leg of the three trails mid-leg, its landmark before (hazed) and after
// (open), light and dark, inside the real Yatra strip; the highest points at night; reduced motion; a caption at 200%.
// The walk is the legacy one (three sessions reach one place a day), so a day count is a global leg index.
const OUT = process.env.SHOTS575_DIR ?? 'D:/nandi-gate-logs/shots-575';
mkdirSync(OUT, { recursive: true });
const START = '2026-10-01';
const dayOf = (n: number) => new Date(Date.parse(`${START}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const row = (kind: 'train' | 'mind', n: number, dayKey: string) => ({ id: `s575-${kind}-${n}-${dayKey}`, dayKey, mode: kind, kind: kind === 'train' ? 'session' : 'board', refId: `r${n}`, inputs: kind === 'train' ? { xp: 60, workingSets: 6 } : {}, updatedAt: new Date(`${dayKey}T09:00:00`).getTime() + n * 60_000, deleted: 0, deviceId: 's575' });
/** `legs` whole days (each reaches the next place; the first session a Mind board, so each passed landmark is open), then one more session today. */
const walk = (legs: number, today: 'train' | 'mind' | null) => [
  ...Array.from({ length: legs * 3 }, (_, i) => row(i % 3 === 0 ? 'mind' : 'train', i, dayOf(Math.floor(i / 3)))),
  ...(today ? [row(today, 999, dayOf(legs))] : []),
];
async function seed(page: Page, facts: ReturnType<typeof row>[], rainAt?: number) {
  await page.evaluate(async ({ facts, rainAt }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(['ledger', 'settings', 'focus'], 'readwrite');
      transaction.objectStore('ledger').clear();
      transaction.objectStore('focus').clear();
      // A focus paused by the guard is rain over the scene (spec 571 §4; b2 ruling b: one rain in every zone).
      if (rainAt) transaction.objectStore('focus').put({ id: 's575-rain', taskId: 't', startedAt: rainAt - 20 * 60_000, pauses: [{ at: rainAt - 60_000, reason: 'guard' }], updatedAt: 1, deleted: 0, deviceId: 's575' });
      for (const fact of facts) transaction.objectStore('ledger').put(fact);
      transaction.objectStore('settings').put({ key: 'yatra.startDay', value: '2026-10-01', updatedAt: 1, deleted: 0, deviceId: 's575' });
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, { facts, rainAt });
}
async function shot(page: Page, name: string, legs: number, today: 'train' | 'mind' | null, hour = 12, options: { rain?: boolean; route?: string; target?: string } = {}) {
  const at = new Date(`${dayOf(legs)}T${String(hour).padStart(2, '0')}:00:00`);
  await page.clock.setFixedTime(at);
  await seed(page, walk(legs, today), options.rain ? at.getTime() : undefined);
  await page.goto(`/?e2e#${options.route ?? 'yatra'}`);
  await page.reload();
  const scene = page.locator(options.target ?? '.trek-strip .trek-scene');
  await expect(scene).toBeVisible({ timeout: 15_000 });
  const close = page.getByRole('button', { name: 'Keep in the journal' });
  if (await close.isVisible({ timeout: 1500 }).catch(() => false)) await close.click();
  await page.waitForTimeout(400);
  await scene.screenshot({ path: `${OUT}/${name}.png` });
}
const TRAILS = [['hampta', 5], ['tarsar', 6], ['sandakphu', 8]] as const;

for (const theme of ['light', 'dark'] as const) {
  test(`575 every leg before and after its landmark opens (${theme})`, async ({ page }) => {
    test.setTimeout(600_000);
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto('/?e2e#plan');
    let offset = 0;
    for (const [trail, legs] of TRAILS) {
      for (let leg = 0; leg < legs; leg++) {
        await shot(page, `575-${theme}-${trail}-leg${leg + 1}-before`, offset + leg, 'train');
        await shot(page, `575-${theme}-${trail}-leg${leg + 1}-after`, offset + leg, 'mind');
      }
      offset += legs;
    }
  });
}

test('575 the highest points at night, clear of the stars; the switch; a caption at 200%', async ({ page }) => {
  test.setTimeout(300_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?e2e#plan');
  // Hampta Pass is place 3 (leg 3 done), Sandakphu is the 7th place of the third trail (5 + 6 + 6 legs done).
  await shot(page, '575-night-hampta-pass', 3, 'train', 23);
  await shot(page, '575-night-sandakphu', 17, 'train', 23);
  await shot(page, '575-switch-next-tarsar', 5, null);
  await shot(page, '575-pass-leg-close', 3, 'mind');
  // b2 ruling b: rain looks the same in every zone (one shot in three zones).
  await shot(page, '575-rain-kullu-forest', 0, 'train', 12, { rain: true });
  await shot(page, '575-rain-lake-basin', 8, 'train', 12, { rain: true });
  await shot(page, '575-rain-ridge-meadow', 14, 'train', 12, { rain: true });
  // The night Calm (the second TrekScene mount, ruling a): the zone ridges render there too.
  await shot(page, '575-night-calm', 8, 'train', 23, { route: 'grow/calm', target: '.trek-scene' });
  // Must 3: past 12 tags the neem's peg-board holds the overflow (17 camps reached).
  await shot(page, '575-neem-pegboard', 17, null, 12, { route: 'courtyard', target: '.courtyard-b-home' });
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await page.getByRole('button', { name: 'Hampta Glacier' }).click();
  await expect(page.locator('.trek-landmark-caption')).toBeVisible();
  await page.locator('.trek-strip').screenshot({ path: `${OUT}/575-caption-200.png` });
});
