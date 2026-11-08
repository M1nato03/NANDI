import { describe, expect, it } from 'vitest';
import raw from '../../ui/courtyard/anchors.json';
import { containFit, FRIEND_IDS, homeFit, layoutProblems, parseAnchors, pointOnScreen, rectOnScreen, stageFit, stepForward } from './anchors';

// Spec 571 §0.19 layout B, stage 2 commit 3: the painted pass's anchors (p9p now; 9q is a data swap, then these re-run).
const anchors = parseAnchors(raw);
/** The lantern string runs along the wall and may reach the edge (§0.19 G-edge); its lanterns are checked by eye. */
const WALL_RUN = ['spec-15-lanterns'];

describe('courtyard anchors: the file', () => {
  it('reads all six friends with their areas, the header, the card and the tab bar', () => {
    expect(anchors.canvas).toEqual([1080, 2520]);
    expect(Object.keys(anchors.friends).sort()).toEqual([...FRIEND_IDS].sort());
    expect(anchors.friends.nandi.area).toBe('train');
    expect(anchors.headerBottom).toBe(216);
    expect(anchors.cardTop).toBeLessThan(anchors.tabTop);
    // The pass the app reads (scripts/import-courtyard-anchors.ts): p9q since 8 Nov, re-imported at "9q done".
    expect(raw.pass).toBe('p9q');
  });

  it('names every missing key at once instead of guessing', () => {
    expect(() => parseAnchors({ canvas: [1080, 2520], layout: {}, friends: { mor: { area: 'plan' } } }))
      .toThrow(/layout\.header_mask, layout\.card_begins_y, layout\.tab_bar_begins_y, friends\.mor\.foot_point, friends\.mor\.tap_rect, friends\.mor\.today_glow_rect, friends\.mor\.scale, friends\.moti/);
    expect(() => parseAnchors({ ...raw, friends: { ...raw.friends, kapi: { ...raw.friends.kapi, area: 'play' } } })).toThrow(/friends\.kapi\.area \(mind\)/);
  });
});

describe('courtyard anchors: the stage fit (width fit, centred vertical crop, up to 0.6; the 0.6 frame above)', () => {
  it('matches the pass’s own crop table: 0.4286 shows 2520 px, 0.45 shows 2400, 0.47 shows 2298', () => {
    expect(stageFit(anchors, 360, 840)).toMatchObject({ mode: 'width', cropTop: 0, visibleHeight: 2520 });
    expect(stageFit(anchors, 360, 800).visibleHeight).toBeCloseTo(2400, 6);
    expect(stageFit(anchors, 360, 800).cropTop).toBeCloseTo(60, 6);
    expect(stageFit(anchors, 1080 * 0.47, 1080).visibleHeight).toBeCloseTo(2297.87, 1);
    // At 360 × 840 a canvas px is a third of a CSS px, with nothing cropped.
    const fit = stageFit(anchors, 360, 840);
    rectOnScreen(fit, anchors.friends.mor.tap).forEach((value, i) => expect(value).toBeCloseTo(anchors.friends.mor.tap[i]! / 3, 9));
    pointOnScreen(fit, anchors.friends.kapi.foot).forEach((value, i) => expect(value).toBeCloseTo(anchors.friends.kapi.foot[i]! / 3, 9));
  });

  it('above 0.6 the frame sits centred at full height', () => {
    const fit = stageFit(anchors, 1280, 800);
    expect(fit.mode).toBe('frame');
    expect(fit.offsetX).toBeCloseTo((1280 - 1080 * fit.scale) / 2, 6);
    expect(fit.visibleHeight * fit.scale).toBeCloseTo(800, 6);
  });
});

describe('courtyard anchors: the layout gates on every phone shape', () => {
  // The painted pass was framed for 0.4286-0.47 (its crop table). b2 (8 Nov): 16:9 phones are in the gate, width-fit up
  // to 0.6; the p9p numbers there are recorded below as the painted contract's open item (stage 2 draws the SVG layout).
  for (const [width, height] of [[360, 840], [360, 800], [360, 766], [390, 844], [412, 915]] as const) {
    it(`${width} × ${height}: taps ≥ 48, apart, ≥ 16 inside the sides, clear of the header and the collapsed card; props ≥ 16 inside`, () => {
      expect(layoutProblems(anchors, width, height, WALL_RUN)).toEqual([]);
    });
  }

  it('p9p on a 16:9 phone and on a desktop frame: with the centred crop Nandi’s tap goes under the card', () => {
    expect(layoutProblems(anchors, 360, 640, WALL_RUN)).toEqual(['nandi: tap under the collapsed card (499.6 > 440.5)']);
    expect(layoutProblems(anchors, 1280, 800, WALL_RUN)).toEqual(['nandi: tap under the collapsed card (639.5 > 600.5)']);
  });

  it('b2 (8 Nov) the card-aware home fit: every size passes, the crop moving down only where a tap would meet the card', () => {
    const top = Math.min(anchors.friends.kapi.tap[1], anchors.props['kapi-kite']![1]);
    for (const [width, height] of [[360, 640], [360, 720], [360, 740], [360, 766], [360, 800], [360, 840], [390, 844], [412, 915], [1280, 800], [768, 1024]] as const) {
      const fit = homeFit(anchors, width, height, top);
      expect(fit.blocked, `${width}x${height}`).toBeUndefined();
      expect(layoutProblems(anchors, width, height, WALL_RUN, fit), `${width}x${height}`).toEqual([]);
      // Kapi and the kite stay below the header.
      expect((top - fit.cropTop) * fit.scale).toBeGreaterThanOrEqual(anchors.headerBottom / 3 - 1e-9);
    }
    // Phones that already clear keep the centred crop.
    expect(homeFit(anchors, 360, 800, top).cropTop).toBeCloseTo(stageFit(anchors, 360, 800).cropTop, 9);
    expect(homeFit(anchors, 360, 640, top).cropTop).toBeCloseTo(501.4, 1);
    // When both cannot hold, it says so with the numbers.
    expect(homeFit(anchors, 360, 640, 300).blocked).toMatch(/^360x640: the lowest tap needs a crop of 501\.4 px but the header allows /);
  });

  it('containFit keeps the part’s aspect, bottom-centred in its rect, and says how far the aspects differ', () => {
    const fit = containFit([10, 20, 20, 10], [100, 100, 40, 40]);
    expect(fit.k).toBe(2);
    expect(fit.x + 10 * fit.k).toBe(100);
    expect(fit.y + 20 * fit.k + 10 * fit.k).toBe(140);
    expect(fit.aspectOff).toBe(2);
  });

  it('spec 660 pose (unused in stage 2): one friend stepped forward 30 canvas px is gated too', () => {
    for (const id of FRIEND_IDS) expect(layoutProblems(stepForward(anchors, id, 30), 360, 800, WALL_RUN), id).toEqual([]);
    // Too far forward and the card catches it.
    expect(layoutProblems(stepForward(anchors, 'nandi', 200), 360, 840, WALL_RUN).some(line => line.startsWith('nandi: tap under the collapsed card'))).toBe(true);
  });

  it('the gates bite: a tap moved to the edge, shrunk, overlapping or under the card is named', () => {
    const moved = parseAnchors({ ...raw, friends: { ...raw.friends,
      mor: { ...raw.friends.mor, tap_rect: [30, 1026, 146, 156] },
      kapi: { ...raw.friends.kapi, tap_rect: [742, 761, 120, 120] },
      chiku: { ...raw.friends.chiku, tap_rect: [850, 1100, 160, 167] },
      nandi: { ...raw.friends.nandi, tap_rect: [441, 1800, 223, 190] } } });
    const problems = layoutProblems(moved, 360, 840, WALL_RUN);
    expect(problems).toContain('mor: tap within 16 px of a side (10.0..58.7 of 360)');
    expect(problems).toContain('kapi: tap 40.0×40.0 under 48');
    expect(problems.some(line => line.startsWith('moti and chiku: taps overlap'))).toBe(true);
    expect(problems.some(line => line.startsWith('nandi: tap under the collapsed card'))).toBe(true);
    // The final p9q lantern string starts 20.2 CSS in (b2's 22:54 fix), so it now passes even without the wall-run exemption.
    expect(layoutProblems(anchors, 360, 840)).toEqual([]);
  });
});
