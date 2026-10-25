import { describe, expect, it } from 'vitest';
import type { PuzzleBoard, PuzzleType } from './index';
import { loadPortedGenerator } from '../ported-test-loader.js';
import { brokenRules, checkRules, type PuzzleState } from './rules';
import { availableDeductions } from './deduction';
import { featuredSpec } from './daily';
import { SHELF, shelfLevel, shelfSeedText, shelfSolvedToday } from './shelf';
import { dayKey } from '../time';

const PZ = loadPortedGenerator(new URL('./puzzles.js', import.meta.url), 'PZ') as typeof import('./puzzles.js').default & { _test: Record<string, (...args: unknown[]) => number> };
const types: PuzzleType[] = ['sudoku', 'crowns', 'sunmoon', 'path', 'calc'];
const build = (type: PuzzleType, diff: 'easy' | 'medium' | 'hard', text: string) => {
  const seed = PZ.hash(text);
  for (let attempt = 0; attempt < 6; attempt++) { const board = PZ.generate(type, { seed: (seed + attempt * 7919) >>> 0, diff }); if (board) return board; }
  return null;
};
const solved = (board: PuzzleBoard): PuzzleState => board.type === 'path' ? { grid: [], path: board.solution.slice() }
  : board.type === 'crowns' ? { grid: Array.from({ length: board.N * board.N }, (_, i) => board.solution[Math.floor(i / board.N)] === i % board.N ? 2 : 0), path: [] }
    : { grid: board.solution.slice(), path: [] };
const unique = (board: PuzzleBoard) => {
  const T = PZ._test;
  if (board.type === 'sudoku') return T.sdkCount!(board.givens, 2);
  if (board.type === 'crowns') return T.crownCount!(board.N, board.region, 2);
  if (board.type === 'sunmoon') return T.binCount!({ given: board.given, hs: board.hs, vs: board.vs }, 2);
  if (board.type === 'path') return T.pathCount!(board.R, board.C, board.waypoints, 2);
  return T.calcCount!(board.N, board.cages.map(cage => ({ ...cage, tuples: (PZ._test as unknown as { cageTuples: (c: unknown, n: number) => number[][] }).cageTuples(cage, board.N) })), 2);
};

describe("spec 29 Kapi's shelf", () => {
  it('lists every board Mind has, each with one plain line', () => {
    expect(SHELF.map(item => item.type).sort()).toEqual([...types].sort());
    for (const item of SHELF) expect(item.line.split(' ').length).toBeLessThanOrEqual(12);
  });
  it('the daily seed follows the planning day: 03:59 is still the day before, and a reload builds the same board', () => {
    expect(dayKey(new Date('2026-11-05T03:59:00'))).toBe('2026-11-04');
    const a = build('crowns', 'easy', shelfSeedText(dayKey(new Date('2026-11-05T03:59:00')), 'crowns', 'easy', 0));
    const b = build('crowns', 'easy', shelfSeedText('2026-11-04', 'crowns', 'easy', 0));
    expect(a).toEqual(b);
    expect(shelfSeedText('2026-11-04', 'crowns', 'easy', 0)).toBe('daily:2026-11-04:crowns:easy');
    expect(shelfSeedText('2026-11-04', 'crowns', 'easy', 1)).not.toBe(shelfSeedText('2026-11-04', 'crowns', 'easy', 2));
  });
  it('every shelf board of every type has exactly one solution (daily and both extras, a week of days)', () => {
    for (const type of types) for (let d = 1; d <= 7; d++) for (const index of [0, 1, 2]) {
      const day = `2026-11-0${d}`;
      const board = build(type, 'easy', shelfSeedText(day, type, 'easy', index));
      expect(board, `${type} ${day} ${index}`).not.toBeNull();
      expect(unique(board!), `${type} ${day} ${index}`).toBe(1);
    }
  });
  it('the first boards stay easy, the level never changes mid-day, and the featured type keeps its daily level', () => {
    const day = '2026-11-03'; // a Tuesday
    const featured = featuredSpec(day);
    const other = types.find(type => type !== featured.type)!;
    const solvedOn = (dayKey: string) => ({ type: other, dayKey, result: 'solved', deleted: 0, daily: true });
    expect(shelfLevel(other, [], day)).toBe('easy');
    expect(shelfLevel(other, [solvedOn('2026-11-01'), solvedOn('2026-11-02'), solvedOn(day)], day)).toBe('easy');
    expect(shelfLevel(other, [solvedOn('2026-10-30'), solvedOn('2026-11-01'), solvedOn('2026-11-02')], day)).toBe(other === 'sunmoon' ? 'hard' : 'medium');
    // The ramp comes first, for the featured type too (Codex B item 105).
    expect(shelfLevel(featured.type, [], day)).toBe('easy');
    const featuredSolved = (dayKey: string) => ({ type: featured.type, dayKey, result: 'solved', deleted: 0, daily: true });
    expect(shelfLevel(featured.type, [featuredSolved('2026-10-30'), featuredSolved('2026-11-01')], day)).toBe('easy');
    expect(shelfLevel(featured.type, ['2026-10-29', '2026-10-30', '2026-11-01'].map(featuredSolved), day)).toBe(featured.diff);
  });
  it('counts the daily board and the shelf extras of today only', () => {
    const rows = [
      { type: 'crowns', dayKey: '2026-11-03', result: 'solved', daily: true },
      { type: 'crowns', dayKey: '2026-11-03', result: 'solved', shelf: true },
      { type: 'crowns', dayKey: '2026-11-03', result: 'solved' }, // More boards practice, not the shelf
      { type: 'crowns', dayKey: '2026-11-03', shelf: true },
      { type: 'crowns', dayKey: '2026-11-02', result: 'solved', daily: true },
    ];
    expect(shelfSolvedToday('crowns', rows, '2026-11-03')).toBe(2);
  });
});

describe('spec 29 Check and hints', () => {
  it('Check names each broken rule, and its cells are exactly the cells the rules mark', () => {
    for (const type of types) for (let seed = 0; seed < 6; seed++) {
      const board = build(type, 'easy', `check:${type}:${seed}`)!;
      const right = solved(board);
      expect(brokenRules(board, right)).toEqual([]);
      const length = board.type === 'path' ? right.path.length : right.grid.length;
      for (let i = 0; i < length; i += 3) {
        const broken = { grid: right.grid.slice(), path: right.path.slice() };
        if (board.type === 'path') broken.path[i] = broken.path[(i + 1) % length]!;
        else if (board.type === 'crowns') broken.grid[i] = broken.grid[i] === 2 ? 0 : 2;
        else if (board.type === 'sunmoon') broken.grid[i] = broken.grid[i] === 1 ? 0 : 1;
        else broken.grid[i] = broken.grid[i] === 1 ? 2 : 1;
        const rules = brokenRules(board, broken);
        expect([...new Set(rules.flatMap(item => item.cells))].sort((a, b) => a - b)).toEqual(checkRules(board, broken).conflicts);
        for (const item of rules) expect(item.rule).toMatch(/^[A-Z].*\.$/);
      }
    }
  });
  it('says which rule in plain words', () => {
    const crowns: PuzzleBoard = { type: 'crowns', diff: 'easy', seed: 0, N: 4, region: [0, 0, 1, 1, 0, 0, 1, 1, 2, 2, 3, 3, 2, 2, 3, 3], solution: [] };
    expect(brokenRules(crowns, { grid: [2, 0, 0, 2, ...Array(12).fill(0)], path: [] })).toEqual([{ rule: 'Two crowns in row 1.', cells: [0, 3] }]);
    expect(brokenRules(crowns, { grid: [2, 0, 0, 0, 0, 2, ...Array(10).fill(0)], path: [] })[0]!.rule).toBe('Two crowns in one colour.');
    const sudoku: PuzzleBoard = { type: 'sudoku', diff: 'easy', seed: 0, N: 4, br: 2, bc: 2, givens: Array(16).fill(0), solution: [] };
    expect(brokenRules(sudoku, { grid: [3, 0, 0, 0, 3, ...Array(11).fill(0)], path: [] })[0]!.rule).toBe('Two 3s in column 1.');
  });
  it('a hint never fills more than one cell', () => {
    for (const type of types) for (let seed = 0; seed < 6; seed++) {
      const board = build(type, 'easy', `hint:${type}:${seed}`)!;
      const start: PuzzleState = { grid: board.type === 'sudoku' ? board.givens.slice() : board.type === 'sunmoon' ? board.given.slice() : board.type === 'path' ? [] : Array(board.N * board.N).fill(0), path: [] };
      for (const deduction of availableDeductions(board, start).slice(0, 5)) {
        expect(Number.isInteger(deduction.cell)).toBe(true);
        const next = board.type === 'path' ? { ...start, path: [...start.path, deduction.cell] } : { ...start, grid: start.grid.map((value, index) => index === deduction.cell ? deduction.value : value) };
        const changed = board.type === 'path' ? next.path.length - start.path.length : next.grid.filter((value, i) => value !== start.grid[i]).length;
        expect(changed).toBeLessThanOrEqual(1);
      }
    }
  });
});
