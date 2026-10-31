import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { RULES } from '../../core/rules.config';
import { dayKey } from '../../core/time';
import { actsToday, PAUSE_ACTS, pauseAppLabel, pauseLine, readPauseCard } from '../../core/pauseCard';
import { pauseNextMove } from '../../core/pauseNextMove';
import { recordPauseAttempt, type PauseOutcome } from '../../data/repos/pause';
import { clearNightPause, goPhoneHome, openPausedApp } from '../../platform/nightPause';
import { Mor } from '../cast/Cast';
import { go } from '../shell/router';
import { useModalFocus } from '../shell/useModalFocus';
import './pause.css';

type Stage = { kind: 'card' } | { kind: 'act'; act: string; endsAt: number } | { kind: 'done'; paid: boolean };

/**
 * Spec 39, the Pause card: shown when a picked app comes to the front inside the window. The person's own plan, one
 * big "Do my 2-min thing", and "Do it in NANDI", "Not now" and "Open <app> anyway" at equal weight: every way out is
 * one tap, with no countdown before it and no "are you sure". Spec 39b: "I did it" shows from the start of the act;
 * the 2 minutes are a guide, never a gate, and the person's word is enough. `demo` is the setup's "See it once":
 * nothing is recorded or opened.
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

  // The clock is a guide only: it counts down to 0:00 and stays there; "I did it" is there the whole time.
  useEffect(() => {
    if (stage.kind !== 'act') return;
    const tick = () => setLeft(Math.max(0, Math.ceil((stage.endsAt - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [stage]);

  async function answer(outcome: PauseOutcome, then: () => Promise<void>) {
    if (acting.current) return;
    acting.current = true;
    try {
      if (!demo) await recordPauseAttempt(db, packageName, outcome, Date.now());
    } catch { acting.current = false; setMessage('That did not work. You can leave NANDI normally.'); return; }
    // The choice is saved; the card goes even if the phone could not open the app, so nobody is stuck on it.
    try { if (!demo) await then(); } catch { /* the app can be opened from the phone as usual */ }
    close();
  }
  function start(what: string) { setMessage(''); setStage({ kind: 'act', act: what, endsAt: Date.now() + RULES.pause.actSeconds * 1000 }); } // eslint-disable-line react-hooks/purity
  // One showing of the card pays at most once: "I did it" leaves the act for the done screen.
  async function finish() {
    if (stage.kind !== 'act' || acting.current) return;
    acting.current = true;
    const paid = actsToday(facts, dayKey(Date.now())).nextPays;
    if (!demo) {
      try { await recordPauseAttempt(db, packageName, 'act_done', Date.now()); await clearNightPause(); }
      catch { setMessage('Could not save that. Your 2 minutes still happened.'); }
    }
    setStage({ kind: 'done', paid });
  }
  const openAnyway = () => answer('opened_anyway', () => openPausedApp(packageName, card.grace * 60_000));
  const notNow = () => answer('backed_out', async () => { await clearNightPause(); await goPhoneHome(); });
  // Spec 39b: the next real thing in NANDI instead (focus, a Train day, a task, the Read drop). The card pays nothing.
  async function inApp() {
    if (demo) { close(); return; }
    const at = Date.now();
    const today = dayKey(at);
    try {
      const [focus, tasks, programs, sessions] = await Promise.all([db.focus.toArray(), db.tasks.where('dayKey').equals(today).toArray(), db.programs.toArray(), db.sessions.toArray()]);
      const move = pauseNextMove({ focus, tasks, programs, sessions, today, weekday: new Date(at).getDay() });
      await answer('in_app', clearNightPause);
      go(move.route);
    } catch { setMessage('That did not work. You can leave NANDI normally.'); }
  }
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
        <div className="pause-exits pause-exits-3">
          <button type="button" className="text-button" onClick={() => void inApp()}>Do it in NANDI</button>
          <button type="button" className="text-button" onClick={() => void notNow()}>Not now</button>
          <button type="button" className="text-button" onClick={() => void openAnyway()}>Open {label} anyway</button>
        </div>
      </>}
      {stage.kind === 'act' && <>
        <p className="eyebrow">Your 2 minutes</p>
        <h1 className="pause-line">{stage.act[0]!.toUpperCase() + stage.act.slice(1)}</h1>
        <p className="pause-clock" role="timer" aria-live="off">{clock}</p>
        <p className="small">About 2 minutes. Tap when it's done, however long it took.</p>
        <button type="button" className="pause-do" onClick={() => void finish()}>I did it</button>
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
