import { useCallback, useEffect, useRef, useState } from 'react';
import PZ, { type PuzzleBoard, type PuzzleDifficulty, type PuzzleType } from '../../core/puzzles';
import { featuredSpec } from '../../core/puzzles/daily';
import { nextHint } from '../../core/puzzles/hint';
import { checkRules, type PuzzleState } from '../../core/puzzles/rules';
import { dayKey } from '../../core/time';
import { db } from '../../data/db';
import { accrueActive, bestPuzzleMs, initialGrid, openPuzzleRun, savePuzzleRun } from '../../data/repos/puzzleRuns';
import type { PuzzleRunRow } from '../../data/types';
import { recordError } from '../errorRing';
import { go } from '../shell/router';
import { PuzzleBoardView } from '../mind/Boards';
import '../mind/mind.css';

type Selection = { type: PuzzleType; diff: PuzzleDifficulty; daily: boolean; attempt?: number };
const types: PuzzleType[] = ['sudoku', 'crowns', 'sunmoon', 'path', 'calc'];
const diffs: PuzzleDifficulty[] = ['easy', 'medium', 'hard'];
const today = dayKey(Date.now());
const featured = featuredSpec(today);

function timeText(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function Mind() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [practice, setPractice] = useState(false);
  const [board, setBoard] = useState<PuzzleBoard | null>(null);
  const [run, setRun] = useState<PuzzleRunRow | null>(null);
  const [dailyDone, setDailyDone] = useState(false);
  const [best, setBest] = useState<number | undefined>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const current = useRef<PuzzleRunRow | null>(null);
  const writes = useRef<Promise<unknown>>(Promise.resolve());

  const persist = useCallback((row: PuzzleRunRow) => {
    current.current = row;
    setRun(row);
    setElapsed(row.activeMs ?? 0);
    writes.current = writes.current.then(() => savePuzzleRun(db, row)).catch(error => recordError('window', error));
  }, []);

  useEffect(() => {
    let live = true;
    void db.puzzleRuns.get(`daily:${today}:${featured.type}:${featured.diff}`).then(row => { if (live) setDailyDone(row?.result === 'solved'); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!selection) return;
    let live = true;
    const worker = new Worker(new URL('../../workers/puzzle.worker.ts', import.meta.url), { type: 'module' });
    const seed = PZ.hash(`${selection.daily ? 'daily' : 'practice'}:${today}:${selection.type}:${selection.diff}${selection.daily ? '' : `:${selection.attempt ?? 0}`}`);
    worker.onmessage = (event: MessageEvent<{ board?: PuzzleBoard | null; error?: string }>) => {
      if (!live) return;
      if (event.data.error || !event.data.board) { setMessage(event.data.error ?? 'Could not build this board.'); setBusy(false); return; }
      const generated = event.data.board;
      void openPuzzleRun(db, generated, today, selection.daily, Date.now(), selection.attempt).then(async row => {
        if (!live) return;
        await writes.current;
        current.current = row;
        setBoard(generated); setRun(row); setElapsed(row.activeMs ?? 0);
        setBest(await bestPuzzleMs(db, generated.type, generated.diff));
        setBusy(false);
      }).catch(error => { setBusy(false); recordError('window', error); setMessage('Could not open the saved board.'); });
    };
    worker.onerror = event => { setBusy(false); setMessage(event.message); recordError('window', event.message); };
    worker.postMessage(selection.daily ? { kind: 'daily', day: today } : { kind: 'practice', day: today, type: selection.type, diff: selection.diff, seed });
    return () => { live = false; worker.terminate(); };
  }, [selection]);

  useEffect(() => {
    if (!current.current || current.current.result) return;
    const tick = () => {
      const row = current.current;
      if (!row || row.result || document.visibilityState !== 'visible') return;
      setElapsed((row.activeMs ?? 0) + Math.min(Math.max(0, Date.now() - (row.lastActiveAt ?? Date.now())), 60_000));
    };
    const interval = window.setInterval(tick, 1000);
    const save = () => {
      const row = current.current;
      if (row && !row.result) persist(accrueActive(row, Date.now()));
    };
    const visibility = () => {
      if (document.visibilityState === 'hidden') save();
      else if (current.current && !current.current.result) current.current = { ...current.current, lastActiveAt: Date.now() };
    };
    window.addEventListener('visibilitychange', visibility);
    window.addEventListener('pageshow', visibility);
    return () => { window.clearInterval(interval); window.removeEventListener('visibilitychange', visibility); window.removeEventListener('pageshow', visibility); save(); };
  }, [run?.id, run?.result, persist]);

  const commit = useCallback((state: PuzzleState, extra: Partial<PuzzleRunRow> = {}) => {
    const row = current.current;
    if (!board || !row || row.result) return;
    const checked = checkRules(board, state);
    const now = Date.now();
    const next = { ...accrueActive(row, now), grid: state.grid, path: state.path, ...extra };
    if (checked.solved) {
      next.result = 'solved'; next.solveMs = next.activeMs; next.finishedAt = now;
      if (next.daily) setDailyDone(true);
      setBest(previous => previous === undefined ? next.solveMs : Math.min(previous, next.solveMs ?? previous));
      setMessage('');
    } else if (checked.complete) setMessage('Board full. Check the marked rules.');
    else setMessage('');
    persist(next);
  }, [board, persist]);

  useEffect(() => {
    if (import.meta.env.VITE_E2E !== '1' || !new URLSearchParams(location.search).has('e2e') || !board || !current.current) return;
    const hook = { solveKnownSolution: () => {
      const state: PuzzleState = board.type === 'path' ? { grid: [], path: board.solution.slice() }
        : board.type === 'crowns' ? { grid: Array(board.N * board.N).fill(0).map((_, i) => board.solution[Math.floor(i / board.N)] === i % board.N ? 2 : 0), path: [] }
          : { grid: board.solution.slice(), path: [] };
      commit(state);
    } };
    (window as Window & { __nandiMindTest?: typeof hook }).__nandiMindTest = hook;
    return () => { delete (window as Window & { __nandiMindTest?: typeof hook }).__nandiMindTest; };
  }, [board, run?.id, commit]);

  const open = (item: Selection) => {
    setBoard(null); setRun(null); current.current = null; setBusy(true); setMessage('');
    if (item.daily) { setSelection(item); return; }
    void db.puzzleRuns.where('type').equals(item.type).toArray().then(rows => {
      const matching = rows.filter(row => !row.deleted && !row.daily && row.dayKey === today && row.diff === item.diff);
      const unfinished = matching.find(row => !row.result);
      const attempt = unfinished?.practiceAttempt ?? (matching.length ? Math.max(...matching.map(row => row.practiceAttempt ?? 0)) + 1 : 0);
      setSelection({ ...item, attempt });
    }).catch(error => { recordError('window', error); setMessage('Could not open practice.'); setBusy(false); });
  };
  const close = () => { if (current.current && !current.current.result) persist(current.current); setSelection(null); setBoard(null); setRun(null); current.current = null; setMessage(''); };
  const state: PuzzleState = { grid: run?.grid ?? (board ? initialGrid(board) : []), path: run?.path ?? [] };
  const checked = board ? checkRules(board, state) : null;
  const name = board ? PZ.TYPES[board.type].name : '';

  if (selection) return <section className="screen mind-board">
    <button type="button" className="text-button" onClick={close}>← Mind</button>
    {busy || !board || !run ? <><h1>{PZ.TYPES[selection.type].name}</h1><p role="status">{message || 'Building board…'}</p></> : <>
      <p className="eyebrow">{selection.daily ? `Daily drop · ${today}` : `Practice · ${board.diff}`}</p>
      <h1>{name}</h1>
      <p className="rule">{PZ.TYPES[board.type].rule}</p>
      {run.result === 'solved' ? <div className="card mind-result" aria-label="Puzzle result"><h2>Board complete</h2><p>Time {timeText(run.solveMs ?? 0)} · {run.hintsUsed ?? 0} hints · Best {timeText(best ?? run.solveMs ?? 0)}</p><button type="button" onClick={close}>Back to Mind</button></div> : <>
        <p className="small" aria-label="Active time">Time {timeText(elapsed)}</p>
        <PuzzleBoardView key={board.seed} board={board} state={state} conflicts={checked?.conflicts ?? []} notes={run.notes ?? []} notesMode={!!run.notesMode} onGrid={(grid, notes) => commit({ ...state, grid }, notes ? { notes } : {})} onPath={path => commit({ ...state, path })} onNotesMode={() => { const row = current.current; if (row) persist({ ...row, notesMode: !row.notesMode }); }} done={false} />
        <div className="mind-actions"><button type="button" className="secondary" onClick={() => { const row = current.current; if (row) commit({ grid: initialGrid(board), path: [] }, { notes: Array(board.solution.length).fill(0), hintsUsed: row.hintsUsed }); }}>Restart</button><button type="button" onClick={() => { const hint = nextHint(board, state); if (hint.changed) commit(hint.state, { hintsUsed: (run.hintsUsed ?? 0) + 1, hintRungs: [...(run.hintRungs ?? []), 3] }); setMessage(hint.message); }}>Hint</button></div>
        {message && <p role="status">{message}</p>}
      </>}
    </>}
  </section>;

  return <section className="screen mind-hub">
    <p className="eyebrow">Daily drop · {today}</p><h1>Mind</h1>
    {dailyDone ? <div className="card"><h2>Today's drop complete.</h2><p>Next drop: 7:00</p><button type="button" onClick={() => go('today')}>Back to planner</button></div>
      : <div className="card"><h2>Today's board</h2><p>{PZ.TYPES[featured.type].name} · {featured.diff}</p><button type="button" onClick={() => open({ ...featured, daily: true })}>Open daily board</button></div>}
    <div className="card"><h2>Practice</h2><p>Choose a board and level.</p><button type="button" className="secondary" onClick={() => setPractice(value => !value)} aria-expanded={practice}>Practice</button>
      {practice && <div className="mind-practice-options">{types.map(type => <div key={type}><h3>{PZ.TYPES[type].name}</h3>{diffs.filter(diff => type !== 'sunmoon' || diff !== 'medium').map(diff => <button type="button" className="secondary" key={diff} onClick={() => open({ type, diff, daily: false })}>{diff}</button>)}</div>)}</div>}
    </div>
    <button type="button" className="text-button mind-debug" onClick={() => go('mind/generator')}>Generator check ↗</button>
  </section>;
}
