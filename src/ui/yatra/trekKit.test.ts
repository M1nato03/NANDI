import { describe, expect, it } from 'vitest';
import { gapVariation, scatterLeg, ZONE_ART } from './trekKit';
import { ZONES, type Leg, type Zone } from '../../core/yatra/trail';
import { shipped } from '../../data/yatra/trails';

// Spec 575 §5'.5 (a9's gate): no even rows, nothing random, no text in the art, every zone has its own look.
const sources = import.meta.glob(['./TrekScene.tsx', './trekKit.tsx', './hash.ts'], { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const legOf = (zone: Zone, n: number): Leg => ({ id: `t-${n}`, from: 'a', to: 'b', landmark: { id: `${zone}-mark-${n}`, name: 'M', kind: 'river' }, terrain: { zone, features: [] }, postcard: { lines: [] }, sources: [], constellation: '' });

describe('spec 575: the trail kit', () => {
  it('every zone has its own art', () => {
    expect(Object.keys(ZONE_ART).sort()).toEqual([...ZONES].sort());
    const looks = ZONES.map(zone => JSON.stringify([ZONE_ART[zone].far.fill, ZONE_ART[zone].mid.fill, ZONE_ART[zone].front]));
    expect(new Set(looks).size).toBe(ZONES.length);
  });

  it('even-rows check: in every zone the gaps between neighbouring pieces vary (coefficient of variation >= 0.35)', () => {
    for (const zone of ZONES) {
      const xs = [0, 1, 2, 3].flatMap(n => scatterLeg(legOf(zone, n), n * 560, 560, []).map(piece => piece.x));
      expect(gapVariation(xs), zone).toBeGreaterThanOrEqual(0.35);
    }
  });

  it('the shipped legs scatter in clusters, kept off the camps and the landmark spot', () => {
    for (const trail of shipped) trail.legs.forEach((leg, i) => {
      const from = 340 + i * 560;
      const clear: [number, number][] = [[from - 70, from + 110], [from + 0.71 * 560 - 60, from + 0.71 * 560 + 60]];
      const pieces = scatterLeg(leg, from, 560, clear);
      expect(pieces.length, leg.id).toBeGreaterThan(2);
      for (const piece of pieces) expect(clear.some(([a, b]) => piece.x > a && piece.x < b), leg.id).toBe(false);
    });
  });

  it('grep: no <text in the trek art, no Math.random, no cairn or pennant, and no altitude or source rendered', () => {
    const code = Object.values(sources).join('\n');
    expect(code).not.toMatch(/<text[\s>]/);
    expect(code).not.toMatch(/Math\.random/);
    expect(code).not.toMatch(/Cairn|#d9573b/);
    expect(code).not.toMatch(/\{[^}]*altitudeM[^}]*\}/);
    expect(sources['./TrekScene.tsx']).not.toMatch(/\.sources\b/);
  });
});
