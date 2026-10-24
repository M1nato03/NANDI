import { paceAt } from '../../core/puzzles/pace';

function timeText(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
const motionOn = () => !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.motion !== 'reduce';

/**
 * Spec 24 pace line (cj5-mind §7.1): a thin line with two dots, you and the other run, where the other run had got
 * after the same active time. It counts up, never ends a run and never says who is ahead. Under reduced motion it is
 * one still line of text instead.
 */
export function PaceLine({ mine, marks, elapsed, who, totalMs }: { mine: number; marks: number[]; elapsed: number; who: string; totalMs: number }) {
  if (!motionOn()) return <p className="small mind-pace-still">{who}: {timeText(totalMs)}</p>;
  const other = paceAt(marks, elapsed);
  const percent = (value: number) => Math.round(value * 100);
  return <div className="mind-pace">
    <div className="mind-pace-track" role="img" aria-label={`You ${percent(mine)}% filled · ${who} ${percent(other)}% at this time`}>
      <span className="mind-pace-dot mind-pace-other" style={{ left: `${other * 100}%` }} />
      <span className="mind-pace-dot mind-pace-you" style={{ left: `${mine * 100}%` }} />
    </div>
    <p className="small mind-pace-key" aria-hidden="true"><span className="mind-pace-you-key">You</span><span className="mind-pace-other-key">{who}</span></p>
  </div>;
}
