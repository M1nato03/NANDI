import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { answerChhutti, checkChhutti, chhuttiInLightsOut, removeChhuttiWindow, saveChhuttiWindow, skipChhuttiToday, type ChhuttiPending } from '../../data/repos/chhutti';
import { appliesOn, boundsOn, CHHUTTI_KEY, CHHUTTI_LABELS, chhuttiLine, isLive, readChhutti, windowBounds } from '../../core/plan/chhutti';
import { dayKey } from '../../core/time';

/**
 * Spec 24 #1, Phone ki chhutti: plan a short day off for the phone. Nothing is blocked and nothing counts down;
 * the next time NANDI opens, it reads the phone's own usage log for the window and says what happened in one line.
 */
export function PhoneChhutti() {
  const [now, setNow] = useState(() => Date.now());
  const [pending, setPending] = useState<ChhuttiPending[]>([]);
  const [editing, setEditing] = useState(false);
  const [from, setFrom] = useState('21:00');
  const [choice, setChoice] = useState<(typeof CHHUTTI_LABELS)[number]>(CHHUTTI_LABELS[1]);
  const [message, setMessage] = useState('');
  const [lightsOut, setLightsOut] = useState(false);
  const source = useLiveQuery(async () => ({
    settings: await db.settings.where('key').startsWith(CHHUTTI_KEY).toArray(),
    facts: await db.ledger.where('kind').equals('chhutti').toArray(),
  }), []);
  useEffect(() => {
    let alive = true;
    const check = () => {
      if (document.visibilityState !== 'visible') return;
      const at = Date.now();
      setNow(at);
      void chhuttiInLightsOut(db, at).then(quiet => { if (alive) setLightsOut(quiet); }).catch(() => undefined);
      void checkChhutti(db, at).then(list => { if (alive) setPending(list); }).catch(() => undefined);
    };
    check();
    document.addEventListener('visibilitychange', check);
    return () => { alive = false; document.removeEventListener('visibilitychange', check); };
  }, []);
  if (!source) return null;
  const today = dayKey(now);
  const windows = readChhutti(source.settings);
  const window = windows.find(isLive);
  const facts = source.facts.filter(fact => !fact.deleted);
  async function save() {
    try {
      await saveChhuttiWindow(db, { id: window?.id, label: choice.label, from, weekdays: 'weekdays' in choice ? [...choice.weekdays] : undefined });
      setEditing(false);
      setMessage('Saved. Nothing will stop you; NANDI just looks back afterwards.');
    } catch { setMessage('Could not save that. Try again.'); }
  }
  async function answer(item: ChhuttiPending, choice: 'yes' | 'partly' | 'no') {
    await answerChhutti(db, item.day, item.window, choice).catch(() => setMessage('Could not save that. Try again.'));
    setPending(list => list.filter(entry => entry !== item));
  }
  if (!window || editing) return <section className="card phone-chhutti" aria-label="Phone ki chhutti">
    <h2>Phone ki chhutti</h2>
    <p>Give your phone a short day off. When does it get one?</p>
    <div className="chip-row">{CHHUTTI_LABELS.map(option => <button type="button" className={option === choice ? '' : 'secondary'} aria-pressed={option === choice} key={option.label} onClick={() => { setChoice(option); setFrom(option.from); }}>{option.label}</button>)}</div>
    <label>Starts at <input type="time" value={from} onChange={event => setFrom(event.target.value)} /></label>
    <button type="button" onClick={() => void save()}>Save the chhutti</button>
    <p className="small">It starts at 30 minutes. It grows a little when it goes well, and you can say "Not today" any day.</p>
    {editing && <button type="button" className="text-button" onClick={() => setEditing(false)}>Keep it as it is</button>}
    {message && <p role="status">{message}</p>}
  </section>;
  const ended = facts.filter(fact => fact.inputs.windowId === window.id).sort((a, b) => b.dayKey.localeCompare(a.dayKey))[0];
  const showLast = !lightsOut && ended && ended.dayKey >= dayKey(now - 86_400_000);
  const { fromMs, toMs } = windowBounds(window, today);
  const skipped = source.settings.some(row => row.key === `${CHHUTTI_KEY}.skip:${today}:${window.id}` && row.value === true && !row.deleted);
  const upcoming = appliesOn(window, today) && !skipped && now < toMs;
  // Today keeps the bounds it was planned with; a change or a longer window shows from the next day.
  const shown = upcoming ? boundsOn(window, today) : window;
  return <section className="card phone-chhutti" aria-label="Phone ki chhutti">
    <h2>Phone ki chhutti</h2>
    <p>{window.label}, the phone goes on the shelf from {shown.from} until {shown.to}.</p>
    {upcoming && now >= fromMs && <p className="small">This is the phone's chhutti now.</p>}
    {skipped && <p className="small">Not today. It comes back tomorrow.</p>}
    {showLast && <p className="chhutti-line" role="status">{chhuttiLine(ended, ended.inputs.label === window.label ? window.label : String(ended.inputs.label ?? window.label))}</p>}
    {!lightsOut && pending.map(item => <div key={`${item.day}:${item.window.id}`} className="chhutti-ask" role="group" aria-label={`${item.window.label} check-in`}>
      <p>Did the phone get its chhutti ({item.window.label.toLowerCase()})?</p>
      <div className="sheet-actions"><button type="button" onClick={() => void answer(item, 'yes')}>Yes</button><button type="button" className="secondary" onClick={() => void answer(item, 'partly')}>Partly</button><button type="button" className="secondary" onClick={() => void answer(item, 'no')}>Not today</button></div>
    </div>)}
    <div className="sheet-actions">
      {upcoming && <button type="button" className="secondary" onClick={() => void skipChhuttiToday(db, window.id).catch(() => setMessage('Could not save that. Try again.'))}>Not today</button>}
      <button type="button" className="secondary" onClick={() => { setFrom(window.from); setChoice(CHHUTTI_LABELS.find(option => option.label === window.label) ?? CHHUTTI_LABELS[1]); setEditing(true); }}>Change</button>
      <button type="button" className="text-button" onClick={() => void removeChhuttiWindow(db, window.id).catch(() => setMessage('Could not save that. Try again.'))}>Turn off</button>
    </div>
    {message && <p role="status">{message}</p>}
  </section>;
}
