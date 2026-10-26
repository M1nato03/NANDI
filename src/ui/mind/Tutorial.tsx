import { useLayoutEffect, useRef, useState } from 'react';
import PZ, { type PuzzleType } from '../../core/puzzles';
import type { PuzzleState } from '../../core/puzzles/rules';
import { CASE_TUTORIAL, TUTORIALS } from '../../core/puzzles/tutorials';
import { PuzzleBoardView } from './Boards';
import { Kapi } from '../cast/Cast';
import { KapiMoment } from './KapiMoment';

/** Kapi sits on the step's square (it hops there with each new step) without catching taps (spec 29 table). It
 * measures from its own place in the board wrapper, since the wrapper's ref is not set yet when a child first lays out. */
function KapiOnCell({ cell, step }: { cell: number; step: number }) {
  const self = useRef<HTMLSpanElement>(null);
  const [spot, setSpot] = useState<{ left: number; top: number; step: number } | null>(null);
  useLayoutEffect(() => {
    const wrap = self.current?.parentElement;
    const target = wrap?.querySelectorAll<HTMLElement>('.mind-grid > button, .case-tutorial-grid button')[cell];
    if (!target || !wrap) return;
    const box = target.getBoundingClientRect(), outer = wrap.getBoundingClientRect();
    setSpot({ left: box.left - outer.left + box.width / 2 - 14, top: box.top - outer.top - 26, step });
  }, [cell, step]);
  const shown = spot?.step === step;
  return <span ref={self} className={shown ? 'kapi-on-cell kapi-friend kapi-hop' : 'kapi-on-cell'} key={step} data-moment="hop" style={shown ? { left: spot.left, top: spot.top } : { visibility: 'hidden' }} aria-hidden="true"><Kapi pose="think" size={28} /></span>;
}

/** Spec 29: the first open of a board type starts here. One rule and one move per step; it can be skipped, never by default. */
export function BoardTutorial({ type, onDone }: { type: PuzzleType; onDone: (skipped: boolean) => void }) {
  const tutorial = TUTORIALS[type];
  const [index, setIndex] = useState(0);
  const step = tutorial.steps[Math.min(index, tutorial.steps.length - 1)]!;
  const [state, setState] = useState<PuzzleState>(step.start);
  const [done, setDone] = useState(false);
  const [note, setNote] = useState('');
  const finished = index >= tutorial.steps.length;
  const go = (next: number) => { setIndex(next); setDone(false); setNote(''); const s = tutorial.steps[next]; if (s) setState(s.start); };
  const onGrid = (grid: number[]) => {
    if (done) return;
    const changed = grid.flatMap((value, i) => value !== state.grid[i] ? [i] : []);
    if (changed.some(i => i !== step.cell)) { setNote('Tap the glowing square.'); return; }
    if (grid[step.cell] === step.value) { setState({ ...state, grid }); setDone(true); setNote(''); return; }
    // Crowns and Sun & Moon cycle through marks, so the tap on the way is fine; a wrong number is not taken.
    if (type === 'crowns' || type === 'sunmoon') { setState({ ...state, grid }); setNote(''); return; }
    setNote('Not that number. Look at the rule again.');
  };
  const onPath = (path: number[]) => {
    if (done) return;
    const expected = [...step.start.path, step.cell];
    // Starting a drag on the line's head reports the same line again; that is not a move.
    if (path.length === state.path.length && path.every((cell, i) => cell === state.path[i])) return;
    if (path.length === expected.length && path.every((cell, i) => cell === expected[i])) { setState({ ...state, path }); setDone(true); setNote(''); }
    else setNote('Tap the glowing square.');
  };
  return <section className="screen mind-tutorial" aria-label={`How to play ${PZ.TYPES[type].name}`}>
    <p className="eyebrow">How to play · {finished ? 'Ready' : `Step ${index + 1} of ${tutorial.steps.length}`}</p>
    <h1>{PZ.TYPES[type].name}</h1>
    {finished ? <>
      <KapiMoment moment="clap" at={index}>{tutorial.outro}</KapiMoment>
      <button type="button" onClick={() => onDone(false)}>Play my first board</button>
    </> : <>
      <KapiMoment moment={done ? 'clap' : 'hop'} at={index * 2 + (done ? 1 : 0)}>{done ? 'That is it.' : step.text}</KapiMoment>
      <div className="mind-tutorial-board">
        <PuzzleBoardView key={index} board={step.board} state={state} conflicts={[]} highlights={[step.cell]} notes={[]} notesMode={false} onGrid={onGrid} onPath={onPath} onNotesMode={() => {}} done={done} />
        {!done && <KapiOnCell cell={step.cell} step={index} />}
      </div>
      {note && <p className="small" role="status">{note}</p>}
      {done && <button type="button" onClick={() => go(index + 1)}>{index + 1 < tutorial.steps.length ? 'Next' : 'Done'}</button>}
    </>}
    {!finished && <button type="button" className="text-button" onClick={() => onDone(true)}>Skip how-to</button>}
  </section>;
}

/** Spec 29: Kapi's case gets the same treatment, a 4-step walkthrough of the grid. */
export function CaseTutorial({ onDone }: { onDone: (skipped: boolean) => void }) {
  const { suspects, objects, steps, outro } = CASE_TUTORIAL;
  const [index, setIndex] = useState(0);
  const step = steps[Math.min(index, steps.length - 1)]!;
  const [grid, setGrid] = useState(step.start);
  const [done, setDone] = useState(false);
  const [note, setNote] = useState('');
  const finished = index >= steps.length;
  const n = objects.length;
  const auto = (i: number) => grid[i] === 0 && grid.some((value, j) => value === 1 && j !== i && (Math.floor(j / n) === Math.floor(i / n) || j % n === i % n));
  const tap = (i: number) => {
    if (done || step.cell === undefined) return;
    if (i !== step.cell) { setNote('Tap the glowing square.'); return; }
    const next = grid.slice(); next[i] = next[i] === 0 ? -1 : next[i] === -1 ? 1 : 0;
    setGrid(next); setNote('');
    if (next[i] === step.value) setDone(true);
  };
  const go = (next: number) => { setIndex(next); setDone(false); setNote(''); const s = steps[next]; if (s) setGrid(s.start); };
  return <section className="screen mind-tutorial" aria-label="How to play the case">
    <p className="eyebrow">How to play · {finished ? 'Ready' : `Step ${index + 1} of ${steps.length}`}</p>
    <h1>Kapi's case</h1>
    {finished ? <>
      <KapiMoment moment="clap" at={index}>{outro}</KapiMoment>
      <button type="button" onClick={() => onDone(false)}>Open today's case</button>
    </> : <>
      <KapiMoment moment={done ? 'clap' : 'hop'} at={index * 2 + (done ? 1 : 0)}>{done ? 'That is it.' : step.text}</KapiMoment>
      <div className="mind-tutorial-board mind-case">
        <div className="case-grid case-tutorial-grid" style={{ gridTemplateColumns: `minmax(72px, 1.3fr) repeat(${n}, minmax(44px, 1fr))` }}>
          <span />{objects.map(label => <span key={label}>{label}</span>)}
          {suspects.map((who, r) => <div key={who} style={{ display: 'contents' }}><strong>{who}</strong>{objects.map((what, c) => {
            const i = r * n + c, value = grid[i]!;
            return <button key={what} type="button" className={`case-cell ${value === 1 ? 'case-yes' : value === -1 || auto(i) ? 'case-no' : 'case-blank'}${i === step.cell && !done ? ' hint-focus' : ''}`} aria-label={`${who}, ${what}: ${value === 1 ? 'yes' : value === -1 || auto(i) ? 'no' : 'blank'}`} onClick={() => tap(i)}>{value === 1 ? '✓' : value === -1 || auto(i) ? '×' : ''}</button>;
          })}</div>)}
        </div>
        {!done && step.cell !== undefined && <KapiOnCell cell={step.cell} step={index} />}
      </div>
      {step.culprit !== undefined && !done && <div className="mind-review-actions" role="group" aria-label="Name the culprit">{suspects.map((who, i) => <button type="button" className="secondary" key={who} onClick={() => { if (i === step.culprit) { setDone(true); setNote(''); } else setNote(`${who} didn't have the lamp. Look at the ✓ marks.`); }}>{who}</button>)}</div>}
      {note && <p className="small" role="status">{note}</p>}
      {done && <button type="button" onClick={() => go(index + 1)}>{index + 1 < steps.length ? 'Next' : 'Done'}</button>}
    </>}
    {!finished && <button type="button" className="text-button" onClick={() => onDone(true)}>Skip how-to</button>}
  </section>;
}
