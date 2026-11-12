import { describe, expect, it } from 'vitest';
import { BAND_PX, liftAt, placeLifts, SHELF_PX, steepestDegrees } from './path';
import { shipped } from '../../data/yatra/trails';

const LEG = 560, FIRST = 340;
describe('spec 575 §2: the path follows the real altitudes', () => {
  it('a higher place is higher on screen; each trail fills its own band from its lowest to its highest place', () => {
    for (const trail of shipped) {
      const lifts = placeLifts(trail);
      expect(Math.min(...lifts)).toBe(0);
      expect(Math.max(...lifts)).toBeCloseTo(BAND_PX);
      trail.places.forEach((a, i) => trail.places.forEach((b, j) => { if (a.altitudeM! > b.altitudeM!) expect(lifts[i]!).toBeGreaterThan(lifts[j]!); }));
    }
  });

  it('camps sit on level shelves, the curve between is monotone (no invented peaks), and no slope passes 30 degrees', () => {
    for (const trail of shipped) {
      const lifts = placeLifts(trail);
      lifts.forEach((lift, i) => {
        const x = FIRST + i * LEG;
        for (const dx of [-SHELF_PX, -20, 0, 20, SHELF_PX]) if ((i > 0 || dx >= 0) && (i < lifts.length - 1 || dx <= 0)) expect(liftAt(x + dx, lifts, FIRST, LEG)).toBeCloseTo(lift);
        if (i === lifts.length - 1) return;
        const samples = Array.from({ length: 41 }, (_, k) => liftAt(x + k * LEG / 40, lifts, FIRST, LEG));
        const rising = lifts[i + 1]! >= lift;
        samples.slice(1).forEach((value, k) => expect(rising ? value >= samples[k]! - 1e-9 : value <= samples[k]! + 1e-9).toBe(true));
      });
      expect(steepestDegrees(lifts, LEG)).toBeLessThan(30);
    }
  });

  it('a trail without altitudes stays flat', () => {
    expect(placeLifts({ places: [{ id: 'a', name: 'A', kind: 'start', regionLine: '' }, { id: 'b', name: 'B', kind: 'camp', regionLine: '' }] })).toEqual([0, 0]);
  });
});
