/**
 * Spec 660 §7 (commit 7): the quest stones' path in the courtyard, in layout B's canvas CSS (360 × 840, the painted
 * pass's coordinates / 3). A worn track leaves the door's stone step, passes left of the neem's platform and runs down
 * the open floor between Kachhua's cot and Chiku's globe to Nandi's gym. Each finished quest lays one stone on it, row by
 * row from the door: the middle of a row first, then its left, then its right.
 *
 * The track and every slot keep clear of every part at every stage (s1-s5), the step, the platform and the friends
 * (standing or stepped forward): questPath.test.ts checks each against the scene's own placement (support.ts placeAt).
 *
 * A stone never goes away. The path holds PATH_STONES; past that each further stone polishes one already laid, from
 * the door, so 31..60 still show a change and nothing is ever removed or moved.
 */
export const PATH_LINE: readonly (readonly [number, number])[] = [
  [111, 400], [117, 409], [126, 418], [137, 425], [151, 432], [163, 440], [171, 451], [175, 462], [176, 473], [175, 484],
];
export const ROW_STONES = 3;
export const PATH_STONES = PATH_LINE.length * ROW_STONES;
/** Stones a row apart sideways (canvas CSS), and each stone's half sizes. */
export const STONE_SPREAD = 13;
export const STONE_RX = 5.5;
export const STONE_RY = 3;
/** The worn track's half width: the outer stones sit inside it. */
export const TRACK_HALF = STONE_SPREAD + STONE_RX + 2;

export interface StoneSpot { index: number; row: number; x: number; y: number; polished: boolean }

/** The unit normal of the line at row `i` (the average of the segments either side). */
function normal(i: number): [number, number] {
  const prev = PATH_LINE[Math.max(0, i - 1)]!, next = PATH_LINE[Math.min(PATH_LINE.length - 1, i + 1)]!;
  const dx = next[0] - prev[0], dy = next[1] - prev[1], length = Math.hypot(dx, dy) || 1;
  return [-dy / length, dx / length];
}

/** Where slot `index` is: row index / 3, and in the row middle (0), left (1, toward the normal's negative side), right (2). */
export function slotAt(index: number): { row: number; x: number; y: number } {
  const row = Math.floor(index / ROW_STONES), side = index % ROW_STONES;
  const [cx, cy] = PATH_LINE[row]!;
  const [nx, ny] = normal(row);
  const offset = side === 0 ? 0 : side === 1 ? -STONE_SPREAD : STONE_SPREAD;
  return { row, x: cx + nx * offset, y: cy + ny * offset };
}

/** The stones for `count` finished quests: `min(count, PATH_STONES)` laid, and `count - PATH_STONES` of them polished. */
export function pathStones(count: number): StoneSpot[] {
  const laid = Math.max(0, Math.min(Math.floor(count), PATH_STONES));
  const polished = Math.max(0, Math.floor(count) - PATH_STONES);
  return Array.from({ length: laid }, (_, index) => ({ index, ...slotAt(index), polished: index < polished }));
}
