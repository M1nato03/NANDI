import { describe, expect, it } from 'vitest';
import raw from './anchors.json';
import { FRIEND_IDS, parseAnchors, stepForward, type Rect, type StageAnchors } from '../../core/courtyard/anchors';
import { nudgeAnchors } from '../../core/courtyard/nudges';
import { LINES, placeAt, TREE_AT, TREE_SCALE } from '../../core/courtyard/support';
import { PATH_LINE, PATH_STONES, pathStones, STONE_RX, STONE_RY, TRACK_HALF } from '../../core/quests660/path';
import { PROP_PARTS } from './layoutBParts';
import { DOOR_RECT } from './LayoutBScene';
import { FORWARD_DY } from './questArt';

// Spec 660 §7 (a9's art checks): every stone and the track rest ON the floor, clear of every part at s1-s5, the door's
// step, the neem's platform and every friend (standing, and the quest friend stepped forward); the stones never shrink.
const anchors = nudgeAnchors(parseAnchors(raw));
const cssRect = (rect: Rect): Rect => [rect[0] / 3, rect[1] / 3, rect[2] / 3, rect[3] / 3];
const propsCss = Object.fromEntries(Object.entries(anchors.props).map(([name, rect]) => [name, cssRect(rect)]));
/** The neem's chabutra in canvas CSS (Scene.tsx Tree: x 150..210, y 134..153, scaled about TREE_AT). */
const tree = (x: number, y: number): [number, number] => [TREE_AT[0] + TREE_SCALE * (x - 180), TREE_AT[1] - 132 * TREE_SCALE + TREE_SCALE * y];
const [px0, py0] = tree(150, 133), [px1, py1] = tree(210, 153);
const PLATFORM: Rect = [px0, py0, px1 - px0, py1 - py0];
const STEP: Rect = [DOOR_RECT[0] - 4, DOOR_RECT[1] + DOOR_RECT[3] - 2.5, DOOR_RECT[2] + 8, 5];
/** A friend's drawn sprite (LayoutBScene: width = tap height, top = foot − 0.95 × size) and its tap, in canvas CSS. */
function friendRects(at: StageAnchors): [string, Rect][] {
  return FRIEND_IDS.flatMap(id => {
    const friend = at.friends[id], tap = cssRect(friend.tap), [fx, fy] = [friend.foot[0] / 3, friend.foot[1] / 3], size = tap[3];
    return [[`${id} sprite`, [fx - size / 2, fy - size * 0.95, size, size * 0.95] as Rect], [`${id} tap`, tap]] as [string, Rect][];
  });
}
function obstacles(stage: number, at: StageAnchors = anchors): [string, Rect][] {
  const parts = PROP_PARTS.filter(row => stage >= row.from && (row.until === undefined || stage <= row.until))
    .flatMap(row => { const placed = placeAt(row.prop, propsCss, () => stage); return placed ? [[row.prop, placed.rect] as [string, Rect]] : []; });
  return [...parts, ['door step', STEP], ['neem platform', PLATFORM], ...friendRects(at)];
}
const hits = (a: Rect, b: Rect, gap = 1) => a[0] < b[0] + b[2] + gap && b[0] < a[0] + a[2] + gap && a[1] < b[1] + b[3] + gap && b[1] < a[1] + a[3] + gap;
const stoneRect = (x: number, y: number): Rect => [x - STONE_RX, y - STONE_RY, STONE_RX * 2, STONE_RY * 2];
/** The track sampled every 2 CSS along its centre line, each sample a square of the track's width. */
const trackSamples = (): Rect[] => PATH_LINE.slice(1).flatMap((to, i) => {
  const from = PATH_LINE[i]!, steps = Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / 2);
  return Array.from({ length: steps + 1 }, (_, k) => { const x = from[0] + (to[0] - from[0]) * k / steps, y = from[1] + (to[1] - from[1]) * k / steps; return [x - TRACK_HALF * 0.7, y - TRACK_HALF * 0.7, TRACK_HALF * 1.4, TRACK_HALF * 1.4] as Rect; });
});

describe('quest stones on the courtyard path (§7)', () => {
  it('every slot rests on the floor and is clear of every part, the step, the platform and the friends at s1-s5', () => {
    for (const stage of [1, 2, 3, 4, 5]) for (const stone of pathStones(PATH_STONES)) {
      expect(stone.y - STONE_RY, `slot ${stone.index} above the floor`).toBeGreaterThan(LINES.wallFoot);
      for (const [name, rect] of obstacles(stage)) expect(hits(stoneRect(stone.x, stone.y), rect), `s${stage} slot ${stone.index} under ${name}`).toBe(false);
    }
  });

  it('the stepped-forward quest friend keeps clear of the stones too (each friend, s5)', () => {
    for (const id of FRIEND_IDS) {
      const at = stepForward(anchors, id, FORWARD_DY[id]);
      for (const stone of pathStones(PATH_STONES)) for (const [name, rect] of friendRects(at)) expect(hits(stoneRect(stone.x, stone.y), rect), `${id} forward: slot ${stone.index} under ${name}`).toBe(false);
    }
  });

  it('the worn track is clear of every part at s1-s5 (the door step it leaves from aside)', () => {
    for (const stage of [1, 2, 3, 4, 5]) for (const sample of trackSamples()) for (const [name, rect] of obstacles(stage)) {
      if (name === 'door step') continue;
      expect(hits(sample, rect, 0), `s${stage} track under ${name} at ${sample[0].toFixed(0)},${sample[1].toFixed(0)}`).toBe(false);
    }
  });

  it('no two stones overlap, and 3 / 10 / 30 lay that many from the door', () => {
    const all = pathStones(PATH_STONES);
    // Equal axis-aligned ellipses are circles after scaling x by 1/rx and y by 1/ry: apart when the centres are ≥ 2 apart
    // (2.2 keeps a visible joint between them).
    const apart = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot((a.x - b.x) / STONE_RX, (a.y - b.y) / STONE_RY);
    for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) expect(apart(all[a]!, all[b]!), `${a} and ${b}`).toBeGreaterThanOrEqual(2.2);
    expect(pathStones(3).map(stone => stone.row)).toEqual([0, 0, 0]);
    expect(pathStones(10)).toHaveLength(10);
    expect(pathStones(30)).toHaveLength(30);
  });

  it('never shrinks: n + 1 keeps every stone of n where it was, and past 30 polishes instead of removing', () => {
    for (let n = 0; n < 70; n++) {
      const now = pathStones(n), next = pathStones(n + 1);
      expect(next.length).toBeGreaterThanOrEqual(now.length);
      now.forEach((stone, i) => { expect(next[i]!.x).toBe(stone.x); expect(next[i]!.y).toBe(stone.y); if (stone.polished) expect(next[i]!.polished).toBe(true); });
    }
    expect(pathStones(31).filter(stone => stone.polished)).toHaveLength(1);
    expect(pathStones(500)).toHaveLength(PATH_STONES);
  });
});
