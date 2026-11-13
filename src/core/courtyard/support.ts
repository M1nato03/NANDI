import type { AreaId } from './courtyard';
import type { Rect } from './anchors';
import { K_GROWTH } from './layoutB';

/**
 * Spec 571 hotfix (b2 + a9, 9 Nov; Jenil: "the rubiks cube is glitched, the vase is hanging mid air, the book is just
 * lying there"). Layout B puts today's flat parts into the painted pass's prop rects, but the pass has a wall-top ledge
 * and a side wall that the flat scene does not: so every part says what it stands on, and the flat scene draws what
 * holds it. b2's ruling (10 Nov): every prop keeps its 9q painted spot, so the code and a later painted swap agree;
 * the flat scene adds Mor's planter shelf on the wall face and lifts the coping things onto the flat coping's top
 * (nudges.ts LAYOUT_B_NUDGES.places), and the young neem's crown keeps clear of Kapi's things (crownFit).
 *
 * Canvas CSS (360 wide; the anchor file's px / 3). The flat scene's lines: the coping's top (things on the wall top
 * stand here), the coping's foot (the wall face starts), and the wall's foot (9q's floor line; floor things stand at
 * or below it).
 */
export const LINES = { coping: 305, wallTop: 314.3, wallFoot: 370 } as const;

/** What a part stands on: the floor, the coping top, the wall face (hung), another part, or nothing (the kite flies). */
export type Support = 'floor' | 'coping' | 'wall' | 'air' | { on: string } | { hangs: string };

/** Every part's support, by prop (the gate checks each against its line at every stage). */
export const SUPPORT: Readonly<Record<string, Support>> = {
  'mor-planter-shelf': 'wall', 'mor-pot-1': { on: 'mor-planter-shelf' }, 'mor-pot-2': { on: 'mor-planter-shelf' },
  'mor-marigold-bed': { on: 'mor-planter-shelf' }, 'mor-trellis-creeper': { on: 'mor-planter-shelf' }, 'mor-birdbath-water': 'floor',
  'moti-chest': 'floor', 'moti-picture-frame': 'wall', 'moti-shelf-three-jars': 'wall', 'moti-brass-trunk': 'floor', 'moti-bulbs-small-photos': 'wall',
  'kapi-wall-puzzle': 'coping', 'kapi-flat-board-game': 'coping', 'kapi-kite': 'air', 'kapi-telescope': 'coping', 'kapi-slate': 'coping',
  'nandi-mat': 'floor', 'nandi-clubs': 'floor', 'nandi-dumbbells': 'floor', 'nandi-wooden-gym-frame': 'floor', 'nandi-medals': { hangs: 'nandi-wooden-gym-frame' },
  'kachhua-sleeping-mat': 'floor', 'kachhua-pillow': 'floor', 'kachhua-charpai': 'floor', 'kachhua-standing-lantern': 'floor', 'kachhua-blanket': 'floor',
  'chiku-reading-mat': 'floor', 'chiku-open-book': { on: 'chiku-reading-mat' }, 'chiku-book-stack': 'floor', 'chiku-bookshelf': 'floor',
  'chiku-reading-lamp': 'floor', 'chiku-globe': 'floor',
};

/**
 * Draw order: parts draw back to front by foot, plus this bias (CSS). The planter shelf and the trellis in it go behind
 * the pots and the bed; on the coping the telescope and the slate stand behind the board, the board behind the cube.
 */
export const DEPTH: Readonly<Record<string, number>> = { 'mor-planter-shelf': -40, 'mor-trellis-creeper': -20, 'kapi-telescope': -1, 'kapi-slate': -1, 'kapi-flat-board-game': -0.5 };
export const drawFoot = (prop: string, rect: Rect) => rect[1] + rect[3] + (DEPTH[prop] ?? 0);

/**
 * b2 pick 1 (10 Nov): at Kapi's first two stages his cube and board sit in the 9q spots nearest him (the slate's and
 * the telescope's), so he is beside them; from s3 each takes its own 9q spot. Canvas CSS, feet on the coping top.
 */
export const KAPI_EARLY = {
  cube: [238.5, 287, 19, 19] as Rect,
  board: [216, 298.1, 27.7, 7.9] as Rect,
} as const;

/**
 * a9's s1 note: the open book lies alone on the floor, so at Chiku's first two stages his things sit at his feet: the
 * book on a small reading mat (s1), then the stack on the mat with the book on top (s2). From s3 the stack stands where
 * the pass puts it and the book lies on it; the mat goes with the shelf's arrival. Canvas CSS.
 */
export const CHIKU_EARLY = {
  mat: [262, 498.5, 27, 4] as Rect,
  book: [263.5, 492.5, 24, 6] as Rect,
  stack: [262.5, 482, 25.5, 16.5] as Rect,
  bookOnStack: [264, 476, 22, 6] as Rect,
} as const;

/**
 * A part's rect and support at a stage; `props` is every placed prop (canvas CSS), `null` when the prop is not drawn
 * then (the reading mat after s2).
 */
export function placeAt(prop: string, props: Readonly<Record<string, Rect>>, stage: (area: AreaId) => number): { rect: Rect; support: Support } | null {
  const learn = stage('learn');
  const support = SUPPORT[prop] ?? 'floor';
  const rect = props[prop];
  if (prop === 'chiku-reading-mat') return learn <= 2 ? { rect: CHIKU_EARLY.mat, support } : null;
  if (!rect) return null;
  if (prop === 'chiku-open-book') {
    if (learn <= 1) return { rect: CHIKU_EARLY.book, support: { on: 'chiku-reading-mat' } };
    if (learn === 2) return { rect: CHIKU_EARLY.bookOnStack, support: { on: 'chiku-book-stack' } };
    const stack = props['chiku-book-stack'];
    if (!stack) return { rect, support: 'floor' };
    // From s3 the book lies on the pass's stack, centred, its foot on the stack's top.
    const w = Math.min(rect[2], stack[2] - 3), h = rect[3] * (w / rect[2]);
    return { rect: [stack[0] + (stack[2] - w) / 2, stack[1] - h, w, h], support: { on: 'chiku-book-stack' } };
  }
  if (prop === 'chiku-book-stack' && learn === 2) return { rect: CHIKU_EARLY.stack, support: { on: 'chiku-reading-mat' } };
  // J1/J2 (a9 13 Nov): the picture frame hangs 22 px up the wall face; the jar shelf sits 6 px higher on it.
  if (prop === 'moti-picture-frame') return { rect: [rect[0], rect[1] - 22, rect[2], rect[3]], support };
  if (prop === 'moti-shelf-three-jars') return { rect: [rect[0], rect[1] - 6, rect[2], rect[3]], support };
  if (prop === 'kapi-wall-puzzle' && stage('mind') <= 2) return { rect: KAPI_EARLY.cube, support };
  if (prop === 'kapi-flat-board-game' && stage('mind') <= 2) return { rect: KAPI_EARLY.board, support };
  return { rect, support };
}

const bottom = (rect: Rect) => rect[1] + rect[3];

/**
 * The support rule on rects (the shots' alpha check repeats it on pixels): each part's foot within 2 CSS of the floor
 * (at or below the wall foot), the coping top, or the top of the part it stands on; a hung part wholly inside the
 * wall-face band; a hanging part's top inside its host. Empty = pass.
 */
export const SUPPORT_TOLERANCE = 2;
export function supportProblems(placed: readonly { prop: string; rect: Rect; support: Support }[]): string[] {
  const out: string[] = [];
  const byProp = new Map(placed.map(row => [row.prop, row]));
  const t = SUPPORT_TOLERANCE;
  for (const { prop, rect, support } of placed) {
    const foot = bottom(rect);
    if (support === 'floor') { if (foot < LINES.wallFoot - t) out.push(`${prop}: foot ${foot.toFixed(1)} is above the floor (${LINES.wallFoot})`); }
    else if (support === 'coping') { if (Math.abs(foot - LINES.coping) > t) out.push(`${prop}: foot ${foot.toFixed(1)} is not on the coping top (${LINES.coping})`); }
    else if (support === 'wall') { if (rect[1] < LINES.wallTop - t || foot > LINES.wallFoot + t) out.push(`${prop}: ${rect[1].toFixed(1)}..${foot.toFixed(1)} is outside the wall face (${LINES.wallTop}..${LINES.wallFoot})`); }
    else if (support === 'air') continue;
    else if ('on' in support) {
      const host = byProp.get(support.on);
      if (!host) out.push(`${prop}: stands on ${support.on}, which is not drawn`);
      else if (Math.abs(foot - host.rect[1]) > t) out.push(`${prop}: foot ${foot.toFixed(1)} is not on ${support.on}'s top (${host.rect[1].toFixed(1)})`);
    } else {
      const host = byProp.get(support.hangs);
      if (!host) out.push(`${prop}: hangs on ${support.hangs}, which is not drawn`);
      else if (rect[1] < host.rect[1] - t || rect[1] > bottom(host.rect)) out.push(`${prop}: does not hang from ${support.hangs}`);
    }
  }
  return out;
}

/**
 * The neem as layout B draws it (Scene.tsx Tree at TREE_SCALE about TREE_AT): the crown's leaves in the tree's own
 * units, and the growth per tree stage. Layout B's canvas point of a tree point (x, y) at growth k, before any fit:
 * x' = TREE_AT.x + TREE_SCALE·k·(x − 180), y' = TREE_AT.y − 132·TREE_SCALE + TREE_SCALE·(140 + (y − 140)·k − 8).
 */
export const TREE_AT: readonly [number, number] = [180, 377];
export const TREE_SCALE = 1.3;
/** A crown clump: centre, radius (tree units) and tone (0 leaf, 1 dark, 2 light). */
export type Leaf = readonly [number, number, number, 0 | 1 | 2];
export const NEEM_LEAVES: readonly Leaf[] = [
  [180, 46, 30, 0], [148, 60, 24, 1], [212, 60, 24, 1], [162, 30, 21, 2], [200, 28, 21, 0], [134, 80, 16, 0], [226, 80, 16, 0], [180, 70, 22, 2], [180, 18, 15, 2],
];
/**
 * a9 (10 Nov): the stage-2 neem is s1's clumped crown at ×1.15, made asymmetric (the right-most low clump dropped, the
 * right ones shrunk, one added low on the left), so it stays round and clear of Kapi's s2 board with no lift.
 */
export const NEEM_LEAVES_YOUNG: readonly Leaf[] = [
  [180, 46, 30, 0], [148, 60, 24, 1], [200, 62, 18, 1], [162, 30, 21, 2], [198, 28, 18, 0], [134, 80, 16, 0], [124, 70, 17, 1], [180, 70, 22, 2], [180, 18, 15, 2],
];
export const NEEM_GROWTH = K_GROWTH;
/** The crown each tree stage draws: its clumps and its growth. */
export function crownShape(treeStage: number): { leaves: readonly Leaf[]; k: number } {
  return treeStage === 2 ? { leaves: NEEM_LEAVES_YOUNG, k: K_GROWTH[1] * 1.15 } : { leaves: NEEM_LEAVES, k: K_GROWTH[treeStage] ?? 1 };
}
/** How far the crown stays above Kapi's things (a9: ≥ 6 CSS). */
export const CROWN_CLEAR = 6;

const leafOnCanvas = (k: number, [x, y, r]: Leaf, lift = 0) => ({
  cx: TREE_AT[0] + TREE_SCALE * k * (x - 180), cy: TREE_AT[1] - 132 * TREE_SCALE + TREE_SCALE * (140 + (y - 140) * k - 8) - lift, r: TREE_SCALE * k * r,
});
/** The lowest crown point over [x0, x1] (canvas CSS) for a tree stage and a lift. */
export function crownBottom(treeStage: number, x0: number, x1: number, lift = 0): number {
  const { leaves, k } = crownShape(treeStage);
  let bottom = -Infinity;
  for (const leaf of leaves) {
    const { cx, cy, r } = leafOnCanvas(k, leaf, lift);
    for (let i = 0; i <= 40; i++) {
      const dx = Math.abs(x0 + (i * (x1 - x0)) / 40 - cx);
      if (dx < r) bottom = Math.max(bottom, cy + Math.sqrt(r * r - dx * dx));
    }
  }
  return bottom;
}
/** The crown's box (canvas CSS, before any lift): [left, top, right, bottom]. */
export function crownBox(treeStage: number): [number, number, number, number] {
  const { leaves, k } = crownShape(treeStage);
  const circles = leaves.map(leaf => leafOnCanvas(k, leaf));
  return [Math.min(...circles.map(c => c.cx - c.r)), Math.min(...circles.map(c => c.cy - c.r)), Math.max(...circles.map(c => c.cx + c.r)), Math.max(...circles.map(c => c.cy + c.r))];
}

/** Kapi's coping things that can stand under a tree of this stage: his things at every stage up to it (his days never outnumber the tree's). */
function kapiThingsUpTo(treeStage: number, props: Readonly<Record<string, Rect>>): Rect[] {
  const out: Rect[] = [];
  const coping = ['kapi-wall-puzzle', 'kapi-flat-board-game', 'kapi-telescope', 'kapi-slate'];
  const from: Record<string, number> = { 'kapi-wall-puzzle': 1, 'kapi-flat-board-game': 2, 'kapi-telescope': 4, 'kapi-slate': 5 };
  for (let mind = 1; mind <= treeStage; mind++) for (const prop of coping) {
    if (mind < from[prop]!) continue;
    const at = placeAt(prop, props, area => area === 'mind' ? mind : treeStage);
    if (at) out.push(at.rect);
  }
  return out;
}

/**
 * b2 (10 Nov): the flat crown keeps CROWN_CLEAR above Kapi's things, only over the span they take. Young trees
 * (stages 1-2) have a crown that stays clear without a lift (a9: no bare pole); an older one is lifted on its trunk by
 * what is needed. Canvas CSS.
 */
export function crownFit(treeStage: number, props: Readonly<Record<string, Rect>>): { lift: number } {
  const things = kapiThingsUpTo(treeStage, props);
  const need = Math.max(0, ...things.map(([x, y, w]) => crownBottom(treeStage, x, x + w) - (y - CROWN_CLEAR)));
  return { lift: Math.ceil(need * 10) / 10 };
}
