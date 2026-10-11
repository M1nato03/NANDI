import type { MysteryCase } from './index';
import CaseGen from './index';

export type CaseGrid = {
  A: number[];
  B: number[];
  C: number[];
  struck: number[];
};
export type Accusation = { s: number; i: number; p: number };

export function emptyCaseGrid(n: number): CaseGrid {
  return {
    A: Array(n * n).fill(0),
    B: Array(n * n).fill(0),
    C: Array(n * n).fill(0),
    struck: [],
  };
}

export function cycleMark(value: number): number {
  return value === 0 ? -1 : value === -1 ? 1 : 0;
}

export function caseGridMistakes(
  mystery: MysteryCase,
  grid: CaseGrid,
): string[] {
  const wrong: string[] = [];
  const expected = (name: 'A' | 'B' | 'C', row: number, col: number) =>
    name === 'A'
      ? mystery.sol.sp[row] === col
      : name === 'B'
        ? mystery.sol.si[row] === col
        : mystery.sol.sp[mystery.sol.si.indexOf(row)] === col;
  for (const name of ['A', 'B', 'C'] as const)
    for (let row = 0; row < mystery.n; row++)
      for (let col = 0; col < mystery.n; col++) {
        const mark = grid[name][row * mystery.n + col];
        if (mark && (mark === 1) !== expected(name, row, col))
          wrong.push(`${name}:${row}:${col}`);
      }
  return wrong;
}

function placements(grid: number[], n: number): number[] | null {
  const chosen = Array.from({ length: n }, (_, row) => {
    const cols = Array.from({ length: n }, (_, col) => col).filter(
      (col) => grid[row * n + col] === 1,
    );
    return cols.length === 1 ? cols[0]! : -1;
  });
  return chosen.every((col) => col >= 0) && new Set(chosen).size === n
    ? chosen
    : null;
}

export function checkCaseGrid(
  mystery: MysteryCase,
  grid: CaseGrid,
): { complete: boolean; valid: boolean } {
  const sp = placements(grid.A, mystery.n),
    si = placements(grid.B, mystery.n);
  if (!sp || !si) return { complete: false, valid: false };
  const marked = (matrix: number[], row: number, col: number) =>
    matrix[row * mystery.n + col];
  for (let s = 0; s < mystery.n; s++)
    for (let col = 0; col < mystery.n; col++) {
      if (marked(grid.A, s, col) === (sp[s] === col ? -1 : 1))
        return { complete: true, valid: false };
      if (marked(grid.B, s, col) === (si[s] === col ? -1 : 1))
        return { complete: true, valid: false };
    }
  for (let i = 0; i < mystery.n; i++)
    for (let p = 0; p < mystery.n; p++) {
      if (marked(grid.C, i, p) === (sp[si.indexOf(i)] === p ? -1 : 1))
        return { complete: true, valid: false };
    }
  return {
    complete: true,
    valid: mystery.clues.every((clue) => CaseGen.holds(clue, sp, si)),
  };
}

export function accusationIsCorrect(
  mystery: MysteryCase,
  grid: CaseGrid,
  pick: Accusation,
): boolean {
  const result = checkCaseGrid(mystery, grid);
  if (!result.valid) return false;
  const sp = placements(grid.A, mystery.n)!,
    si = placements(grid.B, mystery.n)!;
  const culprit =
    mystery.killer.k === 'place'
      ? sp.indexOf(mystery.killer.idx)
      : si.indexOf(mystery.killer.idx);
  return pick.s === culprit && pick.i === si[culprit] && pick.p === sp[culprit];
}
