import { copy, random, shuffle, type Grid, type Level } from './common';

export interface SudokuPuzzle { cells: Grid; boxRows: number; boxCols: number }

function candidates(grid: Grid, r: number, c: number, br: number, bc: number): number[] {
  const n = grid.length, used = new Set<number>();
  for (let i = 0; i < n; i++) { used.add(grid[r][i]); used.add(grid[i][c]); }
  for (let y = Math.floor(r / br) * br; y < Math.floor(r / br) * br + br; y++)
    for (let x = Math.floor(c / bc) * bc; x < Math.floor(c / bc) * bc + bc; x++) used.add(grid[y][x]);
  return Array.from({ length: n }, (_, i) => i + 1).filter(v => !used.has(v));
}

export function solveSudoku(puzzle: SudokuPuzzle, limit = 2): Grid[] {
  const grid = copy(puzzle.cells), n = grid.length, found: Grid[] = [];
  const visit = (): void => {
    if (found.length >= limit) return;
    let best: [number, number, number[]] | undefined;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!grid[r][c]) {
      const opts = candidates(grid, r, c, puzzle.boxRows, puzzle.boxCols);
      if (!opts.length) return;
      if (!best || opts.length < best[2].length) best = [r, c, opts];
    }
    if (!best) { found.push(copy(grid)); return; }
    const [r, c, opts] = best;
    for (const v of opts) { grid[r][c] = v; visit(); grid[r][c] = 0; if (found.length >= limit) return; }
  };
  visit(); return found;
}

export function sudokuLogicSteps(puzzle: SudokuPuzzle): number {
  const grid = copy(puzzle.cells), n = grid.length;
  let steps = 0;
  while (true) {
    let move: [number, number, number] | undefined;
    const opts = grid.map((row, r) => row.map((v, c) => v ? [] : candidates(grid, r, c, puzzle.boxRows, puzzle.boxCols)));
    for (let r = 0; r < n && !move; r++) for (let c = 0; c < n && !move; c++)
      if (!grid[r][c] && opts[r][c].length === 1) move = [r, c, opts[r][c][0]];
    const units: [number, number][][] = [];
    for (let i = 0; i < n; i++) {
      units.push(Array.from({ length: n }, (_, c) => [i, c]));
      units.push(Array.from({ length: n }, (_, r) => [r, i]));
    }
    for (let r = 0; r < n; r += puzzle.boxRows) for (let c = 0; c < n; c += puzzle.boxCols)
      units.push(Array.from({ length: n }, (_, k) => [r + Math.floor(k / puzzle.boxCols), c + k % puzzle.boxCols]));
    for (const unit of units) for (let v = 1; v <= n && !move; v++) {
      const places = unit.filter(([r, c]) => opts[r][c].includes(v));
      if (places.length === 1) move = [...places[0], v];
    }
    if (!move) return grid.every(row => row.every(Boolean)) ? steps : -1;
    grid[move[0]][move[1]] = move[2]; steps++;
  }
}

export function generateSudoku(seed: number, level: Level): { puzzle: SudokuPuzzle; solution: Grid; difficulty: number } {
  const rng = random(seed), n = level === 'easy' ? 4 : level === 'medium' ? 6 : 9;
  const br = n === 6 ? 2 : n === 9 ? 3 : 2, bc = n / br;
  const digits = shuffle(Array.from({ length: n }, (_, i) => i + 1), rng);
  const bands = shuffle(Array.from({ length: n / br }, (_, i) => i), rng);
  const stacks = shuffle(Array.from({ length: n / bc }, (_, i) => i), rng);
  const rowOrder = bands.flatMap(b => shuffle(Array.from({ length: br }, (_, i) => b * br + i), rng));
  const colOrder = stacks.flatMap(s => shuffle(Array.from({ length: bc }, (_, i) => s * bc + i), rng));
  const solution = rowOrder.map(r => colOrder.map(c => digits[(r * bc + Math.floor(r / br) + c) % n]));
  const cells = copy(solution);
  const floor = n === 4 ? 6 : n === 6 ? 15 : 33;
  for (const k of shuffle(Array.from({ length: n * n }, (_, i) => i), rng)) {
    if (cells.flat().filter(Boolean).length <= floor) break;
    const r = Math.floor(k / n), c = k % n, old = cells[r][c];
    cells[r][c] = 0;
    const candidate = { cells, boxRows: br, boxCols: bc };
    if (solveSudoku(candidate).length !== 1 || (level !== 'hard' && sudokuLogicSteps(candidate) < 0)) cells[r][c] = old;
  }
  const puzzle = { cells, boxRows: br, boxCols: bc };
  return { puzzle, solution, difficulty: sudokuLogicSteps(puzzle) };
}
