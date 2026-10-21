import { useEffect, useState } from 'react';
import { softNumbers } from '../../core/soft/soft';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { hashPin, ownerMetrics, validPin } from '../../core/owner/metrics';
import { readPinHash, savePinHash } from '../../data/repos/owner';
import { deriveEconomy } from '../../core/economy/deriveEconomy';
import { dayKey } from '../../core/time';
import { lessonMetrics } from '../../core/learn/steps';
import { catalogFor, topics } from '../learn/flow';
import './owner.css';

const UNLOCK_KEY = 'nandi.owner.unlocked';
const unlockedNow = () => { try { return sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch { return false; } };
const rememberUnlock = () => { try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch { /* the panel just asks again */ } };

/** Owner-only numbers, computed on this phone from local data. Nothing is sent anywhere. */
export function OwnerPanel() {
  const [saved, setSaved] = useState<string | null | undefined>(undefined);
  const [open, setOpen] = useState(unlockedNow);
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { void readPinHash(db).then(setSaved).catch(() => setSaved(null)); }, []);
  async function submit() {
    if (!validPin(pin)) { setMessage('Use 4 to 6 digits.'); return; }
    const hash = await hashPin(pin);
    if (saved === null) {
      await savePinHash(db, hash, Date.now());
      setSaved(hash); rememberUnlock(); setOpen(true); setPin(''); return;
    }
    if (hash === saved) { rememberUnlock(); setOpen(true); setPin(''); }
    else setMessage('That PIN does not match.');
  }
  if (saved === undefined) return <section className="screen"><p>Loading…</p></section>;
  if (!open) return <section className="screen owner-gate">
    <p className="eyebrow">Owner</p><h1>{saved === null ? 'Set an owner PIN' : 'Owner panel'}</h1>
    <p>{saved === null ? 'Choose 4 to 6 digits. You will need it to open this panel.' : 'Enter your owner PIN.'}</p>
    <label>PIN <input inputMode="numeric" type="password" autoComplete="off" value={pin} onChange={event => { setPin(event.target.value.replace(/\D/g, '').slice(0, 6)); setMessage(''); }} onKeyDown={event => { if (event.key === 'Enter') void submit(); }} /></label>
    <button type="button" onClick={() => void submit()}>{saved === null ? 'Save PIN' : 'Open'}</button>
    {message && <p role="status">{message}</p>}
  </section>;
  return <OwnerNumbers />;
}

function OwnerNumbers() {
  const source = useLiveQuery(async () => ({ ledger: await db.ledger.toArray(), settings: await db.settings.toArray() }), []);
  if (!source) return <section className="screen"><p>Loading…</p></section>;
  const now = Date.now(); // eslint-disable-line react-hooks/purity
  const today = dayKey(now);
  const m = ownerMetrics({ ledger: source.ledger, settings: source.settings, today, now });
  const economy = deriveEconomy(source.ledger, undefined, source.settings, today);
  const maxFacts = Math.max(1, ...m.days.map(point => point.facts));
  const maxOpens = Math.max(1, ...m.days.map(point => point.opens));
  const stepById = new Map(catalogFor(topics.map(pack => pack.body.topic.id)).flatMap(concept => concept.items.map(item => [item.id, item.step] as const)));
  const lessons = lessonMetrics(source.ledger, itemId => stepById.get(itemId));
  const pct = (part: number, whole: number) => whole ? `${Math.round(part / whole * 100)}%` : '—';
  const soft = softNumbers(source.ledger, today);
  const share = (value: number | null) => value === null ? '—' : `${Math.round(value * 100)}%`;
  const tiles: [string, string][] = [
    ['Opens today', String(m.opensToday)], ['Opens a day (7 d)', String(m.opensAvg7)],
    ['Active days (7 d)', `${m.activeDays7} of 7`], ['Active days (30 d)', `${m.activeDays30} of 30`],
    ['Streak', `${economy.streak.days} days`], ['Level', String(economy.level)],
    ['Tasks done (7 d)', String(m.tasksDone7)], ['Workouts (7 d)', String(m.workouts7)],
    ['Boards solved (7 d)', String(m.boards7)], ['Cases solved (7 d)', String(m.cases7)],
    ['Learn answers (7 d)', String(m.answers7)], ['Learn accuracy (7 d)', m.accuracy7 === null ? '—' : `${m.accuracy7}%`],
    ['Recall at 7 days', `${pct(m.retention.recalled7, m.retention.checked7)} (${m.retention.checked7})`],
    ['Recall at 30 days', `${pct(m.retention.recalled30, m.retention.checked30)} (${m.retention.checked30})`],
    ['App pause: chose NANDI', String(m.pauseOpenings)], ['App pause: went anyway', String(m.pauseWentAnyway)],
    ['Rest days banked', String(economy.streak.restDays)], ['Errors saved', String(m.errors)],
    ['Lessons taught', String(lessons.lessons)], ['Guided first try (aim 85–95%)', lessons.guidedFirstTry === null ? '—' : `${lessons.guidedFirstTry}% (${lessons.guidedCount})`],
    ['Your turn right (aim ~80%)', lessons.yourTurn === null ? '—' : `${lessons.yourTurn}% (${lessons.yourTurnCount})`],
    // Spec 15 §6 kill test for soft days.
    ['Soft days finished (keep if ≥70%)', soft.started ? `${share(soft.finishRate)} (${soft.finished} of ${soft.started})` : '—'],
    ['Soft day minutes (aim ≤4)', soft.medianMinutes === null ? '—' : `${Math.round(soft.medianMinutes * 10) / 10} min`],
    ['Back next day: soft vs missed', `${share(soft.returnAfterSoft)} vs ${share(soft.returnAfterMiss)}`],
  ];
  return <section className="screen owner-panel" aria-label="Owner panel">
    <p className="eyebrow">Owner</p><h1>How NANDI is doing</h1>
    <p className="small">Worked out on this phone from your own data. Nothing leaves the device.</p>
    <div className="owner-tiles">{tiles.map(([label, value]) => <div className="card owner-tile" key={label}><span className="small">{label}</span><strong>{value}</strong></div>)}</div>
    <section className="card owner-chart" aria-label="Activity, last 30 days"><h2>Activity, last 30 days</h2>
      <div className="owner-bars">{m.days.map(point => <span key={point.day} title={`${point.day}: ${point.facts} actions`} style={{ height: `${Math.max(4, point.facts / maxFacts * 100)}%` }} className={point.facts ? 'on' : ''} />)}</div></section>
    <section className="card owner-chart" aria-label="Opens, last 30 days"><h2>Opens, last 30 days</h2>
      <div className="owner-bars">{m.days.map(point => <span key={point.day} title={`${point.day}: ${point.opens} opens`} style={{ height: `${Math.max(4, point.opens / maxOpens * 100)}%` }} className={point.opens ? 'on' : ''} />)}</div></section>
  </section>;
}
