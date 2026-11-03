import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { savePicks } from '../../data/repos/picks';
import { GOALS, PICKS_KEY, readPicks, type Picks } from '../../core/welcome';
import { GoalPicker } from '../welcome/GoalPicker';
import { recordError } from '../errorRing';

/** You's one-line summary of the picks: "Everything", or the picked areas in tap order. */
export function picksLine(picks: Picks): string {
  return picks.size === 'all' ? 'Everything' : picks.goals.map(goal => GOALS.find(item => item.id === goal)!.label).join(' · ');
}

const usePicks = () => useLiveQuery(async () => readPicks(await db.settings.where('key').anyOf(PICKS_KEY.goals, PICKS_KEY.size).toArray()), []);

/** Spec 52 C: You's row, "What NANDI helps with". */
export function HelpsWithRow({ open }: { open: () => void }) {
  const picks = usePicks();
  return <button type="button" className="card you-link you-helps-link" onClick={open}><strong>What NANDI helps with</strong><span>{picks ? picksLine(picks) : ''}</span></button>;
}

/** The same toggles and size line as Welcome. Every change applies at once; nothing is hidden or locked by them. */
export function HelpsWith() {
  const picks = usePicks();
  const change = (next: Picks) => { if (next.goals.length) void savePicks(db, next, Date.now()).catch(error => recordError('promise', error)); };
  return <section className="screen you-helps"><p className="eyebrow">You</p><h1>What NANDI helps with</h1>
    <p>NANDI suggests these first. Everything else is always there.</p>
    {picks && <GoalPicker value={picks} onChange={change} />}
  </section>;
}
