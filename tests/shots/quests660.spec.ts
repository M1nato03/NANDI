import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';

// Spec 660 shots (a9's gate checklist §7-§8). Stones on the courtyard path at 3 / 10 / 30 at s1-s5, light and dark,
// and the quest's friend stepped forward with the scroll. Every shot is taken before any tap. To SHOTS660_DIR.
const OUT = process.env.SHOTS660_DIR ?? 'D:/nandi-gate-logs/shots-660';
mkdirSync(OUT, { recursive: true });
const NOON = new Date('2026-11-13T12:00:00');
const DAY = '2026-11-13';

type Row = Record<string, unknown>;
let serial = 0;
const fact = (day: string, mode: string, kind: string, inputs: Row = {}, refId?: string): Row => ({
  id: `${kind}:q660-${++serial}`, dayKey: day, mode, kind, refId: refId ?? `q660-${serial}`, inputs, updatedAt: new Date(`${day}T10:00:00`).getTime() + serial, deleted: 0, deviceId: 'q660',
});
const daysBefore = (day: string, n: number) => Array.from({ length: n }, (_, i) => new Date(Date.parse(`${day}T12:00:00Z`) - (i + 1) * 86_400_000).toISOString().slice(0, 10));
const STAGE_DAYS = [0, 3, 7, 14, 30, 60];
function corners(stage: number): Row[] {
  return daysBefore(DAY, STAGE_DAYS[stage]!).flatMap(day => [
    fact(day, 'train', 'session', { xp: 60, workingSets: 6 }), fact(day, 'tasks', 'done', { plannedSize: 'M', wasPlanned: true }),
    fact(day, 'bonuses', 'lightsout', { metTarget: true }), fact(day, 'mind', 'board', { daily: false }),
    fact(day, 'mind', 'card', {}), fact(day, 'mind', 'learn-drop', {}),
  ]);
}
/** `count` finished quests, one a day back from yesterday (a stone each). */
const stones = (count: number): Row[] => daysBefore(DAY, count).map(day => fact(day, 'quests660', 'quest-done', { outcome: 'fine', minutes: 5 }, 'kapi-five-red'));
async function put(page: Page, store: string, rows: Row[]) {
  await page.evaluate(async ({ store, rows }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => { const transaction = database.transaction(store, 'readwrite'); for (const row of rows) transaction.objectStore(store).put(row); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
    database.close();
  }, { store, rows });
}
async function phone(browser: Browser, colorScheme: 'light' | 'dark'): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme, reducedMotion: 'reduce', baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#courtyard');
  return page;
}
async function home(page: Page) {
  await page.goto('/?e2e#courtyard');
  await page.reload();
  await expect(page.locator('.courtyard-b')).toBeVisible();
  await expect(page.locator('.courtyard-card-next .courtyard-card-row, .courtyard-card-next .next-move-go').first()).toBeVisible();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

/**
 * On the real page: each laid stone's box, and what the browser finds on top at the stone's centre (a friend's sprite
 * or tap = covered). Every stone lies under the floor's wall foot line and above the collapsed card.
 */
async function stoneReport(page: Page) {
  return page.evaluate(() => {
    const scene = document.querySelector('.courtyard-b-scene') as SVGSVGElement;
    const outer = scene.firstElementChild as SVGGElement;
    const m = outer.transform.baseVal.consolidate()!.matrix;
    const wallFoot = m.d * Number(scene.getAttribute('data-wall-foot')) + m.f;
    const cardTop = document.querySelector('.courtyard-card')!.getBoundingClientRect().top;
    const out: string[] = [];
    const nodes = [...document.querySelectorAll<SVGGElement>('.courtyard-quest-stone')];
    for (const node of nodes) {
      const box = node.getBoundingClientRect();
      const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
      if (box.y < wallFoot) out.push(`stone ${node.dataset.slot}: top ${box.y.toFixed(1)} above the wall foot ${wallFoot.toFixed(1)}`);
      if (box.bottom > cardTop) out.push(`stone ${node.dataset.slot}: under the card (${box.bottom.toFixed(1)} > ${cardTop.toFixed(1)})`);
      const top = document.elementFromPoint(cx, cy);
      if (top && top.closest('.courtyard-b-friend, .courtyard-friend-tap, .courtyard-held, .courtyard-card')) out.push(`stone ${node.dataset.slot}: covered by ${top.className}`);
    }
    return { laid: nodes.length, problems: out };
  });
}

const report: Record<string, unknown> = {};
for (const theme of ['light', 'dark'] as const) {
  const t = theme === 'light' ? 'l' : 'd';
  test(`stones at 3 / 10 / 30 on the path, s1 to s5, ${theme}`, async ({ browser }) => {
    test.setTimeout(240_000);
    for (const stage of [1, 2, 3, 4, 5]) for (const count of [3, 10, 30]) {
      const page = await phone(browser, theme);
      await put(page, 'ledger', [...corners(stage), ...stones(count)]);
      await put(page, 'settings', [{ key: 'quests.safetyAsked', value: true, updatedAt: 1, deleted: 0, deviceId: 'q660' }]);
      await home(page);
      await expect(page.locator('.courtyard-quest-path')).toHaveAttribute('data-stones', String(count));
      const row = await stoneReport(page);
      report[`${theme} s${stage} ${count}`] = row;
      expect(row.laid).toBe(count);
      expect(row.problems, `${theme} s${stage} ${count}`).toEqual([]);
      await page.screenshot({ path: `${OUT}/660-${t}-stones-s${stage}-${count}.png` });
      await page.context().close();
    }
    writeFileSync(`${OUT}/stones-report-${theme}.json`, `${JSON.stringify(report, null, 2)}\n`);
  });

  /**
   * a9 §7: the friend steps forward with the scroll BESIDE their things, at s1-s5. Each friend in turn: the row's quest
   * is swapped away (a quest-swap fact, as the Swap button writes) until every friend has had the row.
   */
  test(`the collapsed row with each friend stepped forward holding the scroll, s1 to s5, ${theme}`, async ({ browser }) => {
    test.setTimeout(300_000);
    const held: Record<string, unknown> = {};
    for (const stage of [1, 2, 3, 4, 5]) {
      const page = await phone(browser, theme);
      await put(page, 'ledger', [...corners(stage), ...stones(10)]);
      await put(page, 'settings', [{ key: 'quests.safetyAsked', value: true, updatedAt: 1, deleted: 0, deviceId: 'q660' }]);
      const seen = new Set<string>();
      for (let turn = 0; turn < 40 && seen.size < 6; turn++) {
        await home(page);
        const row = page.locator('.courtyard-card-next .courtyard-card-row[data-kind="quest"]');
        if (!await row.count()) break;
        const friend = (await row.locator('strong').textContent())!.split(' ')[0]!;
        const questId = await page.locator('.quest-list').first().locator('.quest-card').first().getAttribute('data-quest');
        if (!seen.has(friend)) {
          seen.add(friend);
          // The row's friend is the one stepped forward in the scene, holding the scroll; nobody else is.
          const forward = page.locator('.courtyard-b-friend[data-forward="true"]');
          await expect(forward).toHaveCount(1);
          await expect(forward).toHaveAttribute('data-friend', friend);
          const scroll = page.locator('.courtyard-held .courtyard-quest-scroll');
          await expect(scroll).toBeVisible();
          const box = (await scroll.boundingBox())!, card = (await page.locator('.courtyard-card').boundingBox())!;
          held[`${theme} s${stage} ${friend}`] = { scroll: [Math.round(box.x), Math.round(box.y), Math.round(box.width), Math.round(box.height)], inView: box.x >= 0 && box.x + box.width <= 360 && box.y + box.height <= card.y };
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(360);
          expect(box.y + box.height, `${friend}'s scroll above the card`).toBeLessThanOrEqual(card.y);
          await page.screenshot({ path: `${OUT}/660-${t}-forward-s${stage}-${friend.toLowerCase()}.png` });
        }
        await put(page, 'ledger', [{ id: `quest660-swap:${questId}:${DAY}`, kind: 'quest-swap', mode: 'quests660', refId: questId, dayKey: DAY, inputs: {}, updatedAt: NOON.getTime() + turn, deleted: 0, deviceId: 'q660' }]);
      }
      expect([...seen].sort(), `${theme} s${stage}: every friend had the row`).toEqual(['Chiku', 'Kachhua', 'Kapi', 'Mor', 'Moti', 'Nandi']);
      await page.context().close();
    }
    writeFileSync(`${OUT}/forward-report-${theme}.json`, `${JSON.stringify(held, null, 2)}\n`);
  });
}

// a9 §8 shots 2-9 and 11-13: each screen as it opens (no tap before the picture), light and dark, 360x800; * also 200%.
async function textAt200(page: Page) {
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('32px');
}
const asked = { key: 'quests.safetyAsked', value: true, updatedAt: 1, deleted: 0, deviceId: 'q660' };
const done = (id: string, day: string, inputs: Row) => ({ id: `quest660:${id}:${day}`, dayKey: day, mode: 'quests660', kind: 'quest-done', refId: id, inputs, updatedAt: new Date(`${day}T10:00:00`).getTime(), deleted: 0, deviceId: 'q660' });
for (const theme of ['light', 'dark'] as const) {
  const t = theme === 'light' ? 'l' : 'd';
  test(`the screens, ${theme}`, async ({ browser }) => {
    test.setTimeout(240_000);
    const open = async (name: string, route: string, ready: string, rows: { store: string; rows: Row[] }[], big = false) => {
      const page = await phone(browser, theme);
      for (const row of rows) await put(page, row.store, row.rows);
      await page.goto(`/?e2e#${route}`);
      await page.reload();
      await expect(page.locator(ready).first()).toBeVisible({ timeout: 15_000 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.screenshot({ path: `${OUT}/660-${t}-${name}.png` });
      if (big) { await textAt200(page); await page.screenshot({ path: `${OUT}/660-${t}-${name}-200.png` }); }
      await page.context().close();
    };
    const settled = [{ store: 'settings', rows: [asked] }];
    await open('02-board', 'courtyard/quests', '[data-testid="quest-board"]', settled, true);
    await open('03-quest-card', 'courtyard/quest/courage-honest-feedback', '[data-testid="quest-screen"]', settled, true);
    await open('04-safety', 'courtyard/quests', '[data-testid="quest-safety"]', []);
    await open('05-settings', 'you/quests/settings', '[data-testid="quest-settings"]', settled, true);
    const reality = [{ store: 'settings', rows: [asked] }, { store: 'ledger', rows: [
      done('courage-ask-at-home', '2026-11-10', { prediction: 'ignore', outcome: 'fine', fear: 4, felt: 2 }),
      done('courage-tell-them', '2026-11-11', { prediction: 'ignore', outcome: 'happened', fear: 4, felt: 3, learned: 'still-glad' }),
      done('speak-spin-60', '2026-11-12', { prediction: 'freeze', outcome: 'better', fear: 5, felt: 1 }),
    ] }];
    await open('09-reality-check', 'you/quests', '[data-testid="reality-check"]', reality);
    await open('12-small-steps', 'you', '[aria-label="Small steps today"]', settled);
    await open('13-history', 'you/history', '[data-testid="you-history"]', [{ store: 'ledger', rows: [
      { id: 'badge-tier:tasks:1', dayKey: '2026-11-05', mode: 'gamify', kind: 'badge-tier', refId: 'tasks:1', inputs: {}, updatedAt: 1, deleted: 0, deviceId: 'q660' },
      { id: 'purchase:old-theme', dayKey: '2026-11-01', mode: 'economy', kind: 'purchase', refId: 'theme:linen', inputs: { itemId: 'theme:linen', price: 400, accepted: true }, updatedAt: 1, deleted: 0, deviceId: 'q660' },
    ] }], true);
  });
}

for (const theme of ['light', 'dark'] as const) {
  const t = theme === 'light' ? 'l' : 'd';
  test(`a courage quest's steps, each shot as the step opens, and the Pause card's quest button, ${theme}`, async ({ browser }) => {
    test.setTimeout(180_000);
    const page = await phone(browser, theme);
    await put(page, 'settings', [asked]);
    await page.goto('/?e2e#courtyard/quest/courage-honest-feedback');
    await page.reload();
    await expect(page.getByTestId('quest-screen')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.locator('[data-step="before"]')).toBeVisible();
    await page.screenshot({ path: `${OUT}/660-${t}-06-prediction.png` });
    await textAt200(page);
    await page.screenshot({ path: `${OUT}/660-${t}-06-prediction-200.png` });
    await page.reload();
    await expect(page.locator('[data-step="before"]').or(page.getByRole('button', { name: 'Start', exact: true })).first()).toBeVisible();
    if (await page.getByRole('button', { name: 'Start', exact: true }).isVisible()) await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.getByRole('group', { name: 'How scary does it feel?' }).getByRole('button', { name: '3' }).click();
    await page.getByRole('button', { name: 'It’ll be awkward' }).click();
    await page.getByRole('button', { name: 'Go do it' }).click();
    await page.getByRole('button', { name: /I.m back/ }).click();
    await expect(page.locator('[data-step="after"]')).toBeVisible();
    await page.screenshot({ path: `${OUT}/660-${t}-07-outcome.png` });
    await textAt200(page);
    await page.screenshot({ path: `${OUT}/660-${t}-07-outcome-200.png` });
    await page.addStyleTag({ content: 'html { font-size: 100% !important; }' });
    await page.getByRole('button', { name: 'It went fine' }).click();
    await page.getByRole('group', { name: 'How did it actually feel?' }).getByRole('button', { name: '2' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.quest-finish')).toBeVisible();
    await page.screenshot({ path: `${OUT}/660-${t}-08-finish.png` });
    // 11: the Pause card with "Or a 5-min quest?" (the e2e stand-in for the phone's pause).
    await put(page, 'settings', [{ key: 'pause.card.on', value: true, updatedAt: 1, deleted: 0, deviceId: 'q660' }, { key: 'pause.act', value: 'do 10 squats', updatedAt: 1, deleted: 0, deviceId: 'q660' }, { key: 'night.pause.apps', value: ['com.instagram.android'], updatedAt: 1, deleted: 0, deviceId: 'q660' }, { key: 'night.pause.dayMode', value: 'open', updatedAt: 1, deleted: 0, deviceId: 'q660' }]);
    await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
    await page.goto('/?e2e#courtyard');
    await page.reload();
    await page.evaluate(() => { sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ pendingPackage: 'com.instagram.android', pendingReason: 'open' })); window.dispatchEvent(new Event('nandi:night-pause')); });
    const card = page.getByRole('dialog', { name: 'Pause card' });
    await expect(card.getByTestId('pause-quest-link')).toBeVisible();
    await page.screenshot({ path: `${OUT}/660-${t}-11-pause-card.png` });
    await page.context().close();
  });
}
