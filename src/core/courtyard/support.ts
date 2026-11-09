import type { AreaId } from './courtyard';
import type { Rect } from './anchors';

/**
 * Spec 571 hotfix (b2 + a9, 9 Nov; Jenil: "the rubiks cube is glitched, the vase is hanging mid air, the book is just
 * lying there"). Layout B puts today's flat parts into the painted pass's prop rects, but the pass has a wall-top ledge
 * and a side wall that the flat scene does not: so every part says what it stands on, and the rects that rested on
 * the missing ledge or wall are placed again (nudges.ts LAYOUT_B_NUDGES.places).
 *
 * Canvas CSS (360 wide; the anchor file's px / 3). The flat scene's lines: the coping's top (things on the wall top
 * stand here), the coping's foot (the wall face starts), and the wall's foot, which is the door's base line (floor
 * things stand at or below it).
 */
export const LINES = { coping: 305, wallTop: 314.3, wallFoot: 385 } as const;

/** What a part stands on: the floor, the coping top, the wall face (hung), another part, or nothing (the kite flies). */
export type Support = 'floor' | 'coping' | 'wall' | 'air' | { on: string } | { hangs: string };

/** Every part's support, by prop (the gate checks each against its line at every stage). */
export const SUPPORT: Readonly<Record<string, Support>> = {
  'mor-pot-1': 'floor', 'mor-pot-2': 'floor', 'mor-marigold-bed': 'floor', 'mor-trellis-creeper': 'wall', 'mor-birdbath-water': 'floor',
  'moti-chest': 'floor', 'moti-picture-frame': 'wall', 'moti-shelf-three-jars': 'wall', 'moti-brass-trunk': 'floor', 'moti-bulbs-small-photos': 'wall',
  'kapi-wall-puzzle': 'coping', 'kapi-flat-board-game': 'coping', 'kapi-kite': 'air', 'kapi-telescope': 'coping', 'kapi-slate': 'coping',
  'nandi-mat': 'floor', 'nandi-clubs': 'floor', 'nandi-dumbbells': 'floor', 'nandi-wooden-gym-frame': 'floor', 'nandi-medals': { hangs: 'nandi-wooden-gym-frame' },
  'kachhua-sleeping-mat': 'floor', 'kachhua-pillow': 'floor', 'kachhua-charpai': 'floor', 'kachhua-standing-lantern': 'floor', 'kachhua-blanket': 'floor',
  'chiku-reading-mat': 'floor', 'chiku-open-book': { on: 'chiku-reading-mat' }, 'chiku-book-stack': 'floor', 'chiku-bookshelf': 'floor',
  'chiku-reading-lamp': 'floor', 'chiku-globe': 'floor',
};

/**
 * Draw order among parts with the same foot (Kapi's wall-top cluster: the telescope and the slate stand behind the
 * cube and the board). Lower draws first; parts not listed are 1.
 */
export const DEPTH: Readonly<Record<string, number>> = { 'kapi-telescope': 0, 'kapi-slate': 0, 'kapi-wall-puzzle': 2, 'kapi-flat-board-game': 2 };

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
