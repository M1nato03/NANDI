import { describe, expect, it } from 'vitest';
import type { PuzzleBoard, PuzzleDifficulty, PuzzleType } from '../index';
import { loadPortedGenerator } from '../../ported-test-loader.js';
import { checkRules, type PuzzleState } from './index';

const types: PuzzleType[] = ['sudoku', 'crowns', 'sunmoon', 'path', 'calc'];
const levels: PuzzleDifficulty[] = ['easy', 'medium', 'hard'];
const PZ = loadPortedGenerator(new URL('../puzzles.js', import.meta.url), 'PZ') as typeof import('../puzzles.js').default;

function solvedState(board: PuzzleBoard): PuzzleState {
  if (board.type === 'path') return { grid: [], path: board.solution.slice() };
  if (board.type === 'crowns') return { grid: Array.from({ length: board.N * board.N }, (_, i) => board.solution[Math.floor(i / board.N)] === i % board.N ? 2 : 0), path: [] };
  return { grid: board.solution.slice(), path: [] };
}

describe('player-facing rule checks', () => {
  for (const type of types) for (const diff of levels) {
    it(`${type} ${diff}: accepts the rules and rejects every single-cell corruption`, () => {
      const board = PZ.generate(type, { seed: PZ.hash(`rules:${type}:${diff}`), diff });
      expect(board).not.toBeNull();
      const generated = board!;
      const correct = solvedState(generated);
      expect(checkRules({ ...generated, solution: [] } as PuzzleBoard, correct).solved).toBe(true);
      const length = generated.type === 'path' ? correct.path.length : correct.grid.length;
      for (let i = 0; i < length; i++) {
        const broken = { grid: correct.grid.slice(), path: correct.path.slice() };
        if (generated.type === 'path') broken.path[i] = broken.path[(i + 1) % length]!;
        else if (generated.type === 'crowns') broken.grid[i] = broken.grid[i] === 2 ? 0 : 2;
        else if (generated.type === 'sunmoon') broken.grid[i] = broken.grid[i] === 1 ? 0 : 1;
        else broken.grid[i] = 0;
        expect(checkRules(generated, broken).solved, `cell ${i}`).toBe(false);
      }
    });
  }
});
