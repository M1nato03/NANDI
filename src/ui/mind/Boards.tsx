import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { PuzzleBoard } from '../../core/puzzles';
import type { PuzzleState } from '../../core/puzzles/rules';

type Props = {
  board: PuzzleBoard;
  state: PuzzleState;
  conflicts: number[];
  highlights?: number[];
  notes: number[];
  notesMode: boolean;
  onGrid: (grid: number[], notes?: number[]) => void;
  onPath: (path: number[]) => void;
  onNotesMode: () => void;
  done: boolean;
};

const position = (i: number, width: number) => `Row ${Math.floor(i / width) + 1}, column ${i % width + 1}`;
const border = (same: (a: number, b: number) => boolean, i: number, n: number, boundary = 2) => ({
  borderTopWidth: i < n || !same(i, i - n) ? boundary : 1,
  borderLeftWidth: i % n === 0 || !same(i, i - 1) ? boundary : 1,
  borderRightWidth: i % n === n - 1 || !same(i, i + 1) ? boundary : 1,
  borderBottomWidth: i >= n * (n - 1) || !same(i, i + n) ? boundary : 1,
});

function NumberBoard({ board, state, conflicts, highlights = [], notes, notesMode, onGrid, onNotesMode, done }: Props & { board: Extract<PuzzleBoard, { type: 'sudoku' | 'calc' }> }) {
  const [selected, setSelected] = useState<number | null>(null);
  const n = board.N;
  const cageOf = board.type === 'calc' ? Array.from({ length: n * n }, (_, i) => board.cages.findIndex(cage => cage.cells.includes(i))) : [];
  const selectedGiven = selected !== null && board.type === 'sudoku' && (board.givens[selected] ?? 0) > 0;
  const selectDigit = (digit: number) => {
    if (selected === null || done || (board.type === 'sudoku' && (board.givens[selected] ?? 0) > 0)) return;
    if (notesMode && digit && !state.grid[selected]) {
      const next = notes.slice(); next[selected] = (next[selected] ?? 0) ^ (1 << digit); onGrid(state.grid, next);
    } else {
      const next = state.grid.slice();
      next[selected] = digit && next[selected] === digit ? 0 : digit;
      const nextNotes = notes.slice(); nextNotes[selected] = 0;
      if (next[selected]) for (let i = 0; i < next.length; i++) {
        const row = Math.floor(i / n) === Math.floor(selected / n);
        const column = i % n === selected % n;
        const group = board.type === 'sudoku'
          ? Math.floor(Math.floor(i / n) / board.br) === Math.floor(Math.floor(selected / n) / board.br) && Math.floor((i % n) / board.bc) === Math.floor((selected % n) / board.bc)
          : cageOf[i] === cageOf[selected];
        if (row || column || group) nextNotes[i] = (nextNotes[i] ?? 0) & ~(1 << digit);
      }
      onGrid(next, nextNotes);
    }
  };
  return <>
    <div className="mind-grid" role="grid" aria-label={`${board.type === 'sudoku' ? 'Mini Sudoku' : 'Calcudoku'} board`} style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
      {state.grid.map((value, i) => {
        const given = board.type === 'sudoku' && (board.givens[i] ?? 0) > 0;
        const cage = board.type === 'calc' ? board.cages[cageOf[i] ?? -1] : null;
        const box = board.type === 'sudoku' ? (a: number, b: number) => Math.floor(Math.floor(a / n) / board.br) === Math.floor(Math.floor(b / n) / board.br) && Math.floor((a % n) / board.bc) === Math.floor((b % n) / board.bc) : (a: number, b: number) => cageOf[a] === cageOf[b];
        const peer = selected !== null && (Math.floor(selected / n) === Math.floor(i / n) || selected % n === i % n || box(selected, i));
        const same = selected !== null && value > 0 && value === state.grid[selected];
        return <button key={i} type="button" className={`mind-cell ${given ? 'given' : ''} ${peer ? 'peer' : ''} ${same ? 'same' : ''} ${selected === i ? 'selected' : ''} ${conflicts.includes(i) ? 'conflict' : ''} ${highlights.includes(i) ? 'hint-focus' : ''}`} style={border(box, i, n)} aria-label={`${position(i, n)}: ${value || 'empty'}${cage && cage.cells[0] === i ? `, cage ${cage.target}${cage.op}` : ''}`} aria-selected={selected === i} onClick={() => setSelected(i)} disabled={done}>
          {cage?.cells[0] === i && <small className="cage-label">{cage.target}{cage.op}</small>}
          {value || (notes[i] ? <small className="notes">{Array.from({ length: n }, (_, k) => k + 1).filter(d => ((notes[i] ?? 0) & (1 << d)) !== 0).join('')}</small> : '')}
        </button>;
      })}
    </div>
    <div className="mind-pad" aria-label="Number pad">{Array.from({ length: n }, (_, i) => i + 1).map(d => <button type="button" key={d} onClick={() => selectDigit(d)} disabled={done || selected === null || selectedGiven}>{d}</button>)}<button type="button" className="secondary" onClick={() => selectDigit(0)} disabled={done || selected === null || selectedGiven}>Clear</button></div>
    <button type="button" className="secondary" aria-pressed={notesMode} onClick={onNotesMode}>Notes: {notesMode ? 'on' : 'off'}</button>
  </>;
}

export function MiniSudokuBoard(props: Props & { board: Extract<PuzzleBoard, { type: 'sudoku' }> }) { return <NumberBoard {...props} />; }
export function CalcudokuBoard(props: Props & { board: Extract<PuzzleBoard, { type: 'calc' }> }) { return <NumberBoard {...props} />; }

export function CrownsBoard({ board, state, conflicts, highlights = [], onGrid, done }: Props & { board: Extract<PuzzleBoard, { type: 'crowns' }> }) {
  return <div className="mind-grid" role="grid" aria-label="Crowns board" style={{ gridTemplateColumns: `repeat(${board.N}, 1fr)` }}>
    {state.grid.map((value, i) => <button type="button" key={i} className={`mind-cell region-${(board.region[i] ?? 0) % 8} ${conflicts.includes(i) ? 'conflict' : ''} ${highlights.includes(i) ? 'hint-focus' : ''}`} style={border((a, b) => board.region[a] === board.region[b], i, board.N, 3)} aria-label={`${position(i, board.N)}, region ${(board.region[i] ?? 0) + 1}: ${value === 2 ? 'crown' : value === 1 ? 'cross' : 'empty'}`} onClick={() => { const next = state.grid.slice(); next[i] = (value + 1) % 3; onGrid(next); }} disabled={done}>{value === 1 ? <span aria-hidden="true">×</span> : value === 2 ? <span aria-hidden="true">♛</span> : ''}</button>)}
  </div>;
}

export function SunMoonBoard({ board, state, conflicts, highlights = [], onGrid, done }: Props & { board: Extract<PuzzleBoard, { type: 'sunmoon' }> }) {
  return <div className="mind-grid" role="grid" aria-label="Sun and Moon board" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
    {state.grid.map((value, i) => {
      const given = (board.given[i] ?? -1) >= 0;
      const r = Math.floor(i / 6), c = i % 6;
      const right = c < 5 ? (board.hs[r * 5 + c] ?? 0) : 0;
      const below = r < 5 ? (board.vs[r * 6 + c] ?? 0) : 0;
      const rightClue = right === 1 ? '; equal to the cell on the right' : right === 2 ? '; opposite to the cell on the right' : '';
      const belowClue = below === 1 ? '; equal to the cell below' : below === 2 ? '; opposite to the cell below' : '';
      return <button type="button" key={i} className={`mind-cell ${given ? 'given' : ''} ${conflicts.includes(i) ? 'conflict' : ''} ${highlights.includes(i) ? 'hint-focus' : ''}`} aria-label={`${position(i, 6)}: ${value < 0 ? 'empty' : value ? 'sun' : 'moon'}${given ? ', given' : ''}${rightClue}${belowClue}`} disabled={done || given} onClick={() => { const next = state.grid.slice(); next[i] = value < 0 ? 1 : value === 1 ? 0 : -1; onGrid(next); }}>{value < 0 ? '' : value ? '☀' : '☾'}{right > 0 && <span aria-hidden="true" className="edge right">{right === 1 ? '=' : '×'}</span>}{below > 0 && <span aria-hidden="true" className="edge below">{below === 1 ? '=' : '×'}</span>}</button>;
    })}
  </div>;
}

export function NumberPathBoard({ board, state, onPath, done }: Props & { board: Extract<PuzzleBoard, { type: 'path' }> }) {
  const drag = useRef(false);
  const current = useRef(state.path);
  useEffect(() => { current.current = state.path; }, [state.path]);
  const valid = (path: number[], cell: number) => {
    if (!path.length) return cell === board.waypoints[0] ? [cell] : path;
    const previous = path.at(-1)!;
    if (path.length >= 2 && cell === path.at(-2)) return path.slice(0, -1);
    if (path.includes(cell)) return path;
    if (Math.abs(Math.floor(previous / board.C) - Math.floor(cell / board.C)) + Math.abs(previous % board.C - cell % board.C) !== 1) return path;
    const waypoint = board.waypoints.indexOf(cell);
    if (waypoint >= 0 && (waypoint !== board.waypoints.filter(i => path.includes(i)).length || (waypoint === board.waypoints.length - 1 && path.length !== board.R * board.C - 1))) return path;
    return [...path, cell];
  };
  const step = (cell: number, start = false) => {
    const path = current.current;
    const next = start && path.includes(cell) ? path.slice(0, path.indexOf(cell) + 1) : valid(path, cell);
    if (next !== path) { current.current = next; onPath(next); }
  };
  const fromPoint = (event: PointerEvent<HTMLDivElement>) => {
    const element = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-cell]');
    return element && event.currentTarget.contains(element) ? Number(element.getAttribute('data-cell')) : -1;
  };
  return <>
    <div className="mind-path-wrap" onPointerDown={event => { if (done) return; drag.current = true; event.currentTarget.setPointerCapture(event.pointerId); step(fromPoint(event), true); }} onPointerMove={event => { if (drag.current && !done) step(fromPoint(event)); }} onPointerUp={() => { drag.current = false; }} onPointerCancel={() => { drag.current = false; }}>
      <div className="mind-grid" role="grid" aria-label="Number Path board" style={{ gridTemplateColumns: `repeat(${board.C}, 1fr)` }}>
        {Array.from({ length: board.R * board.C }, (_, i) => { const order = state.path.indexOf(i); const waypoint = board.waypoints.indexOf(i); return <button type="button" key={i} data-cell={i} className={`mind-cell ${order >= 0 ? 'on-path' : ''} ${order === state.path.length - 1 ? 'path-head' : ''}`} aria-label={`${position(i, board.C)}${waypoint >= 0 ? `, number ${waypoint + 1}` : ''}${order >= 0 ? `, path ${order + 1}` : ''}`} onClick={() => { if (!done) step(i); }} disabled={done}>{waypoint >= 0 ? waypoint + 1 : order >= 0 ? <span aria-hidden="true">·</span> : ''}</button>; })}
      </div>
      <svg className="mind-path-line" viewBox={`0 0 ${board.C * 100} ${board.R * 100}`} aria-hidden="true" preserveAspectRatio="none"><polyline points={state.path.map(i => `${i % board.C * 100 + 50},${Math.floor(i / board.C) * 100 + 50}`).join(' ')} /></svg>
    </div>
    <p className="small" role="status">Covered {state.path.length} of {board.R * board.C} · next number: {board.waypoints.filter(i => state.path.includes(i)).length + 1}</p>
    <button type="button" className="secondary" disabled={done || state.path.length === 0} onClick={() => onPath(state.path.slice(0, -1))}>Undo</button>
  </>;
}

export function PuzzleBoardView(props: Props) {
  switch (props.board.type) {
    case 'sudoku': return <MiniSudokuBoard {...props} board={props.board} />;
    case 'calc': return <CalcudokuBoard {...props} board={props.board} />;
    case 'crowns': return <CrownsBoard {...props} board={props.board} />;
    case 'sunmoon': return <SunMoonBoard {...props} board={props.board} />;
    case 'path': return <NumberPathBoard {...props} board={props.board} />;
  }
}
