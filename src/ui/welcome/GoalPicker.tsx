import { useState } from 'react';
import { ALL_PICKS, GOALS, PICK_LIMIT, type Goal, type Picks, type PickSize } from '../../core/welcome';
import './welcome.css';

/** What a refused extra tap says, per size. */
const FULL: Record<Exclude<PickSize, 'all'>, string> = {
  two: 'Two to start. You can add more later.',
  more: 'Four at most here. Everything picks all five.',
};

/** Moving to a smaller size keeps the first picks in tap order; Everything picks all five, the tapped ones first. */
export function resize(state: Picks, size: PickSize): Picks {
  if (size === 'all') return { goals: [...state.goals, ...ALL_PICKS.goals.filter(goal => !state.goals.includes(goal))], size };
  return { goals: state.goals.slice(0, PICK_LIMIT[size]), size };
}

/**
 * A tap on one area. At 'two' and 'more' a tap past the limit is refused (null); at 'all' a tap takes that area out,
 * which leaves the other four at 'more'.
 */
export function toggle(state: Picks, goal: Goal): Picks | null {
  if (state.goals.includes(goal)) {
    const goals = state.goals.filter(id => id !== goal);
    return state.size === 'all' ? { goals, size: 'more' } : { goals, size: state.size };
  }
  if (state.size === 'all' || state.goals.length >= PICK_LIMIT[state.size]) return null;
  return { goals: [...state.goals, goal], size: state.size };
}

/**
 * Spec 52 C: the five areas as toggles plus a quiet size line, shared by Welcome and You. A choice by size, never by
 * difficulty: two (the default), 3-4 things, or Everything. Nothing is hidden or locked by it; it decides what NANDI
 * offers first.
 */
export function GoalPicker({ value, onChange, onEverything }: { value: Picks; onChange: (next: Picks) => void; onEverything?: (before: Picks) => void }) {
  const [refused, setRefused] = useState('');
  const tap = (goal: Goal) => {
    const next = toggle(value, goal);
    if (!next) { setRefused(value.size === 'all' ? '' : FULL[value.size]); return; }
    setRefused('');
    onChange(next);
  };
  const size = (next: PickSize) => { setRefused(''); onChange(resize(value, next)); if (next === 'all') onEverything?.(value); };
  const all = value.size === 'all';
  return <div className="goal-picker">
    <div className="welcome-goals" role="group" aria-label="What NANDI helps with">
      {GOALS.map(item => {
        const on = all || value.goals.includes(item.id);
        return <button type="button" key={item.id} className={`welcome-goal${on ? ' picked' : ''}`} aria-pressed={on} onClick={() => tap(item.id)}>{item.label}{on && <span className="goal-check" aria-hidden="true">✓</span>}</button>;
      })}
    </div>
    <p className="goal-refused" role="status">{refused}</p>
    <p className="goal-size">
      {value.size === 'two' && <><span>Want more?</span><span className="goal-sep" aria-hidden="true">·</span><button type="button" className="text-button" onClick={() => size('more')}>3-4 things</button></>}
      {value.size !== 'two' && <><span>{all ? 'Everything is on' : 'Up to four'}</span><span className="goal-sep" aria-hidden="true">·</span><button type="button" className="text-button" onClick={() => size('two')}>Just two</button></>}
      {value.size === 'all' && <><span className="goal-sep" aria-hidden="true">·</span><button type="button" className="text-button" onClick={() => size('more')}>3-4 things</button></>}
      {value.size !== 'all' && <><span className="goal-sep" aria-hidden="true">·</span><button type="button" className="text-button" onClick={() => size('all')}>Everything</button></>}
    </p>
  </div>;
}
