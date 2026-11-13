import { describe, expect, it } from 'vitest';
import raw from './anchors.json';
import { containFit, parseAnchors, type Rect } from '../../core/courtyard/anchors';
import { nudgeAnchors } from '../../core/courtyard/nudges';
import { LANTERNS_DRAWN, lanternSpots } from './Scene';
import { LANTERNS_BOX } from './LayoutBScene';

// a9 13 Nov (option a): layout B's soft-day lanterns, measured with the scene's own maths (containFit of the string's box
// into the 'spec-15-lanterns' anchor, canvas CSS = file px / 3).
const anchors = nudgeAnchors(parseAnchors(raw));
const css = (rect: Rect): Rect => [rect[0] / 3, rect[1] / 3, rect[2] / 3, rect[3] / 3];
const fit = containFit(LANTERNS_BOX, css(anchors.props['spec-15-lanterns']!));
const onScreen = (x: number, y: number, w: number, h: number): Rect => [fit.x + x * fit.k, fit.y + y * fit.k, w * fit.k, h * fit.k];
const overlaps = (a: Rect, b: Rect) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
const kachhua = css(anchors.friends.kachhua.tap);
const standLantern = css(anchors.props['kachhua-standing-lantern']!);
/** The bedroll's top in the shot: the rolled mat sits about 14 CSS above the blanket rect (484.4), so ~470. */
const BEDROLL_TOP = 470;

describe('layout B soft-day lanterns (a9 13 Nov, option a)', () => {
  it('for 1 to 12 lanterns: each misses Kachhua and the stand lantern and is whole above the bedroll', () => {
    for (let count = 1; count <= LANTERNS_DRAWN; count++) {
      for (const spot of lanternSpots(count, 'two')) {
        const body = onScreen(spot.x - spot.width / 2, spot.top, spot.width, 10);
        expect(overlaps(body, kachhua), `count ${count}, lantern at ${spot.x}/${spot.top} over Kachhua`).toBe(false);
        expect(overlaps(body, standLantern), `count ${count}, lantern at ${spot.x}/${spot.top} over the stand lantern`).toBe(false);
        expect(body[1] + body[3], `count ${count}, lantern at ${spot.x}/${spot.top} below the bedroll top`).toBeLessThanOrEqual(BEDROLL_TOP);
      }
    }
  });

  it('draws all 12 on two strings of six; more soft days still draw 12', () => {
    expect(lanternSpots(12, 'two').length).toBe(12);
    expect(new Set(lanternSpots(12, 'two').map(spot => spot.string)).size).toBe(2);
    expect(lanternSpots(20, 'two').length).toBe(12);
    expect(lanternSpots(6, 'two').every(spot => spot.string === lanternSpots(1, 'two')[0]!.string)).toBe(true);
  });

  it("the upper string's lanterns end above the lower string", () => {
    const spots = lanternSpots(12, 'two');
    const lower = Math.max(...spots.map(spot => spot.string));
    expect(spots.filter(spot => spot.string < lower).every(spot => spot.top + 10 < lower)).toBe(true);
  });

  it('neighbours on a string never touch', () => {
    const row = lanternSpots(6, 'two');
    for (let i = 1; i < row.length; i++) expect(row[i]!.x - row[i - 1]!.x).toBeGreaterThan(row[i]!.width);
  });

  it('the classic scene keeps its one string of 9 apart', () => {
    expect(lanternSpots(3).map(spot => spot.x)).toEqual([16, 25, 34]);
    expect(lanternSpots(3).every(spot => spot.top === 140 && spot.string === 137)).toBe(true);
  });
});
