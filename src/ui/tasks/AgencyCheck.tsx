import { useLiveQuery } from 'dexie-react-hooks';
import { AGENCY_SCORES } from '../../core/guard';
import { dayKey } from '../../core/time';
import { db } from '../../data/db';
import { recordAgency } from '../../data/repos/guard';
import { recordError } from '../errorRing';

const SCORE_WORDS: Record<number, string> = { 1: 'Not at all', 5: 'Very' };

/** The weekly agency check (HANDOVER §4): two one-tap questions, saved on today's log. */
export function AgencyCheck({ now }: { now: number }) {
  const today = dayKey(now);
  const log = useLiveQuery(() => db.dailyLog.get(today), [today]);
  const save = (answer: { score?: number; openedInstead?: boolean }) => void recordAgency(db, now, answer).catch(error => recordError('promise', error));
  const score = log?.agency1to5;
  const instead = log?.agencyOpenedInstead;
  return <section className="card agency-check" aria-label="Time in NANDI">
    <h2>Time in NANDI this week</h2>
    <p id="agency-score-q">Did your time in the app feel well spent?</p>
    <div className="interest-chips" role="group" aria-labelledby="agency-score-q">{AGENCY_SCORES.map(value => <button type="button" key={value} className={score === value ? 'interest-chip on' : 'interest-chip'} aria-pressed={score === value} aria-label={`${value} of 5${SCORE_WORDS[value] ? `, ${SCORE_WORDS[value].toLowerCase()}` : ''}`} onClick={() => save({ score: value })}>{value}</button>)}</div>
    <p className="small agency-ends"><span>1 · {SCORE_WORDS[1]}</span><span>5 · {SCORE_WORDS[5]}</span></p>
    <p id="agency-instead-q">Did you open it when you meant to do something else?</p>
    <div className="interest-chips" role="group" aria-labelledby="agency-instead-q">{([[true, 'Yes'], [false, 'No']] as const).map(([value, label]) => <button type="button" key={label} className={instead === value ? 'interest-chip on' : 'interest-chip'} aria-pressed={instead === value} onClick={() => save({ openedInstead: value })}>{label}</button>)}</div>
    {score !== undefined && instead !== undefined && <p className="small" role="status">Saved for this week. Thank you.</p>}
  </section>;
}
