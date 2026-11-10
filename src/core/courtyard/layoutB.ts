import type { AreaId } from './courtyard';
import { CSS_PER_PX, FRIEND_AREA, FRIEND_IDS, layoutProblems, type FriendAnchor, type FriendId, type Rect, type StageAnchors } from './anchors';

/**
 * Spec 571 §0.19 layout B with today's Scene.tsx parts (b2, 8 Nov: the painted pass waits for Jenil's sign-off on the
 * full layer set). The courtyard fills the screen between the header and the tab bar: the wall row (Garden, Keepsakes,
 * Tree, Kapi's puzzles) and the front row (Nandi's gym, Kachhua's rest, Chiku's books) are placed so the front row
 * stands just above the collapsed card, then everything is scaled 1.3x about the front row's foot, with the side
 * corners stepped inward. Ported from preview-cy-scratch 9c4e833 (B v3), not merged from it.
 *
 * Geometry only (pure). `stageAnchors()` expresses a layout in the painted pass's anchor shape, so the same gate
 * (anchors.layoutProblems: G-edge, taps, overlap, header, card) checks both.
 */
export const B_SCALE = 1.3;
/** §0.19 growth of the neem tree per stage (was [.22,.45,.64,.84,1,1]). */
export const K_GROWTH = [0.3, 0.55, 0.8, 1.05, 1.3, 1.55] as const;
export const SCENE_W = 360;

export type Corner = 'garden' | 'keep' | 'puzzles' | 'gym' | 'rest' | 'books' | 'tree' | 'door';
export type Row = 'wall' | 'front';
/** How far each side corner steps in (scene units, before the 1.3x), so nothing crops at the sides (tuned by the gate). */
export const CORNER_SHIFT: Record<Corner, number> = { garden: 40, keep: -40, puzzles: -10, gym: 0, rest: 32, books: -32, tree: 0, door: 21 };
/**
 * b2 (8 Nov, option A): the friends, their taps and the neem stay at 1.3x (Jenil's "full size and growth reads
 * clearly"); the corner objects share one scale in [1.0, 1.3], about each corner's own anchor (the point where the
 * corner meets the floor or the wall), while the anchors themselves spread at 1.3x about the foot. The largest value
 * at which every stage passes the gate at every gate size (tuned by the gate, see layoutB.test).
 */
export const OBJECT_SCALE = 1.3;
/** Each corner's anchor in scene units: its objects grow and shrink about this point. */
export const CORNER_ANCHOR: Record<Corner, [number, number]> = {
  garden: [48, 128], keep: [312, 128], puzzles: [250, 141], gym: [180, 196], rest: [56, 192], books: [300, 196], tree: [180, 140], door: [115, 130],
};
export const CORNER_ROW: Record<Corner, Row> = { garden: 'wall', keep: 'wall', puzzles: 'wall', tree: 'wall', door: 'wall', gym: 'front', rest: 'front', books: 'front' };
export const AREA_CORNER: Record<AreaId, Corner> = { plan: 'garden', remember: 'keep', mind: 'puzzles', train: 'gym', sleep: 'rest', learn: 'books' };

/** Where each friend stands in Scene.tsx's own 360 × 200 units: centre x, feet y, size. Kachhua is on the cot from stage 3. */
export const SPOTS: Record<AreaId, (stage: number) => [number, number, number]> = {
  train: () => [184, 199, 64], plan: () => [46, 140, 50], remember: () => [314, 146, 52],
  mind: () => [250, 80, 40], learn: () => [298, 197, 46], sleep: stage => stage >= 3 ? [54, 170, 46] : [54, 192, 46],
};

/** Each corner object as drawn in Scene.tsx (scene units), from the stage it appears. `wallRun` may reach the edge. */
export interface SceneObject { id: string; corner: Corner; from: number; rect: Rect; wallRun?: boolean }
export const OBJECTS: readonly SceneObject[] = [
  { id: 'mor-pot-1', corner: 'garden', from: 1, rect: [8, 95, 20, 33] },
  { id: 'mor-pot-2', corner: 'garden', from: 2, rect: [66, 95, 20, 33] },
  { id: 'mor-flower-bed', corner: 'garden', from: 3, rect: [2, 117, 92, 16], wallRun: true },
  { id: 'mor-trellis', corner: 'garden', from: 4, rect: [8, 80, 82, 46], wallRun: true },
  { id: 'mor-water-bowl', corner: 'garden', from: 5, rect: [77, 139, 22, 11] },
  { id: 'moti-box', corner: 'keep', from: 1, rect: [275, 131, 18, 13] },
  { id: 'moti-frame', corner: 'keep', from: 2, rect: [324, 100, 24, 20] },
  { id: 'moti-jars', corner: 'keep', from: 3, rect: [278, 98, 36, 19] },
  { id: 'moti-trunk', corner: 'keep', from: 4, rect: [338, 126, 22, 20] },
  { id: 'moti-photos', corner: 'keep', from: 5, rect: [266, 84, 90, 17], wallRun: true },
  { id: 'kapi-cube', corner: 'puzzles', from: 1, rect: [226, 66, 9, 9] },
  { id: 'kapi-stool', corner: 'puzzles', from: 2, rect: [238, 134, 26, 22] },
  { id: 'kapi-kite', corner: 'puzzles', from: 3, rect: [279, 22, 18, 40] },
  { id: 'kapi-telescope', corner: 'puzzles', from: 4, rect: [266, 60, 18, 20] },
  { id: 'kapi-slate', corner: 'puzzles', from: 5, rect: [238, 102, 26, 24] },
  { id: 'nandi-mat', corner: 'gym', from: 1, rect: [132, 184, 96, 12] },
  { id: 'nandi-clubs', corner: 'gym', from: 2, rect: [116, 160, 18, 26] },
  { id: 'nandi-dumbbells', corner: 'gym', from: 3, rect: [132, 179, 16, 15] },
  // §0.19 (Jenil 6 Nov, "wooden frame it is"): a freestanding wooden frame behind the mat at stage 4, medals on it at 5.
  { id: 'nandi-gym-frame', corner: 'gym', from: 4, rect: [130, 110, 100, 41] },
  { id: 'kachhua-mat', corner: 'rest', from: 1, rect: [14, 164, 84, 31] },
  { id: 'kachhua-pillow', corner: 'rest', from: 2, rect: [78, 159, 18, 25] },
  { id: 'kachhua-cot', corner: 'rest', from: 3, rect: [10, 164, 92, 28] },
  { id: 'kachhua-lantern', corner: 'rest', from: 4, rect: [101, 152, 14, 25] },
  { id: 'kachhua-blanket', corner: 'rest', from: 5, rect: [15, 159, 20, 25] },
  { id: 'chiku-book', corner: 'books', from: 1, rect: [286, 192, 24, 6] },
  { id: 'chiku-stack', corner: 'books', from: 2, rect: [257, 181, 23, 15] },
  { id: 'chiku-shelf', corner: 'books', from: 3, rect: [320, 148, 38, 48] },
  { id: 'chiku-lamp', corner: 'books', from: 4, rect: [240, 161, 16, 36] },
  { id: 'chiku-globe', corner: 'books', from: 5, rect: [260, 162, 16, 20] },
  { id: 'neem-platform', corner: 'tree', from: 0, rect: [150, 132, 60, 21] },
];

export interface LayoutB {
  /** CSS px per scene unit (the art is 360 units wide). */
  u: number;
  /** The art's height in scene units (the screen between the header and the tab bar). */
  height: number;
  dyWall: number; dyFront: number;
  /** The front row's foot (scene units), the centre of the 1.3x. */
  foot: number;
  /** The corner steps in force (CORNER_SHIFT unless a gate run overrides them). */
  shift?: Record<Corner, number>;
}

/**
 * The B layout for an art area `widthCss` × `heightCss` (between the header and the tab bar) whose bottom `cardCss` is
 * covered by the collapsed card: the front row's foot sits 12 units above the card, and the wall row sits so a stage-5
 * canopy (154 units above the coping, scaled) fits under the header.
 */
/** The stage-4 and stage-5 neem canopies above the coping, in scene units (132 - 137k at k 1.3 and 1.55, vs the coping at 74). */
export const CANOPY_4 = 137 * K_GROWTH[4] - 58, CANOPY_5 = 137 * K_GROWTH[5] - 58;
/** b2 (8 Nov): on short screens (aspect > 0.5, and the desktop frame) at most the top 20% of the stage-5 canopy may tuck under the header. */
export const SHORT_ASPECT = 0.5, CANOPY_TUCK = 0.2;
export function copingTop(short: boolean): number {
  return short ? Math.max(CANOPY_5 * B_SCALE * (1 - CANOPY_TUCK), CANOPY_4 * B_SCALE) : CANOPY_5 * B_SCALE + 14;
}

export function layoutB(widthCss: number, heightCss: number, cardCss: number, short = false): LayoutB {
  const u = widthCss / SCENE_W;
  const height = heightCss / u, card = cardCss / u;
  const dyFront = height - card - 12 - 200;
  const foot = dyFront + 200;
  const wallTop = copingTop(short);
  const dyWall = Math.round((wallTop - foot) / B_SCALE + foot - 74);
  return { u, height, dyWall, dyFront, foot };
}

/** A scene point of a corner, in the art's units after the row shift, the corner step and the 1.3x. */
export function place(layout: LayoutB, corner: Corner, x: number, y: number): [number, number] {
  const dy = CORNER_ROW[corner] === 'wall' ? layout.dyWall : layout.dyFront;
  const step = (layout.shift ?? CORNER_SHIFT)[corner];
  return [SCENE_W / 2 + (x + step - SCENE_W / 2) * B_SCALE, layout.foot + (y + dy - layout.foot) * B_SCALE];
}
/** A corner OBJECT's point: its corner's anchor spreads at 1.3x, the object itself at OBJECT_SCALE about that anchor. */
export function placeObject(layout: LayoutB, corner: Corner, x: number, y: number, scale = OBJECT_SCALE): [number, number] {
  const [ax, ay] = CORNER_ANCHOR[corner];
  const [px, py] = place(layout, corner, ax, ay);
  return [px + (x - ax) * scale, py + (y - ay) * scale];
}
export function placeRect(layout: LayoutB, corner: Corner, rect: Rect, scale = OBJECT_SCALE): Rect {
  const [x, y] = placeObject(layout, corner, rect[0], rect[1], scale);
  return [x, y, rect[2] * scale, rect[3] * scale];
}
/** The arched door is wall, not a corner object: it spreads and scales with the wall at 1.3x. */
export const DOOR: Rect = [94, 81, 42, 49];
/** b2 (8 Nov): the door and its toran take their own wall step (+21 units), so Mor's pots stay together on its left. */
export const doorRect = (layout: LayoutB): Rect => { const [x, y] = place(layout, 'door', DOOR[0], DOOR[1]); return [x, y, DOOR[2] * B_SCALE, DOOR[3] * B_SCALE]; };

/**
 * b2 (8 Nov, the beside rule by rule): which side of its things each friend stands on. Inner = toward the middle:
 * Mor and Kachhua to the right of their corners, Moti and Chiku to the left, Kapi to the right of his wall-top
 * puzzles; Nandi sits on his own mat (a floor mat, the one allowed contact with Kachhua's).
 */
export const BESIDE_SIDE: Record<AreaId, 'right' | 'left' | 'centre'> = { plan: 'right', sleep: 'right', remember: 'left', learn: 'left', mind: 'right', train: 'centre' };
/** Floor mats a friend may stand on (b2: only these; the cot, pillow and blanket are not). */
export const FLOOR_MATS: readonly string[] = ['nandi-mat', 'kachhua-mat'];
/** The gap between a friend's box and its things, in scene units (≤ 6 CSS on every gate size). */
export const BESIDE_GAP = 2;
/** Kapi stands on the wall top beside these (the stool, slate and kite are below or above him). */
const WALL_TOP: readonly string[] = ['kapi-cube', 'kapi-telescope'];

/**
 * A friend's sprite box in the art's units: `size` × 1.3 square, feet on its corner's floor line (SPOTS' feet; Kachhua
 * on the floor beside the cot, not on it). From stage 1 the friend stands just beside its things on the inner side, at
 * the current object scale, so it is recomputed per stage and never stands in front of them.
 */
export function friendBox(layout: LayoutB, area: AreaId, stage: number, objectScale = OBJECT_SCALE): Rect {
  const [x, feetRaw, size] = SPOTS[area](0);
  const feet = area === 'sleep' ? feetRaw : SPOTS[area](stage)[1];
  const corner = AREA_CORNER[area];
  const [cx, fy] = place(layout, corner, x, feet);
  const s = size * B_SCALE;
  const own = OBJECTS.filter(object => object.corner === corner && object.from <= stage && !FLOOR_MATS.includes(object.id) && (area !== 'mind' || WALL_TOP.includes(object.id)))
    .map(object => placeRect(layout, corner, object.rect, objectScale));
  const side = BESIDE_SIDE[area];
  if (!own.length || side === 'centre') return [cx - s / 2, fy - s * 0.95, s, s];
  const left = Math.min(...own.map(rect => rect[0])), right = Math.max(...own.map(rect => rect[0] + rect[2]));
  const bx = side === 'right' ? right + BESIDE_GAP : left - BESIDE_GAP - s;
  return [bx, fy - s * 0.95, s, s];
}

export interface ScreenChrome { header: number; tabBar: number; card: number }
/** Measured on the stage 1 build (360 px): the top bar, the tab bar and the collapsed card (handle + one next move). */
export const CHROME_CSS: ScreenChrome = { header: 64, tabBar: 67, card: 134 };

export interface StageOptions {
  chrome?: ScreenChrome;
  objectScale?: number;
  shift?: Partial<Record<Corner, number>>;
  /** Spec 660 (later): one friend steps toward the card by `dy` CSS px, holding something. Unused in stage 2; gated. */
  forward?: { area: AreaId; dy: number };
}

/** The B frame on a `width` × `height` screen: the full width up to aspect 0.6, else a 0.6 frame centred. */
export const FRAME_ASPECT = 0.6;
export function frameOf(width: number, height: number): { stageWidth: number; offsetX: number } {
  const stageWidth = width / height > FRAME_ASPECT ? height * FRAME_ASPECT : width;
  return { stageWidth, offsetX: (width - stageWidth) / 2 };
}

/** Everything the gate needs about one screen and stage, in screen CSS px. */
export interface StageGeometry {
  layout: LayoutB; offsetX: number; stageWidth: number; chrome: ScreenChrome; objectScale: number;
  friends: Record<AreaId, Rect>;
  objects: { id: string; corner: Corner; rect: Rect; wallRun: boolean }[];
  door: Rect;
}
export function stageGeometry(width: number, height: number, stage: number, options: StageOptions = {}): StageGeometry {
  const chrome = options.chrome ?? CHROME_CSS;
  const objectScale = options.objectScale ?? OBJECT_SCALE;
  const { stageWidth, offsetX } = frameOf(width, height);
  const art = height - chrome.header - chrome.tabBar;
  const layout: LayoutB = { ...layoutB(stageWidth, art, chrome.card, width / height > SHORT_ASPECT), shift: { ...CORNER_SHIFT, ...options.shift } };
  const css = (rect: Rect): Rect => [offsetX + rect[0] * layout.u, chrome.header + rect[1] * layout.u, rect[2] * layout.u, rect[3] * layout.u];
  const friends = {} as Record<AreaId, Rect>;
  for (const area of Object.keys(SPOTS) as AreaId[]) {
    const box = css(friendBox(layout, area, stage, objectScale));
    friends[area] = options.forward?.area === area ? [box[0], box[1] + options.forward.dy, box[2], box[3]] : box;
  }
  const objects = OBJECTS.filter(object => object.from <= stage).map(object => ({ id: object.id, corner: object.corner, rect: css(placeRect(layout, object.corner, object.rect, objectScale)), wallRun: !!object.wallRun }));
  return { layout, offsetX, stageWidth, chrome, objectScale, friends, objects, door: css(doorRect(layout)) };
}

/** The geometry in the painted pass's anchor shape (canvas px = CSS × 3, the frame only), for anchors.layoutProblems. */
export function stageAnchors(width: number, height: number, stage: number, options: StageOptions = {}): StageAnchors {
  const geometry = stageGeometry(width, height, stage, options);
  const { chrome, offsetX } = geometry;
  const px = (rect: Rect): Rect => [(rect[0] - offsetX) / CSS_PER_PX, rect[1] / CSS_PER_PX, rect[2] / CSS_PER_PX, rect[3] / CSS_PER_PX];
  const friends = {} as Record<FriendId, FriendAnchor>;
  for (const id of FRIEND_IDS) {
    const area = FRIEND_AREA[id] as AreaId;
    const tap = px(geometry.friends[area]);
    friends[id] = { area, foot: [tap[0] + tap[2] / 2, tap[1] + tap[3]], tap, glow: [tap[0], tap[1] + tap[3] - 48, tap[2], 48], scale: 1 };
  }
  const props: Record<string, Rect> = {};
  for (const object of geometry.objects) if (!object.wallRun) props[object.id] = px(object.rect);
  const art = height - chrome.header - chrome.tabBar;
  return { canvas: [geometry.stageWidth / CSS_PER_PX, height / CSS_PER_PX], headerBottom: chrome.header / CSS_PER_PX, cardTop: (chrome.header + art - chrome.card) / CSS_PER_PX, tabTop: (chrome.header + art) / CSS_PER_PX, friends, props };
}

const gap = (a: Rect, b: Rect) => Math.max(0, Math.max(a[0], b[0]) - Math.min(a[0] + a[2], b[0] + b[2]), Math.max(a[1], b[1]) - Math.min(a[1] + a[3], b[1] + b[3]));
const overlap = (a: Rect, b: Rect) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));

/** 6 Nov item 3 (courtyard-painted-pass-notes.md): these pairs must not touch at 1.3x. */
export const APART: readonly (readonly [string, string])[] = [['mor-pot-1', 'door'], ['mor-pot-2', 'door'], ['kachhua-cot', 'nandi-clubs'], ['moti-jars', 'kapi-stool']];
export const BESIDE_CSS = 6;
export const DOOR_CLEAR_CSS = 4;
export const CORNER_COVER = 0.15;

/**
 * The whole layout B gate for one screen and stage (empty = pass): anchors.layoutProblems (G-edge, taps, overlap,
 * header, card), the beside rule (each friend within 6 CSS of its own things and never over them, floor mats excepted),
 * G-corner (a friend's box covers at most 15% of any other corner's object) and the item 3 pairs at 0 px.
 * Friend boxes are the sprites' square boxes, so coverage is an upper bound on the real alpha.
 */
export function courtyardProblems(width: number, height: number, stage: number, options: StageOptions = {}): string[] {
  const geometry = stageGeometry(width, height, stage, options);
  const out = layoutProblems(stageAnchors(width, height, stage, options), geometry.stageWidth, height);
  for (const area of Object.keys(geometry.friends) as AreaId[]) {
    const box = geometry.friends[area];
    const own = geometry.objects.filter(object => object.corner === AREA_CORNER[area]);
    if (own.length) {
      const nearest = Math.min(...own.map(object => gap(box, object.rect)));
      if (nearest > BESIDE_CSS) out.push(`${area}: ${nearest.toFixed(1)} px from its own things (beside rule <= ${BESIDE_CSS})`);
    }
    for (const object of own) if (!FLOOR_MATS.includes(object.id) && overlap(box, object.rect) > 0) out.push(`${area}: over its own ${object.id}`);
    for (const object of geometry.objects) {
      if (object.corner === AREA_CORNER[area] || object.wallRun) continue;
      const cover = overlap(box, object.rect) / (object.rect[2] * object.rect[3]);
      if (cover > CORNER_COVER) out.push(`${area}: covers ${(cover * 100).toFixed(0)}% of ${object.id}`);
    }
  }
  const rect = (id: string) => id === 'door' ? geometry.door : geometry.objects.find(object => object.id === id)?.rect;
  for (const [a, b] of APART) {
    const ra = rect(a), rb = rect(b);
    if (!ra || !rb) continue;
    // b2: pot-2 keeps at least 4 CSS clear of the door; the other item 3 pairs only must not touch.
    const need = b === 'door' ? DOOR_CLEAR_CSS : 0;
    if (overlap(ra, rb) > 0 || gap(ra, rb) < need) out.push(`${a} touches ${b}${need ? ` (${gap(ra, rb).toFixed(1)} < ${need} px clear)` : ''}`);
  }
  return out;
}
