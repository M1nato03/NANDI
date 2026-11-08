import { describe, expect, it } from 'vitest';
import { layoutProblems } from './anchors';
import { B_SCALE, CHROME_CSS, friendBox, layoutB, OBJECTS, place, stageAnchors } from './layoutB';

// Spec 571 §0.19 layout B with today's Scene.tsx parts (b2, 8 Nov). Geometry checks; the layout gate's open items are
// listed in the last test until b2 picks a fix (the front row does not fit 328 units at 1.3x).
const art = (height: number) => height - CHROME_CSS.header - CHROME_CSS.tabBar;

describe('layout B geometry', () => {
  it('the front row stands 12 units above the collapsed card; the 1.3x keeps that foot fixed', () => {
    const layout = layoutB(360, art(800), CHROME_CSS.card);
    expect(layout.u).toBe(1);
    expect(layout.foot).toBeCloseTo(art(800) - CHROME_CSS.card - 12, 9);
    expect(place(layout, 'gym', 180, 200 - 0)[1]).toBeCloseTo(layout.foot, 9);
    // A point 10 units above the foot ends 13 above it; the centre column does not move sideways.
    expect(place(layout, 'gym', 180, 190)).toEqual([180, layout.foot - 10 * B_SCALE]);
  });

  it('wider phones scale the art with the width (u), so the same scene units land at the same share of the screen', () => {
    const narrow = layoutB(360, 600, 134), wide = layoutB(412, 600 * 412 / 360, 134 * 412 / 360);
    expect(wide.u).toBeCloseTo(412 / 360, 9);
    expect(wide.foot).toBeCloseTo(narrow.foot, 9);
  });

  it('the stage-5 neem canopy fits under the header: the wall row sits 154 x 1.3 + 14 units from the top', () => {
    const layout = layoutB(360, art(800), CHROME_CSS.card);
    // The coping (y 74 in the scene) after the shift and the scale.
    const coping = place(layout, 'tree', 180, 74)[1];
    expect(coping).toBeGreaterThanOrEqual(154 * B_SCALE + 14 - B_SCALE);
    expect(coping).toBeLessThanOrEqual(154 * B_SCALE + 14 + B_SCALE);
  });

  it('every friend is at least 48 CSS px each way on a 360-wide screen, at every stage', () => {
    const layout = layoutB(360, art(800), CHROME_CSS.card);
    for (const stage of [0, 1, 2, 3, 4, 5]) for (const area of ['plan', 'remember', 'mind', 'train', 'sleep', 'learn'] as const) {
      const [, , w, h] = friendBox(layout, area, stage);
      expect(Math.min(w, h), `${area} at stage ${stage}`).toBeGreaterThanOrEqual(48);
    }
  });

  it('the anchor shape matches the screen: canvas = CSS x 3, header, card and tab bar where the chrome says', () => {
    const stage = stageAnchors(360, 800, 3);
    expect(stage.canvas).toEqual([1080, 2400]);
    expect(stage.headerBottom).toBe(64 * 3);
    expect(stage.tabTop).toBe((800 - 67) * 3);
    expect(stage.cardTop).toBe((800 - 67 - 134) * 3);
    expect(Object.keys(stage.props)).toEqual(OBJECTS.filter(object => object.from <= 3 && !object.wallRun).map(object => object.id));
  });
});

describe('layout B gate (open: for b2)', () => {
  it('with the scratch B v3 corner steps, today’s parts reach the side edges at 1.3x (listed, not yet fixed)', () => {
    expect(layoutProblems(stageAnchors(360, 800, 5), 360, 800)).toEqual([
      'mor-pot-1: within 16 px of a side', 'moti-frame: within 16 px of a side', 'moti-trunk: within 16 px of a side',
      'kachhua-mat: within 16 px of a side', 'kachhua-cot: within 16 px of a side', 'kachhua-blanket: within 16 px of a side', 'chiku-shelf: within 16 px of a side',
    ]);
  });
});
