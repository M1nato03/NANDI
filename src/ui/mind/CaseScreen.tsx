import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { MysteryCase } from '../../core/mysteries';
import { revealedPanels } from '../../core/mysteries';
import { nextCaseDeduction, availableCaseDeductions, caseNudge } from '../../core/mysteries/deduction';
import { techniqueCard } from '../../core/puzzles/techniques';
import { unlockTechnique } from '../../data/repos/techniques';
import { caseResultText, shareTile } from '../../core/puzzles/share';
import { shareFileNow, shareNote, shareTextNow } from '../shareActions';
import { RULES } from '../../core/rules.config';
import {
  accusationIsCorrect,
  caseGridMistakes,
  checkCaseGrid,
  cycleMark,
  emptyCaseGrid,
  type Accusation,
  type CaseGrid,
} from '../../core/mysteries/casePlay';
import { trackWrite } from '../../core/pendingWrites';
import { openDailyCase, saveDailyCase } from '../../data/repos/mysteries';
import { accrueActive } from '../../data/repos/puzzleRuns';
import { db } from '../../data/db';
import { formatDayKey } from '../../core/time/formatDayKey';
import type { PuzzleRunRow } from '../../data/types';
import { recordError } from '../errorRing';

import { ProveIt } from './ProveIt';
import { go } from '../shell/router';

type GridName = 'A' | 'B' | 'C';
type CaseTestHook = {
  solveKnownSolution: () => void;
  solveTodaysCase: () => void;
  /** Spec 24 Prove it: one shortest proof (clue indexes) and the clue count. */
  proof: () => { shortest: number[]; clues: number };
};
function timeText(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
function installCaseTestHook(hook: CaseTestHook): () => void {
  (window as Window & { __nandiCaseTest?: CaseTestHook }).__nandiCaseTest =
    hook;
  return () => {
    delete (window as Window & { __nandiCaseTest?: CaseTestHook })
      .__nandiCaseTest;
  };
}

export function CaseScreen({
  day,
  diff,
  afterBedtime,
  canShare,
  onExit,
}: {
  day: string;
  diff: 'easy' | 'medium' | 'hard';
  afterBedtime: boolean;
  canShare: boolean;
  onExit: () => void;
}) {
  const [mystery, setMystery] = useState<MysteryCase | null>(null);
  const [run, setRun] = useState<PuzzleRunRow | null>(null);
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error'>(
    'saving',
  );
  const [message, setMessage] = useState('Building case…');
  const [clock, setClock] = useState(() => Date.now());
  const [revealArmed, setRevealArmed] = useState(false);
  const [wrongCells, setWrongCells] = useState<string[]>([]);
  const [hintStep, setHintStep] = useState(0);
  const [newCard, setNewCard] = useState(false);
  const runs = useLiveQuery(() => db.puzzleRuns.toArray(), []) ?? [];
  // Spec 29: no running timer while playing unless the person turned pace on (Codex B item 105).
  const paceOn = useLiveQuery(async () => (await db.settings.get('mind.paceOn'))?.value === true, []) ?? false;
  // Spec 24 Prove it: the worker sends one shortest proof with the case, so the main thread never searches.
  const [shortest, setShortest] = useState<number[]>();
  const proofOffered = !!mystery && !!shortest && shortest.length < mystery.clues.length;
  const [pick, setPick] = useState<Accusation>({ s: -1, i: -1, p: -1 });
  const pending = useRef<Promise<unknown>>(Promise.resolve());
  const latest = useRef<PuzzleRunRow | null>(null);
  const version = useRef(0);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let live = true;
    const worker = new Worker(
      new URL('../../workers/puzzle.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.onmessage = (
      event: MessageEvent<{ mystery?: MysteryCase; shortest?: number[]; error?: string }>,
    ) => {
      if (!live) return;
      if (!event.data.mystery) {
        setMessage(event.data.error ?? 'Could not build today’s case.');
        return;
      }
      const generated = event.data.mystery;
      const proof = event.data.shortest;
      void openDailyCase(db, generated, day)
        .then((row) => {
          if (live) {
            latest.current = row;
            setRun(row);
            setMystery(generated);
            setShortest(proof);
            setPick(row.accusation ?? { s: -1, i: -1, p: -1 });
            setSaveState('saved');
            setMessage('');
          }
        })
        .catch((error) => {
          recordError('window', error);
          setMessage('Could not open today’s case.');
        });
    };
    worker.onerror = (event) => {
      recordError('window', event.message);
      setMessage('Could not build today’s case.');
    };
    worker.postMessage({ kind: 'case', day, caseDiff: diff });
    return () => {
      live = false;
      worker.terminate();
    };
  }, [day, diff]);
  const persist = (row: PuzzleRunRow) => {
    const savedRow = row.result ? row : accrueActive(row, clock);
    latest.current = savedRow;
    setRun(savedRow);
    setSaveState('saving');
    const token = ++version.current;
    const write = trackWrite(() =>
      pending.current.then(() =>
        saveDailyCase(db, savedRow, Date.now(), afterBedtime),
      ),
    );
    pending.current = write
      .then((saved) => {
        if (version.current === token) {
          setRun(saved);
          latest.current = saved;
          setSaveState('saved');
        }
      })
      .catch((error) => {
        recordError('window', error);
        if (version.current === token) setSaveState('error');
      });
  };
  const grid = run?.caseGrid ?? (mystery ? emptyCaseGrid(mystery.n) : null);
  const mark = (name: GridName, index: number) => {
    const row = latest.current,
      currentGrid = row?.caseGrid;
    if (!row || !currentGrid || row.result) return;
    setWrongCells([]);
    const next: CaseGrid = {
      ...currentGrid,
      [name]: currentGrid[name].map((value, i) =>
        i === index ? cycleMark(value) : value,
      ),
    };
    const deduction = availableCaseDeductions(mystery!, currentGrid).find(item => item.grid === name && item.cell === index && next[name][index] === item.value);
    const learned = deduction?.technique;
    setHintStep(0);
    persist({ ...row, caseGrid: next, techniquesSeen: learned ? [...new Set([...(row.techniquesSeen ?? []), learned])] : row.techniquesSeen });
  };
  const strike = (index: number) => {
    const row = latest.current,
      currentGrid = row?.caseGrid;
    if (!row || !currentGrid || row.result) return;
    const struck = currentGrid.struck.includes(index)
      ? currentGrid.struck.filter((i) => i !== index)
      : [...currentGrid.struck, index];
    persist({ ...row, caseGrid: { ...currentGrid, struck } });
  };
  const accuse = (choice: Accusation, now: number) => {
    const row = latest.current;
    if (!mystery || !row || !row.caseGrid || row.result) return;
    if (!checkCaseGrid(mystery, row.caseGrid).valid) {
      setMessage('Finish a grid that fits every clue before accusing.');
      return;
    }
    const correct = accusationIsCorrect(mystery, row.caseGrid, choice);
    const tries = (row.tries ?? 0) + (correct ? 0 : 1);
    const result = correct ? 'solved' : tries >= 2 ? 'revealed' : undefined;
    const active = accrueActive(row, now);
    persist({
      ...active,
      accusation: choice,
      tries,
      result,
      finishedAt: result ? now : undefined,
      solveMs: result ? active.activeMs : undefined,
      score: result === 'solved' ? (tries || row.hintsUsed ? RULES.mind.caseScore.withHintsOrSecondTry : RULES.mind.caseScore.cleanSolve) : RULES.mind.caseScore.revealed,
    });
    if (result === 'solved' && row.techniquesSeen?.length) void Promise.all(row.techniquesSeen.map(name => unlockTechnique(db, 'mystery', name))).then(values => { if (values.some(Boolean)) setNewCard(true); }).catch(error => recordError('window', error));
    setMessage(result ? '' : `Not quite. One more try.`);
  };
  const reveal = (now: number) => {
    if (!revealArmed) {
      setRevealArmed(true);
      return;
    }
    const row = latest.current;
    if (!row || row.result) return;
    persist({ ...row, result: 'revealed', finishedAt: now, score: 0 });
    setMessage('');
  };
  const persistRef = useRef(persist);
  const accuseRef = useRef(accuse);
  useEffect(() => {
    persistRef.current = persist;
    accuseRef.current = accuse;
  });
  useEffect(() => {
    if (!run || run.result) return;
    const save = () => {
      const row = latest.current;
      if (row && !row.result) persistRef.current(row);
    };
    const visibility = () => {
      if (document.visibilityState === 'hidden') save();
      else if (latest.current && !latest.current.result)
        latest.current = { ...latest.current, lastActiveAt: Date.now() };
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', save);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', save);
    };
  }, [run]);
  useEffect(() => {
    if (
      import.meta.env.VITE_E2E !== '1' ||
      !new URLSearchParams(location.search).has('e2e') ||
      !mystery
    )
      return;
    const solveTodaysCase = () => {
      const row = latest.current;
      if (!row) return;
      const solved = emptyCaseGrid(mystery.n);
      for (let s = 0; s < mystery.n; s++) {
        solved.A[s * mystery.n + mystery.sol.sp[s]!] = 1;
        solved.B[s * mystery.n + mystery.sol.si[s]!] = 1;
      }
      persistRef.current({ ...row, caseGrid: solved });
      accuseRef.current(
        {
          s: mystery.culprit,
          i: mystery.sol.si[mystery.culprit]!,
          p: mystery.sol.sp[mystery.culprit]!,
        },
        Date.now(),
      );
    };
    const hook: CaseTestHook = {
      solveKnownSolution: solveTodaysCase,
      solveTodaysCase,
      proof: () => ({ shortest: shortest ?? [], clues: mystery.clues.length }),
    };
    return installCaseTestHook(hook);
  }, [mystery, shortest]);
  const renderGrid = (
    name: GridName,
    title: string,
    rows: string[],
    cols: string[],
  ) => (
    <section className="case-grid-wrap" aria-label={title}>
      <h3>{title}</h3>
      <div
        className="case-grid"
        style={{
          gridTemplateColumns: `minmax(80px, 1.3fr) repeat(${cols.length}, minmax(44px, 1fr))`,
        }}
      >
        <span />
        {cols.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
        {rows.map((label, r) => (
          <div
            className="case-grid-row"
            key={r}
            style={{ display: 'contents' }}
          >
            <strong>{label}</strong>
            {cols.map((col, c) => {
              const value = grid?.[name][r * cols.length + c] ?? 0;
              const yesInRow = cols.some(
                (_, x) => grid?.[name][r * cols.length + x] === 1 && x !== c,
              );
              const yesInCol = rows.some(
                (_, y) => grid?.[name][y * cols.length + c] === 1 && y !== r,
              );
              const auto = value === 0 && (yesInRow || yesInCol);
              return (
                <button
                  key={c}
                  type="button"
                  disabled={!!run?.result}
                  className={`case-cell ${value === 1 ? 'case-yes' : value === -1 || auto ? 'case-no' : 'case-blank'}${wrongCells.includes(`${name}:${r}:${c}`) ? ' case-error' : ''}`}
                  aria-label={`${label}, ${col}: ${value === 1 ? 'yes' : value === -1 || auto ? 'no' : 'blank'}${wrongCells.includes(`${name}:${r}:${c}`) ? ", doesn't fit the clues yet" : ''}`}
                  onClick={() => mark(name, r * cols.length + c)}
                >
                  {value === 1 ? '✓' : value === -1 || auto ? '×' : ''}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
  return (
    <section className="screen mind-case" data-save-state={saveState}>
      <button type="button" className="screen-back" aria-label="Back to Mind" onClick={onExit}>
        <span className="back-chevron" aria-hidden="true">‹</span>Back
      </button>
      <p className="eyebrow">Case of the day · {formatDayKey(day)}</p>
      {!mystery || !run || !grid ? (
        <p role="status">{message}</p>
      ) : (
        <>
          <h1>{mystery.title}</h1>
          <p>{mystery.setup}</p>
          {(run.result || paceOn) && <p className="small">
            Time{' '}
            {timeText(
              run.result
                ? (run.solveMs ?? run.activeMs ?? 0)
                : (run.activeMs ?? 0) +
                    (document.visibilityState === 'visible'
                      ? Math.min(
                          60_000,
                          Math.max(0, clock - (run.lastActiveAt ?? clock)),
                        )
                      : 0),
            )}
          </p>}
          <p>
            <strong>Suspects:</strong>{' '}
            {mystery.S.map((item) => `${item.n} (${item.role})`).join(', ')}
          </p>
          <p>
            <strong>Objects:</strong>{' '}
            {mystery.I.map((item) => item.n).join(', ')}
          </p>
          <p>
            <strong>Places:</strong>{' '}
            {mystery.P.map((item) => item.s).join(', ')}
          </p>
          {/* Spec 29: How to play replays the 4-step walkthrough. */}
          <button type="button" className="text-button" onClick={() => go('mind/howto/case')}>How to play</button>
          <div className="card case-clues">
            <h2>Clues</h2>
            <ol>
              {mystery.clues.map((clue, index) => (
                <li key={index}>
                  <button
                    type="button"
                    className="text-button"
                    aria-pressed={grid.struck.includes(index)}
                    style={{
                      textDecoration: grid.struck.includes(index)
                        ? 'line-through'
                        : undefined,
                    }}
                    onClick={() => strike(index)}
                  >
                    {clue.text}
                  </button>
                </li>
              ))}
            </ol>
            <p>
              <strong>Key clue:</strong> {mystery.killerText}
            </p>
          </div>
          <details className="card">
            <summary>Show clues while marking</summary>
            <ol>
              {mystery.clues.map((clue, index) => (
                <li key={index}>{clue.text}</li>
              ))}
            </ol>
          </details>
          <div className="card case-grids">
            {renderGrid(
              'A',
              'Who was where?',
              mystery.S.map((item) => item.n),
              mystery.P.map((item) => item.s),
            )}
            {renderGrid(
              'B',
              'Who had what?',
              mystery.S.map((item) => item.n),
              mystery.I.map((item) => item.n),
            )}
            {renderGrid(
              'C',
              'Which object was where?',
              mystery.I.map((item) => item.n),
              mystery.P.map((item) => item.s),
            )}
          </div>
          {run.result ? (
            <div className="card">
              <h2>
                {run.result === 'solved' ? 'Case closed.' : 'Case unsolved.'}
              </h2>
              <p>
                {mystery.S[mystery.culprit]!.n}, with{' '}
                {mystery.I[mystery.sol.si[mystery.culprit]!]!.n}, at{' '}
                {mystery.P[mystery.sol.sp[mystery.culprit]!]!.s}.
              </p>
              <details>
                <summary>How to solve it, step by step</summary>
                <ol>
                  {mystery.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </details>
              {/* Spec 24 Prove it: day window only (canShare is night === 'day'), and only when a proof is shorter than the clue list. */}
              {run.result === 'solved' && canShare && proofOffered && <ProveIt mystery={mystery} run={run} shortest={shortest!} />}
              {run.result === 'solved' && <>{revealedPanels(runs, day).filter(panel => panel.dayKey === day && !panel.bonus).map(panel => <div className="mind-story-panel" key={panel.id}><h3>{panel.chapterTitle}</h3><p>{panel.text}</p></div>)}{newCard && <p role="status">New technique card</p>}{canShare && (() => { const result = caseResultText(run, day, diff, runs); return <div className="mind-share"><p className="small mind-share-text">{result}</p><button type="button" className="secondary" onClick={() => void shareTextNow(result).then(sent => setMessage(shareNote(sent)))}>Share result</button><button type="button" className="text-button mind-share-image" onClick={() => void shareFileNow(() => shareTile(run, 'Case'), result).then(sent => setMessage(shareNote(sent))).catch(error => recordError('window', error))}>Share as image</button></div>; })()}</>}
            </div>
          ) : (
            <div className="card">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  const deduction = nextCaseDeduction(mystery, grid);
                  const nudge = caseNudge(mystery, grid, deduction);
                  const rung = caseGridMistakes(mystery, grid).length ? 1 : Math.min(RULES.mind.hintLadderRungs, hintStep + 1);
                  const card = deduction && techniqueCard('mystery', deduction.technique);
                  setWrongCells(nudge.cells);
                  setHintStep(rung === 3 ? 0 : rung);
                  if (rung === 3 && deduction) persist({ ...run, caseGrid: { ...grid, [deduction.grid]: grid[deduction.grid].map((value, index) => index === deduction.cell ? deduction.value : value) }, hintsUsed: (run.hintsUsed ?? 0) + 1, hintRungs: [...(run.hintRungs ?? []), rung] });
                  else persist({ ...run, hintsUsed: (run.hintsUsed ?? 0) + 1, hintRungs: [...(run.hintRungs ?? []), rung] });
                  setMessage(rung === 1 ? nudge.message : rung === 2 && card ? `${card.name}: ${card.example}` : deduction ? `Mark row ${Math.floor(deduction.cell / mystery.n) + 1} in the ${deduction.grid} grid.` : nudge.message);
                }}
              >Hint</button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  const wrong = caseGridMistakes(mystery, grid);
                  const marked = [...grid.A, ...grid.B, ...grid.C].some(
                    (value) => value !== 0,
                  );
                  setWrongCells(wrong);
                  setMessage(
                    !marked
                      ? 'Mark some boxes first, then check.'
                      : wrong.length
                        ? `These marks don't fit the clues yet: ${wrong.length}, outlined on the grid.`
                        : 'Every mark so far is right. Keep going.',
                  );
                  if (marked)
                    persist({ ...run, hintsUsed: (run.hintsUsed ?? 0) + 1, hintRungs: [...(run.hintRungs ?? []), 1] });
                }}
              >
                Check my grid
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setWrongCells([]);
                  persist({ ...run, caseGrid: emptyCaseGrid(mystery.n) });
                }}
              >
                Clear grid
              </button>
              <h2 className="case-accusation-heading">Name the culprit</h2>
              {(
                [
                  ['s', 'Who', mystery.S.map((item) => item.n)],
                  ['i', 'Object', mystery.I.map((item) => item.n)],
                  ['p', 'Where', mystery.P.map((item) => item.s)],
                ] as const
              ).map(([key, label, choices]) => (
                <label key={key}>
                  {label}
                  <select
                    value={pick[key]}
                    onChange={(event) => {
                      const row = latest.current;
                      if (!row) return;
                      const choice = {
                        ...(row.accusation ?? pick),
                        [key]: Number(event.target.value),
                      };
                      setPick(choice);
                      persist({ ...row, accusation: choice });
                    }}
                  >
                    <option value={-1}>Choose</option>
                    {choices.map((value, index) => (
                      <option key={index} value={index}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <button
                type="button"
                disabled={Object.values(pick).some((value) => value < 0)}
                onClick={() => accuse(pick, Date.now())}
              >
                Accuse
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => reveal(Date.now())}
              >
                {revealArmed
                  ? 'Show the solution and end case'
                  : 'Show the solution'}
              </button>
            </div>
          )}
          <p role="status">
            {message ||
              (saveState === 'saved'
                ? 'Saved.'
                : saveState === 'saving'
                  ? 'Saving…'
                  : 'Could not save. Try again.')}
          </p>
        </>
      )}
    </section>
  );
}
