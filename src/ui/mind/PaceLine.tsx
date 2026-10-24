import { paceAt } from '../../core/puzzles/pace';

function timeText(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
/** The par line at the finish; bold when this solve beat your par (spec 24 pace line). */
export function ParLine({ par, solveMs }: { par: number; solveMs?: number }) {
  const text = `Par ${timeText(par)} (your median of the last 10)`;
  return solveMs !== undefined && solveMs < par ? <p className="mind-par-beaten"><strong>{text}</strong></p> : <p>{text}</p>;
}
export const paceMotionOn = () => !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.motion !== 'reduce';

/**
 * Spec 24 pace line (cj5-mind §7.1): a thin line inside the timer row with two dots, you and the other run, where the
 * other run had got after the same active time. It counts up, never ends a run and never says who is ahead. Your dot
 * only moves forward (the caller passes a rise-only value). Under reduced motion it is a still word instead.
 */
export function PaceLine({ mine, marks, elapsed, who, caption, totalMs, motion = paceMotionOn() }: { mine: number; marks: number[]; elapsed: number; who: string; caption: string; totalMs: number; motion?: boolean }) {
  if (!motion) return <span className="small mind-pace-still">{who}: {timeText(totalMs)}</span>;
  const other = paceAt(marks, elapsed);
  const percent = (value: number) => Math.round(value * 100);
  return <>
    <span className="mind-pace-track" role="img" aria-label={`${caption}. You ${percent(mine)}% filled · ${who} ${percent(other)}% at this time`} title={caption}>
      <span className="mind-pace-dot mind-pace-other" style={{ left: `${other * 100}%` }} />
      <span className="mind-pace-dot mind-pace-you" style={{ left: `${mine * 100}%` }} />
    </span>
    {/* A tiny key, always shown while the line is on, so a touch user can tell which dot is theirs (Codex A item 78). */}
    <span className="small mind-pace-key" aria-hidden="true"><span className="mind-pace-you-key">you</span><span className="mind-pace-other-key">{who.replace(/^Your /, '')}</span></span>
  </>;
}
