import PZ, { type PuzzleBoard } from './index';
import { checkRules, type PuzzleState } from './rules';

export type Deduction = { technique: string; cells: number[]; value: number; cell: number };
export type Nudge = { message: string; cells: number[]; conflict: boolean };

const line = (n: number, k: number, column = false) => Array.from({ length: n }, (_, i) => column ? i * n + k : k * n + i);
const unique = (values: number[]) => [...new Set(values)];

export function nudgeFor(board: PuzzleBoard, state: PuzzleState, deduction?: Deduction): Nudge {
  const conflict = checkRules(board, state).conflicts[0];
  const width = board.type === 'path' ? board.C : board.type === 'sunmoon' ? 6 : board.N;
  if (conflict !== undefined) return { message: `Check row ${Math.floor(conflict / width) + 1}. The marked cells break a rule.`, cells: checkRules(board, state).conflicts, conflict: true };
  // A generated path board is solvable by logic from any correct line, so no next step means the line has gone wrong.
  if (!deduction && board.type === 'path' && state.path.length) return { message: "This line can't reach every square from here. Undo a few steps.", cells: state.path.slice(-1), conflict: false };
  if (!deduction) return { message: 'Look at an open row or group.', cells: [], conflict: false };
  return { message: `Look at row ${Math.floor(deduction.cell / width) + 1}.`, cells: deduction.cells, conflict: false };
}

/** Sound placements from the marks currently on the board. No stored solution is read. */
export function availableDeductions(board: PuzzleBoard, state: PuzzleState): Deduction[] {
  if (checkRules(board, state).conflicts.length) return [];
  const out: Deduction[] = [];
  const add = (technique: string, cell: number, value: number, cells: number[]) => {
    if (!out.some(item => item.cell === cell && item.value === value)) out.push({ technique, cell, value, cells: unique(cells) });
  };
  if (board.type === 'path') {
    if (!state.path.length) {
      if (board.waypoints[0] !== undefined) add('Waypoint order', board.waypoints[0], 1, [board.waypoints[0]]);
      return out;
    }
    // The Number Path logic solver (puzzles.js pathLogic) decides edges from the clues and the line so far.
    const head = state.path.at(-1)!;
    const logic = PZ._test.pathLogic(board.R, board.C, board.waypoints, 2, state.path);
    if (logic.broken || logic.path.length <= state.path.length || logic.path.slice(0, state.path.length).some((cell, index) => cell !== state.path[index])) return out;
    const next = logic.path[state.path.length]!;
    const used = new Set(state.path);
    const adjacent = [head - board.C, head + board.C, head - 1, head + 1]
      .filter(cell => cell >= 0 && cell < board.R * board.C && !used.has(cell) && Math.abs(Math.floor(cell / board.C) - Math.floor(head / board.C)) + Math.abs(cell % board.C - head % board.C) === 1);
    const reason = (other: number) => logic.why[`${Math.min(head, other)},${Math.max(head, other)}`];
    const others = adjacent.filter(cell => cell !== next).map(reason);
    const technique = reason(next) === 'ahead' || others.some(why => why === 'loop' || why === 'early' || why === 'ahead') ? 'Dead-end avoidance'
      : others.includes('order') ? 'Waypoint order' : 'Forced move';
    add(technique, next, state.path.length + 1, [head, ...adjacent]);
    return out;
  }
  const n = board.type === 'sunmoon' ? 6 : board.N;
  const grid = state.grid;
  if (board.type === 'sudoku' || board.type === 'calc') {
    const units = [...Array.from({ length: n }, (_, k) => line(n, k)), ...Array.from({ length: n }, (_, k) => line(n, k, true))];
    if (board.type === 'sudoku') for (let r = 0; r < n; r += board.br) for (let c = 0; c < n; c += board.bc) units.push(Array.from({ length: board.br * board.bc }, (_, k) => (r + Math.floor(k / board.bc)) * n + c + k % board.bc));
    const domains = Array.from({ length: n * n }, (_, cell) => {
      if (grid[cell]) return [];
      const peers = units.filter(unit => unit.includes(cell)).flat();
      let values = Array.from({ length: n }, (_, k) => k + 1).filter(value => !peers.some(peer => grid[peer] === value));
      if (board.type === 'calc') {
        const cage = board.cages.find(group => group.cells.includes(cell));
        if (cage) {
          const position = cage.cells.indexOf(cell);
          const tuples = PZ._test.cageTuples(cage, n).filter(tuple => cage.cells.every((index, k) => !grid[index] || grid[index] === tuple[k]));
          values = values.filter(value => tuples.some(tuple => tuple[position] === value));
        }
      }
      return values;
    });
    for (let cell = 0; cell < domains.length; cell++) if (domains[cell]?.length === 1) {
      const cage = board.type === 'calc' ? board.cages.find(group => group.cells.includes(cell)) : undefined;
      const technique = board.type === 'sudoku' ? 'Naked single' : cage?.cells.length === 1 ? 'Single-cell cage' : 'Cage arithmetic';
      add(technique, cell, domains[cell]![0]!, cage?.cells ?? units.find(unit => unit.includes(cell)) ?? [cell]);
    }
    for (const unit of units) for (let value = 1; value <= n; value++) {
      if (unit.some(cell => grid[cell] === value)) continue;
      const spots = unit.filter(cell => domains[cell]?.includes(value));
      if (spots.length === 1) add(board.type === 'sudoku' ? 'Hidden single' : 'Latin elimination', spots[0]!, value, unit);
    }
    if (board.type === 'sudoku') {
      const reduced = domains.map(values => values.slice());
      const boxes = Array.from({ length: n / board.br * (n / board.bc) }, (_, box) => {
        const row = Math.floor(box / (n / board.bc)) * board.br;
        const col = box % (n / board.bc) * board.bc;
        return Array.from({ length: board.br * board.bc }, (_, k) => (row + Math.floor(k / board.bc)) * n + col + k % board.bc);
      });
      for (const box of boxes) for (let value = 1; value <= n; value++) {
        const spots = box.filter(cell => reduced[cell]?.includes(value));
        if (spots.length < 2) continue;
        const rows = unique(spots.map(cell => Math.floor(cell / n)));
        const cols = unique(spots.map(cell => cell % n));
        const outside = rows.length === 1 ? line(n, rows[0]!).filter(cell => !box.includes(cell))
          : cols.length === 1 ? line(n, cols[0]!, true).filter(cell => !box.includes(cell)) : [];
        for (const cell of outside) if (reduced[cell]?.includes(value)) {
          reduced[cell] = reduced[cell]!.filter(candidate => candidate !== value);
          if (reduced[cell]?.length === 1) add('Pointing candidates', cell, reduced[cell]![0]!, [...box, cell]);
        }
      }
      for (const unit of units) for (let value = 1; value <= n; value++) {
        if (unit.some(cell => grid[cell] === value)) continue;
        const spots = unit.filter(cell => reduced[cell]?.includes(value));
        if (spots.length === 1 && domains[spots[0]!]!.length > 1) add('Pointing candidates', spots[0]!, value, unit);
      }
    }
    if (board.type === 'calc') for (const unit of units) {
      const pairs = unit.filter(cell => domains[cell]?.length === 2);
      for (let a = 0; a < pairs.length; a++) for (let b = a + 1; b < pairs.length; b++) {
        const first = pairs[a]!, second = pairs[b]!;
        if (domains[first]![0] !== domains[second]![0] || domains[first]![1] !== domains[second]![1]) continue;
        for (const cell of unit) if (cell !== first && cell !== second && domains[cell]?.length) {
          const remaining = domains[cell]!.filter(value => !domains[first]!.includes(value));
          if (remaining.length === 1 && remaining.length < domains[cell]!.length) add('Naked pair', cell, remaining[0]!, [first, second, cell]);
        }
      }
    }
    return out;
  }
  if (board.type === 'crowns') {
    const placed = grid.flatMap((value, cell) => value === 2 ? [cell] : []);
    const valid = (cell: number) => !grid[cell] && !placed.some(other => Math.floor(other / n) === Math.floor(cell / n) || other % n === cell % n || board.region[other] === board.region[cell] || Math.abs(Math.floor(other / n) - Math.floor(cell / n)) <= 1 && Math.abs(other % n - cell % n) <= 1);
    for (const region of unique(board.region)) {
      if (placed.some(cell => board.region[cell] === region)) continue;
      const cells = board.region.flatMap((value, cell) => value === region ? [cell] : []);
      const open = cells.filter(valid);
      if (open.length === 1) add('One-cell region', open[0]!, 2, cells);
    }
    for (let row = 0; row < n; row++) {
      if (placed.some(cell => Math.floor(cell / n) === row)) continue;
      const cells = line(n, row), open = cells.filter(valid);
      if (open.length === 1) add('Adjacency elimination', open[0]!, 2, cells);
    }
    {
      const regions = unique(board.region).filter(region => !placed.some(cell => board.region[cell] === region));
      const openByRegion = new Map(regions.map(region => [region, board.region.flatMap((value, cell) => value === region && valid(cell) ? [cell] : [])]));
      for (const source of regions) {
        const sourceOpen = openByRegion.get(source) ?? [];
        const rows = unique(sourceOpen.map(cell => Math.floor(cell / n)));
        const cols = unique(sourceOpen.map(cell => cell % n));
        for (const target of regions) {
          if (target === source) continue;
          const targetOpen = openByRegion.get(target) ?? [];
          const remaining = targetOpen.filter(cell => rows.length !== 1 || Math.floor(cell / n) !== rows[0]);
          if (rows.length === 1 && remaining.length === 1 && targetOpen.length > 1) add('Region confined to a row or column', remaining[0]!, 2, [...sourceOpen, ...targetOpen]);
          const byColumn = targetOpen.filter(cell => cols.length !== 1 || cell % n !== cols[0]);
          if (cols.length === 1 && byColumn.length === 1 && targetOpen.length > 1) add('Region confined to a row or column', byColumn[0]!, 2, [...sourceOpen, ...targetOpen]);
        }
      }
      for (let a = 0; a < regions.length; a++) for (let b = a + 1; b < regions.length; b++) {
        const reserved = unique([...(openByRegion.get(regions[a]!) ?? []), ...(openByRegion.get(regions[b]!) ?? [])].map(cell => Math.floor(cell / n)));
        if (reserved.length !== 2 || (openByRegion.get(regions[a]!) ?? []).some(cell => !reserved.includes(Math.floor(cell / n))) || (openByRegion.get(regions[b]!) ?? []).some(cell => !reserved.includes(Math.floor(cell / n)))) continue;
        for (const target of regions) {
          if (target === regions[a] || target === regions[b]) continue;
          const open = openByRegion.get(target) ?? [];
          const remaining = open.filter(cell => !reserved.includes(Math.floor(cell / n)));
          if (remaining.length === 1 && open.length > 1) add('Two regions sharing two rows', remaining[0]!, 2, [...(openByRegion.get(regions[a]!) ?? []), ...(openByRegion.get(regions[b]!) ?? []), ...open]);
        }
      }
    }
    if (!out.length) {
      // Enumerate layouts consistent with the player's marks. A cell shared by
      // every layout is forced even when no single region is locally complete.
      const required = Array.from({ length: n }, (_, row) => line(n, row).find(cell => grid[cell] === 2));
      const layouts: number[][] = [];
      const visit = (row: number, usedCols: Set<number>, usedRegions: Set<number>, chosen: number[]) => {
        if (row === n) { layouts.push(chosen.slice()); return; }
        for (const cell of line(n, row)) {
          const col = cell % n, region = board.region[cell]!;
          if (grid[cell] === 1 || required[row] !== undefined && required[row] !== cell || usedCols.has(col) || usedRegions.has(region) || chosen.length && Math.abs(chosen.at(-1)! % n - col) <= 1) continue;
          usedCols.add(col); usedRegions.add(region); chosen.push(cell);
          visit(row + 1, usedCols, usedRegions, chosen);
          chosen.pop(); usedCols.delete(col); usedRegions.delete(region);
        }
      };
      visit(0, new Set(), new Set(), []);
      if (layouts.length) for (let row = 0; row < n; row++) {
        const cell = layouts[0]![row]!;
        if (!grid[cell] && layouts.every(layout => layout[row] === cell)) add('Region and row check', cell, 2, line(n, row));
      }
    }
    return out;
  }
  const binary = grid;
  for (let row = 0; row < 6; row++) for (const cells of [line(6, row), line(6, row, true)]) {
    for (const value of [0, 1]) {
      const filled = cells.filter(cell => binary[cell] === value);
      if (filled.length === 3) for (const cell of cells) if ((binary[cell] ?? -1) < 0) add('Balance', cell, 1 - value, cells);
    }
    for (let k = 0; k < 4; k++) {
      const triple = cells.slice(k, k + 3), known = triple.filter(cell => (binary[cell] ?? -1) >= 0);
      if (known.length === 2 && binary[known[0]!] === binary[known[1]!]) {
        const empty = triple.find(cell => (binary[cell] ?? -1) < 0);
        if (empty !== undefined) add('No three in a row', empty, 1 - binary[known[0]!]!, triple);
      }
    }
  }
  const sign = (a: number, b: number, kind: number) => {
    if (!kind) return;
    if ((binary[a] ?? -1) >= 0 && (binary[b] ?? -1) < 0) add('Sign propagation', b, kind === 1 ? binary[a]! : 1 - binary[a]!, [a, b]);
    if ((binary[b] ?? -1) >= 0 && (binary[a] ?? -1) < 0) add('Sign propagation', a, kind === 1 ? binary[b]! : 1 - binary[b]!, [a, b]);
  };
  for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) sign(r * 6 + c, r * 6 + c + 1, board.hs[r * 5 + c] ?? 0);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) sign(r * 6 + c, (r + 1) * 6 + c, board.vs[r * 6 + c] ?? 0);
  {
    const patterns = Array.from({ length: 64 }, (_, bits) => Array.from({ length: 6 }, (_, k) => bits >> k & 1))
      .filter(values => values.reduce((sum, value) => sum + value, 0) === 3 && values.every((value, k) => k < 2 || value !== values[k - 1] || value !== values[k - 2]));
    for (let k = 0; k < 6; k++) for (const column of [false, true]) {
      const cells = line(6, k, column);
      const signs = Array.from({ length: 5 }, (_, q) => column ? board.vs[q * 6 + k] ?? 0 : board.hs[k * 5 + q] ?? 0);
      const fits = patterns.filter(pattern => pattern.every((value, q) => (binary[cells[q]!] ?? -1) < 0 || binary[cells[q]!] === value)
        && signs.every((kind, q) => !kind || (pattern[q] === pattern[q + 1]) === (kind === 1)));
      if (fits.length) for (let q = 0; q < 6; q++) {
        const cell = cells[q]!;
        if ((binary[cell] ?? -1) < 0 && fits.every(pattern => pattern[q] === fits[0]![q])) add('Line pattern elimination', cell, fits[0]![q]!, cells);
      }
    }
  }
  return out;
}

export function usedTechnique(deductions: readonly Deduction[], before: PuzzleState, after: PuzzleState): string | undefined {
  const changes = after.grid.flatMap((value, cell) => before.grid[cell] !== value ? [cell] : []);
  if (changes.length === 1 && before.path.length === after.path.length) return deductions.find(item => item.cell === changes[0] && after.grid[item.cell] === item.value)?.technique;
  if (!changes.length && after.path.length === before.path.length + 1 && before.path.every((cell, index) => after.path[index] === cell)) return deductions.find(item => item.cell === after.path.at(-1))?.technique;
  return undefined;
}
