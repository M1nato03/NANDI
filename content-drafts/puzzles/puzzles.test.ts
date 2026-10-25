import { describe, expect, it } from 'vitest';
import { generateStarBattle, solveStarBattle, starLogicSteps } from './star-battle';
import { generateBinairo, solveBinairo, binairoLogicSteps } from './binairo';
import type { Edge } from './binairo';
import { generateSudoku, solveSudoku, sudokuLogicSteps } from './sudoku';
import { generateNonogram, solveNonogram, nonogramLogicSteps, clues } from './nonogram';
import tutorials from './tutorials.json';
import type { Grid, Level } from './common';

const levels: Level[] = ['easy', 'medium', 'hard'];
const same = (a: Grid, b: Grid) => expect(a).toEqual(b);

function starValid(regions: Grid, grid: Grid): boolean {
  const n = grid.length;
  for (let i = 0; i < n; i++) {
    if (grid[i].reduce((a, b) => a + b, 0) !== 1) return false;
    if (grid.reduce((a, row) => a + row[i], 0) !== 1) return false;
    if (grid.flatMap((row, r) => row.map((v, c) => regions[r][c] === i ? v : 0)).reduce((a, b) => a + b, 0) !== 1) return false;
  }
  return grid.every((row, r) => row.every((v, c) => !v ||
    grid.every((other, y) => other.every((x, z) => !x || (r === y && c === z) || Math.abs(r - y) > 1 || Math.abs(c - z) > 1))));
}

function binairoValid(grid: Grid): boolean {
  const n = grid.length;
  return [...grid, ...Array.from({ length: n }, (_, c) => grid.map(row => row[c]))].every(line =>
    line.filter(v => v === 0).length === n / 2 && line.filter(v => v === 1).length === n / 2 &&
    line.every((v, i) => i < 2 || v !== line[i - 1] || v !== line[i - 2]));
}

function sudokuValid(grid: Grid, br: number, bc: number): boolean {
  const n = grid.length, full = Array.from({ length: n }, (_, i) => i + 1).join(',');
  const units = [...grid, ...Array.from({ length: n }, (_, c) => grid.map(row => row[c]))];
  for (let r = 0; r < n; r += br) for (let c = 0; c < n; c += bc)
    units.push(Array.from({ length: n }, (_, k) => grid[r + Math.floor(k / bc)][c + k % bc]));
  return units.every(unit => [...unit].sort((a, b) => a - b).join(',') === full);
}

describe('200 seeded puzzles per genre and level', () => {
  for (const level of levels) {
    it(`star battle ${level}`, () => {
      const times: number[] = [], steps: number[] = [];
      for (let seed = 0; seed < 200; seed++) {
        const start = performance.now();
        const { puzzle, solution, difficulty } = generateStarBattle(seed, level);
        expect(starValid(puzzle.regions, solution)).toBe(true);
        expect(puzzle.regions.flat().filter((v, i, all) => all.indexOf(v) === i).length).toBe(solution.length);
        same(solveStarBattle(puzzle)[0], solution);
        expect(solveStarBattle(puzzle)).toHaveLength(1);
        expect(starLogicSteps(puzzle)).toBe(difficulty);
        if (level !== 'hard') expect(difficulty).toBeGreaterThanOrEqual(0);
        times.push(performance.now() - start); steps.push(difficulty);
      }
      report('Star battle', level, times, steps);
    });
    it(`binairo ${level}`, () => {
      const times: number[] = [], steps: number[] = [];
      for (let seed = 0; seed < 200; seed++) {
        const start = performance.now();
        const { puzzle, solution, difficulty } = generateBinairo(seed, level);
        expect(binairoValid(solution)).toBe(true);
        for (const edge of puzzle.edges) expect((solution[edge.a[0]][edge.a[1]] === solution[edge.b[0]][edge.b[1]])).toBe(edge.kind === '=');
        same(solveBinairo(puzzle)[0], solution);
        expect(solveBinairo(puzzle)).toHaveLength(1);
        expect(binairoLogicSteps(puzzle)).toBe(difficulty);
        if (level !== 'hard') expect(difficulty).toBeGreaterThanOrEqual(0);
        times.push(performance.now() - start); steps.push(difficulty);
      }
      report('Binairo', level, times, steps);
    });
    it(`sudoku ${level}`, () => {
      const times: number[] = [], steps: number[] = [];
      for (let seed = 0; seed < 200; seed++) {
        const start = performance.now();
        const { puzzle, solution, difficulty } = generateSudoku(seed, level);
        expect(sudokuValid(solution, puzzle.boxRows, puzzle.boxCols)).toBe(true);
        same(solveSudoku(puzzle)[0], solution);
        expect(solveSudoku(puzzle)).toHaveLength(1);
        expect(sudokuLogicSteps(puzzle)).toBe(difficulty);
        if (level !== 'hard') expect(difficulty).toBeGreaterThanOrEqual(0);
        times.push(performance.now() - start); steps.push(difficulty);
      }
      report('Sudoku', level, times, steps);
    });
    it(`nonogram ${level}`, () => {
      const times: number[] = [], steps: number[] = [];
      for (let seed = 0; seed < 200; seed++) {
        const start = performance.now();
        const { puzzle, solution, difficulty } = generateNonogram(seed, level);
        expect(solution.map(clues)).toEqual(puzzle.rows);
        expect(Array.from({ length: solution[0].length }, (_, c) => clues(solution.map(row => row[c])))).toEqual(puzzle.cols);
        same(solveNonogram(puzzle)[0], solution);
        expect(solveNonogram(puzzle)).toHaveLength(1);
        expect(nonogramLogicSteps(puzzle)).toBe(difficulty);
        if (level !== 'hard') expect(difficulty).toBeGreaterThanOrEqual(0);
        times.push(performance.now() - start); steps.push(difficulty);
      }
      report('Nonogram', level, times, steps);
    });
  }
});

function report(name: string, level: Level, times: number[], steps: number[]): void {
  const mean = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2);
  const max = Math.max(...times).toFixed(2);
  const logic = steps.filter(v => v >= 0).length;
  const meanSteps = (steps.filter(v => v >= 0).reduce((a, b) => a + b, 0) / Math.max(logic, 1)).toFixed(1);
  console.log(`| ${name} | ${level} | ${times.length} | ${logic}/${times.length} | ${meanSteps} | ${mean} | ${max} |`);
}

it('tutorial moves have a highlighted open cell on a small board', () => {
  for (const steps of Object.values(tutorials)) {
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps.length).toBeLessThanOrEqual(5);
    for (const step of steps) {
      expect(step.board.length).toBeGreaterThanOrEqual(4);
      expect(step.board.length).toBeLessThanOrEqual(5);
      expect(step.board.every(row => row.length === step.board[0].length)).toBe(true);
      expect(step.board[step.move.row][step.move.col]).toBe('.');
      expect(step.highlights).toContainEqual([step.move.row, step.move.col]);
      expect(step.text.length).toBeLessThan(125);
    }
  }
  for (const step of tutorials.sudoku) {
    const cells = step.board.map(row => [...row].map(char => char === '.' ? 0 : Number(char)));
    const solutions = solveSudoku({ cells, boxRows: step.boxRows, boxCols: step.boxCols }, 100);
    expect(solutions.length).toBeGreaterThan(0);
    expect(solutions.every(grid => grid[step.move.row][step.move.col] === step.move.value)).toBe(true);
  }
  for (const step of tutorials.binairo) {
    const cells = step.board.map(row => [...row].map(char => char === '.' ? -1 : Number(char === 'S')));
    const edges = step.edges as Edge[];
    const solutions = solveBinairo({ cells, edges }, 100);
    expect(solutions.length).toBeGreaterThan(0);
    expect(solutions.every(grid => grid[step.move.row][step.move.col] === Number(step.move.value === 'S'))).toBe(true);
  }
  for (const step of tutorials.nonogram) {
    const givens = step.board.map(row => [...row].map(char => char === '#' ? 1 : -1));
    const solutions = solveNonogram({ rows: step.rowClues, cols: step.colClues, givens, picture: 'tutorial' }, 100);
    expect(solutions.length).toBeGreaterThan(0);
    expect(solutions.every(grid => grid[step.move.row][step.move.col] === Number(step.move.value === 'filled'))).toBe(true);
  }
});

it('prints seed 42 sample boards', () => {
  const star = generateStarBattle(42, 'easy');
  const bin = generateBinairo(42, 'easy');
  const sudoku = generateSudoku(42, 'easy');
  const nono = generateNonogram(42, 'easy');
  console.log(`SAMPLES ${JSON.stringify({
    starRegions: star.puzzle.regions,
    starSolution: star.solution,
    binairo: bin.puzzle,
    sudoku: sudoku.puzzle,
    nonogram: nono.puzzle,
    nonogramSolution: nono.solution,
  })}`);
});
