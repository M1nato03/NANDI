import { expect, it } from 'vitest';
import { currentArcTitle, revealedPanels, seasonFor } from './arc';
import CaseGen from './index';
import { emptyCaseGrid } from './casePlay';
import { nextCaseDeduction, caseNudge } from './deduction';
import type { PuzzleRunRow } from '../../data/types';

it('selects prologue and successive arcs on first Mondays', () => {
  expect(seasonFor('2026-10-30').arcIndex).toBe(0);
  expect(seasonFor('2026-11-02').arcIndex).toBe(1);
  expect(seasonFor('2026-12-07').arcIndex).toBe(2);
  expect(currentArcTitle('2026-11-02')).toBe('The Missing Measure');
});

it('reveals daily panels in order and closes on Sunday with a boss bonus', () => {
  const run = (day: string, type: PuzzleRunRow['type']): PuzzleRunRow => ({ id: `${day}:${type}`, type, daily: true, dayKey: day, result: 'solved', updatedAt: 1, deleted: 0, deviceId: 'test' });
  const rows = [run('2026-11-08', 'sudoku'), run('2026-11-08', 'mystery'), run('2026-11-02', 'mystery'), run('2026-11-03', 'mystery')];
  const panels = revealedPanels(rows, '2026-11-08');
  expect(panels.map(panel => panel.dayKey)).toEqual(['2026-11-02', '2026-11-03', '2026-11-08', '2026-11-08']);
  expect(panels.at(-1)?.bonus).toBe(true);
  expect(panels[2]?.text).toMatch(/Sunday/);
});

it('uses case propagation to find a current-grid deduction and points to a conflict', () => {
  const mystery = CaseGen.generate({ seed: 7, diff: 'easy' })!;
  const grid = emptyCaseGrid(mystery.n);
  expect(nextCaseDeduction(mystery, grid)).toMatchObject({ technique: 'Direct clue' });
  const clue = nextCaseDeduction(mystery, grid)!;
  grid[clue.grid][clue.cell] = -clue.value;
  expect(caseNudge(mystery, grid).cells).toContain(clue.cells[0]);
});
