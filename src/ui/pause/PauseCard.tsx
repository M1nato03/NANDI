import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { RULES } from '../../core/rules.config';
import { dayKey } from '../../core/time';
import { actsToday, GRACE_CHOICES, PAUSE_ACTS, pauseAppLabel, pauseLine, readPauseCard } from '../../core/pauseCard';
import { PAUSE_REASONS, type PauseReason } from '../../core/pauseReasons';
import { recordPauseAttempt, recordPauseReason, type PauseOutcome } from '../../data/repos/pause';
import { clearNightPause, openPausedApp } from '../../platform/nightPause';
import { Mor } from '../cast/Cast';
import { go } from '../shell/router';
import { useModalFocus } from '../shell/useModalFocus';
import './pause.css';

type Stage = { kind: 'card' } | { kind: 'pick' } | { kind: 'act'; act: string; endsAt: number } | { kind: 'done'; act: string | null; paid: boolean } | { kind: 'anyway'; minutes: number; why: PauseReason | null };

/**
 * Spec 39, the Pause card: shown when a picked app comes to the front inside the window. Every way out is one tap,
 * with no countdown before it and no "are you sure".
 * Jenil 14 Nov: three ways, no more. A filled "Start the 2 minutes" (the person's plan; with no plan set, the picks come
 * on the next screen), "Open <app> anyway", and a small "Not now" that keeps the person in NANDI, on its home (the
 * Courtyard, where the next move and the quests already are). "I did it" shows once the 2 minutes are started; the
 * clock is a guide, never a gate, and the person's word is enough. After it: "Back to NANDI", or open the app now.
 * (This replaces spec 39b's "I did it" on the card, 45c's three ways of one weight, 52 D's in-app move and 660's
 * quest link.) The night card after bedtime is NightPauseCard, apart from this one.
 * `demo` is the setup's "See it once": nothing is recorded or opened.
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

  /** Records the choice, then closes the card; false (and the card stays, with one line) when the save failed. */
  async function answer(outcome: PauseOutcome, then: () => Promise<void>): Promise<boolean> {
    if (acting.current) return false;
    acting.current = true;
    try {
      if (!demo) await recordPauseAttempt(db, packageName, outcome, Date.now());
    } catch { acting.current = false; setMessage('That didn’t work. You can leave NANDI normally.'); return false; }
    // The choice is saved; the card goes even if the phone could not do its part, so nobody is stuck on it.
    try { if (!demo) await then(); } catch { /* the phone's pending card clears on its own next time */ }
    close();
    return true;
  }
  function start(what: string) { setMessage(''); setStage({ kind: 'act', act: what, endsAt: Date.now() + RULES.pause.actSeconds * 1000 }); }
  // One showing of the card pays at most once: "I did it" (in the 2 minutes) leaves for the done screen.
  async function finish() {
    if (stage.kind === 'done' || acting.current) return;
    acting.current = true;
    const paid = actsToday(facts, dayKey(Date.now())).nextPays;
    if (!demo) {
      try { await recordPauseAttempt(db, packageName, 'act_done', Date.now()); await clearNightPause(); }
      catch { setMessage('Couldn’t save that. Your 2\u00a0minutes still happened.'); }
    }
    setStage({ kind: 'done', act: stage.kind === 'act' ? stage.act : act, paid });
  }
  // Spec 54: "Open anyway" asks two quiet things first: how long to stay quiet (the setup's time chosen), and why
  // (optional, private, counted only in You). The phone's quiet time is per open already (openPausedApp's snooze).
  const openAnyway = () => { setMessage(''); setStage({ kind: 'anyway', minutes: card.grace, why: null }); };
  async function openFor(minutes: number, why: PauseReason | null) {
    if (demo) { close(); return; }
    if (acting.current) return;
    acting.current = true;
    try {
      const at = Date.now();
      const attempt = await recordPauseAttempt(db, packageName, 'opened_anyway', at);
      if (why) await recordPauseReason(db, attempt, why, at + 1);
    } catch { acting.current = false; setMessage('That didn’t work. You can leave NANDI normally.'); return; }
    try { await openPausedApp(packageName, minutes * 60_000); } catch { /* the app can be opened from the phone as usual */ }
    close();
  }
  // Jenil 14 Nov: "Not now" stays in NANDI, on its home (the Courtyard), not the phone's home screen. The app was not
  // opened, so it is recorded as backing out; the pending card is cleared, so it doesn't come back on the next look.
  async function notNow() {
    if (demo) { close(); return; }
    // a9 14 Nov: only once it is saved; a failed save keeps the card (with its line) and the screen under it.
    if (await answer('backed_out', clearNightPause)) go('courtyard');
  }
  const backToNandi = () => { close(); if (!demo) go('courtyard'); };
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;

  return <div ref={dialog} tabIndex={-1} className="night-pause-overlay pause-overlay" role="dialog" aria-modal="true" aria-label="Pause card">
    <section className={`card pause-card pause-slip paper paper-tape pause-${stage.kind}`}>
      <span className="pause-friend" aria-hidden="true"><Mor pose="idle" size={40} /></span>
      {stage.kind === 'card' && <>
        <div className="pause-middle">
          <p className="eyebrow">{label}</p>
          <p className="pause-plan-label">Your plan:</p>
          <h1 className="pause-line">{pauseLine(label, act)}</h1>
        </div>
        <div className="pause-foot"><div className="pause-ways">
          <button type="button" className="pause-do pause-start" aria-label={act ? `Start the 2\u00a0minutes: ${act}` : undefined} onClick={() => { if (act) start(act); else setStage({ kind: 'pick' }); }}>Start the 2&nbsp;minutes</button>
          <button type="button" className="paper-choice" onClick={() => void openAnyway()}>Open {label} anyway</button>
        </div>
        <button type="button" className="ink-link pause-link" onClick={() => void notNow()}>Not now</button></div>
      </>}
      {stage.kind === 'pick' && <>
        {/* An older setup has no 2-minute thing: the picks come here, after Start, so the card itself stays at three ways. */}
        <div className="pause-middle">
          <p className="eyebrow">Your 2&nbsp;minutes</p>
          <h1 className="pause-line">Pick a 2-minute thing</h1>
          <div className="pause-picks" role="group" aria-label="Pick a 2-minute thing">{PAUSE_ACTS.slice(0, 4).map(pick => <button type="button" key={pick} className="secondary" onClick={() => start(pick)}>{pick[0]!.toUpperCase() + pick.slice(1)}</button>)}</div>
        </div>
        <div className="pause-foot"><button type="button" className="ink-link pause-link" onClick={() => void notNow()}>Not now</button></div>
      </>}
      {stage.kind === 'act' && <>
        <div className="pause-middle">
          <p className="eyebrow">Your 2&nbsp;minutes</p>
          <h1 className="pause-line">{stage.act[0]!.toUpperCase() + stage.act.slice(1)}</h1>
          <p className="pause-clock" role="timer" aria-live="off">{clock}</p>
          <p className="small">About 2&nbsp;minutes. Tap when it’s done, however long it took.</p>
        </div>
        <div className="pause-foot">
          <button type="button" className="pause-do" onClick={() => void finish()}>I did it</button>
          <button type="button" className="ink-link pause-link" onClick={() => void openAnyway()}>Open {label} anyway</button>
          <button type="button" className="ink-link pause-link" onClick={() => void notNow()}>Not now</button>
        </div>
      </>}
      {stage.kind === 'anyway' && <>
        <p className="eyebrow">{label}</p>
        <h1 className="pause-line">Open {label}</h1>
        <p className="pause-plan-label" id="pause-how-long">How long?</p>
        <div className="pause-picks pause-chips" role="group" aria-labelledby="pause-how-long">{GRACE_CHOICES.map(minutes => <button type="button" key={minutes} className="secondary" aria-pressed={stage.minutes === minutes} onClick={() => setStage({ ...stage, minutes })}>{minutes}&nbsp;min</button>)}</div>
        <p className="pause-plan-label" id="pause-why">Why? <span className="small">Only you see this. You can skip it.</span></p>
        <div className="pause-picks pause-chips" role="group" aria-labelledby="pause-why">{PAUSE_REASONS.map(reason => <button type="button" key={reason.id} className="secondary" aria-pressed={stage.why === reason.id} onClick={() => setStage({ ...stage, why: stage.why === reason.id ? null : reason.id })}>{reason.label}</button>)}</div>
        <button type="button" className="pause-do" onClick={() => void openFor(stage.minutes, stage.why)}>Open for {stage.minutes}&nbsp;min</button>
        <button type="button" className="ink-link pause-link" onClick={() => setStage({ kind: 'card' })}>Back</button>
      </>}
      {stage.kind === 'done' && <>
        {/* What was done, in the person's words; the XP on its own line. No claim of time given back. */}
        <h1 className="pause-line">{stage.act ? `Done: ${stage.act[0]!.toUpperCase() + stage.act.slice(1)}.` : 'Done.'}</h1>
        {stage.paid && <p className="pause-earned">+{RULES.pause.actXp}&nbsp;XP</p>}
        <button type="button" className="pause-do" onClick={backToNandi}>Back to NANDI</button>
        <button type="button" className="ink-link pause-link" onClick={() => { if (demo) close(); else void openPausedApp(packageName, card.grace * 60_000).then(close, close); }}>Open {label} now</button>
      </>}
      {demo && <p className="small pause-demo">This is how it looks. Nothing is saved.</p>}
      {message && <p role="status">{message}</p>}
    </section>
  </div>;
}
