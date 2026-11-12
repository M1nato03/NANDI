import type { Trail } from './trail';

/**
 * Spec 575 §2 (b2 ruling c): the path's height. Each trail's own lowest and highest places map onto one band of
 * BAND_PX, so a trail's real shape shows (up, then down; Sandakphu up-down-up) and the group never rises into tonight's
 * stars. Camps sit on level shelves; between them the path is a smooth monotone curve (no invented peaks), and its
 * steepest slope stays far under 30 degrees. Altitudes shape the path only: they are never shown as text (M5).
 */
export const BAND_PX = 45;
/** Either side of a place, the ground is level: a shelf for the camp, the tents and the fire. */
export const SHELF_PX = 80;

/** Each place's lift in px (0 = the trail's lowest place, BAND_PX = its highest); a trail with no altitudes is flat. */
export function placeLifts(trail: Pick<Trail, 'places'>): number[] {
  const heights = trail.places.map(place => typeof place.altitudeM === 'number' ? place.altitudeM : null);
  const known = heights.filter((value): value is number => value !== null);
  if (known.length < 2) return heights.map(() => 0);
  const low = Math.min(...known), high = Math.max(...known);
  return heights.map(value => value === null || high === low ? 0 : (value - low) / (high - low) * BAND_PX);
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** The ground's lift at world x, for places at placeX(i) spaced `legW` apart. */
export function liftAt(x: number, lifts: readonly number[], firstX: number, legW: number): number {
  if (!lifts.length) return 0;
  const index = Math.floor((x - firstX) / legW);
  if (index < 0) return lifts[0]!;
  if (index >= lifts.length - 1) return lifts[lifts.length - 1]!;
  const from = firstX + index * legW, to = from + legW;
  if (x <= from + SHELF_PX) return lifts[index]!;
  if (x >= to - SHELF_PX) return lifts[index + 1]!;
  const t = (x - from - SHELF_PX) / (legW - 2 * SHELF_PX);
  return lifts[index]! + (lifts[index + 1]! - lifts[index]!) * smooth(t);
}

/** The steepest slope of the drawn path, in degrees (smoothstep peaks at 1.5x the mean rise over the sloped part). */
export function steepestDegrees(lifts: readonly number[], legW: number): number {
  let steepest = 0;
  for (let i = 1; i < lifts.length; i++) steepest = Math.max(steepest, Math.abs(lifts[i]! - lifts[i - 1]!) * 1.5 / (legW - 2 * SHELF_PX));
  return Math.atan(steepest) * 180 / Math.PI;
}
