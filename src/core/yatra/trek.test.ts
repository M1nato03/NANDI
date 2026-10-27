import { describe, expect, it } from 'vitest';
import type { LedgerRow } from '../../data/types';
import { deriveTrek, trekLine } from './trek';
import { trailErrors, type Trail } from './trail';

// A test trail only (the shipped one comes from the idea engine, every fact sourced).
const place = (id: string, kind: 'start' | 'camp' | 'pass' = 'camp') => ({ id, name: id[0]!.toUpperCase() + id.slice(1), kind, region: 'Test' });
const leg = (from: string, to: string, n: number) => ({ from, to, landmark: { id: `mark-${n}`, name: `Mark ${n}`, kind: 'bridge' }, postcard: { lines: ['One.', 'Two.'], sources: ['https://example.org/a'] }, constellation: `The ${to} Kite` });
const ids = ['jobra', 'chika', 'balu', 'pass', 'shea', 'chatru'];
const trail: Trail = { id: 'test-trail', title: 'Test trail', region: 'Test', places: ids.map((id, i) => place(id, i === 0 ? 'start' : id === 'pass' ? 'pass' : 'camp')), legs: ids.slice(1).map((id, i) => leg(ids[i]!, id, i + 1)) };
let n = 0;
const fact = (dayKey: string, kind: 'train' | 'mind' | 'calm' | 'other'): LedgerRow => {
  n++;
  const [mode, k] = kind === 'train' ? ['train', 'session'] : kind === 'mind' ? ['mind', 'board'] : kind === 'calm' ? ['calm', 'session'] : ['tasks', 'done'];
  return { id: `f${String(n).padStart(3, '0')}`, dayKey, mode: mode!, kind: k!, refId: 'r', inputs: {}, updatedAt: n, deleted: 0, deviceId: 'd' };
};

describe('spec 34 trail file', () => {
  it('accepts the test trail and names what a shipped trail must not lack', () => {
    expect(trailErrors(trail)).toEqual([]);
    const short = { ...trail, places: trail.places.slice(0, 5), legs: trail.legs.slice(0, 4) };
    expect(trailErrors(short)).toContain('a trail has 6-10 places, this one has 5');
    const unsourced = { ...trail, legs: trail.legs.map((row, i) => i === 1 ? { ...row, postcard: { lines: ['Only one.'], sources: [] } } : row) };
    expect(trailErrors(unsourced)).toEqual(['leg 2 postcard has 2-3 lines', 'leg 2 postcard needs at least one https source']);
  });
});

describe('spec 34 trek', () => {
  it('moves one stretch a session, reaches a place after three, and says where in words', () => {
    const facts = [fact('2026-10-28', 'train'), fact('2026-10-28', 'calm')];
    const trek = deriveTrek(facts, trail, '2026-10-28', '2026-10-28');
    expect([trek.place, trek.stretch]).toEqual([0, 2]);
    expect(trekLine(trek)).toBe('Stretch 2 of 3 to Chika');
    expect(trek.today.stars.map(star => star.kind)).toEqual(['train', 'calm']);
    const next = deriveTrek([...facts, fact('2026-10-28', 'mind')], trail, '2026-10-28', '2026-10-28');
    expect([next.place, next.stretch, next.legs[0]!.doneOn]).toEqual([1, 0, '2026-10-28']);
    expect(trekLine(next)).toBe('At Chika. Next: Balu');
  });

  it('reaching a place ends the day\'s walk; later sessions that day only light stars over that camp', () => {
    const day = '2026-10-28';
    const trek = deriveTrek([fact(day, 'train'), fact(day, 'train'), fact(day, 'train'), fact(day, 'mind'), fact(day, 'calm')], trail, day, day);
    expect([trek.place, trek.stretch]).toEqual([1, 0]);
    expect(trek.today.stars).toHaveLength(5);
    expect(trek.today.stars.map(star => star.leg)).toEqual([0, 0, 0, 0, 0]);
    expect(trek.today.stars.map(star => star.stretch)).toEqual([true, true, true, false, false]);
    // The after-camp Mind session did not walk, so it opened no gate.
    expect(trek.legs[0]!.gateOn).toBeUndefined();
  });

  it('only the first Mind session that walks a leg opens its gate (item 192 h)', () => {
    const trek = deriveTrek([fact('2026-10-28', 'mind'), fact('2026-10-28', 'mind'), fact('2026-10-29', 'calm')], trail, '2026-10-28', '2026-10-29');
    expect(trek.legs[0]!.gateOn).toBe('2026-10-28');
    expect(trek.legs[1]!.gateOn).toBeUndefined();
  });

  it('a day with no session is a camp day, and unfinished stretches carry over', () => {
    const trek = deriveTrek([fact('2026-10-28', 'train')], trail, '2026-10-28', '2026-10-30');
    expect(trek.today).toEqual({ stars: [], campDay: true, atPlace: false });
    expect(trek.stretch).toBe(1);
  });

  it('counts only Train sessions, solved boards or cases, and Calm, from the start day on', () => {
    const trek = deriveTrek([fact('2026-10-27', 'train'), fact('2026-10-28', 'other'), { ...fact('2026-10-28', 'train'), deleted: 1 }, fact('2026-10-28', 'calm')], trail, '2026-10-28', '2026-10-28');
    expect(trek.stars.map(star => star.kind)).toEqual(['calm']);
  });

  it("a finished leg's stars form its constellation, under the user's name when one is given", () => {
    const day = '2026-10-28';
    const facts = [fact(day, 'train'), fact(day, 'mind'), fact(day, 'calm'), fact(day, 'calm')];
    const trek = deriveTrek(facts, trail, day, day);
    expect(trek.constellations).toEqual([expect.objectContaining({ id: 'mark-1', leg: 0, name: 'The chika Kite', formedOn: day })]);
    expect(trek.constellations[0]!.stars).toHaveLength(4);
    expect(deriveTrek(facts, trail, day, day, { 'mark-1': 'Our kite' }).constellations[0]!.name).toBe('Our kite');
  });

  it('a leg still walking after a week closes that week into a constellation; a lone star stays a star', () => {
    const trek = deriveTrek([fact('2026-10-28', 'train'), fact('2026-10-30', 'calm'), fact('2026-11-06', 'mind')], trail, '2026-10-28', '2026-11-06');
    expect(trek.stretch).toBe(0);
    expect(trek.constellations.map(row => [row.id, row.stars.length, row.formedOn])).toEqual([['mark-1', 2, '2026-11-03']]);
  });

  it('after the last place the trail is complete and sessions keep lighting stars there', () => {
    const facts = Array.from({ length: 5 }, (_, day) => [0, 1, 2].map(() => fact(`2026-11-0${day + 1}`, 'train'))).flat();
    const trek = deriveTrek([...facts, fact('2026-11-06', 'calm')], trail, '2026-11-01', '2026-11-06');
    expect(trek.complete).toBe(true);
    expect(trekLine(trek)).toBe('Test trail: trail complete');
    expect(trek.today.stars).toEqual([expect.objectContaining({ kind: 'calm', leg: 4, stretch: false })]);
  });
});
