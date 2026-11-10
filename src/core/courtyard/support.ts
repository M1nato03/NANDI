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
  'moti-chest': 'floor', 'moti-picture-frame': 'floor', 'moti-shelf-three-jars': 'wall', 'moti-brass-trunk': 'floor', 'moti-bulbs-small-photos': 'wall',
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
export const NEEM_LEAVES: readonly (readonly [number, number, number])[] = [
  [180, 46, 30], [148, 60, 24], [212, 60, 24], [162, 30, 21], [200, 28, 21], [134, 80, 16], [226, 80, 16], [180, 70, 22], [180, 18, 15],
];
export const NEEM_GROWTH = K_GROWTH;
/** How far the crown stays above Kapi's things (a9: ≥ 6 CSS), and how narrow a young crown may get. */
export const CROWN_CLEAR = 6, CROWN_MIN_NARROW = 0.55;

/** The lowest crown point over [x0, x1] (canvas CSS), for growth k, a horizontal squeeze about the trunk and a lift. */
export function crownBottom(k: number, x0: number, x1: number, narrow = 1, lift = 0): number {
  let bottom = -Infinity;
  for (const [x, y, r] of NEEM_LEAVES) {
    const cx = TREE_AT[0] + TREE_SCALE * k * narrow * (x - 180);
    const cy = TREE_AT[1] - 132 * TREE_SCALE + TREE_SCALE * (140 + (y - 140) * k - 8) - lift;
    const ry = TREE_SCALE * k * r, rx = ry * narrow;
    for (let i = 0; i <= 40; i++) {
      const px = x0 + (i * (x1 - x0)) / 40, dx = Math.abs(px - cx);
      if (dx < rx) bottom = Math.max(bottom, cy + ry * Math.sqrt(1 - (dx / rx) ** 2));
    }
  }
  return bottom;
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
 * b2 (10 Nov): the flat crown keeps CROWN_CLEAR above Kapi's things, only over the span they take. A young tree
 * (stages 1-2) gets a narrower crown, never a bare pole; an older one is lifted on its trunk by what is left over.
 * Canvas CSS lift; narrow is the crown's horizontal squeeze about the trunk.
 */
export function crownFit(treeStage: number, props: Readonly<Record<string, Rect>>): { narrow: number; lift: number } {
  const k = NEEM_GROWTH[treeStage] ?? 1;
  const things = kapiThingsUpTo(treeStage, props);
  const need = (narrow: number) => Math.max(0, ...things.map(([x, y, w]) => crownBottom(k, x, x + w, narrow) - (y - CROWN_CLEAR)));
  let narrow = 1;
  if (treeStage <= 2) while (narrow > CROWN_MIN_NARROW + 1e-9 && need(narrow) > 0) narrow = Math.round((narrow - 0.05) * 100) / 100;
  return { narrow, lift: Math.ceil(need(narrow) * 10) / 10 };
}
