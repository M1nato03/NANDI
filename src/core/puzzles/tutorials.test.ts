import { describe, expect, it } from 'vitest';
import { brokenRules, type PuzzleState } from './rules';
import { CASE_TUTORIAL, TUTORIALS } from './tutorials';

const apply = (step: (typeof TUTORIALS)['crowns']['steps'][number]): PuzzleState => step.board.type === 'path'
  ? { grid: [], path: [...step.start.path, step.value] }
  : { grid: step.start.grid.map((value, i) => i === step.cell ? step.value : value), path: [] };

describe('spec 29 tutorials', () => {
  for (const tutorial of Object.values(TUTORIALS)) {
    it(`${tutorial.type}: 3-5 steps, each one open move on a tiny board that breaks no rule`, () => {
      expect(tutorial.steps.length).toBeGreaterThanOrEqual(3);
      expect(tutorial.steps.length).toBeLessThanOrEqual(5);
      for (const step of tutorial.steps) {
        expect(step.board.type).toBe(tutorial.type);
        expect(brokenRules(step.board, step.start)).toEqual([]);
        if (step.board.type === 'path') {
          expect(step.start.path).not.toContain(step.cell);
          const last = step.start.path.at(-1);
          if (last !== undefined) expect(Math.abs(Math.floor(last / 3) - Math.floor(step.cell / 3)) + Math.abs(last % 3 - step.cell % 3)).toBe(1);
          else expect(step.cell).toBe(step.board.waypoints[0]);
        } else {
          const empty = step.board.type === 'sunmoon' ? -1 : 0;
          expect(step.start.grid[step.cell], `${step.text}: the cell starts open`).toBe(empty);
          if (step.board.type === 'sudoku') expect(step.board.givens[step.cell]).toBe(0);
          if (step.board.type === 'sunmoon') expect(step.board.given[step.cell]).toBe(-1);
        }
        expect(brokenRules(step.board, apply(step)), step.text).toEqual([]);
        expect(step.text.split(/\s+/).length).toBeLessThanOrEqual(30);
      }
    });
  }
  it('the case walkthrough has 4 steps; the moves fit the clues and end on the culprit', () => {
    expect(CASE_TUTORIAL.steps).toHaveLength(4);
    const [first, second, third, last] = CASE_TUTORIAL.steps;
    expect(first!.start.every(value => value === 0)).toBe(true);
    for (const [step, next] of [[first, second], [second, third], [third, last]] as const) {
      expect(step!.start[step!.cell!]).toBe(0);
      expect(next!.start[step!.cell!]).toBe(step!.value);
    }
    expect(CASE_TUTORIAL.suspects[last!.culprit!]).toBe('Meera');
    expect(last!.start[2 * 3 + 1]).toBe(1);
  });
});
