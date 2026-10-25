import { useMemo, useState } from 'react';
import type { TaalWeek as Week } from '../../core/train/taal';
import { weekLine } from '../../core/train/taal';

const short = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const words = (beat: Week['beats'][number]) => `${short[beat.weekday]}: ${beat.plan === 'clap' ? (beat.filled ? (beat.extra ? 'trained on a rest day' : 'trained') : 'training day') : beat.filled ? (beat.walked ? 'rest, with a walk' : 'rest') : 'rest day'}${beat.today ? ', today' : ''}`;

function Beats({ week, small = false }: { week: Week; small?: boolean }) {
  return <ol className={`taal-beats${small ? ' taal-beats-small' : ''}`} aria-label={small ? `Week of ${week.weekStart}: ${weekLine(week)}` : 'This week'}>
    {week.beats.map(beat => <li key={beat.dayKey} className={`taal-beat taal-${beat.plan}${beat.filled ? ' taal-filled' : ''}${beat.today ? ' taal-today' : ''}${beat.extra ? ' taal-extra' : ''}`} aria-label={words(beat)}>
      <span className="taal-mark" aria-hidden="true">{beat.walked ? '•' : ''}</span>
      {!small && <span className="taal-day" aria-hidden="true">{short[beat.weekday]![0]}</span>}
    </li>)}
  </ol>;
}

/**
 * Spec 24 #3 Taal week (cj5-train §7 #1): claps are training days, the open beats are rest, and both are part of the
 * rhythm. Beats only fill; a short week is drawn whole; past weeks stay on the rhythm sheet.
 */
export function TaalWeekCard({ week, sheetWeeks, loadSheet }: { week: Week; sheetWeeks: number; loadSheet: () => Week[] }) {
  const today = week.beats.find(beat => beat.today);
  const [open, setOpen] = useState(false);
  const sheet = useMemo(() => open ? loadSheet() : [], [open, loadSheet]);
  return <div className="card taal-card">
    <h2>This week's rhythm</h2>
    <Beats week={week} />
    <p>{weekLine(week)}</p>
    {today?.plan === 'rest' && !today.filled && <p className="small">Rest is today's beat.</p>}
    <p className="small taal-key"><span className="taal-key-clap">Training day</span><span className="taal-key-rest">Rest day</span></p>
    {sheetWeeks > 0 && <details className="taal-sheet" onToggle={event => setOpen(event.currentTarget.open)}><summary>Rhythm sheet</summary><ul>{sheet.map(past => <li key={past.weekStart}><Beats week={past} small /><span className="small">{weekLine(past)}</span></li>)}</ul></details>}
  </div>;
}
