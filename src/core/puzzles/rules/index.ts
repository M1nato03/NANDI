import type { PuzzleBoard } from '../puzzles.js';

export type PuzzleState = { grid: number[]; path: number[] };
export type RuleResult = { complete: boolean; solved: boolean; conflicts: number[] };

const line = (n: number, row: number, column: boolean) =>
  Array.from({ length: n }, (_, i) => column ? i * n + row : row * n + i);

function duplicates(cells: number[], values: number[], bad: Set<number>) {
  const seen = new Map<number, number>();
  for (const cell of cells) {
    const value = values[cell] ?? 0;
    if (value <= 0) continue;
    const previous = seen.get(value);
    if (previous !== undefined) { bad.add(previous); bad.add(cell); }
    else seen.set(value, cell);
  }
}

function latin(board: Extract<PuzzleBoard, { type: 'sudoku' | 'calc' }>, grid: number[], bad: Set<number>) {
  for (let k = 0; k < board.N; k++) {
    duplicates(line(board.N, k, false), grid, bad);
    duplicates(line(board.N, k, true), grid, bad);
  }
  if (board.type === 'sudoku') {
    for (let r = 0; r < board.N; r += board.br) for (let c = 0; c < board.N; c += board.bc) {
      const cells: number[] = [];
      for (let dr = 0; dr < board.br; dr++) for (let dc = 0; dc < board.bc; dc++) cells.push((r + dr) * board.N + c + dc);
      duplicates(cells, grid, bad);
    }
    board.givens.forEach((value, i) => { if (value && grid[i] !== value) bad.add(i); });
  } else for (const cage of board.cages) {
    const values = cage.cells.map(i => grid[i] ?? 0);
    if (values.some(v => v <= 0)) continue;
    const [a = 0, b = 0] = values;
    const valid = cage.op === '' ? a === cage.target
      : cage.op === '+' ? values.reduce((sum, value) => sum + value, 0) === cage.target
        : cage.op === '×' ? values.reduce((product, value) => product * value, 1) === cage.target
          : cage.op === '−' ? Math.abs(a - b) === cage.target
            : Math.max(a, b) / Math.min(a, b) === cage.target;
    if (!valid) cage.cells.forEach(i => bad.add(i));
  }
}

function crowns(board: Extract<PuzzleBoard, { type: 'crowns' }>, grid: number[], bad: Set<number>) {
  const placed = grid.flatMap((value, i) => value === 2 ? [i] : []);
  for (let a = 0; a < placed.length; a++) for (let b = a + 1; b < placed.length; b++) {
    const i = placed[a]!, j = placed[b]!;
    const rowGap = Math.abs(Math.floor(i / board.N) - Math.floor(j / board.N));
    const colGap = Math.abs(i % board.N - j % board.N);
    if (!rowGap || !colGap || board.region[i] === board.region[j] || (rowGap <= 1 && colGap <= 1)) { bad.add(i); bad.add(j); }
  }
  return placed.length === board.N;
}

function sunmoon(board: Extract<PuzzleBoard, { type: 'sunmoon' }>, grid: number[], bad: Set<number>) {
  for (let k = 0; k < 6; k++) for (const cells of [line(6, k, false), line(6, k, true)]) {
    for (const value of [0, 1]) {
      const matches = cells.filter(i => grid[i] === value);
      if (matches.length > 3) matches.forEach(i => bad.add(i));
    }
    for (let i = 0; i < 4; i++) {
      const group = cells.slice(i, i + 3);
      if ((grid[group[0]!] ?? -1) >= 0 && group.every(j => grid[j] === grid[group[0]!])) group.forEach(j => bad.add(j));
    }
  }
  const edge = (a: number, b: number, sign: number) => {
    if (sign && (grid[a] ?? -1) >= 0 && (grid[b] ?? -1) >= 0 && (grid[a] === grid[b]) !== (sign === 1)) { bad.add(a); bad.add(b); }
  };
  for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) edge(r * 6 + c, r * 6 + c + 1, board.hs[r * 5 + c] ?? 0);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) edge(r * 6 + c, (r + 1) * 6 + c, board.vs[r * 6 + c] ?? 0);
  board.given.forEach((value, i) => { if (value >= 0 && grid[i] !== value) bad.add(i); });
}

function path(board: Extract<PuzzleBoard, { type: 'path' }>, cells: number[], bad: Set<number>) {
  const size = board.R * board.C;
  const seen = new Set<number>();
  let next = 0;
  cells.forEach((cell, index) => {
    if (!Number.isInteger(cell) || cell < 0 || cell >= size || seen.has(cell)) bad.add(cell);
    seen.add(cell);
    if (index) {
      const previous = cells[index - 1]!;
      if (Math.abs(Math.floor(cell / board.C) - Math.floor(previous / board.C)) + Math.abs(cell % board.C - previous % board.C) !== 1) { bad.add(cell); bad.add(previous); }
    }
    const waypoint = board.waypoints.indexOf(cell);
    if (waypoint >= 0) { if (waypoint !== next) bad.add(cell); next++; }
  });
  if (cells.length && cells[0] !== board.waypoints[0]) bad.add(cells[0]!);
  if (cells.length === size && cells[size - 1] !== board.waypoints.at(-1)) bad.add(cells[size - 1]!);
  return cells.length === size && seen.size === size && next === board.waypoints.length;
}

/** Checks the player's marks against clues and rules; board.solution is never read. */
export function checkRules(board: PuzzleBoard, state: PuzzleState): RuleResult {
  const bad = new Set<number>();
  let complete: boolean;
  if (board.type === 'path') complete = path(board, state.path, bad);
  else {
    const grid = state.grid;
    if (board.type === 'crowns') complete = crowns(board, grid, bad);
    else if (board.type === 'sunmoon') { sunmoon(board, grid, bad); complete = grid.length === 36 && grid.every(v => v === 0 || v === 1); }
    else {
      latin(board, grid, bad);
      complete = grid.length === board.N * board.N && grid.every(v => Number.isInteger(v) && v >= 1 && v <= board.N);
    }
  }
  return { complete, solved: complete && bad.size === 0, conflicts: [...bad].filter(i => i >= 0).sort((a, b) => a - b) };
}
