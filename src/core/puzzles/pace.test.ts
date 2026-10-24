import { describe, expect, it } from 'vitest';
import PZ from '.';
import { bestPace, completePace, decodePace, encodePace, fillFraction, nextPace, paceAt, PACE_MARKS } from './pace';
import { challengeRoute, parseChallenge } from './challenge';
import { canonicalRoute } from '../../ui/shell/router';
import { initialGrid } from '../../data/repos/puzzleRuns';
import type { PuzzleRunRow } from '../../data/types';

const marks = [10_000, 20_000, 31_000, 40_000, 52_000, 60_000, 75_000, 90_000, 120_000, 250_000];

describe('pace line (spec 24, cj5-mind §7.1)', () => {
  it('counts only open cells as filled, for every board type', () => {
    for (const type of ['sudoku', 'crowns', 'sunmoon', 'path', 'calc'] as const) {
      const board = PZ.generate(type, { seed: 41, diff: 'easy' })!;
      const empty = { grid: initialGrid(board), path: [] };
      expect(fillFraction(board, empty), type).toBe(0);
      const solved = type === 'path' ? { grid: [], path: board.solution.slice() }
        : board.type === 'crowns' ? { grid: Array(board.N * board.N).fill(0).map((_, i) => board.solution[Math.floor(i / board.N)] === i % board.N ? 2 : 0), path: [] }
          : { grid: board.solution.slice(), path: [] };
      expect(fillFraction(board, solved), type).toBe(1);
    }
  });
  it('only rises: a cleared board keeps its marks, and a solve fills the rest with the solve time', () => {
    let pace = nextPace(undefined, 0.25, 30_000);
    expect(pace).toEqual([30_000, 30_000]);
    pace = nextPace(pace, 0, 45_000);
    expect(pace).toEqual([30_000, 30_000]);
    pace = nextPace(pace, 0.31, 50_000);
    expect(pace).toEqual([30_000, 30_000, 50_000]);
    pace = nextPace(pace, 0.9, 80_000, true);
    expect(pace).toHaveLength(PACE_MARKS);
    expect(pace.slice(3).every(value => value === 80_000)).toBe(true);
    expect(completePace(pace)).toBe(true);
  });
  it("reads how far the other run had got, between marks, never past the end", () => {
    expect(paceAt(marks, 0)).toBe(0);
    expect(paceAt(marks, 5_000)).toBeCloseTo(0.05);
    expect(paceAt(marks, 20_000)).toBeCloseTo(0.2);
    expect(paceAt(marks, 185_000)).toBeCloseTo(0.95);
    expect(paceAt(marks, 999_000)).toBe(1);
    expect(paceAt([1, 2], 10)).toBe(0);
  });
  it('travels in the link as one a-z0-9 segment that older parsers ignore', () => {
    const segment = encodePace(marks)!;
    expect(segment).toMatch(/^p[0-9a-z]{30}$/);
    expect(decodePace(segment)).toEqual(marks);
    const route = challengeRoute({ type: 'crowns', diff: 'medium', seed: 797416356, day: '2026-11-05', pace: marks });
    expect(canonicalRoute(`#${route}`)).toBe(route);
    expect(parseChallenge(route.slice('mind/'.length))).toEqual({ type: 'crowns', diff: 'medium', seed: 797416356, day: '2026-11-05', pace: marks });
    // The same link read the way older versions did: day, then type/diff/seed, and nothing after.
    const [, day, type, diff, seed] = route.slice('mind/'.length).split('/');
    expect([day, type, diff, seed]).toEqual(['20261105', 'crowns', 'medium', '797416356']);
    // Also without a day, and a broken segment never refuses the board.
    expect(parseChallenge(`challenge/crowns/medium/7/${segment}`)).toEqual({ type: 'crowns', diff: 'medium', seed: 7, pace: marks });
    expect(parseChallenge('challenge/crowns/medium/7/pzz')).toEqual({ type: 'crowns', diff: 'medium', seed: 7 });
    expect(decodePace(`p${'0'.repeat(27)}zzz`.replace(/^p.{3}/, 'pzzz'))).toBeUndefined();
    expect(encodePace([1, 2, 3])).toBeUndefined();
  });
  it('picks your fastest solved run of the same type and difficulty that has marks', () => {
    const run = (id: string, solveMs: number, pace?: number[], extra: Partial<PuzzleRunRow> = {}): PuzzleRunRow => ({ id, type: 'crowns', diff: 'medium', result: 'solved', solveMs, pace, updatedAt: 1, deleted: 0, deviceId: 'd', ...extra });
    const fast = marks.map(value => value / 2);
    const runs = [run('a', 250_000, marks), run('b', 125_000, fast), run('c', 60_000), run('d', 50_000, fast, { diff: 'hard' }), run('e', 40_000, fast, { deleted: 1 })];
    expect(bestPace(runs, 'crowns', 'medium')).toEqual({ marks: fast, solveMs: 125_000 });
    expect(bestPace(runs, 'crowns', 'medium', 'b')).toEqual({ marks, solveMs: 250_000 });
    expect(bestPace(runs, 'sudoku', 'medium')).toBeUndefined();
  });
});
