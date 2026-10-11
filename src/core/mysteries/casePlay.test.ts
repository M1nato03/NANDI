import { describe, expect, it } from 'vitest';
import CaseGen from './index';
import { accusationIsCorrect, caseGridMistakes, checkCaseGrid, cycleMark, emptyCaseGrid } from './casePlay';

describe('daily case play', () => {
  const mystery = CaseGen.daily('2026-10-11', 'easy')!;
  it('cycles marks and checks relationships from clues', () => {
    const grid = emptyCaseGrid(mystery.n);
    expect(cycleMark(cycleMark(cycleMark(0)))).toBe(0);
    expect(checkCaseGrid(mystery, grid).complete).toBe(false);
    for (let s = 0; s < mystery.n; s++) {
      grid.A[s * mystery.n + mystery.sol.sp[s]!] = 1;
      grid.B[s * mystery.n + mystery.sol.si[s]!] = 1;
    }
    expect(checkCaseGrid(mystery, grid).complete).toBe(true);
    expect(checkCaseGrid(mystery, grid).valid).toBe(true);
    grid.A[0] = grid.A[0] === 1 ? -1 : 1;
    expect(checkCaseGrid(mystery, grid).valid).toBe(false);
    expect(caseGridMistakes(mystery, grid)).toContain('A:0:0');
  });
  it('checks the culprit against the key clue and consistent grid', () => {
    const grid = emptyCaseGrid(mystery.n);
    for (let s = 0; s < mystery.n; s++) {
      grid.A[s * mystery.n + mystery.sol.sp[s]!] = 1;
      grid.B[s * mystery.n + mystery.sol.si[s]!] = 1;
    }
    const culprit = mystery.culprit;
    expect(accusationIsCorrect(mystery, grid, { s: culprit, i: mystery.sol.si[culprit]!, p: mystery.sol.sp[culprit]! })).toBe(true);
    expect(accusationIsCorrect(mystery, grid, { s: (culprit + 1) % mystery.n, i: mystery.sol.si[culprit]!, p: mystery.sol.sp[culprit]! })).toBe(false);
  });
});
