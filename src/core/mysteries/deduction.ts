import CaseGen, { type MysteryCase } from './index';
import { caseGridMistakes, type CaseGrid } from './casePlay';

export type CaseDeduction = { technique: string; cells: string[]; value: number; grid: 'A' | 'B' | 'C'; cell: number };

export function availableCaseDeductions(mystery: MysteryCase, grid: CaseGrid): CaseDeduction[] {
  if (caseGridMistakes(mystery, grid).length) return [];
  const result = CaseGen.propagate(mystery.clues, mystery.n, true, grid);
  if (result.bad) return [];
  return result.steps.filter(item => grid[item.g][item.r * mystery.n + item.c] === 0).map(step => ({
    technique: step.why.rule === 'clue' || step.why.rule === 'or' ? 'Direct clue'
      : step.why.rule.startsWith('chain') ? 'Linking two grids' : 'Elimination',
    grid: step.g, cell: step.r * mystery.n + step.c, value: step.v,
    cells: [`${step.g}:${step.r}:${step.c}`],
  }));
}

export function nextCaseDeduction(mystery: MysteryCase, grid: CaseGrid): CaseDeduction | undefined {
  return availableCaseDeductions(mystery, grid)[0];
}

export function caseNudge(mystery: MysteryCase, grid: CaseGrid, deduction?: CaseDeduction): { message: string; cells: string[] } {
  const wrong = caseGridMistakes(mystery, grid);
  if (wrong.length) return { message: 'Check the marked boxes in this grid.', cells: wrong };
  if (!deduction) return { message: 'Look at a clue and an open row.', cells: [] };
  return { message: `Look at row ${Math.floor(deduction.cell / mystery.n) + 1} in the ${deduction.grid} grid.`, cells: deduction.cells };
}
