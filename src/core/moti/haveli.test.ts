import { describe, expect, it } from 'vitest';
import { HAVELI_FACT, finishedIdeas, haveliPicks, haveliTiles, lastVisits, placeTile, type HaveliIdea } from './haveli';

const recall = { pieces: ['Give it weeks, and', 'do not worry about', 'one missed day.'], decoys: [{ text: 'Give it exactly 21 days, and', slot: 0, misconceptionId: 'm1', fix: 'Habit time varies.' }, { text: 'expect progress to vanish after', slot: 1, misconceptionId: 'm2', fix: 'One miss did not wipe it out.' }], claimIds: ['c2'] };
const idea = (id: string, steps = [`${id}-s1`, `${id}-s2`]): HaveliIdea => ({ id, title: id, topicId: 'psychology', topicTitle: 'Psychology', recall, steps });
const lesson = (stepId: string) => ({ kind: 'learn-lesson', refId: stepId, dayKey: '2026-10-20' });
const visit = (day: string, id: string) => ({ kind: 'card', refId: HAVELI_FACT(day, id), dayKey: day });

describe("spec 26 Moti's haveli", () => {
  it('only finished ideas with three pieces live in the haveli', () => {
    const ideas = [idea('a'), idea('b'), { ...idea('c'), recall: { ...recall, pieces: [] } }];
    expect(finishedIdeas(ideas, [lesson('a-s1'), lesson('a-s2'), lesson('b-s1')]).map(row => row.id)).toEqual(['a']);
  });
  it('picks due ideas first, then the oldest unvisited, deterministically, at most the cap', () => {
    const ideas = ['a', 'b', 'c', 'd', 'e', 'f'].map(id => idea(id));
    const now = Date.parse('2026-11-03T12:00:00');
    const due = new Map([['e', now - 10], ['c', now - 100], ['f', now + 1000]]);
    const facts = [visit('2026-10-30', 'a'), visit('2026-10-25', 'b')];
    expect(haveliPicks(ideas, facts, due, now, '2026-11-03', 4).map(row => row.id)).toEqual(['c', 'e', 'd', 'f']);
    expect(haveliPicks(ideas, facts, due, now, '2026-11-03', 4)).toEqual(haveliPicks([...ideas].reverse(), facts, due, now, '2026-11-03', 4));
  });
  it('a rebuilt idea stays lit today, and nothing ever dims: visits only add', () => {
    const ideas = ['a', 'b'].map(id => idea(id));
    const facts = [visit('2026-11-03', 'b'), visit('2026-10-01', 'a')];
    expect(haveliPicks(ideas, facts, new Map(), 0, '2026-11-03', 1).map(row => row.id)).toEqual(['b', 'a'].slice(0, 1));
    expect(lastVisits([...facts, visit('2026-10-02', 'a')]).get('a')).toBe('2026-10-02');
  });
  it('five tiles in a seeded order; pieces go in in order, a decoy shows its fix and costs nothing', () => {
    const tiles = haveliTiles(idea('a'), '2026-11-03:a');
    expect(tiles).toHaveLength(5);
    expect(haveliTiles(idea('a'), '2026-11-03:a')).toEqual(tiles);
    const decoy = tiles.find(tile => tile.kind === 'decoy')!;
    expect(placeTile(0, decoy)).toEqual({ placed: 0, fix: decoy.kind === 'decoy' ? decoy.fix : '', out: 'decoy' });
    const piece = (index: number) => tiles.find(tile => tile.kind === 'piece' && tile.index === index)!;
    expect(placeTile(0, piece(1)).out).toBe('later');
    let placed = 0;
    for (const index of [0, 1, 2]) placed = placeTile(placed, piece(index)).placed;
    expect(placed).toBe(3);
  });
});
