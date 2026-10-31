import { useState, type CSSProperties } from 'react';
import { cueFor, squareAt, type SquarePhase } from '../../core/calm/squareBreath';
import { Cast } from '../cast/Cast';
import './squareBreath.css';

// The square's four hand-drawn sides (top, right, bottom, left), each walked by the dot in one phase.
const SIDES = [
  'M24 24Q80 21 132 24T196 24',
  'M196 24Q198 80 196 132T196 196',
  'M196 196Q140 199 88 196T24 196',
  'M24 196Q21 140 24 88T24 24',
] as const;

/** The dot walks one side a phase at an even speed; it starts where the phase already is, so a return never replays. */
function Dot({ phase, intoMs, paused }: { phase: SquarePhase; intoMs: number; paused: boolean }) {
  const [delay] = useState(intoMs);
  return <span className="square-dot" data-side={phase.side} aria-hidden="true"
    style={{ animationName: `square-side-${phase.side}`, animationDuration: `${phase.seconds}s`, animationDelay: `${-delay}ms`, animationPlayState: paused ? 'paused' : undefined }} />;
}

/**
 * Spec 45a: the square breath, drawn from the time since it began (`elapsedMs`), shared by the opening page and Calm.
 * The phase word and the count change on the wall clock; only the dot moves, and only by transform. The count is
 * not read out each second; the side being walked is drawn darker, also with reduced motion (where nothing moves).
 */
export function SquareBreath({ elapsedMs, holds, onHolds, cueRound, paused = false, rest, context }: {
  elapsedMs: number; holds: boolean; onHolds?: () => void; cueRound?: number; paused?: boolean; rest?: string; context: 'opener' | 'calm';
}) {
  const at = squareAt(elapsedMs, holds);
  const style = { '--phase-s': `${at.phase.seconds}s` } as CSSProperties;
  return <div className={`square-breath square-${context}`}>
    <div className="square-wrap" data-kind={rest ? 'rest' : at.phase.kind} style={style}>
      <svg className={`square-lines${holds ? '' : ' two-sides'}`} viewBox="0 0 220 220" aria-hidden="true">
        {SIDES.map((d, side) => <path key={side} d={d} className={`${side % 2 ? 'hold-side' : ''}${!rest && side === at.phase.side ? ' active' : ''}`} />)}
      </svg>
      {!rest && <Dot key={`${at.round}:${at.index}`} phase={at.phase} intoMs={at.intoMs} paused={paused} />}
      <div className="square-middle">
        <span key={rest ?? at.phase.kind} className="square-word">{rest ?? at.phase.label}</span>
        {!rest && <span className="square-count" aria-hidden="true">{at.count}</span>}
      </div>
      <span className="square-turtle" aria-hidden="true"><Cast name="Kachhua" size={64} /></span>
    </div>
    {onHolds && <button type="button" className="square-holds" aria-pressed={holds} onClick={onHolds}>Holds: {holds ? 'on' : 'off'}</button>}
    <p className="square-cue">{cueFor(cueRound ?? at.round)}</p>
  </div>;
}
