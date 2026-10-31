import { useEffect, useState } from 'react';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time/dayKey';
import { logHasActivity } from '../../core/guard';
import { firstAction, GOALS, STARTER_TOPIC, WELCOME_BEDTIME, type Goal } from '../../core/welcome';
import { isAfterBedtime } from '../../core/time/nightTimeline';
import { Cast } from '../cast/Cast';
import { recordError } from '../errorRing';
import { go } from '../shell/router';
import './welcome.css';
import { useModalFocus } from '../shell/useModalFocus';

export const WELCOME_DONE_KEY = 'welcome.done';
const DONE_KEY = WELCOME_DONE_KEY;
// Set when a friend's challenge link is the very first thing opened: the next visit still gets the first run.
const DEFERRED_KEY = 'welcome.deferred';
// The Playwright build skips the first run unless a test asks for it with ?welcome.
const allowed = () => import.meta.env.VITE_E2E !== '1' || new URLSearchParams(location.search).has('welcome');

/** Judged when the last button is tapped, not when the welcome opened. */
const actionAt = (goal: Goal | undefined, bedtime: string) => firstAction(goal, isAfterBedtime(Date.now(), bedtime));

async function putSetting(key: string, value: unknown): Promise<void> {
  const now = Date.now(), deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key, value, updatedAt: now, deleted: 0, deviceId }));
}

async function markDone(extra: { key: string; value: unknown }[] = []): Promise<void> {
  const now = Date.now(), deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.settings, async () => {
    for (const row of [{ key: DONE_KEY, value: dayKey(now) }, ...extra]) await db.settings.put({ ...row, updatedAt: now, deleted: 0, deviceId });
  }));
}

/** Anything already done on this phone means the person has used NANDI before. */
async function hasHistory(): Promise<boolean> {
  const counts = await Promise.all([db.ledger.count(), db.tasks.count(), db.sessions.count(), db.puzzleRuns.count(), db.learnDrops.count(), db.dailyLog.filter(logHasActivity).count(), db.reminders.count(), db.lessonProg.count()]);
  return counts.some(count => count > 0) || (await db.settings.get('planner.bedtime')) !== undefined;
}

export function useWelcomeNeeded(): [boolean, () => void] {
  const [needed, setNeeded] = useState(false);
  useEffect(() => {
    if (!allowed()) return;
    const challenge = /^#(?:mind|read\/games|yatra\/mind)\/challenge\//.test(location.hash);
    let live = true;
    void (async () => {
      const done = await db.settings.get(DONE_KEY);
      if (done && !done.deleted) return;
      const deferred = await db.settings.get(DEFERRED_KEY);
      // A friend's challenge link opens straight onto the board; the first run (and its 18+ tick) waits for the next visit.
      if (challenge) { if (!deferred && !(await hasHistory())) await putSetting(DEFERRED_KEY, true); return; }
      if (!(deferred && !deferred.deleted) && await hasHistory()) { await markDone(); return; }
      if (live) setNeeded(true);
    })().catch(error => recordError('promise', error));
    return () => { live = false; };
  }, []);
  return [needed, () => setNeeded(false)];
}

export function Welcome({ onDone }: { onDone: () => void }) {
  // No Escape: the first run has no close action.
  const dialog = useModalFocus<HTMLDivElement>();
  const [step, setStep] = useState(0);
  const [adult, setAdult] = useState(false);
  const [goal, setGoal] = useState<Goal>();
  const [bedtime, setBedtime] = useState(WELCOME_BEDTIME);
  const [saving, setSaving] = useState(false);
  const [openedAt] = useState(() => Date.now());
  // "After bedtime" follows the clock while the welcome sits open, so the last button never offers a lesson past bedtime.
  const [clock, setClock] = useState(openedAt);
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 30_000); return () => window.clearInterval(timer); }, []);
  const action = firstAction(goal, isAfterBedtime(clock, bedtime));
  const finish = async () => {
    setSaving(true);
    const next = actionAt(goal, bedtime);
    try {
      const extra: { key: string; value: unknown }[] = [{ key: 'profile.goals', value: goal ? [goal] : [] }, { key: 'profile.adultConfirmedAt', value: new Date(openedAt).toISOString() }, { key: 'planner.bedtime', value: bedtime }];
      // Learn opens straight on its first lesson; topics can be changed from Learn later.
      if (goal === 'learn') extra.push({ key: 'learn.selectedTopics', value: [STARTER_TOPIC] });
      await markDone(extra);
      onDone();
      go(next.route);
      if (next.route === 'plan') window.setTimeout(() => document.querySelector<HTMLInputElement>('.quick-add-field input')?.focus(), 300);
    } catch (error) { recordError('promise', error); setSaving(false); }
  };
  // Not marked done: a finished restore brings its own history, and a cancelled one shows the first run again next time.
  const restore = () => { onDone(); go('you/backup'); };
  return <div ref={dialog} tabIndex={-1} className="welcome" role="dialog" aria-modal="true" aria-label="Welcome to NANDI">
    <div className="welcome-inner">
      <p className="welcome-steps" role="img" aria-label={`Step ${step + 1} of 3`}>{[0, 1, 2].map(index => <span key={index} className={index <= step ? 'on' : ''} />)}</p>
      {step === 0 && <>
        <Cast name="Nandi" pose="cheer" size={120} title="Nandi saying hello" moment="wave" at={1} />
        <h1>Hi, I'm Nandi.</h1>
        <p>Swap a little scrolling for things you'll be glad you did.</p>
        <p className="small">Your activity is saved on this phone. It leaves only when you back it up or share it.</p>
        {/* A one-page placeholder notice; Jenil and a lawyer finalise it before 13 May 2027. */}
        <p className="small welcome-privacy"><a href="privacy.html">Privacy notice</a></p>
        <label className="welcome-adult"><input type="checkbox" checked={adult} onChange={event => setAdult(event.target.checked)} /> I'm 18 or older.</label>
        <button type="button" disabled={!adult} onClick={() => setStep(1)}>Let's start</button>
        <button type="button" className="text-button" onClick={restore}>I have a backup to restore</button>
      </>}
      {step === 1 && <>
        <h1>Pick one to try first</h1>
        <p>Pick one to start. Everything else is one tap away later.</p>
        <div className="welcome-goals">{GOALS.map(item => <button type="button" key={item.id} className="welcome-goal" onClick={() => { setGoal(item.id); setStep(2); }}>{item.label}</button>)}</div>
      </>}
      {step === 2 && <>
        <Cast name="Kachhua" pose="rest" size={96} title="Kachhua resting" moment="settle" at={1} breathe />
        <h1>When do you want to be asleep?</h1>
        <p>From this time, NANDI turns calm: no new lessons, just a gentle wind-down.</p>
        <label className="welcome-time">Bedtime<input type="time" required value={bedtime} onChange={event => setBedtime(event.target.value || WELCOME_BEDTIME)} /></label>
        <p className="small">You can change it any time in Settings.</p>
        <button type="button" disabled={saving} onClick={() => void finish()}>{action.label}</button>
      </>}
    </div>
  </div>;
}
