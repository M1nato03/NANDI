import { describe, expect, it } from 'vitest';
import { FEATURE_KINDS, trailErrors, ZONES } from '../../core/yatra/trail';
import { STRETCHES_PER_LEG } from '../../core/yatra/trek';
import { JAR } from '../../core/yatra/jar';
import { journeyTrails, ORDER, shipped } from './trails';

// Spec 575 gates (d) and must 4: the three trails ship in a fixed order, none is silently dropped, ids never move.
describe('spec 575: the shipped trails', () => {
  it('(d) every trail file passes trailErrors, and all three ship in the fixed order', () => {
    const files = Object.keys(import.meta.glob('../../../content/yatra/*.json')).map(path => path.split('/').pop());
    expect(files.sort()).toEqual(['hampta-pass.json', 'sandakphu.json', 'tarsar-marsar.json']);
    for (const trail of shipped) expect(trailErrors(trail), trail.id).toEqual([]);
    expect(shipped.map(trail => trail.id)).toEqual(ORDER);
    expect(ORDER).toEqual(['hampta-pass', 'tarsar-marsar', 'sandakphu']);
    expect(journeyTrails()).toBe(shipped);
  });

  it("must 4: Hampta's place and landmark ids are frozen (kept postcards, constellation names and tags hang on them)", () => {
    const hampta = shipped[0]!;
    expect(hampta.places.map(place => place.id)).toEqual(['jobra', 'chika', 'balu-ka-ghera', 'hampta-pass', 'shea-goru', 'chatru']);
    expect(hampta.legs.map(leg => leg.landmark.id)).toEqual(['rani-nallah', 'jwara-meadow', 'hampta-glacier', 'hampta-pass-top', 'chandra-river']);
    expect(hampta.legs.map(leg => leg.id)).toEqual(['jobra-chika', 'chika-balu-ka-ghera', 'balu-ka-ghera-hampta-pass', 'hampta-pass-shea-goru', 'shea-goru-chatru']);
  });

  it('ids are unique across all trails: places (tags), landmarks (postcards, constellations) and constellation names', () => {
    const places = shipped.flatMap(trail => trail.places.map(place => place.id));
    const landmarks = shipped.flatMap(trail => trail.legs.map(leg => leg.landmark.id));
    const names = shipped.flatMap(trail => trail.legs.map(leg => leg.constellation));
    expect(new Set(places).size).toBe(places.length);
    expect(new Set(landmarks).size).toBe(landmarks.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it('the Sandakphu loop starts at sepi and ends at sepi-return, both named Sepi; the trails total 570 jar minutes', () => {
    const sandakphu = shipped[2]!;
    expect([sandakphu.places[0]!.id, sandakphu.places.at(-1)!.id]).toEqual(['sepi', 'sepi-return']);
    expect([sandakphu.places[0]!.name, sandakphu.places.at(-1)!.name]).toEqual(['Sepi', 'Sepi']);
    expect(shipped.map(trail => trail.legs.length * STRETCHES_PER_LEG * JAR.stretchMinutes)).toEqual([150, 180, 240]);
  });

  it('every place has an altitude inside its range, every leg a known zone, every feature a source and a spot 0-1', () => {
    for (const trail of shipped) {
      for (const place of trail.places) {
        expect(typeof place.altitudeM, place.id).toBe('number');
        expect(place.altitudeRangeM, place.id).toHaveLength(2);
        expect(place.altitudeM!).toBeGreaterThanOrEqual(place.altitudeRangeM![0]);
        expect(place.altitudeM!).toBeLessThanOrEqual(place.altitudeRangeM![1]);
      }
      for (const leg of trail.legs) {
        expect(ZONES, leg.id).toContain(leg.terrain?.zone);
        for (const feature of leg.terrain!.features) {
          expect(FEATURE_KINDS).toContain(feature.kind);
          expect(feature.at).toBeGreaterThanOrEqual(0);
          expect(feature.at).toBeLessThanOrEqual(1);
          expect(feature.source).toMatch(/^https:\/\/\S+$/);
        }
      }
    }
  });

  it('the shape is honest: Hampta climbs to the pass then drops; Sandakphu is up-down-up then down', () => {
    const heights = (index: number) => shipped[index]!.places.map(place => place.altitudeM);
    expect(heights(0)).toEqual([2860, 3070, 3660, 4250, 3900, 3320]);
    expect(heights(2)).toEqual([1951, 2365, 3420, 3600, 3490, 3527, 3636, 2254, 1951]);
  });
});
