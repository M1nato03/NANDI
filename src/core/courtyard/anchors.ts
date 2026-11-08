/**
 * Spec 571 §0.19 layout B (stage 2 commit 3): where the painted courtyard puts each friend, from the Blender pass's
 * anchor file (anchors-p9p.json now; anchors-p9q.json is a data swap, same format). Pure: the stage fit for any phone,
 * canvas → screen CSS, and the layout gates as numbers (G-edge, tap size, no overlap, clear of the header and of the
 * collapsed card), so a new pass is checked by unit tests before anything is drawn.
 *
 * The canvas is 1080 × 2520 (21:9, aspect 0.4286), top-left origin, CSS = pixels / 3 at 360 px wide. It is the whole
 * screen: the header sits over its top (`header_mask`) and the tab bar over its bottom (`tab_bar_begins_y`).
 * Crop rule (§0.19; b2 8 Nov: 16:9 phones are in the gate): up to aspect 0.6 the stage fits the phone's WIDTH and crops
 * top and bottom equally (never the sides); above 0.6 (foldables, tablets, desktop) the 0.6 frame sits centred at full
 * height (blurred side fill).
 *
 * Read keys only (anything else in the file is ignored): canvas, layout.{header_mask, card_begins_y,
 * tab_bar_begins_y}, friends.<id>.{area, foot_point, tap_rect, today_glow_rect, scale}, tag.{peg_point,
 * tag_rect_css}, prop_rects_css.
 */
export const FRIEND_IDS = ['mor', 'moti', 'kapi', 'nandi', 'kachhua', 'chiku'] as const;
export type FriendId = typeof FRIEND_IDS[number];
export const FRIEND_AREA: Record<FriendId, string> = { mor: 'plan', moti: 'remember', kapi: 'mind', nandi: 'train', kachhua: 'sleep', chiku: 'learn' };
/** [x, y, width, height]. */
export type Rect = readonly [number, number, number, number];
export type Point = readonly [number, number];

export interface FriendAnchor { area: string; foot: Point; tap: Rect; glow: Rect; scale: number }
export interface StageAnchors {
  canvas: Point;
  headerBottom: number;
  cardTop: number;
  tabTop: number;
  friends: Record<FriendId, FriendAnchor>;
  tag?: { peg: Point; rect: Rect };
  /** Free-standing objects, in canvas px (the file gives them in 360-wide CSS). */
  props: Record<string, Rect>;
}

export const CSS_PER_PX = 1 / 3;
/** The widest aspect that still width-fits (16:9 = 0.5625 included); wider screens get this frame centred. */
export const MAX_FIT_ASPECT = 0.6;
export const EDGE_CSS = 16;
export const MIN_TAP_CSS = 48;

const isNum = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const tuple = (value: unknown, length: number): value is number[] => Array.isArray(value) && value.length === length && value.every(isNum);

/** Reads and checks an anchor file. Throws one error naming every missing or malformed key. */
export function parseAnchors(raw: unknown): StageAnchors {
  const problems: string[] = [];
  const file = (raw ?? {}) as Record<string, unknown>;
  const layout = (file.layout ?? {}) as Record<string, unknown>;
  const need = <T>(ok: boolean, path: string, value: T) => { if (!ok) problems.push(path); return value; };
  const canvas = need(tuple(file.canvas, 2), 'canvas', file.canvas as unknown as Point);
  const header = need(tuple(layout.header_mask, 4), 'layout.header_mask', layout.header_mask as number[]);
  const cardTop = need(isNum(layout.card_begins_y), 'layout.card_begins_y', layout.card_begins_y as number);
  const tabTop = need(isNum(layout.tab_bar_begins_y), 'layout.tab_bar_begins_y', layout.tab_bar_begins_y as number);
  const friendsRaw = (file.friends ?? {}) as Record<string, Record<string, unknown>>;
  const friends = {} as Record<FriendId, FriendAnchor>;
  for (const id of FRIEND_IDS) {
    const row = friendsRaw[id];
    if (!row) { problems.push(`friends.${id}`); continue; }
    friends[id] = {
      area: need(row.area === FRIEND_AREA[id], `friends.${id}.area (${FRIEND_AREA[id]})`, FRIEND_AREA[id]),
      foot: need(tuple(row.foot_point, 2), `friends.${id}.foot_point`, row.foot_point as unknown as Point),
      tap: need(tuple(row.tap_rect, 4), `friends.${id}.tap_rect`, row.tap_rect as unknown as Rect),
      glow: need(tuple(row.today_glow_rect, 4), `friends.${id}.today_glow_rect`, row.today_glow_rect as unknown as Rect),
      scale: need(isNum(row.scale) && (row.scale as number) > 0, `friends.${id}.scale`, row.scale as number),
    };
  }
  const tagRaw = file.tag as Record<string, unknown> | undefined;
  const tag = tagRaw && tuple(tagRaw.peg_point, 2) && tuple(tagRaw.tag_rect_css, 4)
    ? { peg: tagRaw.peg_point as unknown as Point, rect: (tagRaw.tag_rect_css as number[]).map(v => v / CSS_PER_PX) as unknown as Rect } : undefined;
  const props: Record<string, Rect> = {};
  for (const [name, rect] of Object.entries((file.prop_rects_css ?? {}) as Record<string, unknown>)) {
    if (tuple(rect, 4)) props[name] = (rect as number[]).map(v => v / CSS_PER_PX) as unknown as Rect;
    else problems.push(`prop_rects_css.${name}`);
  }
  if (problems.length) throw new Error(`Courtyard anchors: missing or malformed ${problems.join(', ')}`);
  return { canvas, headerBottom: header[1]! + header[3]!, cardTop, tabTop, friends, ...(tag ? { tag } : {}), props };
}

export interface StageFit {
  mode: 'width' | 'frame';
  /** CSS px per canvas px. */
  scale: number;
  /** Canvas px cropped off the top (width mode), and the frame's left offset in CSS (frame mode). */
  cropTop: number;
  offsetX: number;
  /** Canvas px visible, top to bottom. */
  visibleHeight: number;
}

/** How the stage sits on a viewport of `width` × `height` CSS px. */
export function stageFit(anchors: StageAnchors, width: number, height: number): StageFit {
  const [cw, ch] = anchors.canvas;
  const aspect = width / height;
  if (aspect <= MAX_FIT_ASPECT) {
    const scale = width / cw;
    const visibleHeight = Math.min(ch, height / scale);
    return { mode: 'width', scale, cropTop: (ch - visibleHeight) / 2, offsetX: 0, visibleHeight };
  }
  const visibleHeight = cw / MAX_FIT_ASPECT;
  const scale = height / visibleHeight;
  return { mode: 'frame', scale, cropTop: (ch - visibleHeight) / 2, offsetX: (width - cw * scale) / 2, visibleHeight };
}

/** A canvas rect on screen, in CSS px from the viewport's top-left. */
export function rectOnScreen(fit: StageFit, rect: Rect): Rect {
  const [x, y, w, h] = rect;
  return [fit.offsetX + x * fit.scale, (y - fit.cropTop) * fit.scale, w * fit.scale, h * fit.scale];
}
export function pointOnScreen(fit: StageFit, point: Point): Point {
  return [fit.offsetX + point[0] * fit.scale, (point[1] - fit.cropTop) * fit.scale];
}

const overlaps = (a: Rect, b: Rect) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];

/**
 * The layout gates for one viewport, as readable problems (empty = pass): every tap rect ≥ 48 CSS each way, no two
 * overlap, each ≥ 16 CSS inside both side edges (G-edge; Android's edge back-gesture), below the header and above the
 * collapsed card (whose height from the screen's bottom is the anchor file's, fixed in CSS); each free-standing prop
 * ≥ 16 CSS inside both edges (wall-run things listed in `wallRun` may reach the edge).
 */
export function layoutProblems(anchors: StageAnchors, width: number, height: number, wallRun: readonly string[] = []): string[] {
  const fit = stageFit(anchors, width, height);
  const out: string[] = [];
  const [, ch] = anchors.canvas;
  // The header and the collapsed card + tab bar keep their CSS size on every phone (they are page chrome, not art).
  const headerCss = anchors.headerBottom * CSS_PER_PX;
  const cardCss = (ch - anchors.cardTop) * CSS_PER_PX;
  const taps = FRIEND_IDS.map(id => [id, rectOnScreen(fit, anchors.friends[id].tap)] as const);
  for (const [id, [x, y, w, h]] of taps) {
    if (w < MIN_TAP_CSS || h < MIN_TAP_CSS) out.push(`${id}: tap ${w.toFixed(1)}×${h.toFixed(1)} under ${MIN_TAP_CSS}`);
    if (x < fit.offsetX + EDGE_CSS - 1e-9 || x + w > width - fit.offsetX - EDGE_CSS + 1e-9) out.push(`${id}: tap within ${EDGE_CSS} px of a side (${x.toFixed(1)}..${(x + w).toFixed(1)} of ${width})`);
    if (y < headerCss) out.push(`${id}: tap under the header (${y.toFixed(1)} < ${headerCss.toFixed(1)})`);
    if (y + h > height - cardCss) out.push(`${id}: tap under the collapsed card (${(y + h).toFixed(1)} > ${(height - cardCss).toFixed(1)})`);
  }
  for (let a = 0; a < taps.length; a++) for (let b = a + 1; b < taps.length; b++) if (overlaps(taps[a]![1], taps[b]![1])) out.push(`${taps[a]![0]} and ${taps[b]![0]}: taps overlap`);
  for (const [name, rect] of Object.entries(anchors.props)) {
    if (wallRun.includes(name)) continue;
    const [x, , w] = rectOnScreen(fit, rect);
    if (x < fit.offsetX + EDGE_CSS - 1e-9 || x + w > width - fit.offsetX - EDGE_CSS + 1e-9) out.push(`${name}: within ${EDGE_CSS} px of a side`);
  }
  return out;
}
