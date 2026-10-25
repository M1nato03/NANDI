import { copy, random, shuffle, type Grid, type Level } from './common';

export interface Edge { a: [number, number]; b: [number, number]; kind: '=' | 'x' }
export interface BinairoPuzzle { cells: Grid; edges: Edge[] }

function patterns(n: number): number[][] {
  const out: number[][] = [];
  for (let bits = 0; bits < 1 << n; bits++) {
    const row = Array.from({ length: n }, (_, c) => (bits >> c) & 1);
    if (row.reduce((a, b) => a + b, 0) !== n / 2) continue;
    if (row.some((v, c) => c > 1 && v === row[c - 1] && v === row[c - 2])) continue;
    out.push(row);
  }
  return out;
}

export function solveBinairo(puzzle: BinairoPuzzle, limit = 2): Grid[] {
  const n = puzzle.cells.length, rows = patterns(n);
  const options = puzzle.cells.map(line => rows.filter(row => row.every((v, c) => line[c] < 0 || line[c] === v)));
  const found: Grid[] = [], grid: Grid = [];
  const visit = (r: number): void => {
    if (found.length >= limit) return;
    if (r === n) { found.push(copy(grid)); return; }
    for (const row of options[r]) {
      if (row.some((v, c) => {
        const col = grid.map(line => line[c]);
        if (r > 1 && col[r - 1] === v && col[r - 2] === v) return true;
        if (col.filter(x => x === v).length + 1 > n / 2) return true;
        return false;
      })) continue;
      grid.push(row);
      const edgeBad = puzzle.edges.some(edge => {
        const [ar, ac] = edge.a, [br, bc] = edge.b;
        return ar <= r && br <= r && ((grid[ar][ac] === grid[br][bc]) !== (edge.kind === '='));
      });
      if (!edgeBad && (r !== n - 1 || Array.from({ length: n }, (_, c) => grid.map(line => line[c])).every(col =>
          col.reduce((a, b) => a + b, 0) === n / 2))) visit(r + 1);
      grid.pop();
    }
  };
  visit(0);
  return found;
}

export function binairoLogicSteps(puzzle: BinairoPuzzle): number {
  const n = puzzle.cells.length, grid = copy(puzzle.cells), rows = patterns(n);
  let steps = 0;
  while (true) {
    let changed = false;
    for (let axis = 0; axis < 2; axis++) for (let i = 0; i < n; i++) {
      const line = Array.from({ length: n }, (_, j) => axis ? grid[j][i] : grid[i][j]);
      const fits = rows.filter(row => row.every((v, j) => line[j] < 0 || line[j] === v));
      if (!fits.length) return -1;
      for (let j = 0; j < n; j++) if (line[j] < 0 && fits.every(row => row[j] === fits[0][j])) {
        if (axis) grid[j][i] = fits[0][j]; else grid[i][j] = fits[0][j];
        steps++; changed = true;
      }
    }
    for (const edge of puzzle.edges) {
      const [ar, ac] = edge.a, [br, bc] = edge.b, a = grid[ar][ac], b = grid[br][bc];
      if (a >= 0 && b < 0) { grid[br][bc] = edge.kind === '=' ? a : 1 - a; changed = true; steps++; }
      if (b >= 0 && a < 0) { grid[ar][ac] = edge.kind === '=' ? b : 1 - b; changed = true; steps++; }
    }
    if (grid.every(row => row.every(v => v >= 0))) return steps;
    if (!changed) return -1;
  }
}

export function generateBinairo(seed: number, level: Level): { puzzle: BinairoPuzzle; solution: Grid; difficulty: number } {
  const rng = random(seed), n = level === 'easy' ? 4 : 6;
  const bases = solveBinairo({ cells: Array.from({ length: n }, () => Array(n).fill(-1)), edges: [] }, 100);
  const solution = bases[Math.floor(rng() * bases.length)];
  if (!solution) throw new Error('No base grid');
  const cells = copy(solution), edges: Edge[] = [];
  const locations = shuffle(Array.from({ length: n * n }, (_, k) => k), rng);
  const floor = level === 'easy' ? 6 : level === 'medium' ? 9 : 7;
  for (const k of locations) {
    if (cells.flat().filter(v => v >= 0).length <= floor) break;
    const r = Math.floor(k / n), c = k % n, previous = cells[r][c];
    cells[r][c] = -1;
    const puzzle = { cells, edges };
    if (solveBinairo(puzzle).length !== 1 || (level !== 'hard' && binairoLogicSteps(puzzle) < 0)) cells[r][c] = previous;
  }
  if (n === 6) {
    const r = Math.floor(rng() * n), c = Math.floor(rng() * (n - 1));
    edges.push({ a: [r, c], b: [r, c + 1], kind: solution[r][c] === solution[r][c + 1] ? '=' : 'x' });
  }
  const puzzle = { cells, edges };
  return { puzzle, solution, difficulty: binairoLogicSteps(puzzle) };
}
