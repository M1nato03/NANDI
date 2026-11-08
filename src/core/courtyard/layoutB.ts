import type { AreaId } from './courtyard';
import { CSS_PER_PX, FRIEND_AREA, FRIEND_IDS, type FriendAnchor, type FriendId, type Rect, type StageAnchors } from './anchors';

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

export type Corner = 'garden' | 'keep' | 'puzzles' | 'gym' | 'rest' | 'books' | 'tree';
export type Row = 'wall' | 'front';
/** How far each side corner steps in (scene units, before the 1.3x), so nothing crops at the sides. */
export const CORNER_SHIFT: Record<Corner, number> = { garden: 40, keep: -40, puzzles: -10, gym: 0, rest: 32, books: -32, tree: 0 };
export const CORNER_ROW: Record<Corner, Row> = { garden: 'wall', keep: 'wall', puzzles: 'wall', tree: 'wall', gym: 'front', rest: 'front', books: 'front' };
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
}

/**
 * The B layout for an art area `widthCss` × `heightCss` (between the header and the tab bar) whose bottom `cardCss` is
 * covered by the collapsed card: the front row's foot sits 12 units above the card, and the wall row sits so a stage-5
 * canopy (154 units above the coping, scaled) fits under the header.
 */
export function layoutB(widthCss: number, heightCss: number, cardCss: number): LayoutB {
  const u = widthCss / SCENE_W;
  const height = heightCss / u, card = cardCss / u;
  const dyFront = height - card - 12 - 200;
  const foot = dyFront + 200;
  const wallTop = 154 * B_SCALE + 14;
  const dyWall = Math.round((wallTop - foot) / B_SCALE + foot - 74);
  return { u, height, dyWall, dyFront, foot };
}

/** A scene point of a corner, in the art's units after the row shift, the corner step and the 1.3x. */
export function place(layout: LayoutB, corner: Corner, x: number, y: number): [number, number] {
  const dy = CORNER_ROW[corner] === 'wall' ? layout.dyWall : layout.dyFront;
  return [SCENE_W / 2 + (x + CORNER_SHIFT[corner] - SCENE_W / 2) * B_SCALE, layout.foot + (y + dy - layout.foot) * B_SCALE];
}
export function placeRect(layout: LayoutB, corner: Corner, rect: Rect): Rect {
  const [x, y] = place(layout, corner, rect[0], rect[1]);
  return [x, y, rect[2] * B_SCALE, rect[3] * B_SCALE];
}

/** A friend's sprite box in the art's units: `size` wide and tall, feet at the bottom (as Courtyard.tsx draws them). */
export function friendBox(layout: LayoutB, area: AreaId, stage: number): Rect {
  const [x, feet, size] = SPOTS[area](stage);
  const [cx, fy] = place(layout, AREA_CORNER[area], x, feet);
  const s = size * B_SCALE;
  return [cx - s / 2, fy - s * 0.95, s, s];
}

export interface ScreenChrome { header: number; tabBar: number; card: number }
/** Measured on the stage 1 build (360 px): the top bar, the tab bar and the collapsed card (handle + one next move). */
export const CHROME_CSS: ScreenChrome = { header: 64, tabBar: 67, card: 134 };

/**
 * The layout on a `width` × `height` CSS screen at `stage` (every corner at that stage), in the painted pass's anchor
 * shape (canvas px = CSS × 3, nothing cropped), so anchors.layoutProblems gates it.
 */
export function stageAnchors(width: number, height: number, stage: number, chrome: ScreenChrome = CHROME_CSS): StageAnchors {
  const art = height - chrome.header - chrome.tabBar;
  const layout = layoutB(width, art, chrome.card);
  const px = (rect: Rect): Rect => [rect[0] * layout.u / CSS_PER_PX, (chrome.header + rect[1] * layout.u) / CSS_PER_PX, rect[2] * layout.u / CSS_PER_PX, rect[3] * layout.u / CSS_PER_PX];
  const friends = {} as Record<FriendId, FriendAnchor>;
  for (const id of FRIEND_IDS) {
    const area = FRIEND_AREA[id] as AreaId;
    const tap = px(friendBox(layout, area, stage));
    friends[id] = { area, foot: [tap[0] + tap[2] / 2, tap[1] + tap[3]], tap, glow: [tap[0], tap[1] + tap[3] - 16, tap[2], 16], scale: 1 };
  }
  const props: Record<string, Rect> = {};
  for (const object of OBJECTS) if (object.from <= stage && !object.wallRun) props[object.id] = px(placeRect(layout, object.corner, object.rect));
  return { canvas: [width / CSS_PER_PX, height / CSS_PER_PX], headerBottom: chrome.header / CSS_PER_PX, cardTop: (chrome.header + art - chrome.card) / CSS_PER_PX, tabTop: (chrome.header + art) / CSS_PER_PX, friends, props };
}
