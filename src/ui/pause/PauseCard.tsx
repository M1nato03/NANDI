import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { RULES } from '../../core/rules.config';
import { dayKey } from '../../core/time';
import { actsToday, PAUSE_ACTS, pauseAppLabel, pauseLine, readPauseCard } from '../../core/pauseCard';
import { recordPauseAttempt, type PauseOutcome } from '../../data/repos/pause';
import { clearNightPause, goPhoneHome, openPausedApp, otherAppInFront } from '../../platform/nightPause';
import { Mor } from '../cast/Cast';
import { useModalFocus } from '../shell/useModalFocus';
import './pause.css';

type Stage = { kind: 'card' } | { kind: 'act'; act: string; startedAt: number; endsAt: number } | { kind: 'ready'; act: string; startedAt: number } | { kind: 'done'; paid: boolean };

/**
 * Spec 39, the Pause card: shown when a picked app comes to the front inside the window. The person's own plan, one
 * big "Do my 2-min thing", and "Not now" and "Open <app> anyway" at equal weight: every way out is one tap, with no
 * countdown before it and no "are you sure". `demo` is the setup's "See it once": nothing is recorded or opened.
 */
export function PauseCard({ packageName, close, demo, demoAct }: { packageName: string; close: () => void; demo?: boolean; demoAct?: string | null }) {
  const dialog = useModalFocus<HTMLDivElement>();
  const settings = useLiveQuery(() => db.settings.toArray(), []) ?? [];
  const facts = useLiveQuery(() => db.ledger.where('mode').equals('pause').toArray(), []) ?? [];
  const now = Date.now(); // eslint-disable-line react-hooks/purity
  const card = readPauseCard(settings, dayKey(now));
  const label = pauseAppLabel(packageName);
  const act = demo ? demoAct ?? null : card.act;
  const [stage, setStage] = useState<Stage>({ kind: 'card' });
  const [left, setLeft] = useState<number>(RULES.pause.actSeconds);
  const [message, setMessage] = useState('');
  const acting = useRef(false);

  // The act counts with NANDI in front or the screen off (squats, a step outside, a paper book: the phone goes down).
  // Opening another app stops it; that is read from the phone's usage log when NANDI is back in front.
  const checking = useRef(false);
  useEffect(() => {
    if (stage.kind !== 'act') return;
    const stopped = () => { setStage({ kind: 'card' }); setMessage('The 2 minutes stopped when another app opened. Start again when you are ready.'); };
    const tick = () => {
      if (document.visibilityState === 'hidden' || checking.current) return;
      const remaining = Math.max(0, Math.ceil((stage.endsAt - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) setStage({ kind: 'ready', act: stage.act, startedAt: stage.startedAt });
    };
    const back = () => {
      if (document.visibilityState !== 'visible') return;
      checking.current = true;
      void otherAppInFront(stage.startedAt, Date.now()).then(other => { checking.current = false; if (other !== false) stopped(); else tick(); }, () => { checking.current = false; stopped(); });
    };
    tick();
    const timer = window.setInterval(tick, 250);
    document.addEventListener('visibilitychange', back);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', back); };
  }, [stage]);

  async function answer(outcome: PauseOutcome, then: () => Promise<void>) {
    if (acting.current) return;
    acting.current = true;
    try {
      if (!demo) { await recordPauseAttempt(db, packageName, outcome, Date.now()); await then(); }
      close();
    } catch { acting.current = false; setMessage('That did not work. You can leave NANDI normally.'); }
  }
  function start(what: string) { const at = Date.now(); setMessage(''); setStage({ kind: 'act', act: what, startedAt: at, endsAt: at + RULES.pause.actSeconds * 1000 }); } // eslint-disable-line react-hooks/purity
  async function finish() {
    if (stage.kind !== 'ready' || acting.current) return;
    acting.current = true;
    // The last word on honesty: an act another app interrupted never pays, however the screen got back here.
    if (!demo && await otherAppInFront(stage.startedAt, Date.now()) !== false) {
      acting.current = false; setStage({ kind: 'card' }); setMessage('The 2 minutes stopped when another app opened. Start again when you are ready.'); return;
    }
    acting.current = false;
    const paid = actsToday(facts, dayKey(Date.now())).nextPays;
    if (!demo) {
      try { await recordPauseAttempt(db, packageName, 'act_done', Date.now()); await clearNightPause(); }
      catch { setMessage('Could not save that. Your 2 minutes still happened.'); }
    }
    setStage({ kind: 'done', paid });
  }
  const openAnyway = () => answer('opened_anyway', () => openPausedApp(packageName, card.grace * 60_000));
  const notNow = () => answer('backed_out', async () => { await clearNightPause(); await goPhoneHome(); });
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;

  return <div ref={dialog} tabIndex={-1} className="night-pause-overlay pause-overlay" role="dialog" aria-modal="true" aria-label="Pause card">
    <section className="card pause-card">
      <span className="pause-friend" aria-hidden="true"><Mor pose="idle" size={40} /></span>
      {stage.kind === 'card' && <>
        <p className="eyebrow">{label}</p>
        <p className="pause-plan-label">Your plan:</p>
        <h1 className="pause-line">{pauseLine(label, act)}</h1>
        {act ? <button type="button" className="pause-do" onClick={() => start(act)}>Do my 2-min thing</button>
          : <div className="pause-picks" role="group" aria-label="Pick a 2-minute thing">{PAUSE_ACTS.slice(0, 4).map(pick => <button type="button" key={pick} className="secondary" onClick={() => start(pick)}>{pick[0]!.toUpperCase() + pick.slice(1)}</button>)}</div>}
        <div className="pause-exits">
          <button type="button" className="text-button" onClick={() => void notNow()}>Not now</button>
          <button type="button" className="text-button" onClick={() => void openAnyway()}>Open {label} anyway</button>
        </div>
      </>}
      {(stage.kind === 'act' || stage.kind === 'ready') && <>
        <p className="eyebrow">Your 2 minutes</p>
        <h1 className="pause-line">{stage.act[0]!.toUpperCase() + stage.act.slice(1)}</h1>
        <p className="pause-clock" role="timer" aria-live="off">{stage.kind === 'ready' ? '0:00' : clock}</p>
        {stage.kind === 'ready' ? <button type="button" className="pause-do" onClick={() => void finish()}>Done</button>
          : <p className="small">Done shows when the 2 minutes are up. Put the phone down or keep NANDI open; opening another app stops it.</p>}
        <div className="pause-exits">
          <button type="button" className="text-button" onClick={() => void notNow()}>Not now</button>
          <button type="button" className="text-button" onClick={() => void openAnyway()}>Open {label} anyway</button>
        </div>
      </>}
      {stage.kind === 'done' && <>
        <h1 className="pause-line">Done.</h1>
        <p className="pause-earned">{stage.paid ? `+${RULES.pause.actXp} XP · 2 minutes back.` : '2 minutes back.'}</p>
        <button type="button" className="pause-do" onClick={() => { if (demo) close(); else void goPhoneHome().then(close, close); }}>Back to my day</button>
        <button type="button" className="text-button" onClick={() => { if (demo) close(); else void openPausedApp(packageName, card.grace * 60_000).then(close, close); }}>Open {label} now</button>
      </>}
      {demo && <p className="small pause-demo">This is how it looks. Nothing is saved.</p>}
      {message && <p role="status">{message}</p>}
    </section>
  </div>;
}
