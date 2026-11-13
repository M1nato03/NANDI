import { describe, expect, it } from 'vitest';
import raw from './anchors.json';
import { containFit, parseAnchors, type Rect } from '../../core/courtyard/anchors';
import { nudgeAnchors } from '../../core/courtyard/nudges';
import { LANTERN_FRAME, LANTERN_H, LANTERNS_DRAWN, lanternSpots } from './Scene';
import { LANTERNS_BOX } from './LayoutBScene';

// a9 13 Nov (option a, then stand A) + b2 (nothing floats): layout B's soft-day lanterns hang from one post's beam,
// measured with the scene's own maths (containFit of the string's box into 'spec-15-lanterns', canvas CSS = px / 3).
const anchors = nudgeAnchors(parseAnchors(raw));
const css = (rect: Rect): Rect => [rect[0] / 3, rect[1] / 3, rect[2] / 3, rect[3] / 3];
const fit = containFit(LANTERNS_BOX, css(anchors.props['spec-15-lanterns']!));
const onScreen = (x: number, y: number, w: number, h: number): Rect => [fit.x + x * fit.k, fit.y + y * fit.k, w * fit.k, h * fit.k];
const overlaps = (a: Rect, b: Rect) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
const kachhua = css(anchors.friends.kachhua.tap);
const standLantern = css(anchors.props['kachhua-standing-lantern']!);
const cot = css(anchors.props['kachhua-charpai']!);
/** a9's measure of Mor's birdbath in the shot (canvas CSS). */
const birdbath: Rect = [62, 383, 22.5, 11.5];
/** The bedroll's top in the shot: the rolled mat sits about 14 CSS above the blanket rect (484.4), so ~470. */
const BEDROLL_TOP = 470;
const f = LANTERN_FRAME;
const post = onScreen(f.postX - 2.2, f.top - 1, 4.4, f.foot + 0.4 - (f.top - 1));
const beam = onScreen(f.postX, f.beamY - f.beamH / 2, f.beamEnd - f.postX, f.beamH);
/** The stay runs from the post top to the beam's end: its height at a canvas x. */
const stayTop = onScreen(f.postX, f.top, 0, 0);
const stayEnd = onScreen(f.beamEnd, f.beamY, 0, 0);
const stayAt = (x: number) => stayTop[1] + (x - stayTop[0]) / (stayEnd[0] - stayTop[0]) * (stayEnd[1] - stayTop[1]);

describe('layout B soft-day lanterns (a9 13 Nov; b2: nothing floats)', () => {
  it('for 1 to 12 lanterns: each misses Kachhua, the stand lantern and the cot, and is whole above the bedroll', () => {
    for (let count = 1; count <= LANTERNS_DRAWN; count++) {
      for (const spot of lanternSpots(count, 'two')) {
        const body = onScreen(spot.x - spot.width / 2, spot.top, spot.width, LANTERN_H);
        expect(overlaps(body, kachhua), `count ${count}, lantern at ${spot.x} over Kachhua`).toBe(false);
        expect(overlaps(body, standLantern), `count ${count}, lantern at ${spot.x} over the stand lantern`).toBe(false);
        expect(overlaps(body, cot), `count ${count}, lantern at ${spot.x} over the cot`).toBe(false);
        expect(body[1] + body[3], `count ${count}, lantern at ${spot.x} below the bedroll top`).toBeLessThanOrEqual(BEDROLL_TOP);
      }
    }
  });

  it('the post stands on the floor beside the stand lantern, and misses it, the cot and Kachhua', () => {
    expect(overlaps(post, standLantern)).toBe(false);
    expect(overlaps(post, cot)).toBe(false);
    expect(overlaps(post, kachhua)).toBe(false);
    // Its foot is level with the stand lantern's foot (a9: y ≈ 487).
    expect(Math.abs(post[1] + post[3] - 487)).toBeLessThan(1.5);
  });

  it('the beam and its stay miss the birdbath and Kachhua; every lantern hangs under the beam', () => {
    expect(overlaps(beam, birdbath)).toBe(false);
    expect(overlaps(beam, kachhua)).toBe(false);
    // Over the birdbath's width the stay runs below its bottom; it ends at the beam, far above Kachhua.
    for (let x = birdbath[0]; x <= Math.min(birdbath[0] + birdbath[2], stayEnd[0]); x += 0.5) expect(stayAt(x)).toBeGreaterThan(birdbath[1] + birdbath[3]);
    expect(stayEnd[1]).toBeLessThan(kachhua[1]);
    for (const spot of lanternSpots(LANTERNS_DRAWN, 'two')) {
      expect(spot.x).toBeGreaterThan(f.postX + f.postW);
      expect(spot.x).toBeLessThan(f.beamEnd);
      expect(spot.top).toBeGreaterThan(f.beamY);
    }
  });

  it('cords alternate short and long, so the tiers stagger; neighbours in a tier never touch', () => {
    const spots = lanternSpots(LANTERNS_DRAWN, 'two');
    expect(spots.map(spot => spot.top)).toEqual(Array.from({ length: 12 }, (_, i) => f.tiers[i % 2]));
    for (const tier of [0, 1]) {
      const row = spots.filter((_, i) => i % 2 === tier);
      for (let i = 1; i < row.length; i++) expect(row[i]!.x - row[i - 1]!.x).toBeGreaterThan(row[i]!.width);
    }
    // The upper tier ends above the lower tier, and a long cord passes between two upper lanterns.
    expect(f.tiers[0] + LANTERN_H).toBeLessThan(f.tiers[1]);
    for (let i = 1; i < spots.length - 1; i += 2) {
      expect(spots[i]!.x).toBeGreaterThan(spots[i - 1]!.x + spots[i - 1]!.width / 2);
      expect(spots[i]!.x).toBeLessThan(spots[i + 1]!.x - spots[i + 1]!.width / 2);
    }
  });

  it('draws 12 at most; more soft days still draw 12', () => {
    expect(lanternSpots(12, 'two').length).toBe(12);
    expect(lanternSpots(20, 'two').length).toBe(12);
  });

  it('the classic scene keeps its one string of 9 apart', () => {
    expect(lanternSpots(3).map(spot => spot.x)).toEqual([16, 25, 34]);
    expect(lanternSpots(3).every(spot => spot.top === 140 && spot.string === 137)).toBe(true);
  });
});
