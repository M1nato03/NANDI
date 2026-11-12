import type { LegState, Trek } from '../yatra/trek';
import type { Trail } from '../yatra/trail';
import { K_GROWTH } from './layoutB';

/**
 * Spec 571 §0.14 (Jenil, 5 Nov: "add something like a keepsake to the neem tree that grows as I progress"): each camp
 * the trek reaches hangs one small painted wooden tag on the courtyard's neem. Derived from deriveTrek's reached camps
 * and keyed by camp id, so a re-run or a restore can neither duplicate nor drop one, and none is ever removed. No
 * letters in the art: the camp's name is a caption outside the SVG on tap, which opens that camp's postcard.
 */
export interface Keepsake {
  /** The camp reached (its place id): the key. */
  campId: string;
  campName: string;
  /** The landmark of the leg that reached it: its postcard, and the tag's painted motif. */
  landmarkId: string;
  motif: string;
  /** 0-based order of reaching, which also picks the tag's wood tone. */
  index: number;
  reachedOn: string;
}

/**
 * Spec 575 (must 3): every walked trail's camps, finished trails first, in walking order, so a trail switch never takes
 * a tag down (camp ids are unique across trails, so the key still holds).
 */
export function treeKeepsakes(trek: Trek & { journey?: { walked: readonly { trail: Trail; legs: readonly LegState[] }[] } }): Keepsake[] {
  const walked = trek.journey?.walked ?? [{ trail: trek.trail, legs: trek.legs }];
  return walked.flatMap(({ trail, legs }) => legs.filter(leg => leg.doneOn !== undefined).map(leg => ({ trail, leg })))
    .map(({ trail, leg }, index) => {
      const place = trail.places[leg.index + 1]!;
      const landmark = trail.legs[leg.index]!.landmark;
      return { campId: place.id, campName: place.name, landmarkId: landmark.id, motif: landmark.kind, index, reachedOn: leg.doneOn! };
    });
}

/** §0.14: about 12 or more and the extra tags go on a small wooden peg-board at the tree's foot. */
export const BOARD_FROM = 12;
export const TAG_W = 7.2, TAG_H = 13.7;
/** The neem's platform top and trunk centre in layout B (canvas CSS), and the trunk's height and width in scene units. */
const BASE_Y = 377, TRUNK_X = 179, TRUNK_H = 70, TRUNK_W = 16, TREE_SCALE = 1.3;
/** p9p's first four tags (neem-keepsake-tag-1..4): 14 above the platform, then every 13.3, alternating sides 8.7 off centre. */
const FIRST_Y = 14, STEP_Y = 13.3, SIDE_X = 8.7;

export interface TagSpot { x: number; y: number; on: 'trunk' | 'platform' | 'board' }

/**
 * Where each tag hangs (its top-left, canvas CSS) for a tree at `treeStage`: on the bole's front, low and moving up as
 * the tree grows (the trunk is K_GROWTH × 70 units tall), alternating sides as p9p's first four do; a sapling's tags sit
 * on the platform's lip; a tag that would pass the trunk's fork, and every tag from the 12th, goes on the peg-board.
 */
export function keepsakeSpots(count: number, treeStage: number, firstRects: readonly (readonly number[])[] = []): TagSpot[] {
  const k = K_GROWTH[treeStage] ?? K_GROWTH[0]!;
  const trunkTop = BASE_Y - TRUNK_H * k * TREE_SCALE;
  const half = TRUNK_W * k * TREE_SCALE / 2;
  const side = Math.min(SIDE_X, Math.max(0, half - TAG_W / 2));
  const spots: TagSpot[] = [];
  let board = 0;
  const onBoard = (): TagSpot => { const i = board++; return { x: 146 + (i % 4) * 7.4, y: 401 + Math.floor(i / 4) * 9, on: 'board' }; };
  for (let i = 0; i < count; i++) {
    if (i >= BOARD_FROM - 1) { spots.push(onBoard()); continue; }
    if (treeStage === 0) { spots.push(i < 4 ? { x: 166 + i * 7.6, y: BASE_Y + 1, on: 'platform' } : onBoard()); continue; }
    // The painted pass's own first four (p9p's neem-keepsake-tag-1..4) where given; then the same rhythm on up.
    const given = firstRects[i];
    const dx = given ? given[0]! + TAG_W / 2 - TRUNK_X : (i % 2 === 0 ? -SIDE_X : SIDE_X);
    const centreY = given ? given[1]! + TAG_H / 2 : BASE_Y - FIRST_Y - STEP_Y * i;
    if (centreY - TAG_H / 2 < trunkTop + 4) { spots.push(onBoard()); continue; }
    // A thinner trunk pulls the tags in toward its centre line, so they stay on the bark.
    const x = TRUNK_X + dx * (side / SIDE_X) - TAG_W / 2;
    spots.push({ x, y: centreY - TAG_H / 2, on: 'trunk' });
  }
  return spots;
}
