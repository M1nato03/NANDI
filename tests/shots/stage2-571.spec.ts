import { writeFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { textAt200 } from '../e2e/helpers/text';
import { MIND_ACTS } from '../../src/core/economy/daySlots';
import { MIND_MARK, RING_MARK_STROKE, RING_MARKS, type RingMarkKind } from '../../src/ui/rings/marks';

/** A ring mark as an SVG string, drawn the way RingMark.tsx draws it. */
function markSvg(kind: RingMarkKind, size: number): string {
  const shapes = RING_MARKS[kind].map(shape => 'd' in shape ? `<path d="${shape.d}"/>`
    : 'circle' in shape ? `<circle cx="${shape.circle[0]}" cy="${shape.circle[1]}" r="${shape.circle[2]}"/>`
      : `<rect x="${shape.rect[0]}" y="${shape.rect[1]}" width="${shape.rect[2]}" height="${shape.rect[3]}" rx="${shape.rect[4]}"${shape.rotate ? ` transform="rotate(${shape.rotate.join(' ')})"` : ''}/>`).join('');
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${RING_MARK_STROKE}" stroke-linecap="round" stroke-linejoin="round">${shapes}</svg>`;
}

// Spec 571 stage 2 shots (b2's list, 8 Nov). Pictures and the alpha report go to SHOTS_DIR
// (default D:/nandi-gate-logs/shots-571-s2). 360x800 unless named otherwise.
const OUT = process.env.SHOTS_DIR ?? 'D:/nandi-gate-logs/shots-571-s2';
const NOON = new Date('2026-11-10T12:00:00');
const DAY = '2026-11-10';
const settle = (page: Page) => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

type Row = Record<string, unknown>;
let serial = 0;
const fact = (day: string, mode: string, kind: string, inputs: Row = {}, refId?: string): Row => ({
  id: `${kind}:s2-${++serial}`, dayKey: day, mode, kind, refId: refId ?? `s2-${serial}`, inputs, updatedAt: new Date(`${day}T10:00:00`).getTime() + serial, deleted: 0, deviceId: 's2',
});
const daysBefore = (day: string, n: number) => Array.from({ length: n }, (_, i) => new Date(Date.parse(`${day}T12:00:00Z`) - (i + 1) * 86_400_000).toISOString().slice(0, 10));
/** Every corner (and the neem) at a stage: [3, 7, 14, 30, 60] practice days per area (rules.config courtyard.stageDays). */
const STAGE_DAYS = [0, 3, 7, 14, 30, 60];
function corners(stage: number): Row[] {
  return daysBefore(DAY, STAGE_DAYS[stage]!).flatMap(day => [
    fact(day, 'train', 'session', { xp: 60, workingSets: 6 }), fact(day, 'tasks', 'done', { plannedSize: 'M', wasPlanned: true }),
    fact(day, 'bonuses', 'lightsout', { metTarget: true }), fact(day, 'mind', 'board', { daily: false }),
    fact(day, 'mind', 'card', {}), fact(day, 'mind', 'learn-drop', {}),
  ]);
}
async function put(page: Page, store: string, rows: Row[]) {
  await page.evaluate(async ({ store, rows }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => { const transaction = database.transaction(store, 'readwrite'); for (const row of rows) transaction.objectStore(store).put(row); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
    database.close();
  }, { store, rows });
}
const setting = (key: string, value: unknown): Row => ({ key, value, updatedAt: 1, deleted: 0, deviceId: 's2' });

async function phone(browser: Browser, colorScheme: 'light' | 'dark', time = NOON, size = { width: 360, height: 800 }): Promise<Page> {
  const context = await browser.newContext({ viewport: size, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme, reducedMotion: 'reduce', baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  await page.clock.setFixedTime(time);
  await page.goto('/?e2e#courtyard');
  return page;
}
/** Home, settled; after shutdown the night deck can open over it, and it is one tap behind. */
async function home(page: Page) {
  await page.goto('/?e2e#courtyard');
  await page.reload();
  const deck = page.getByRole('button', { name: 'Leave night deck' });
  await expect(page.locator('.courtyard-b').or(deck).first()).toBeVisible();
  if (await deck.isVisible()) { await deck.click(); await page.getByRole('link', { name: 'Courtyard' }).click(); }
  await expect(page.locator('.courtyard-b')).toBeVisible();
  await page.waitForTimeout(500);
  await settle(page);
}
const snap = (page: Page, name: string, clip?: { x: number; y: number; width: number; height: number }) => page.screenshot({ path: `${OUT}/${name}.png`, ...(clip ? { clip } : {}) });

for (const theme of ['light', 'dark'] as const) {
  const t = theme === 'light' ? 'l' : 'd';
  test(`layout B home at s1 to s5, ${theme}`, async ({ browser }) => {
    test.setTimeout(120_000);
    for (const stage of [1, 2, 3, 4, 5]) {
      const page = await phone(browser, theme);
      // s5 also has 25 Calm minutes this week, so the open card shows §0.2 row 3 in full: the useful days (45b) and
      // "This week: … of real things" (54), which hides at 0 minutes.
      await put(page, 'ledger', [...corners(stage), ...(stage === 5 ? [fact(DAY, 'calm', 'session', { minutes: 25 })] : [])]);
      await home(page);
      // The chrome the layout assumed (header 64, tab bar 67, card 134): measured here, printed for the gate log.
      const chrome = await page.evaluate(() => ({ header: document.querySelector('.topbar')!.getBoundingClientRect().height, tabBar: document.querySelector('.tabbar')!.getBoundingClientRect().height, card: document.querySelector('.courtyard-card')!.getBoundingClientRect().height }));
      console.log(`stage 2 shots [${theme} s${stage}]: chrome ${JSON.stringify(chrome)}`);
      await snap(page, `s2-${t}-home-s${stage}`);
      // a9 10 Nov: the s5 day cord and its unlit bulbs, the crown at 2× (deviceScaleFactor 2 at its own size).
      if (stage === 5) {
        const crown = (await page.locator('.courtyard-b-scene .courtyard-crown-leaves').first().boundingBox())!;
        await snap(page, `s2-${t}-home-s5-crown-2x`, { x: crown.x - 4, y: crown.y - 4, width: crown.width + 8, height: crown.height + 8 });
        await page.locator('.courtyard-card-handle').click();
        await settle(page);
        await snap(page, `s2-${t}-home-s5-card-open`);
      }
      await page.context().close();
    }
  });

  test(`s5 at night and at 200% text, ${theme}`, async ({ browser }) => {
    // a9 9 Nov: 23:30 is still evening with the default 01:30 bedtime (warm sky, no sun since b2's call, friends resting);
    // true night is 01:45: stars, the moon and the rings resting.
    const evening = await phone(browser, theme, new Date('2026-11-10T23:30:00'));
    await put(evening, 'ledger', [...corners(5), ...daysBefore(DAY, 3).map(day => fact(day, 'soft', 'soft', {}))]);
    await home(evening);
    await snap(evening, `s2-${t}-home-s5-evening`);
    await evening.context().close();
    const night = await phone(browser, theme, new Date('2026-11-11T01:45:00'));
    await put(night, 'ledger', [...corners(5), ...daysBefore(DAY, 3).map(day => fact(day, 'soft', 'soft', {}))]);
    await home(night);
    await expect(night.locator('.courtyard-stars')).toHaveCount(1);
    const rings = night.getByRole('navigation', { name: "Today's rings" });
    await expect(rings.locator('.ring-mark-moon')).toHaveCount(3);
    await rings.getByRole('button').first().click();
    await expect(night.locator('.today-rings-line')).toHaveText('Rings rest for the night.');
    await snap(night, `s2-${t}-home-s5-night`);
    await night.context().close();
    const big = await phone(browser, theme);
    await put(big, 'ledger', corners(5));
    await home(big);
    await textAt200(big);
    await settle(big);
    await snap(big, `s2-${t}-home-s5-200`);
    await big.context().close();
  });
}

// b2 10 Nov: the Settings card with an update found (Jenil's "Later" bug), 360 light and dark. The e2e build's
// stand-in updater: installed 122, version.json offers 124.
for (const theme of ['light', 'dark'] as const) {
  test(`Settings: App updates with an update found, ${theme}`, async ({ browser }) => {
    const page = await phone(browser, theme);
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__nandiFakeUpdater = {
        installed: { versionCode: 122, versionName: '0.1.0' },
        latest: { versionCode: 124, versionName: '0.1.0', sha256: 'a'.repeat(64), url: 'https://nandi-updates.nandi11.workers.dev/nandi-124.apk', builtAt: '2026-11-10T09:14:39Z', commit: '5c818a5', notes: '' },
      };
    });
    // A new document, so the stand-in is there from the first script (a hash change alone would not reload).
    await page.goto('/?e2e#you/settings');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Update to 0.1.0 (124)' })).toBeVisible();
    await settle(page);
    await snap(page, `s2-${theme === 'light' ? 'l' : 'd'}-settings-update`);
    // After Later: the banner goes, the card keeps its Update button.
    await page.getByRole('region', { name: 'Android update' }).getByRole('button', { name: 'Later' }).click();
    await expect(page.getByRole('region', { name: 'Android update' })).toHaveCount(0);
    await settle(page);
    await snap(page, `s2-${theme === 'light' ? 'l' : 'd'}-settings-update-after-later`);
    await page.context().close();
  });
}

test('s5 on a 16:9 phone (360x640, light): the card-aware crop keeps Kapi and the kite below the header', async ({ browser }) => {
  const page = await phone(browser, 'light', NOON, { width: 360, height: 640 });
  await put(page, 'ledger', corners(5));
  await home(page);
  const header = (await page.locator('.topbar').boundingBox())!;
  const kapi = (await page.getByRole('button', { name: /^Kapi, Mind/ }).boundingBox())!;
  const kite = (await page.locator('[data-prop="kapi-kite"]').boundingBox())!;
  console.log(`stage 2 shots [360x640]: header bottom ${header.y + header.height}, Kapi top ${kapi.y}, kite top ${kite.y}`);
  expect(kapi.y).toBeGreaterThanOrEqual(header.y + header.height);
  expect(kite.y).toBeGreaterThanOrEqual(header.y + header.height);
  await snap(page, 's2-l-home-s5-360x640');
  await page.context().close();
});

test('the Yatra tab at 100% and 200% text (the trek strip may grow past its reserved 477 px; nothing clips), light', async ({ browser }) => {
  const page = await phone(browser, 'light');
  await page.goto('/?e2e#yatra');
  await page.reload();
  await expect(page.locator('.trek-strip .home-title h2')).toBeVisible();
  await page.waitForTimeout(500);
  await snap(page, 's2-l-yatra');
  await textAt200(page);
  await settle(page);
  const strip = (await page.locator('.trek-strip').boundingBox())!;
  console.log(`stage 2 shots [yatra 200%]: strip height ${Math.round(strip.height)}`);
  expect(strip.height).toBeGreaterThanOrEqual(477);
  await snap(page, 's2-l-yatra-200');
  await page.context().close();
});

test('Grow › Calm & Sleep with the "Tonight" link (plan item ii, for Jenil to decide), light and dark', async ({ browser }) => {
  for (const theme of ['light', 'dark'] as const) {
    const page = await phone(browser, theme);
    await page.goto('/?e2e#grow/sleep');
    await page.reload();
    await expect(page.getByTestId('night-link')).toBeVisible();
    await settle(page);
    await snap(page, `s2-${theme === 'light' ? 'l' : 'd'}-calm-sleep-tonight-link`);
    await page.context().close();
  }
});

test('the neem keepsakes on the bark (4 camps), the caption, and no clipping at 360x800', async ({ browser }) => {
  const page = await phone(browser, 'light');
  // Four camps reached before the jar's first day: one place a day, three sessions each (the walk before jarFrom).
  const days = daysBefore(DAY, 4).reverse();
  await put(page, 'settings', [setting('yatra.startDay', days[0]), setting('yatra.jarFrom', DAY)]);
  await put(page, 'ledger', [...corners(5), ...days.flatMap(day => [0, 1, 2].map(() => fact(day, 'calm', 'session', { minutes: 10 })))]);
  await home(page);
  const taps = page.locator('.courtyard-keepsake-tap');
  await expect(taps).toHaveCount(4);
  const boxes = await taps.evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
  const header = (await page.locator('.topbar').boundingBox())!;
  for (const box of boxes) { expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.w).toBeLessThanOrEqual(360); expect(box.y).toBeGreaterThanOrEqual(header.y + header.height); }
  const left = Math.min(...boxes.map(b => b.x)) - 40, top = Math.min(...boxes.map(b => b.y)) - 40;
  const clip = { x: Math.max(0, left), y: Math.max(0, top), width: 140, height: Math.max(...boxes.map(b => b.y + b.h)) - top + 50 };
  await snap(page, 's2-l-keepsakes-s5');
  await snap(page, 's2-l-keepsakes-s5-zoom', clip);
  await taps.first().click();
  await expect(page.locator('.courtyard-keepsake-caption')).toBeVisible();
  await snap(page, 's2-l-keepsake-caption');
  await page.context().close();
});

test('header rings: Mind unlit, half and closed, light and dark (360 crops)', async ({ browser }) => {
  for (const theme of ['light', 'dark'] as const) {
    for (const [state, facts] of [
      ['unlit', []],
      ['half', [fact(DAY, 'calm', 'session', { minutes: 6 })]],
      ['closed', [fact(DAY, 'calm', 'session', { minutes: 6 }), fact(DAY, 'read', 'chapter', {})]],
      // a9 9 Nov: a paid session closes Body with its mark (the rest fixture paid 0 XP on replay, so Body stayed empty).
      ['body', [fact(DAY, 'train', 'session', { xp: 60, workingSets: 6 })]],
      ['all', [fact(DAY, 'calm', 'session', { minutes: 6 }), fact(DAY, 'read', 'chapter', {}), fact(DAY, 'tasks', 'done', { plannedSize: 'M', wasPlanned: true }, 's2-task'), fact(DAY, 'train', 'session', { xp: 60, workingSets: 6 })]],
    ] as const) {
      const page = await phone(browser, theme);
      await put(page, 'tasks', [{ id: 's2-task', title: 'Call the bank', status: 'done', dayKey: DAY, updatedAt: 1, deleted: 0, deviceId: 's2' }]);
      await put(page, 'ledger', [...facts]);
      await home(page);
      await expect(page.getByRole('navigation', { name: "Today's rings" })).toBeVisible();
      const slot = (await page.locator('.today-rings-slot').boundingBox())!;
      if (state === 'body' || state === 'all') await expect(page.locator('.today-ring').nth(1).locator('.ring-mark')).not.toHaveCount(0);
      await snap(page, `s2-${theme === 'light' ? 'l' : 'd'}-rings-${state}`, { x: 0, y: 0, width: 360, height: Math.ceil(slot.y + slot.height + 8) });
      if (state === 'closed') {
        await page.getByRole('button', { name: /^Mind:/ }).click();
        await snap(page, `s2-${theme === 'light' ? 'l' : 'd'}-rings-tap-line`, { x: 0, y: 0, width: 360, height: 160 });
      }
      await page.context().close();
    }
  }
});

test('the 15 closed-Mind pairs at 10 CSS, ring vs 28x16 pill, light and dark (§0.20 §72)', async ({ browser }) => {
  const mark = (act: typeof MIND_ACTS[number], size: number) => markSvg(MIND_MARK[act], size);
  const pairs: [typeof MIND_ACTS[number], typeof MIND_ACTS[number]][] = [];
  for (let i = 0; i < MIND_ACTS.length; i++) for (let j = i + 1; j < MIND_ACTS.length; j++) pairs.push([MIND_ACTS[i]!, MIND_ACTS[j]!]);
  for (const theme of ['light', 'dark'] as const) {
    // The app's own tokens for this theme (the Mind ring is Chiku's learn colour, marks knocked out in the surface).
    const app = await phone(browser, theme);
    const tokens = await app.evaluate(() => { const style = getComputedStyle(document.documentElement); return { learn: style.getPropertyValue('--learn-area').trim(), surface: style.getPropertyValue('--surface-1').trim(), ink: style.getPropertyValue('--ink').trim() }; });
    await app.context().close();
    const palette = { surface: tokens.surface, ink: tokens.ink, learn: { area: tokens.learn } };
    const cell = ([a, b]: typeof pairs[number]) => `<div class="cell"><span class="ring"><svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.5" fill="${palette.learn.area}"/></svg><span class="marks">${mark(a, 9)}${mark(b, 9)}</span></span>
      <span class="pill"><span class="marks">${mark(a, 9)}${mark(b, 9)}</span></span><small>${a} + ${b}</small></div>`;
    const html = `<!doctype html><html><body style="margin:0;background:${palette.surface};color:${palette.ink};font:11px sans-serif">
      <style>.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:12px;width:336px}.cell{display:grid;grid-template-columns:30px 34px 1fr;align-items:center;gap:4px}
      .ring{position:relative;width:24px;height:24px}.ring .marks{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:1px;color:${palette.surface}}
      .pill{display:flex;align-items:center;justify-content:center;gap:1px;width:28px;height:16px;border-radius:8px;background:${palette.learn.area};color:${palette.surface}}small{grid-column:1/-1;opacity:.7}</style>
      <div class="grid">${pairs.map(cell).join('')}</div></body></html>`;
    const page = await (await browser.newContext({ viewport: { width: 360, height: 520 }, deviceScaleFactor: 3 })).newPage();
    await page.setContent(html);
    await snap(page, `s2-${theme === 'light' ? 'l' : 'd'}-mind-pairs-ring-vs-pill`);
    await page.context().close();
  }
});

test('rain on the Yatra home during a focus-guard pause (light)', async ({ browser }) => {
  const page = await phone(browser, 'light');
  await put(page, 'tasks', [{ id: 'rain-task', title: 'Write the report', status: 'planned', dayKey: DAY, updatedAt: 1, deleted: 0, deviceId: 's2' }]);
  await put(page, 'focus', [{ id: 'rain-focus', taskId: 'rain-task', startedAt: NOON.getTime() - 20 * 60_000, pauses: [{ at: NOON.getTime() - 5 * 60_000, reason: 'guard', app: 'com.example.feed' }], updatedAt: 1, deleted: 0, deviceId: 's2' }]);
  await page.goto('/?e2e#yatra');
  await page.reload();
  await expect(page.locator('.trek-weather')).toHaveText('Waiting out the rain. Back to focus to climb on.');
  await settle(page);
  await snap(page, 's2-l-yatra-rain');
  await page.context().close();
});

/**
 * The beside rule, G-corner, support and the neem on ALPHA (b2), at every stage: each friend's sprite, each part and the
 * neem's crown and trunk are rasterised alone in the page, and their opaque pixels compared.
 * - Beside: within 6 CSS of its own things (a 6 px dilation touches them) and no shared pixel with them (floor mats
 *   excepted). G-corner: a friend covers at most 15% of another corner's part.
 * - Support (b2 + a9 9 Nov, after Jenil's floating vase): each part's lowest opaque row within 2 CSS of what it stands
 *   on (data-support): the floor (at or below the wall foot), the coping top, or the top of its host part under it; a
 *   wall part wholly inside the wall face; a hanging part's top inside its host. The kite flies.
 * - Neem: no part pixel over the crown or trunk (the swing is part of the tree and left out).
 * The same check gates the painted full-set swap.
 */
test('alpha check: beside, G-corner, support and the neem on the real pixels, s1 to s5', async ({ browser }) => {
  test.setTimeout(240_000);
  const report: Record<string, unknown> = {};
  for (const stage of [1, 2, 3, 4, 5]) {
    const page = await phone(browser, 'light');
    await put(page, 'ledger', corners(stage));
    await home(page);
    report[`s${stage}`] = await page.evaluate(async () => {
      const W = innerWidth, H = innerHeight;
      const scene = document.querySelector('.courtyard-b-scene') as SVGSVGElement;
      const outer = scene.firstElementChild as SVGGElement;
      const m = outer.transform.baseVal.consolidate()!.matrix;
      const lineY = (name: string) => m.d * Number(scene.getAttribute(`data-${name}`)) + m.f;
      const lines = { coping: lineY('coping'), wallTop: lineY('wall-top'), wallFoot: lineY('wall-foot') };
      const tol = 2 * m.d + 0.5;
      const raster = async (svg: string) => {
        const img = new Image();
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        await img.decode();
        const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, W, H).data;
        const mask = new Uint8Array(W * H);
        for (let i = 0; i < W * H; i++) mask[i] = data[i * 4 + 3]! > 40 ? 1 : 0;
        return mask;
      };
      const bounds = (mask: Uint8Array) => {
        let minX = W, maxX = -1, minY = H, maxY = -1;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
        return { minX, maxX, minY, maxY, foot: maxY + 1 };
      };
      const wrap = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${inner}</svg>`;
      const parts = [...scene.querySelectorAll<SVGGElement>('.courtyard-part')].map(node => ({ prop: node.dataset.prop!, support: node.dataset.support!, svg: wrap(`<g transform="${outer.getAttribute('transform')}">${node.outerHTML}</g>`) }));
      const friends = [...document.querySelectorAll<HTMLElement>('.courtyard-b-friend')].map(node => {
        const r = node.getBoundingClientRect(), svg = node.querySelector('svg')!;
        return { friend: node.dataset.friend!, svg: wrap(`<g transform="translate(${r.x} ${r.y}) scale(${r.width / 100})">${svg.innerHTML}</g>`) };
      });
      const neemNode = scene.querySelector<SVGGElement>('.courtyard-neem')!;
      const neemCtm = neemNode.getCTM()!;
      const neemClone = neemNode.cloneNode(true) as SVGGElement;
      for (const swing of neemClone.querySelectorAll('.courtyard-swing')) swing.remove();
      const neem = await raster(wrap(`<g transform="matrix(${neemCtm.a} ${neemCtm.b} ${neemCtm.c} ${neemCtm.d} ${neemCtm.e} ${neemCtm.f})">${neemClone.innerHTML}</g>`));
      const own: Record<string, string> = { Mor: 'mor-', Moti: 'moti-', Kapi: 'kapi-', Nandi: 'nandi-', Kachhua: 'kachhua-', Chiku: 'chiku-' };
      const mats = ['nandi-mat', 'kachhua-sleeping-mat'];
      const partMasks = await Promise.all(parts.map(async part => { const mask = await raster(part.svg); return { ...part, mask, box: bounds(mask) }; }));
      const out: string[] = [], gaps: string[] = [], feet: string[] = [];
      // a9 10 Nov: the crown stays round at every stage (box w/h ≥ 0.9).
      const crownBox = scene.querySelector('.courtyard-crown-leaves')?.getBoundingClientRect();
      if (crownBox && crownBox.width / crownBox.height < 0.9) out.push(`neem crown w/h ${(crownBox.width / crownBox.height).toFixed(2)} < 0.9`);
      // Support and the neem, per part.
      for (const part of partMasks) {
        const { box, support } = part;
        if (box.maxY < 0) { out.push(`${part.prop}: no opaque pixels`); continue; }
        let overNeem = 0;
        for (let i = 0; i < W * H; i++) if (part.mask[i] && neem[i]) overNeem++;
        if (overNeem) out.push(`${part.prop}: ${overNeem} px over the neem's crown or trunk`);
        const at = (value: number) => value.toFixed(1);
        if (support === 'floor') {
          feet.push(`${part.prop}: foot ${box.foot} (floor from ${at(lines.wallFoot)})`);
          if (box.foot < lines.wallFoot - tol) out.push(`${part.prop}: foot ${box.foot} above the floor (wall foot ${at(lines.wallFoot)})`);
        } else if (support === 'coping') {
          feet.push(`${part.prop}: foot ${box.foot} (coping ${at(lines.coping)})`);
          if (Math.abs(box.foot - lines.coping) > tol) out.push(`${part.prop}: foot ${box.foot} not on the coping top (${at(lines.coping)})`);
        } else if (support === 'wall') {
          feet.push(`${part.prop}: ${box.minY}..${box.foot} (wall face ${at(lines.wallTop)}..${at(lines.wallFoot)})`);
          if (box.minY < lines.wallTop - tol || box.foot > lines.wallFoot + tol) out.push(`${part.prop}: ${box.minY}..${box.foot} outside the wall face (${at(lines.wallTop)}..${at(lines.wallFoot)})`);
        } else if (support.startsWith('on:') || support.startsWith('hangs:')) {
          const hostProp = support.slice(support.indexOf(':') + 1);
          const host = partMasks.find(row => row.prop === hostProp);
          if (!host) { out.push(`${part.prop}: its host ${hostProp} is not drawn`); continue; }
          if (support.startsWith('hangs:')) {
            if (box.minY < host.box.minY - tol || box.minY > host.box.maxY) out.push(`${part.prop}: top ${box.minY} does not hang from ${hostProp} (${host.box.minY}..${host.box.maxY})`);
            continue;
          }
          // The host's top under the part's own columns.
          let hostTop = H;
          for (let x = box.minX; x <= box.maxX; x++) for (let y = 0; y < H; y++) if (host.mask[y * W + x]) { if (y < hostTop) hostTop = y; break; }
          feet.push(`${part.prop}: foot ${box.foot} (on ${hostProp}, top ${hostTop})`);
          if (Math.abs(box.foot - hostTop) > tol + 1) out.push(`${part.prop}: foot ${box.foot} not on ${hostProp} (its top ${hostTop})`);
        }
      }
      // The beside rule and G-corner, per friend.
      for (const friend of friends) {
        const mask = await raster(friend.svg);
        const dilated = new Uint8Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) dilated[yy * W + xx] = 1; }
        let near = false;
        for (const part of partMasks) {
          let shared = 0, partPixels = 0, touch = false;
          for (let i = 0; i < W * H; i++) { if (part.mask[i]) { partPixels++; if (mask[i]) shared++; if (dilated[i]) touch = true; } }
          const mine = part.prop.startsWith(own[friend.friend]!);
          if (mine && touch) near = true;
          if (mine && shared > 0 && !mats.includes(part.prop)) out.push(`${friend.friend}: ${shared} px over its own ${part.prop}`);
          if (!mine && partPixels && shared / partPixels > 0.15) out.push(`${friend.friend}: covers ${(100 * shared / partPixels).toFixed(0)}% of ${part.prop}`);
        }
        if (!near && partMasks.some(part => part.prop.startsWith(own[friend.friend]!))) out.push(`${friend.friend}: more than 6 px from its own things`);
        // The measured gap to the nearest own thing, and to which (b2 9 Nov: the numbers behind the beside rule).
        const edge = (m: Uint8Array) => { const pts: number[] = []; for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (m[i] && (!m[i - 1] || !m[i + 1] || !m[i - W] || !m[i + W])) pts.push(x, y); } return pts; };
        const fe = edge(mask);
        let best = Infinity, bestProp = '';
        for (const part of partMasks) {
          if (!part.prop.startsWith(own[friend.friend]!)) continue;
          const pe = edge(part.mask);
          for (let i = 0; i < fe.length; i += 2) for (let j = 0; j < pe.length; j += 2) { const d = Math.hypot(fe[i]! - pe[j]!, fe[i + 1]! - pe[j + 1]!); if (d < best) { best = d; bestProp = part.prop; } }
        }
        if (best < Infinity) gaps.push(`${friend.friend}: ${best.toFixed(1)} px to ${bestProp}`);
      }
      return { problems: out, gaps, feet };
    });
    await page.context().close();
  }
  writeFileSync(`${OUT}/alpha-report.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`stage 2 alpha check: ${JSON.stringify(Object.fromEntries(Object.entries(report).map(([stage, row]) => [stage, (row as { problems: string[] }).problems])))}`);
  // b2 9 Nov: all green, no relaxed rule (beside ≤ 6 px, nothing over its own things but the mats, every part supported,
  // nothing over the neem).
  expect(Object.values(report).flatMap(stage => (stage as { problems: string[] }).problems)).toEqual([]);
});
