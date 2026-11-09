import type { AreaId } from '../../core/courtyard/courtyard';
import type { PartId } from './Scene';

/**
 * Spec 571 stage 2 (b2, 8 Nov): today's Scene.tsx parts at the painted pass's positions. Each painted prop rect gets one
 * existing part (no new art), contain-fitted and bottom-centred, from the stage its area reaches. The three props with
 * no single part map to the nearest one (b2): the bird bath → Mor's water bowl; the bulbs + small photos → Moti's photo
 * string; the flat board game → the chess board from Kapi's stool. Count-driven fixtures (the lantern string, the toran)
 * and the scenery (wall, door, neem) are placed by the scene itself.
 */
export interface PropPart { prop: string; part: PartId; area: AreaId; from: number; until?: number }
export const PROP_PARTS: readonly PropPart[] = [
  { prop: 'mor-pot-1', part: 'pot1', area: 'plan', from: 1 },
  { prop: 'mor-pot-2', part: 'pot2', area: 'plan', from: 2 },
  { prop: 'mor-marigold-bed', part: 'flowerBed', area: 'plan', from: 3 },
  { prop: 'mor-trellis-creeper', part: 'trellis', area: 'plan', from: 4 },
  { prop: 'mor-birdbath-water', part: 'waterBowl', area: 'plan', from: 5 },
  { prop: 'moti-chest', part: 'keepsakeBox', area: 'remember', from: 1 },
  { prop: 'moti-picture-frame', part: 'photoFrame', area: 'remember', from: 2 },
  { prop: 'moti-shelf-three-jars', part: 'jarShelf', area: 'remember', from: 3 },
  { prop: 'moti-brass-trunk', part: 'trunk', area: 'remember', from: 4 },
  { prop: 'moti-bulbs-small-photos', part: 'photoString', area: 'remember', from: 5 },
  { prop: 'kapi-wall-puzzle', part: 'puzzleCube', area: 'mind', from: 1 },
  { prop: 'kapi-flat-board-game', part: 'chessBoard', area: 'mind', from: 2 },
  { prop: 'kapi-kite', part: 'kite', area: 'mind', from: 3 },
  { prop: 'kapi-telescope', part: 'telescope', area: 'mind', from: 4 },
  { prop: 'kapi-slate', part: 'slate', area: 'mind', from: 5 },
  { prop: 'nandi-mat', part: 'gymMat', area: 'train', from: 1 },
  { prop: 'nandi-clubs', part: 'clubs', area: 'train', from: 2 },
  { prop: 'nandi-dumbbells', part: 'dumbbells', area: 'train', from: 3 },
  { prop: 'nandi-wooden-gym-frame', part: 'gymFrame', area: 'train', from: 4 },
  { prop: 'nandi-medals', part: 'medals', area: 'train', from: 5 },
  { prop: 'kachhua-sleeping-mat', part: 'sleepMat', area: 'sleep', from: 1 },
  { prop: 'kachhua-pillow', part: 'pillow', area: 'sleep', from: 2 },
  { prop: 'kachhua-charpai', part: 'cot', area: 'sleep', from: 3 },
  { prop: 'kachhua-standing-lantern', part: 'standingLantern', area: 'sleep', from: 4 },
  { prop: 'kachhua-blanket', part: 'blanket', area: 'sleep', from: 5 },
  // 9 Nov hotfix (support.ts): Chiku's reading mat at his feet for his first two stages.
  { prop: 'chiku-reading-mat', part: 'readingMat', area: 'learn', from: 1, until: 2 },
  { prop: 'chiku-open-book', part: 'openBook', area: 'learn', from: 1 },
  { prop: 'chiku-book-stack', part: 'bookStack', area: 'learn', from: 2 },
  { prop: 'chiku-bookshelf', part: 'bookshelf', area: 'learn', from: 3 },
  { prop: 'chiku-reading-lamp', part: 'readingLamp', area: 'learn', from: 4 },
  { prop: 'chiku-globe', part: 'globe', area: 'learn', from: 5 },
];
/** Painted props placed by the scene, not by a part: count-driven fixtures, and pieces drawn inside another part. */
export const SCENE_PROPS: Readonly<Record<string, string>> = {
  'spec-15-lanterns': 'the lantern string (one per soft day), placed by the scene',
  'spec-24-toran': 'the toran (one flower per kept chhutti), placed with the door',
  'kachhua-weave-band': 'drawn inside the cot part',
};
/** Painted props with nothing in today's art (571 §0.14 keepsake tags are not in today's courtyard). */
export const NO_PART: readonly string[] = ['neem-keepsake-tag-1', 'neem-keepsake-tag-2', 'neem-keepsake-tag-3', 'neem-keepsake-tag-4'];
