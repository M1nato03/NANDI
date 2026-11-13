import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
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
async function seed(page: Page, facts: ReturnType<typeof row>[], rainAt?: number, theme: 'light' | 'dark' = 'light') {
  await page.evaluate(async ({ facts, rainAt, theme, kept }) => {
    localStorage.setItem('nandi.yatra.cards', JSON.stringify(kept));
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(['ledger', 'settings', 'focus'], 'readwrite');
      transaction.objectStore('ledger').clear();
      transaction.objectStore('focus').clear();
      // A focus paused by the guard is rain over the scene (spec 571 §4; b2 ruling b: one rain in every zone).
      if (rainAt) transaction.objectStore('focus').put({ id: 's575-rain', taskId: 't', startedAt: rainAt - 20 * 60_000, pauses: [{ at: rainAt - 60_000, reason: 'guard' }], updatedAt: 1, deleted: 0, deviceId: 's575' });
      for (const fact of facts) transaction.objectStore('ledger').put(fact);
      transaction.objectStore('settings').put({ key: 'yatra.startDay', value: '2026-10-01', updatedAt: 1, deleted: 0, deviceId: 's575' });
      // a9 review 2: the app's own theme setting (emulateMedia alone left the dark shots identical to light).
      transaction.objectStore('settings').put({ key: 'theme', value: theme, updatedAt: 1, deleted: 0, deviceId: 's575' });
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, { facts, rainAt, theme, kept: KEPT });
}
async function shot(page: Page, name: string, legs: number, today: 'train' | 'mind' | null, hour = 12, options: { rain?: boolean; route?: string; target?: string; theme?: 'light' | 'dark'; landmark?: number } = {}) {
  // SHOTS575_ONLY: retake just the named shots (a review asks for a few); the rest are skipped.
  if (ONLY && !ONLY.test(name)) return;
  const at = new Date(`${dayOf(legs)}T${String(hour).padStart(2, '0')}:00:00`);
  await page.clock.setFixedTime(at);
  await seed(page, walk(legs, today), options.rain ? at.getTime() : undefined, options.theme);
  await page.goto(`/?e2e#${options.route ?? 'yatra'}`);
  await page.reload();
  const scene = page.locator(options.target ?? '.trek-strip .trek-scene');
  // One fresh load if the scene never came (shots-575-348b1de: one dark leg of 114 loaded blank), so one bad load
  // doesn't lose the rest of the set.
  if (!await scene.waitFor({ timeout: 15_000 }).then(() => true, () => false)) await page.reload();
  await expect(scene).toBeVisible({ timeout: 15_000 });
  // a9 review 3 (6): the app's own theme is on (the scene art is the same in both; the page around it is not).
  await expect(page.locator('html')).toHaveAttribute('data-theme', options.theme ?? 'light');
  const close = page.getByRole('button', { name: 'Keep in the journal' });
  if (await close.isVisible({ timeout: 1500 }).catch(() => false)) await close.click();
  if (options.landmark !== undefined) {
    // a9 review 2: frame the leg's landmark (ahead of the group), so its before/after state is in the picture.
    await page.evaluate(index => {
      const scroller = document.querySelector<HTMLElement>('.trek-strip .trek-scroll')!;
      const mark = document.querySelectorAll<HTMLElement>('.trek-strip .trek-landmark')[index]!;
      scroller.scrollLeft = mark.offsetLeft + mark.offsetWidth / 2 - scroller.clientWidth / 2;
    }, options.landmark);
  }
  await page.waitForTimeout(400);
  await scene.screenshot({ path: `${OUT}/${name}.png` });
}
const TRAILS = [['hampta', 5], ['tarsar', 6], ['sandakphu', 8]] as const;
const ONLY = process.env.SHOTS575_ONLY ? new RegExp(process.env.SHOTS575_ONLY) : null;
/** a9 review 3 (5): every landmark's postcard counts as kept, so no "Keep in the journal" sheet opens over a shot. */
const KEPT = readdirSync('content/yatra').filter(name => name.endsWith('.json'))
  .flatMap(name => (JSON.parse(readFileSync(`content/yatra/${name}`, 'utf8')) as { legs?: { landmark: { id: string } }[] }).legs?.map(leg => leg.landmark.id) ?? []);

for (const theme of ['light', 'dark'] as const) {
  test(`575 every leg before and after its landmark opens (${theme})`, async ({ page }) => {
    test.setTimeout(600_000);
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto('/?e2e#plan');
    let offset = 0;
    for (const [trail, legs] of TRAILS) {
      for (let leg = 0; leg < legs; leg++) {
        // The group mid-leg (where the zone reads), then the landmark framed shut and open.
        await shot(page, `575-${theme}-${trail}-leg${leg + 1}-group`, offset + leg, 'train', 12, { theme, target: '.trek-strip' });
        await shot(page, `575-${theme}-${trail}-leg${leg + 1}-landmark-before`, offset + leg, 'train', 12, { theme, landmark: leg, target: '.trek-strip' });
        await shot(page, `575-${theme}-${trail}-leg${leg + 1}-landmark-after`, offset + leg, 'mind', 12, { theme, landmark: leg, target: '.trek-strip' });
      }
      offset += legs;
    }
    // The Home strip (the Yatra tab's scene) in three zones, the whole strip with its notes.
    for (const [name, legs] of [['kullu-forest', 0], ['lake-basin', 8], ['ridge-meadow', 14]] as const) {
      await shot(page, `575-${theme}-home-strip-${name}`, legs, 'train', 12, { theme, target: '.trek-strip' });
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
  // b2 13 Nov (A+B): a camp by day and by night (nothing in the camp), and mid-leg with a back-row tree behind a friend.
  await shot(page, '575-camp-day-chika', 1, null);
  await shot(page, '575-camp-night-chika', 1, null, 23);
  await shot(page, '575-midleg-backrow-kullu-forest', 0, 'train');
  await shot(page, '575-midleg-backrow-rhodo-forest', 11, 'train');
  await shot(page, '575-pass-leg-close', 3, 'mind');
  // The camp tree crop (its code is unchanged; the crop is for the side-by-side with main).
  await page.locator('.trek-strip .trek-group .trek-prop.tree').screenshot({ path: `${OUT}/575-camp-tree-crop.png` });
  // A caption at 200%: whole, not cut, not broken mid-word.
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  // The landmark keeps a gentle pulse, so it never reads as "stable" to a normal click (shots-575-348b1de).
  await page.getByRole('button', { name: 'Hampta Glacier' }).click({ force: true });
  await expect(page.locator('.trek-landmark-caption')).toBeVisible();
  await page.locator('.trek-landmark-caption').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/575-caption-200.png` });
  await page.addStyleTag({ content: 'html { font-size: 100% !important; }' });
  // b2 ruling b: rain looks the same in every zone (one shot in three zones).
  await shot(page, '575-rain-kullu-forest', 0, 'train', 12, { rain: true });
  await shot(page, '575-rain-lake-basin', 8, 'train', 12, { rain: true });
  await shot(page, '575-rain-ridge-meadow', 14, 'train', 12, { rain: true });
  // The night Calm (the second TrekScene mount, ruling a): the zone ridges render there too.
  await shot(page, '575-night-calm', 8, 'train', 23, { route: 'grow/calm', target: '.trek-scene' });
  // Must 3: past 12 tags the neem's peg-board holds the overflow (17 camps reached).
  await shot(page, '575-neem-pegboard', 17, null, 12, { route: 'courtyard', target: '.courtyard-b-home' });
});

test('575 swipe across a zone boundary (frames and a video)', async ({ browser }, testInfo) => {
  // A retake that names none of the swipe shots skips it whole (its first shot seeds the page; shots-575-64a6ffc).
  test.skip(!!ONLY && !ONLY.test('575-swipe-start'), 'SHOTS575_ONLY names no swipe shot');
  test.setTimeout(120_000);
  const context = await browser.newContext({ baseURL: testInfo.project.use.baseURL, viewport: { width: 360, height: 800 }, reducedMotion: 'reduce', recordVideo: { dir: `${OUT}/video`, size: { width: 360, height: 800 } } });
  const page = await context.newPage();
  await page.goto('/?e2e#plan');
  // Hampta leg 4 (pass-snow) runs into lahaul-dry: stand at Hampta Pass and swipe right across the change.
  await shot(page, '575-swipe-start', 3, 'train');
  const scroller = page.locator('.trek-strip .trek-scroll');
  const from = await scroller.evaluate(node => node.scrollLeft);
  for (let step = 0; step <= 10; step++) {
    await scroller.evaluate((node, left) => { node.scrollLeft = left; }, from + step * 90);
    await page.waitForTimeout(150);
    if (step % 2 === 0) await page.locator('.trek-strip .trek-scene').screenshot({ path: `${OUT}/575-swipe-frame-${String(step).padStart(2, '0')}.png` });
  }
  await context.close();
});
