import type { FriendId, Point, Rect, StageAnchors } from './anchors';

/**
 * Layout-B nudges on top of the painted pass, in canvas px (1080 wide; 3 px = 1 CSS px at 360). b2 9 Nov, from a9's
 * stage-2 shot review: Jenil's beside rule stays at ≤ 6 px, so the friends move toward their own things instead of the
 * rule relaxing. Measured on the real sprites by the shots' alpha check (alpha-report.json "gaps"), before:
 * Kachhua 13.5 px from its sleeping mat, Chiku 8.0 px from its bookshelf, Kapi 8 px over its kite.
 * The pass file stays as Codex wrote it; a new pass is checked against these again by the same alpha check.
 */
export interface AnchorNudges {
  friends: Partial<Record<FriendId, Point>>; props: Record<string, Point>;
  /** Props placed again outright (canvas CSS, 360 wide), added when the pass has no such prop. */
  places?: Record<string, Rect>;
}
/**
 * The 9 Nov hotfix with b2's 10 Nov ruling (support.ts): every prop keeps its 9q spot. What changes for the flat scene:
 * Kapi's puzzles keep their 9q x but stand on the flat coping's top (9q's feet are at its foot, ~8 CSS lower), the
 * cube at ≥ 18 CSS; Mor's planter shelf is drawn on the wall face under the 9q pots and bed (top ≈ 339.5), with the
 * trellis standing in it; Chiku's reading mat is new (9q has nothing for his s1 book). Moti's chest and Kachhua's mat
 * move 1.5-3 CSS toward their friends (the s1 beside rule, measured), and the kite 3 CSS off Kapi.
 */
export const LAYOUT_B_PLACES_CSS: Record<string, Rect> = {
  'kapi-wall-puzzle': [193, 287, 19, 19],
  'kapi-flat-board-game': [203.7, 298.1, 27.7, 7.9],
  'kapi-telescope': [221, 283.5, 17.8, 22.5],
  'kapi-slate': [236, 291.8, 13, 14.2],
  'mor-planter-shelf': [16, 339.5, 68, 9],
  'mor-trellis-creeper': [22, 307.2, 54, 32.3],
  'moti-chest': [267.4, 402, 25, 16.5],
  'kachhua-sleeping-mat': [31.6, 489.8, 61.2, 8.66],
  'chiku-reading-mat': [262, 498.5, 27, 4],
};
export const LAYOUT_B_NUDGES: AnchorNudges = {
  friends: { kachhua: [-30, 0], chiku: [-10, 0] },
  props: { 'kapi-kite': [9, 0] },
  places: Object.fromEntries(Object.entries(LAYOUT_B_PLACES_CSS).map(([name, rect]) => [name, rect.map(value => value * 3) as unknown as Rect])),
};

const moveRect = (rect: Rect, [dx, dy]: Point): Rect => [rect[0] + dx, rect[1] + dy, rect[2], rect[3]];
const movePoint = (point: Point, [dx, dy]: Point): Point => [point[0] + dx, point[1] + dy];

/** The anchors with each nudged friend (foot, tap and glow together) and prop moved, and each placed prop set; nothing else changes. */
export function nudgeAnchors(anchors: StageAnchors, nudges: AnchorNudges = LAYOUT_B_NUDGES): StageAnchors {
  const friends = { ...anchors.friends };
  for (const [id, by] of Object.entries(nudges.friends) as [FriendId, Point][]) {
    const friend = friends[id];
    friends[id] = { ...friend, foot: movePoint(friend.foot, by), tap: moveRect(friend.tap, by), glow: moveRect(friend.glow, by) };
  }
  const props = { ...anchors.props };
  for (const [name, by] of Object.entries(nudges.props)) if (props[name]) props[name] = moveRect(props[name], by);
  for (const [name, rect] of Object.entries(nudges.places ?? {})) props[name] = rect;
  return { ...anchors, friends, props };
}
