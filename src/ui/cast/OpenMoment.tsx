import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { db } from '../../data/db';
import { dayKey } from '../../core/time';
import { OPEN_GAP_MS } from '../../core/owner/metrics';
import { openerDue, openerStage } from '../../core/calm/squareBreath';
import { loadBreathSettings, markBreathShown, saveHolds } from '../../data/repos/notebookBreath';
import { linkedEntry, startNewEntry } from '../shell/entry';
import { useModalFocus } from '../shell/useModalFocus';
import { WELCOME_DONE_KEY } from '../welcome/Welcome';
import { SquareBreath } from '../yatra/SquareBreath';
import { recordError } from '../errorRing';

/** A notification tap reaches the app a moment after it opens; the breath waits that long before it decides. */
const NATIVE_GRACE_MS = 500;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';
const focusScreen = () => {
  const heading = document.querySelector<HTMLElement>('#main h1');
  if (!heading) return;
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
};

/**
 * Spec 45a: "Before the first page". On the first ordinary open of the planning day (or every open, or never, as chosen
 * in Settings), a notebook page asks for two rounds of the square breath, offers one more for three seconds, then fades
 * to where NANDI was opening anyway. A link, a notification, the widget, a pending Pause card, the first run or the night
 * route skip it without using up the day. It writes no ledger row and pays nothing.
 * `pauseCheckedAt`: when the shell last finished asking the phone for a pending Pause card (the breath waits for that).
 */
export function OpenMoment({ night, pause, pauseCheckedAt, widgetChecked }: { night: boolean; pause: boolean; pauseCheckedAt: number; widgetChecked: boolean }) {
  const [openedAt, setOpenedAt] = useState(() => Date.now());
  const [shown, setShown] = useState<{ startedAt: number; holds: boolean; extraFrom: number | null } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [note, setNote] = useState('');
  const decided = useRef(0);
  const latest = useRef({ night, pause });
  useEffect(() => { latest.current = { night, pause }; });

  // A return after a minute or more away is a new open; a breath the phone hid is put away rather than shown again.
  useEffect(() => {
    let hiddenAt = 0;
    const visibility = () => {
      if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); setShown(null); setLeaving(false); return; }
      if (hiddenAt && Date.now() - hiddenAt >= OPEN_GAP_MS) { startNewEntry(); setOpenedAt(Date.now()); }
      hiddenAt = 0;
    };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);

  // Decide once an open is known: the widget answered, the phone said whether a Pause card is waiting, a notification had its moment.
  useEffect(() => {
    if (decided.current === openedAt || !widgetChecked || pauseCheckedAt < openedAt) return;
    decided.current = openedAt;
    delete document.documentElement.dataset.openingBreath;
    let live = true;
    const timer = window.setTimeout(() => void (async () => {
      const [settings, welcome] = await Promise.all([loadBreathSettings(db), db.settings.get(WELCOME_DONE_KEY)]);
      const at = Date.now(), today = dayKey(at);
      const ordinary = live && !linkedEntry() && !latest.current.pause && !latest.current.night && !!welcome && !welcome.deleted && document.visibilityState === 'visible';
      const due = openerDue({ mode: settings.opening, today, lastShownDay: settings.lastShownDay, ordinary });
      // What this open decided, for tests and the owner's checks: 'shown' or 'skipped'.
      document.documentElement.dataset.openingBreath = due ? 'shown' : 'skipped';
      if (!due) return;
      setNote(''); setLeaving(false); setNow(at);
      setShown({ startedAt: at, holds: settings.holds, extraFrom: null });
      await markBreathShown(db, today, at).catch(() => setNote('Could not save that the breath was shown today. It may come back once more.'));
    })().catch(error => recordError('promise', error)), Capacitor.isNativePlatform() ? NATIVE_GRACE_MS : 0);
    return () => { live = false; window.clearTimeout(timer); };
  }, [openedAt, widgetChecked, pauseCheckedAt]);

  // A Pause card, the night route or a route change (a late notification) always wins: the breath goes at once.
  useEffect(() => { if (shown && (pause || night)) queueMicrotask(() => setShown(null)); }, [shown, pause, night]);
  useEffect(() => {
    if (!shown) return;
    const away = () => setShown(null);
    window.addEventListener('popstate', away);
    window.addEventListener('hashchange', away);
    window.addEventListener('nandi:navigate', away);
    return () => { window.removeEventListener('popstate', away); window.removeEventListener('hashchange', away); window.removeEventListener('nandi:navigate', away); };
  }, [shown]);
  // The wall clock drives the words and the count; the dot moves on its own between ticks.
  useEffect(() => {
    if (!shown || leaving) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [shown, leaving]);
  const stage = shown ? openerStage(now - shown.startedAt, shown.holds, shown.extraFrom) : null;
  const leave = () => {
    if (!shown || leaving) return;
    if (reducedMotion()) { setShown(null); requestAnimationFrame(focusScreen); return; }
    setLeaving(true);
  };
  useEffect(() => { if (stage?.stage === 'done') queueMicrotask(leave); });
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => { setShown(null); setLeaving(false); requestAnimationFrame(focusScreen); }, 320);
    return () => window.clearTimeout(timer);
  }, [leaving]);
  const dialog = useModalFocus<HTMLDivElement>(leave);
  if (!shown || !stage) return null;
  const toggleHolds = () => {
    const holds = !shown.holds, at = Date.now();
    // The breath starts over on the new pattern.
    setShown({ startedAt: at, holds, extraFrom: null }); setNow(at);
    void saveHolds(db, holds, at).then(() => setNote(''), () => setNote('Could not save the hold setting. Try again.'));
  };
  const oneMore = () => { const at = Date.now(); setShown({ ...shown, extraFrom: at - shown.startedAt }); setNow(at); };
  // Focus starts on the page itself (its heading is read first), not on the holds switch.
  const holdFocus = (node: HTMLDivElement | null) => { if (node && !node.contains(document.activeElement)) node.focus({ preventScroll: true }); dialog(node); };
  return <div ref={holdFocus} tabIndex={-1} className={`breath-opener${leaving ? ' leaving' : ''}`} role="dialog" aria-modal="true" aria-labelledby="breath-opener-title">
    <div className="breath-opener-head">
      <p className="eyebrow">Before the first page</p>
      <h1 id="breath-opener-title">Breathe with the square.</h1>
      <p>Follow the dot. Skip anytime.</p>
    </div>
    <SquareBreath key={`${shown.startedAt}:${shown.extraFrom}`} elapsedMs={stage.stage === 'breath' ? stage.breathMs : 0} holds={shown.holds} onHolds={toggleHolds}
      cueRound={stage.stage === 'breath' ? stage.round : 2} rest={stage.stage === 'breath' ? undefined : 'That was two rounds.'} context="opener" />
    <div className="breath-opener-foot">
      {note && <p className="breath-opener-note" role="alert">{note}</p>}
      {stage.stage === 'again' && <button type="button" className="breath-again" onClick={oneMore}>One more round</button>}
      <button type="button" className="breath-skip" onClick={leave}>Skip →</button>
    </div>
  </div>;
}
