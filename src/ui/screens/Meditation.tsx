import { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { meditationElapsedMs, parseMeditation } from '../../core/mind/meditation';
import { RULES } from '../../core/rules.config';
import { db } from '../../data/db';
import { changeMeditation, MEDITATION_HISTORY, MEDITATION_KEY } from '../../data/repos/meditation';
import { minutes } from '../tasks/model';
import { recordError } from '../errorRing';
import { go } from '../shell/router';

export function Meditation() {
  const [now, setNow] = useState(Date.now);
  const [duration, setDuration] = useState<number>(RULES.meditation.defaultDurationMin);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const row = useLiveQuery(async () => (await db.settings.get(MEDITATION_KEY)) ?? null, []);
  const history = useLiveQuery(() => db.settings.where('key').startsWith(MEDITATION_HISTORY).toArray(), []) ?? [];
  const session = row && !row.deleted ? parseMeditation(row.value) : null;
  const active = session?.endedAt === undefined ? session : null;
  const last = history.filter(row => !row.deleted).map(row => parseMeditation(row.value)).filter(row => row?.endedAt !== undefined).sort((a, b) => b!.endedAt! - a!.endedAt!)[0];
  const remaining = active ? Math.max(0, active.durationMs - meditationElapsedMs(active, now)) : duration * 60_000;
  const paused = !!active?.pauses.length && active.pauses.at(-1)?.resumeAt === undefined;

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, 1000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pageshow', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('pageshow', refresh); };
  }, []);

  const act = useCallback(async (action: 'start' | 'pause' | 'resume' | 'finish' | 'complete') => {
    setBusy(true); setMessage('');
    try { await changeMeditation(db, action, Date.now(), duration); setNow(Date.now()); }
    catch (error) { recordError('window', error); setMessage('Could not save your practice. Try again.'); }
    finally { setBusy(false); }
  }, [duration]);

  useEffect(() => {
    if (!active || remaining !== 0 || busy || message) return;
    const timer = window.setTimeout(() => void act('complete'), 0);
    return () => window.clearTimeout(timer);
  }, [active, remaining, busy, message, act]);

  return <section className="screen meditation-screen">
    <button type="button" className="text-button" onClick={() => go('you/mind')}>← Mind</button>
    <p className="eyebrow">Room to breathe</p><h1>Meditate</h1>
    <p>Get comfortable. Breathe normally. When your mind wanders, gently return to your breath.</p>
    <div className="card meditation-card">
      <div className="meditation-clock" role="timer" aria-label="Meditation time remaining" aria-live="off">{minutes(Math.ceil(remaining / 1000) * 1000)}</div>
      {active ? <><p role="status">{paused ? 'Paused. Take your time.' : 'Quiet time. You can put your phone down.'}</p><div className="meditation-actions"><button type="button" disabled={busy} onClick={() => void act(paused ? 'resume' : 'pause')}>{paused ? 'Resume meditation' : 'Pause meditation'}</button><button type="button" className="secondary" disabled={busy} onClick={() => void act('finish')}>Finish now</button></div></> : <>
        <fieldset className="meditation-durations"><legend>Choose your time</legend>{RULES.meditation.durationPresetsMin.map(value => <label key={value}><input type="radio" name="meditation-duration" checked={duration === value} onChange={() => setDuration(value)} />{value} minutes</label>)}</fieldset>
        <button type="button" disabled={busy || row === undefined} onClick={() => void act('start')}>Start meditation</button>
        {last && <p role="status">Practice saved · {minutes(meditationElapsedMs(last, last.endedAt!))}. Back to your day when you are ready.</p>}
      </>}
      {message && <p role="alert">{message}</p>}
    </div>
    <p className="small">Your timer stays saved when you leave. It updates when you return; there is no background alarm.</p>
    <button type="button" className="secondary" onClick={() => go('now')}>Back to Now</button>
  </section>;
}
