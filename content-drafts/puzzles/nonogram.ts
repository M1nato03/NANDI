import { copy, random, type Grid, type Level } from './common';

export interface NonogramPuzzle { rows: number[][]; cols: number[][]; givens: Grid; picture: string }

const art: Record<string, string[]> = {
  kite: ['..#..', '.###.', '#####', '..#..', '...#.'],
  diya: ['...#...', '..###..', '...#...', '.#####.', '#######', '.#####.', '..###..'],
  chai: ['........', '.#####..', '.#...#..', '.#...##.', '.#...##.', '.#####..', '..###...', '.#####..'],
  'cricket bat': ['.......##.', '......##..', '.....##...', '....##....', '...##.....', '..##......', '.##.......', '.##.......', '.##.......', '..#.......'],
};

export function clues(line: number[]): number[] {
  const out: number[] = [], run = { n: 0 };
  for (const v of [...line, 0]) {
    if (v) run.n++;
    else if (run.n) { out.push(run.n); run.n = 0; }
  }
  return out;
}

const lineCache = new Map<string, number[][]>();
function lineOptions(length: number, hint: number[], known: number[]): number[][] {
  const key = `${length}:${hint.join(',')}`;
  let options = lineCache.get(key);
  if (!options) {
    options = [];
    for (let mask = 0; mask < 1 << length; mask++) {
      const line = Array.from({ length }, (_, i) => mask >> i & 1);
      if (clues(line).join(',') === hint.join(',')) options.push(line);
    }
    lineCache.set(key, options);
  }
  return options.filter(line => line.every((v, i) => known[i] < 0 || known[i] === v));
}

export function solveNonogram(puzzle: NonogramPuzzle, limit = 2): Grid[] {
  const h = puzzle.rows.length, w = puzzle.cols.length, grid = copy(puzzle.givens), found: Grid[] = [];
  const visit = (): void => {
    if (found.length >= limit) return;
    let changed = true;
    while (changed) {
      changed = false;
      for (let axis = 0; axis < 2; axis++) for (let i = 0; i < (axis ? w : h); i++) {
        const line = axis ? grid.map(row => row[i]) : grid[i];
        const options = lineOptions(line.length, axis ? puzzle.cols[i] : puzzle.rows[i], line);
        if (!options.length) return;
        for (let j = 0; j < line.length; j++) if (line[j] < 0 && options.every(option => option[j] === options[0][j])) {
          if (axis) grid[j][i] = options[0][j]; else grid[i][j] = options[0][j];
          changed = true;
        }
      }
    }
    let branch: [number, number] | undefined;
    for (let r = 0; r < h && !branch; r++) for (let c = 0; c < w; c++) if (grid[r][c] < 0) { branch = [r, c]; break; }
    if (!branch) { found.push(copy(grid)); return; }
    const [r, c] = branch, snapshot = copy(grid);
    for (const v of [0, 1]) {
      grid[r][c] = v; visit();
      for (let y = 0; y < h; y++) grid[y] = [...snapshot[y]];
      if (found.length >= limit) return;
    }
  };
  visit(); return found;
}

export function nonogramLogicSteps(puzzle: NonogramPuzzle): number {
  const h = puzzle.rows.length, w = puzzle.cols.length, grid = copy(puzzle.givens);
  let steps = 0, changed = true;
  while (changed) {
    changed = false;
    for (let axis = 0; axis < 2; axis++) for (let i = 0; i < (axis ? w : h); i++) {
      const line = axis ? grid.map(row => row[i]) : grid[i];
      const options = lineOptions(line.length, axis ? puzzle.cols[i] : puzzle.rows[i], line);
      if (!options.length) return -1;
      for (let j = 0; j < line.length; j++) if (line[j] < 0 && options.every(option => option[j] === options[0][j])) {
        if (axis) grid[j][i] = options[0][j]; else grid[i][j] = options[0][j];
        changed = true; steps++;
      }
    }
  }
  return grid.every(row => row.every(v => v >= 0)) ? steps : -1;
}

export function generateNonogram(seed: number, level: Level): { puzzle: NonogramPuzzle; solution: Grid; difficulty: number } {
  const rng = random(seed);
  const names = level === 'easy' ? ['kite'] : level === 'medium' ? ['diya', 'chai'] : ['chai', 'cricket bat'];
  const picture = names[Math.floor(rng() * names.length)];
  let solution = art[picture].map(row => [...row].map(char => Number(char === '#')));
  if (rng() < .5) solution = solution.map(row => [...row].reverse());
  if (rng() < .5) solution = [...solution].reverse();
  if (rng() < .5) solution = solution[0].map((_, c) => solution.map(row => row[c]));
  const h = solution.length, w = solution[0].length;
  const puzzle: NonogramPuzzle = {
    rows: solution.map(clues),
    cols: Array.from({ length: w }, (_, c) => clues(solution.map(row => row[c]))),
    givens: Array.from({ length: h }, () => Array(w).fill(-1)),
    picture,
  };
  // Add only the few cells required to disambiguate a hand-drawn silhouette.
  const order = Array.from({ length: h * w }, (_, k) => k).sort((a, b) => ((a * 1103515245 + seed) >>> 0) - ((b * 1103515245 + seed) >>> 0));
  for (const k of order) {
    if (solveNonogram(puzzle).length === 1 && (level === 'hard' || nonogramLogicSteps(puzzle) >= 0)) break;
    const r = Math.floor(k / w), c = k % w;
    puzzle.givens[r][c] = solution[r][c];
  }
  if (solveNonogram(puzzle).length !== 1) throw new Error('Nonogram construction failed');
  return { puzzle, solution, difficulty: nonogramLogicSteps(puzzle) };
}
