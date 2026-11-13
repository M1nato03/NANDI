import { describe, expect, it } from 'vitest';
import { groupStops, headBoxes, LEG_W, trailKit } from './TrekScene';
import { TALL_KIT } from './trekKit';
import { liftAt, placeLifts } from '../../core/yatra/path';
import { shipped } from '../../data/yatra/trails';

// a9 review 3 (3), b2 ruling: no back-row piece over any friend's head at any stop, on every shipped trail.
describe('spec 575: the back row never sits on a head', () => {
  for (const trail of shipped) it(trail.id, () => {
    const lifts = placeLifts(trail);
    const lift = (x: number) => liftAt(x, lifts, 340, LEG_W);
    const kit = trailKit(trail, lift);
    const stops = groupStops(trail.legs.length);
    expect(stops).toHaveLength(trail.legs.length * 3 + 1);
    const tall = kit.filter(piece => piece.tall);
    for (const gx of stops) for (const head of headBoxes(gx, lift)) for (const piece of tall) {
      const hit = piece.box.left < head.right && piece.box.right > head.left && piece.box.bottom < head.top && piece.box.top > head.bottom;
      expect(hit, `${piece.seed} over a head at ${Math.round(gx)}`).toBe(false);
    }
    // The back row is thinned, not emptied: forest legs still have trees behind the trail.
    trail.legs.forEach((leg, i) => {
      if (leg.terrain?.zone !== 'kullu-forest' && leg.terrain?.zone !== 'rhodo-forest') return;
      const from = 340 + i * LEG_W;
      expect(kit.filter(piece => piece.tall && piece.x >= from && piece.x < from + LEG_W && TALL_KIT.has(piece.kind)).length, leg.id).toBeGreaterThan(0);
    });
  });
});
