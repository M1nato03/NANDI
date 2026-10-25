import type { PuzzleBoard } from '../puzzles.js';

export type PuzzleState = { grid: number[]; path: number[] };
export type RuleResult = { complete: boolean; solved: boolean; conflicts: number[] };

const line = (n: number, row: number, column: boolean) =>
  Array.from({ length: n }, (_, i) => column ? i * n + row : row * n + i);

/** Records the cells that break a rule, with the rule in plain words (spec 29: Check names the broken rule). */
type Mark = (cells: number[], rule: string) => void;

function duplicates(cells: number[], values: number[], mark: Mark, where: string) {
  const seen = new Map<number, number>();
  for (const cell of cells) {
    const value = values[cell] ?? 0;
    if (value <= 0) continue;
    const previous = seen.get(value);
    if (previous !== undefined) mark([previous, cell], `Two ${value}s in ${where}.`);
    else seen.set(value, cell);
  }
}

function latin(board: Extract<PuzzleBoard, { type: 'sudoku' | 'calc' }>, grid: number[], mark: Mark) {
  for (let k = 0; k < board.N; k++) {
    duplicates(line(board.N, k, false), grid, mark, `row ${k + 1}`);
    duplicates(line(board.N, k, true), grid, mark, `column ${k + 1}`);
  }
  if (board.type === 'sudoku') {
    for (let r = 0; r < board.N; r += board.br) for (let c = 0; c < board.N; c += board.bc) {
      const cells: number[] = [];
      for (let dr = 0; dr < board.br; dr++) for (let dc = 0; dc < board.bc; dc++) cells.push((r + dr) * board.N + c + dc);
      duplicates(cells, grid, mark, 'one box');
    }
    board.givens.forEach((value, i) => { if (value && grid[i] !== value) mark([i], 'A starting number was changed.'); });
  } else for (const cage of board.cages) {
    const values = cage.cells.map(i => grid[i] ?? 0);
    if (values.some(v => v <= 0)) continue;
    const [a = 0, b = 0] = values;
    const valid = cage.op === '' ? a === cage.target
      : cage.op === '+' ? values.reduce((sum, value) => sum + value, 0) === cage.target
        : cage.op === '×' ? values.reduce((product, value) => product * value, 1) === cage.target
          : cage.op === '−' ? Math.abs(a - b) === cage.target
            : Math.max(a, b) / Math.min(a, b) === cage.target;
    if (!valid) mark(cage.cells, `This group doesn't make ${cage.target}${cage.op}.`);
  }
}

function crowns(board: Extract<PuzzleBoard, { type: 'crowns' }>, grid: number[], mark: Mark) {
  const placed = grid.flatMap((value, i) => value === 2 ? [i] : []);
  for (let a = 0; a < placed.length; a++) for (let b = a + 1; b < placed.length; b++) {
    const i = placed[a]!, j = placed[b]!;
    const rowGap = Math.abs(Math.floor(i / board.N) - Math.floor(j / board.N));
    const colGap = Math.abs(i % board.N - j % board.N);
    if (!rowGap) mark([i, j], `Two crowns in row ${Math.floor(i / board.N) + 1}.`);
    else if (!colGap) mark([i, j], `Two crowns in column ${i % board.N + 1}.`);
    else if (board.region[i] === board.region[j]) mark([i, j], 'Two crowns in one colour.');
    else if (rowGap <= 1 && colGap <= 1) mark([i, j], 'Two crowns touch at a corner.');
  }
  return placed.length === board.N;
}

function sunmoon(board: Extract<PuzzleBoard, { type: 'sunmoon' }>, grid: number[], mark: Mark) {
  for (let k = 0; k < 6; k++) for (const [cells, where] of [[line(6, k, false), `row ${k + 1}`], [line(6, k, true), `column ${k + 1}`]] as const) {
    for (const value of [0, 1]) {
      const matches = cells.filter(i => grid[i] === value);
      if (matches.length > 3) mark(matches, `More than 3 ${value ? 'suns' : 'moons'} in ${where}.`);
    }
    for (let i = 0; i < 4; i++) {
      const group = cells.slice(i, i + 3);
      if ((grid[group[0]!] ?? -1) >= 0 && group.every(j => grid[j] === grid[group[0]!])) mark(group, `Three ${grid[group[0]!] ? 'suns' : 'moons'} side by side in ${where}.`);
    }
  }
  const edge = (a: number, b: number, sign: number) => {
    if (sign && (grid[a] ?? -1) >= 0 && (grid[b] ?? -1) >= 0 && (grid[a] === grid[b]) !== (sign === 1)) mark([a, b], sign === 1 ? 'Squares joined by = must match.' : 'Squares joined by × must differ.');
  };
  for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) edge(r * 6 + c, r * 6 + c + 1, board.hs[r * 5 + c] ?? 0);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) edge(r * 6 + c, (r + 1) * 6 + c, board.vs[r * 6 + c] ?? 0);
  board.given.forEach((value, i) => { if (value >= 0 && grid[i] !== value) mark([i], 'A starting square was changed.'); });
}

function path(board: Extract<PuzzleBoard, { type: 'path' }>, cells: number[], mark: Mark) {
  const size = board.R * board.C;
  const seen = new Set<number>();
  let next = 0;
  cells.forEach((cell, index) => {
    if (!Number.isInteger(cell) || cell < 0 || cell >= size || seen.has(cell)) mark([cell], 'The line crosses a square twice.');
    seen.add(cell);
    if (index) {
      const previous = cells[index - 1]!;
      if (Math.abs(Math.floor(cell / board.C) - Math.floor(previous / board.C)) + Math.abs(cell % board.C - previous % board.C) !== 1) mark([cell, previous], 'The line jumps a square.');
    }
    const waypoint = board.waypoints.indexOf(cell);
    if (waypoint >= 0) { if (waypoint !== next) mark([cell], 'The numbers must come in order.'); next++; }
  });
  if (cells.length && cells[0] !== board.waypoints[0]) mark([cells[0]!], 'The line starts at 1.');
  if (cells.length === size && cells[size - 1] !== board.waypoints.at(-1)) mark([cells[size - 1]!], 'The line ends on the last number.');
  return cells.length === size && seen.size === size && next === board.waypoints.length;
}

function run(board: PuzzleBoard, state: PuzzleState, mark: Mark): boolean {
  if (board.type === 'path') return path(board, state.path, mark);
  const grid = state.grid;
  if (board.type === 'crowns') return crowns(board, grid, mark);
  if (board.type === 'sunmoon') { sunmoon(board, grid, mark); return grid.length === 36 && grid.every(v => v === 0 || v === 1); }
  latin(board, grid, mark);
  return grid.length === board.N * board.N && grid.every(v => Number.isInteger(v) && v >= 1 && v <= board.N);
}

/** Checks the player's marks against clues and rules; board.solution is never read. */
export function checkRules(board: PuzzleBoard, state: PuzzleState): RuleResult {
  const bad = new Set<number>();
  const complete = run(board, state, cells => cells.forEach(cell => bad.add(cell)));
  return { complete, solved: complete && bad.size === 0, conflicts: [...bad].filter(i => i >= 0).sort((a, b) => a - b) };
}

/** Spec 29 Check: each broken rule once, in plain words, with the cells that break it (never compared with the solution). */
export function brokenRules(board: PuzzleBoard, state: PuzzleState): { rule: string; cells: number[] }[] {
  const found = new Map<string, Set<number>>();
  run(board, state, (cells, rule) => { const set = found.get(rule) ?? new Set<number>(); cells.filter(cell => cell >= 0).forEach(cell => set.add(cell)); found.set(rule, set); });
  return [...found].map(([rule, cells]) => ({ rule, cells: [...cells].sort((a, b) => a - b) }));
}
