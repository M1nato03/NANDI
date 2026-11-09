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
 * The 9 Nov hotfix (b2 + a9, support.ts): the pass's wall-top ledge and side wall are not in the flat scene, so the
 * things that stood on them are placed again in canvas CSS. Kapi's puzzles stand on the coping top on his right, the
 * cube in front, the slate and the telescope behind it and the board (his right is the only free coping, ≥ 16 CSS
 * inside the edge). Mor's garden stands at the wall foot (the door's base line) left of the door: the bed against the
 * wall with pot 2 at its end and the trellis on the wall over it. There is no room for Mor beside them at the wall
 * (69 CSS between the edge rule and the door, ~92 needed), so Mor steps forward and right, and pot 1 (his stage-1
 * thing) stands on the floor at his side, the bird bath in front of the bed. Moti's chest and Kachhua's mat move
 * 2-3 CSS toward them (s1 beside rule, measured offline). Moti's frame hangs on a nail on the wall face, clear of the swing; his bulbs hang
 * from the coping's foot.
 */
export const LAYOUT_B_PLACES_CSS: Record<string, Rect> = {
  'kapi-wall-puzzle': [300, 287, 19, 19],
  'kapi-slate': [313.5, 293, 13, 13],
  'kapi-flat-board-game': [321, 300, 22, 6],
  'kapi-telescope': [325, 282, 17, 24],
  'mor-pot-2': [17, 351, 21, 35],
  'mor-pot-1': [38, 392, 21, 35],
  'mor-marigold-bed': [16, 375.5, 46, 9.5],
  'mor-trellis-creeper': [16, 336, 46, 28],
  'mor-birdbath-water': [17, 427, 20, 10],
  'moti-chest': [267.4, 402, 25, 16.5],
  'moti-picture-frame': [246, 352, 24, 26],
  'moti-bulbs-small-photos': [288, 314.5, 56, 10.6],
  'kachhua-sleeping-mat': [31.6, 489.8, 61.2, 8.66],
  'chiku-reading-mat': [262, 498.5, 27, 4],
};
export const LAYOUT_B_NUDGES: AnchorNudges = {
  friends: { kachhua: [-30, 0], chiku: [-10, 0], mor: [120, 137] },
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
