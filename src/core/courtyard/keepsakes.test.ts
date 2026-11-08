import { describe, expect, it } from 'vitest';
import type { LedgerRow } from '../../data/types';
import { deriveTrek } from '../yatra/trek';
import type { Trail } from '../yatra/trail';
import { BOARD_FROM, keepsakeSpots, TAG_H, TAG_W, treeKeepsakes } from './keepsakes';
import raw from '../../ui/courtyard/anchors.json';

// Spec 571 §0.14: one keepsake per reached camp, derived (never stored), keyed by camp id, never removed.
const place = (id: string, kind: 'start' | 'camp' | 'pass' = 'camp') => ({ id, name: id[0]!.toUpperCase() + id.slice(1), kind, regionLine: 'Test' });
const kinds = ['river', 'meadow', 'glacier', 'pass', 'river'];
const ids = ['jobra', 'chika', 'balu', 'pass', 'shea', 'chatru'];
const trail: Trail = { id: 't', name: 'T', region: 'R', places: ids.map((id, i) => place(id, i === 0 ? 'start' : id === 'pass' ? 'pass' : 'camp')),
  legs: ids.slice(1).map((id, i) => ({ id: `${ids[i]}-${id}`, from: ids[i]!, to: id, landmark: { id: `mark-${i}`, name: `Mark ${i}`, kind: kinds[i]! }, postcard: { lines: ['One.', 'Two.'] }, sources: ['https://example.org'] })) } as unknown as Trail;
let n = 0;
const session = (dayKey: string): LedgerRow => ({ id: `f${String(++n).padStart(3, '0')}`, dayKey, mode: 'calm', kind: 'session', refId: 'r', inputs: { minutes: 10 }, updatedAt: n, deleted: 0, deviceId: 'd' });
/** Three sessions a day: one camp a day. */
const days = (count: number) => Array.from({ length: count }, (_, day) => [0, 1, 2].map(() => session(`2026-10-${String(10 + day).padStart(2, '0')}`))).flat();
const tags = (facts: LedgerRow[]) => treeKeepsakes(deriveTrek(facts, trail, '2026-10-01', '2026-10-31'));

describe('§0.14 neem keepsakes: derived from the trek', () => {
  it('one tag per reached camp, keyed by camp id, with the leg’s landmark as its postcard and motif', () => {
    expect(tags([])).toEqual([]);
    expect(tags(days(1))).toEqual([{ campId: 'chika', campName: 'Chika', landmarkId: 'mark-0', motif: 'river', index: 0, reachedOn: '2026-10-10' }]);
    expect(tags(days(3)).map(tag => [tag.campId, tag.motif])).toEqual([['chika', 'river'], ['balu', 'meadow'], ['pass', 'glacier']]);
    // Two sessions short of a camp hang nothing.
    expect(tags([...days(1), session('2026-10-11'), session('2026-10-11')]).map(tag => tag.campId)).toEqual(['chika']);
  });

  it('a restore (the same rows back, in any order) and a re-run give the same tags; nothing is duplicated or dropped', () => {
    const facts = days(4);
    const before = tags(facts);
    const restored = JSON.parse(JSON.stringify(facts)) as LedgerRow[];
    expect(tags([...restored].reverse())).toEqual(before);
    expect(tags(restored)).toEqual(before);
    expect(new Set(before.map(tag => tag.campId)).size).toBe(before.length);
  });

  it('never removed: more days only add tags after the ones already hanging', () => {
    const facts = days(2);
    const first = tags(facts);
    const later = tags([...facts, ...days(5).slice(6)]);
    expect(later.slice(0, first.length)).toEqual(first);
    expect(later.length).toBeGreaterThan(first.length);
  });
});

describe('§0.14 neem keepsakes: where they hang', () => {
  it('at stage 5 the first four sit on the bole exactly where p9p puts them (neem-keepsake-tag-1..4)', () => {
    const rects = [1, 2, 3, 4].map(i => raw.prop_rects_css[`neem-keepsake-tag-${i}` as keyof typeof raw.prop_rects_css] as number[]);
    const spots = keepsakeSpots(4, 5, rects);
    spots.forEach((spot, i) => {
      const rect = rects[i]!;
      expect(spot.on).toBe('trunk');
      expect(Math.abs(spot.x - rect[0]!), `tag ${i + 1} x`).toBeLessThan(0.01);
      expect(Math.abs(spot.y - rect[1]!), `tag ${i + 1} y`).toBeLessThan(0.01);
    });
    expect([TAG_W, TAG_H]).toEqual([7.2, 13.7]);
  });

  it('on a young tree the tags sit low and move up as it grows; a sapling’s sit on the platform', () => {
    expect(keepsakeSpots(3, 0).map(spot => spot.on)).toEqual(['platform', 'platform', 'platform']);
    const young = keepsakeSpots(5, 1), grown = keepsakeSpots(5, 5);
    // A stage-1 trunk holds fewer: the rest wait on the peg-board until the tree grows.
    expect(young.filter(spot => spot.on === 'trunk').length).toBeLessThan(grown.filter(spot => spot.on === 'trunk').length);
    expect(grown.every(spot => spot.on === 'trunk')).toBe(true);
  });

  it(`from the ${BOARD_FROM}th tag on, they go on the peg-board at the tree’s foot (never a string between branches)`, () => {
    const spots = keepsakeSpots(14, 5);
    expect(spots.slice(BOARD_FROM - 1).every(spot => spot.on === 'board')).toBe(true);
    // No two tags on the board overlap.
    const board = spots.filter(spot => spot.on === 'board');
    for (let a = 0; a < board.length; a++) for (let b = a + 1; b < board.length; b++) expect(Math.abs(board[a]!.x - board[b]!.x) >= 7 || Math.abs(board[a]!.y - board[b]!.y) >= 9).toBe(true);
  });
});
