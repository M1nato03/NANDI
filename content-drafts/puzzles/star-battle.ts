import { copy, random, shuffle, type Grid, type Level } from './common';

export interface StarBattlePuzzle {
  regions: Grid;
  // Optional marked empty squares, for compatibility with a game UI.
  empty: boolean[][];
}

export function solveStarBattle(puzzle: StarBattlePuzzle, limit = 2): Grid[] {
  const n = puzzle.regions.length;
  const result: Grid[] = [];
  const placed: number[] = [];
  const used = new Set<number>();
  const visit = (r: number): void => {
    if (result.length >= limit) return;
    if (r === n) {
      const grid = Array.from({ length: n }, () => Array(n).fill(0));
      placed.forEach((c, row) => { grid[row][c] = 1; });
      result.push(grid);
      return;
    }
    for (let c = 0; c < n; c++) {
      const region = puzzle.regions[r][c];
      if (puzzle.empty[r][c] || placed.includes(c) || used.has(region) ||
          (r > 0 && Math.abs(placed[r - 1] - c) <= 1)) continue;
      placed.push(c); used.add(region);
      visit(r + 1);
      placed.pop(); used.delete(region);
    }
  };
  visit(0);
  return result;
}

// Row, column, region and non-touching exclusions are repeatedly applied.
export function starLogicSteps(puzzle: StarBattlePuzzle): number {
  const n = puzzle.regions.length;
  const candidates = puzzle.regions.map((row, r) => row.map((_, c) => !puzzle.empty[r][c]));
  let steps = 0;
  while (true) {
    let changed = false;
    const units: number[][] = [];
    for (let i = 0; i < n; i++) {
      units.push(Array.from({ length: n }, (_, c) => i * n + c));
      units.push(Array.from({ length: n }, (_, r) => r * n + i));
      units.push(Array.from({ length: n * n }, (_, k) => k).filter(k => puzzle.regions[Math.floor(k / n)][k % n] === i));
    }
    const fixed = new Set<number>();
    for (const unit of units) {
      const possible = unit.filter(k => candidates[Math.floor(k / n)][k % n]);
      if (!possible.length) return -1;
      if (possible.length === 1) fixed.add(possible[0]);
    }
    for (const k of fixed) {
      const r = Math.floor(k / n), c = k % n, region = puzzle.regions[r][c];
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        if (y === r && x === c) continue;
        if (y === r || x === c || puzzle.regions[y][x] === region ||
            (Math.abs(y - r) <= 1 && Math.abs(x - c) <= 1)) {
          if (candidates[y][x]) { candidates[y][x] = false; changed = true; steps++; }
        }
      }
    }
    if (fixed.size === n) return steps + fixed.size;
    if (!changed) return -1;
  }
}

export function generateStarBattle(seed: number, level: Level): { puzzle: StarBattlePuzzle; solution: Grid; difficulty: number } {
  const rng = random(seed);
  const n = level === 'easy' ? 5 : level === 'medium' ? (seed & 1 ? 7 : 6) : 8;
  // Start with connected one-cell areas around all but one star. Grow them
  // while preserving uniqueness and connectedness of the remaining area.
  const permutations = (cols: number[], r = 0): number[][] => {
    if (r === n) return [cols];
    const out: number[][] = [];
    for (const c of shuffle(Array.from({ length: n }, (_, i) => i), rng)) {
      if (cols.includes(c) || (r && Math.abs(cols[r - 1] - c) <= 1)) continue;
      out.push(...permutations([...cols, c], r + 1));
      if (out.length > 20) break;
    }
    return out;
  };
  const cols = permutations([])[0];
  if (!cols) throw new Error('No placement');
  const solution = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => Number(cols[r] === c)));
  const regions = Array.from({ length: n }, () => Array(n).fill(n - 1));
  for (let i = 0; i < n - 1; i++) regions[i][cols[i]] = i;
  const empty = Array.from({ length: n }, () => Array(n).fill(false));
  const puzzle = { regions, empty };
  const connected = (): boolean => {
    const cells = regions.flat().filter(v => v === n - 1).length;
    const seen = new Set<number>(), queue = [cols[n - 1] + (n - 1) * n];
    seen.add(queue[0]);
    for (const k of queue) {
      const r = Math.floor(k / n), c = k % n;
      for (const [y, x] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
        const next = y * n + x;
        if (y >= 0 && y < n && x >= 0 && x < n && regions[y][x] === n - 1 && !seen.has(next)) {
          seen.add(next); queue.push(next);
        }
      }
    }
    return seen.size === cells;
  };
  const target = level === 'easy' ? 3 : level === 'medium' ? 4 : 6;
  for (let round = 1; round < target; round++) {
    for (const region of shuffle(Array.from({ length: n - 1 }, (_, i) => i), rng)) {
      const frontier = shuffle(Array.from({ length: n * n }, (_, k) => k).filter(k => {
        const r = Math.floor(k / n), c = k % n;
        return regions[r][c] === n - 1 && !solution[r][c] &&
          [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].some(([y, x]) => y >= 0 && y < n && x >= 0 && x < n && regions[y][x] === region);
      }), rng);
      for (const k of frontier) {
        const r = Math.floor(k / n), c = k % n;
        regions[r][c] = region;
        if (connected() && solveStarBattle(puzzle).length === 1 && (level === 'hard' || starLogicSteps(puzzle) >= 0)) break;
        regions[r][c] = n - 1;
      }
    }
  }
  if (solveStarBattle(puzzle).length !== 1) throw new Error('Star construction failed');
  return { puzzle: { regions: copy(regions), empty: empty.map(row => [...row]) }, solution, difficulty: starLogicSteps(puzzle) };
}
