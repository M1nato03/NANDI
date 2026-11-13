import { describe, expect, it } from 'vitest';
import raw from './anchors.json';
import { containFit, parseAnchors, type Rect } from '../../core/courtyard/anchors';
import { nudgeAnchors } from '../../core/courtyard/nudges';
import { LANTERN_FRAME, LANTERN_H, LANTERNS_DRAWN, lanternSpots, PARTS } from './Scene';
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
/** Mor's birdbath as drawn (b2 14 Nov: not a guess): its part box fitted into its nudged anchor, as LayoutBScene draws it. */
const bowlBox = PARTS.waterBowl.box;
const bowlFit = containFit(bowlBox, css(anchors.props['mor-birdbath-water']!));
const birdbath: Rect = [bowlFit.x + bowlBox[0] * bowlFit.k, bowlFit.y + bowlBox[1] * bowlFit.k, bowlBox[2] * bowlFit.k, bowlBox[3] * bowlFit.k];
/** A rect grown by `by` CSS on every side. */
const grow = (rect: Rect, by: number): Rect => [rect[0] - by, rect[1] - by, rect[2] + 2 * by, rect[3] + 2 * by];
/** The bedroll's top in the shot: the rolled mat sits about 14 CSS above the blanket rect (484.4), so ~470. */
const BEDROLL_TOP = 470;
const f = LANTERN_FRAME;
const post = onScreen(f.postX - 2.2, f.top - 1, 4.4, f.foot + 0.4 - (f.top - 1));
const beam = onScreen(f.postX, f.beamY - f.beamH / 2, f.beamEnd - f.postX, f.beamH);
/** The knee brace under the beam, as the box around it. */
const brace = onScreen(f.postX + f.postW / 2, f.beamY + f.beamH / 2, f.brace.run, f.brace.drop - f.beamH / 2);

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
    // b2 14 Nov: the beam, the brace and every cord keep at least 2 CSS from the bowl as drawn.
    // a9 14 Nov: the beam's top at least 6 CSS under the bowl's drawn bottom; the post's top under it too.
    expect(beam[1] - (birdbath[1] + birdbath[3])).toBeGreaterThanOrEqual(6);
    expect(overlaps(post, grow(birdbath, 2))).toBe(false);
    const near = grow(birdbath, 2);
    expect(overlaps(beam, near), `beam ${beam.map(v => v.toFixed(1))} vs bowl ${birdbath.map(v => v.toFixed(1))}`).toBe(false);
    expect(overlaps(brace, near)).toBe(false);
    for (const spot of lanternSpots(LANTERNS_DRAWN, 'two')) expect(overlaps(onScreen(spot.x - 0.3, spot.string, 0.6, spot.top - spot.string), near)).toBe(false);
    expect(overlaps(beam, kachhua)).toBe(false);
    expect(overlaps(brace, kachhua)).toBe(false);
    for (const spot of lanternSpots(LANTERNS_DRAWN, 'two')) {
      expect(spot.x).toBeGreaterThan(f.postX + f.postW);
      expect(spot.x).toBeLessThan(f.beamEnd);
      expect(spot.top).toBeGreaterThan(f.beamY);
    }
  });

  it('the knee brace ends before the first cord and above the first lantern', () => {
    const first = lanternSpots(1, 'two')[0]!;
    expect(brace[0] + brace[2]).toBeLessThan(onScreen(first.x, 0, 0, 0)[0]);
    expect(brace[1] + brace[3]).toBeLessThan(onScreen(0, first.top, 0, 0)[1]);
  });

  it('the knee brace passes no lantern', () => {
    for (const spot of lanternSpots(LANTERNS_DRAWN, 'two')) expect(overlaps(brace, onScreen(spot.x - spot.width / 2, spot.top, spot.width, LANTERN_H))).toBe(false);
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
