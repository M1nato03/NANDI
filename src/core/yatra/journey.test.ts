import { describe, expect, it } from 'vitest';
import type { LedgerRow } from '../../data/types';
import { deriveJourney, trailSwitchLine } from './journey';
import { deriveTrek } from './trek';
import { trailErrors, type Trail } from './trail';
import { treeKeepsakes } from '../courtyard/keepsakes';

// Spec 575 §4 (M1, M2): trail after trail. Test trails only; the shipped ones are checked in trails.test.ts.
const meta = { deleted: 0 as const, deviceId: 'test' };
let serial = 0;
const fact = (kind: 'train' | 'mind' | 'calm', day: string): LedgerRow => {
  const [mode, k] = kind === 'train' ? ['train', 'session'] : kind === 'mind' ? ['mind', 'board'] : ['calm', 'session'];
  serial++;
  return { ...meta, id: `f${String(serial).padStart(4, '0')}`, mode: mode!, kind: k!, refId: String(serial), dayKey: day, inputs: kind === 'train' ? { xp: 60, workingSets: 6 } : {}, updatedAt: new Date(`${day}T09:00:00`).getTime() + serial };
};
const makeTrail = (id: string, places: number): Trail => {
  const ids = Array.from({ length: places }, (_, i) => `${id}-p${i}`);
  return {
    id, name: id === 'a' ? 'Trail A' : 'Trail B', region: 'Test',
    places: ids.map((place, i) => ({ id: place, name: place.toUpperCase(), kind: i === 0 ? 'start' : 'camp', regionLine: 'Test' })),
    legs: ids.slice(1).map((to, i) => ({ id: `${ids[i]}-${to}`, from: ids[i]!, to, landmark: { id: `${id}-mark-${i}`, name: `Mark ${i}`, kind: 'river' }, postcard: { lines: ['One.', 'Two.'] }, sources: ['https://example.org/a'], constellation: `${id} kite ${i}` })),
  };
};
const A = makeTrail('a', 6); // 5 legs, 15 stretches, 150 jar min
const B = makeTrail('b', 7); // 6 legs
const FROM = '2026-11-01';
const day = (n: number) => { const date = new Date(`${FROM}T12:00:00`); date.setDate(date.getDate() + n); return date.toISOString().slice(0, 10); };
/** `count` jar sessions of 10 min, 6 a day (the cap), the first of each day a Mind board (it opens that leg's gate). */
const jarDays = (count: number, startDay = 0) => Array.from({ length: count }, (_, i) => fact(i % 6 === 0 ? 'mind' : 'calm', day(startDay + Math.floor(i / 6))));
const jar = { from: FROM, focus: [] };
const strip = <T extends { journey?: unknown }>(trek: T) => { const rest: Partial<T> = { ...trek }; delete rest.journey; return rest; };

describe('spec 575: trail after trail', () => {
  it('the test trails are valid trails', () => {
    expect(trailErrors(A)).toEqual([]);
    expect(trailErrors(B)).toEqual([]);
  });

  it('with one trail it is exactly deriveTrek', () => {
    const facts = jarDays(20);
    const today = day(5);
    expect(strip(deriveJourney(facts, [A], FROM, today, {}, jar)!)).toEqual(deriveTrek(facts, A, FROM, today, {}, jar));
  });

  it("Hampta is identical: while trail A is walked, a second trail changes nothing on A (jar fixture)", () => {
    for (const count of [0, 1, 7, 14]) {
      const facts = jarDays(count);
      const today = day(4);
      const one = deriveTrek(facts, A, FROM, today, {}, jar);
      const two = deriveJourney(facts, [A, B], FROM, today, {}, jar)!;
      expect(two.journey.index).toBe(0);
      expect([two.place, two.stretch, two.jar.carry]).toEqual([one.place, one.stretch, one.jar.carry]);
      expect(two.legs).toEqual(one.legs);
      expect(two.legs.filter(leg => leg.gateOn).length).toBe(one.legs.filter(leg => leg.gateOn).length);
      expect(two.climb).toEqual(one.climb);
    }
  });

  it('M1: 290 jar minutes land partway into trail B; A\'s postcards are identical; B matches the joined walk', () => {
    const facts = jarDays(29);
    const today = day(5);
    const alone = deriveTrek(facts, A, FROM, today, {}, jar);
    const trek = deriveJourney(facts, [A, B], FROM, today, {}, jar)!;
    expect(alone.complete).toBe(true);
    expect(trek.journey.index).toBe(1);
    expect(trek.trail.id).toBe('b');
    // 290 - 150 = 140 min on B: 14 stretches = 4 camps and 2 stretches.
    expect([trek.place, trek.stretch, trek.complete]).toEqual([4, 2, false]);
    expect(trek.journey.walked[0]!.legs.map(leg => [leg.doneOn, leg.gateOn])).toEqual(alone.legs.map(leg => [leg.doneOn, leg.gateOn]));
    // B's state is the joined walk's B legs, rebased to B (a fresh derivation over the same ledger).
    const joined = deriveTrek(facts, { ...A, legs: [...A.legs, ...B.legs] }, FROM, today, {}, jar);
    expect(trek.legs.map(leg => leg.stretches.length)).toEqual(joined.legs.slice(5).map(leg => leg.stretches.length));
    expect(trek.legs.map(leg => leg.index)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(trek.climb.settled).toBe(14);
    expect(trailSwitchLine(trek, false)).toBe('Your walking carried you on to Trail B.');
    expect(trailSwitchLine(trek, true)).toBeNull();
  });

  it('trail k+1 starts exactly where k ended: 150 min puts the group at B\'s start with "Next: Trail B"', () => {
    const trek = deriveJourney(jarDays(15), [A, B], FROM, day(3), {}, jar)!;
    expect([trek.journey.index, trek.place, trek.stretch, trek.jar.carry]).toEqual([1, 0, 0, 0]);
    expect(trek.journey.walked[0]!.legs.every(leg => leg.doneOn)).toBe(true);
    expect(trailSwitchLine(trek, false)).toBe('Next: Trail B');
    // One more session is B's first stretch, never A's.
    const next = deriveJourney([...jarDays(15), fact('calm', day(3))], [A, B], FROM, day(3), {}, jar)!;
    expect([next.journey.index, next.place, next.stretch]).toEqual([1, 0, 1]);
  });

  it('M2: the mixed legacy + jar walk carries across the switch in both modes', () => {
    // Before jarFrom: one stretch a session, one place a day. 5 legacy days walk A's 5 legs (3 sessions a day).
    const legacyFrom = '2026-10-20';
    const legacy = Array.from({ length: 15 }, (_, i) => fact(i % 3 === 0 ? 'mind' : 'train', `2026-10-${String(20 + Math.floor(i / 3)).padStart(2, '0')}`));
    const facts = [...legacy, ...jarDays(4)];
    const today = day(1);
    const alone = deriveTrek(facts, A, legacyFrom, today, {}, jar);
    const trek = deriveJourney(facts, [A, B], legacyFrom, today, {}, jar)!;
    expect(alone.complete).toBe(true);
    expect(trek.journey.walked[0]!.legs).toEqual(alone.legs);
    expect([trek.journey.index, trek.place, trek.stretch]).toEqual([1, 1, 1]);
    // Part legacy, part jar: A half walked the old way, then jar minutes finish A and walk on into B.
    const half = [...legacy.slice(0, 6), ...jarDays(9)];
    const mixed = deriveJourney(half, [A, B], legacyFrom, day(3), {}, jar)!;
    expect(strip(deriveJourney(half, [A], legacyFrom, day(3), {}, jar)!).legs).toEqual(mixed.journey.walked[0]!.legs);
    expect([mixed.journey.index, mixed.place, mixed.stretch]).toEqual([1, 0, 0]);
  });

  it('a running focus walks on through the switch on the same route (trek.ts:141)', () => {
    const facts = jarDays(14);
    const now = new Date(`${day(3)}T10:30:00`).getTime();
    const focus = [{ ...meta, id: 'run', taskId: 't', startedAt: new Date(`${day(3)}T10:00:00`).getTime(), updatedAt: 1 }];
    const trek = deriveJourney(facts, [A, B], FROM, day(3), {}, { from: FROM, focus, focusRateFrom: FROM, now })!;
    // 140 settled on A (14 of 15 stretches); the running focus's 10 earned minutes finish A, but the trail on screen
    // stays A until the focus ends, and the climb never passes A's end.
    expect(trek.journey.index).toBe(0);
    expect(trek.climb.settled).toBe(14);
    expect(trek.climb.at).toBe(15);
  });

  it('must 3: the neem keeps every tag through the switch, in walking order', () => {
    const before = deriveJourney(jarDays(15), [A, B], FROM, day(3), {}, jar)!;
    const after = deriveJourney(jarDays(29), [A, B], FROM, day(5), {}, jar)!;
    const aTags = treeKeepsakes(before).map(tag => tag.campId);
    expect(aTags).toEqual(['a-p1', 'a-p2', 'a-p3', 'a-p4', 'a-p5']);
    const tags = treeKeepsakes(after);
    expect(tags.map(tag => tag.campId)).toEqual([...aTags, 'b-p1', 'b-p2', 'b-p3', 'b-p4']);
    expect(tags.map(tag => tag.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(tags.slice(0, 5)).toEqual(treeKeepsakes(before));
  });

  it('the last trail ends complete, and the constellations shown are its own', () => {
    const trek = deriveJourney(jarDays(70), [A, B], FROM, day(12), {}, jar)!;
    expect([trek.journey.index, trek.complete, trek.place]).toEqual([1, true, 6]);
    expect(trek.constellations.every(row => row.leg >= 0 && row.leg < B.legs.length && row.id.startsWith('b-'))).toBe(true);
    expect(trek.stars.every(star => star.leg >= 0 && star.leg < B.legs.length)).toBe(true);
  });
});
