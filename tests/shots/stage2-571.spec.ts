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
  test(`layout B home at s1, s3, s4, s5, ${theme}`, async ({ browser }) => {
    for (const stage of [1, 3, 4, 5]) {
      const page = await phone(browser, theme);
      await put(page, 'ledger', corners(stage));
      await home(page);
      // The chrome the layout assumed (header 64, tab bar 67, card 134): measured here, printed for the gate log.
      const chrome = await page.evaluate(() => ({ header: document.querySelector('.topbar')!.getBoundingClientRect().height, tabBar: document.querySelector('.tabbar')!.getBoundingClientRect().height, card: document.querySelector('.courtyard-card')!.getBoundingClientRect().height }));
      console.log(`stage 2 shots [${theme} s${stage}]: chrome ${JSON.stringify(chrome)}`);
      await snap(page, `s2-${t}-home-s${stage}`);
      if (stage === 5) {
        await page.locator('.courtyard-card-handle').click();
        await settle(page);
        await snap(page, `s2-${t}-home-s5-card-open`);
      }
      await page.context().close();
    }
  });

  test(`s5 at night and at 200% text, ${theme}`, async ({ browser }) => {
    const night = await phone(browser, theme, new Date('2026-11-10T23:30:00'));
    await put(night, 'ledger', [...corners(5), ...daysBefore(DAY, 3).map(day => fact(day, 'soft', 'soft', {}))]);
    await home(night);
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
      ['all', [fact(DAY, 'calm', 'session', { minutes: 6 }), fact(DAY, 'read', 'chapter', {}), fact(DAY, 'tasks', 'done', { plannedSize: 'M', wasPlanned: true }, 's2-task'), fact(DAY, 'train', 'rest', { xp: 10 })]],
    ] as const) {
      const page = await phone(browser, theme);
      await put(page, 'tasks', [{ id: 's2-task', title: 'Call the bank', status: 'done', dayKey: DAY, updatedAt: 1, deleted: 0, deviceId: 's2' }]);
      await put(page, 'ledger', [...facts]);
      await home(page);
      await expect(page.getByRole('navigation', { name: "Today's rings" })).toBeVisible();
      const slot = (await page.locator('.today-rings-slot').boundingBox())!;
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
 * The beside rule and G-corner on ALPHA (b2): each friend's sprite and each part are rasterised alone in the page, and
 * their opaque pixels compared. Beside: within 6 CSS of its own things (a 6 px dilation touches them) and no shared
 * pixel with them (floor mats excepted). G-corner: a friend covers at most 15% of another corner's part.
 */
test('alpha check: beside rule and G-corner on the real sprites, s3 and s5', async ({ browser }) => {
  const report: Record<string, unknown> = {};
  for (const stage of [3, 5]) {
    const page = await phone(browser, 'light');
    await put(page, 'ledger', corners(stage));
    await home(page);
    report[`s${stage}`] = await page.evaluate(async () => {
      const W = innerWidth, H = innerHeight;
      const scene = document.querySelector('.courtyard-b-scene') as SVGSVGElement;
      const outer = scene.firstElementChild as SVGGElement;
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
      const wrap = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${inner}</svg>`;
      const parts = [...scene.querySelectorAll<SVGGElement>('.courtyard-part')].map(node => ({ prop: node.dataset.prop!, svg: wrap(`<g transform="${outer.getAttribute('transform')}">${node.outerHTML}</g>`) }));
      const friends = [...document.querySelectorAll<HTMLElement>('.courtyard-b-friend')].map(node => {
        const r = node.getBoundingClientRect(), svg = node.querySelector('svg')!;
        return { friend: node.dataset.friend!, svg: wrap(`<g transform="translate(${r.x} ${r.y}) scale(${r.width / 100})">${svg.innerHTML}</g>`) };
      });
      const own: Record<string, string> = { Mor: 'mor-', Moti: 'moti-', Kapi: 'kapi-', Nandi: 'nandi-', Kachhua: 'kachhua-', Chiku: 'chiku-' };
      const mats = ['nandi-mat', 'kachhua-sleeping-mat'];
      const partMasks = await Promise.all(parts.map(async part => ({ ...part, mask: await raster(part.svg) })));
      const out: string[] = [];
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
      }
      return out;
    });
    await page.context().close();
  }
  writeFileSync(`${OUT}/alpha-report.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`stage 2 alpha check: ${JSON.stringify(report)}`);
});
