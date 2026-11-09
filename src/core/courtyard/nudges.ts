import type { FriendId, Point, Rect, StageAnchors } from './anchors';

/**
 * Layout-B nudges on top of the painted pass, in canvas px (1080 wide; 3 px = 1 CSS px at 360). b2 9 Nov, from a9's
 * stage-2 shot review: Jenil's beside rule stays at ≤ 6 px, so the friends move toward their own things instead of the
 * rule relaxing. Measured on the real sprites by the shots' alpha check (alpha-report.json "gaps"), before:
 * Kachhua 13.5 px from its sleeping mat, Chiku 8.0 px from its bookshelf, Kapi 8 px over its kite.
 * The pass file stays as Codex wrote it; a new pass is checked against these again by the same alpha check.
 */
export interface AnchorNudges { friends: Partial<Record<FriendId, Point>>; props: Record<string, Point> }
export const LAYOUT_B_NUDGES: AnchorNudges = {
  friends: { kachhua: [-30, 0], chiku: [-10, 0] },
  props: { 'kapi-kite': [6, 0] },
};

const moveRect = (rect: Rect, [dx, dy]: Point): Rect => [rect[0] + dx, rect[1] + dy, rect[2], rect[3]];
const movePoint = (point: Point, [dx, dy]: Point): Point => [point[0] + dx, point[1] + dy];

/** The anchors with each nudged friend (foot, tap and glow together) and prop moved; nothing else changes. */
export function nudgeAnchors(anchors: StageAnchors, nudges: AnchorNudges = LAYOUT_B_NUDGES): StageAnchors {
  const friends = { ...anchors.friends };
  for (const [id, by] of Object.entries(nudges.friends) as [FriendId, Point][]) {
    const friend = friends[id];
    friends[id] = { ...friend, foot: movePoint(friend.foot, by), tap: moveRect(friend.tap, by), glow: moveRect(friend.glow, by) };
  }
  const props = { ...anchors.props };
  for (const [name, by] of Object.entries(nudges.props)) if (props[name]) props[name] = moveRect(props[name], by);
  return { ...anchors, friends, props };
}
