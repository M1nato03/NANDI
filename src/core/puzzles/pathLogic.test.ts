import { describe, expect, it } from 'vitest';
import PZ, { type PuzzleBoard } from './index';
import { availableDeductions, nudgeFor } from './deduction';
import { nextHint } from './hint';
import { checkRules } from './rules';

type PathBoard = Extract<PuzzleBoard, { type: 'path' }>;
const boards = (diff: 'easy' | 'medium' | 'hard', count: number) => Array.from({ length: count }, (_, i) => PZ.generate('path', { seed: PZ.hash(`path-logic:${diff}:${i}`), diff }) as PathBoard | null).filter((board): board is PathBoard => !!board);

describe('Number Path logic solver (HANDOVER rule 9)', () => {
  it('solves every generated board by logic alone, without the stored solution, and the answer is the only one', () => {
    for (const diff of ['easy', 'medium', 'hard'] as const) for (const board of boards(diff, 12)) {
      const logic = PZ._test.pathLogic(board.R, board.C, board.waypoints, diff === 'easy' ? 1 : 2);
      expect(logic.solved).toBe(true);
      expect(checkRules(board, { grid: [], path: logic.path })).toMatchObject({ conflicts: [], complete: true });
      expect(logic.path).toEqual(board.solution);
      expect(PZ._test.pathCount(board.R, board.C, board.waypoints, 2)).toBe(1);
    }
  });

  it('easy boards need no look-ahead', () => {
    for (const board of boards('easy', 12)) expect(PZ._test.pathLogic(board.R, board.C, board.waypoints, 1).solved).toBe(true);
  });

  it('finishes a board from an empty line using only hint deductions', () => {
    for (const diff of ['easy', 'hard'] as const) for (const board of boards(diff, 4)) {
      let path: number[] = [];
      for (let step = 0; step < board.R * board.C; step++) {
        const deduction = availableDeductions(board, { grid: [], path })[0];
        expect(deduction).toBeDefined();
        expect(['Forced move', 'Dead-end avoidance', 'Waypoint order']).toContain(deduction!.technique);
        path = [...path, deduction!.cell];
      }
      expect(checkRules(board, { grid: [], path }).complete).toBe(true);
    }
  });

  it('a wrong turn is found: hints stop and the nudge says to undo, and the hint keeps only the sound part', () => {
    let checked = 0;
    for (const board of boards('medium', 8)) {
      const C = board.C, solution = board.solution;
      const at = solution.findIndex((cell, index) => index > 1 && !board.waypoints.includes(cell) && [cell - C, cell + C, cell - 1, cell + 1].some(other => other !== solution[index + 1] && !solution.slice(0, index + 1).includes(other) && other >= 0 && other < solution.length && !board.waypoints.includes(other) && Math.abs(Math.floor(other / C) - Math.floor(cell / C)) + Math.abs(other % C - cell % C) === 1));
      if (at < 0) continue;
      const head = solution[at]!;
      const wrong = [head - C, head + C, head - 1, head + 1].find(other => other !== solution[at + 1] && !solution.slice(0, at + 1).includes(other) && other >= 0 && other < solution.length && !board.waypoints.includes(other) && Math.abs(Math.floor(other / C) - Math.floor(head / C)) + Math.abs(other % C - head % C) === 1)!;
      let path = [...solution.slice(0, at + 1), wrong];
      for (let step = 0; step < solution.length; step++) {
        const deduction = availableDeductions(board, { grid: [], path })[0];
        if (!deduction) break;
        path = [...path, deduction.cell];
      }
      expect(checkRules(board, { grid: [], path }).complete).toBe(false);
      expect(nudgeFor(board, { grid: [], path }).message).toContain('Undo');
      const hint = nextHint(board, { grid: [], path });
      expect(hint.state.path).toEqual(solution.slice(0, hint.state.path.length));
      checked++;
    }
    expect(checked).toBeGreaterThan(3);
  });
});
