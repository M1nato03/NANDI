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

const DONE_KEY = 'welcome.done';
// Placeholder until Jenil and a lawyer finalise the notice (before 13 May 2027).
const PRIVACY_NOTE = "NANDI keeps your tasks, workouts, answers and settings in this phone's storage. They are not sent to us. The app checks our server for updates, and that check carries none of your activity. A backup or a share leaves the phone only when you choose to make one. Removing the app or clearing its data erases it. This notice is a draft and will be finalised before launch.";
// The Playwright build skips the first run unless a test asks for it with ?welcome.
const allowed = () => import.meta.env.VITE_E2E !== '1' || new URLSearchParams(location.search).has('welcome');

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
    // A friend's challenge link opens straight onto the board; the first run waits for the next visit.
    if (!allowed() || location.hash.startsWith('#mind/challenge/')) return;
    let live = true;
    void (async () => {
      const done = await db.settings.get(DONE_KEY);
      if (done && !done.deleted) return;
      if (await hasHistory()) { await markDone(); return; }
      if (live) setNeeded(true);
    })().catch(error => recordError('promise', error));
    return () => { live = false; };
  }, []);
  return [needed, () => setNeeded(false)];
}

export function Welcome({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [adult, setAdult] = useState(false);
  const [goal, setGoal] = useState<Goal>();
  const [bedtime, setBedtime] = useState(WELCOME_BEDTIME);
  const [saving, setSaving] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const action = firstAction(goal, isAfterBedtime(openedAt, bedtime));
  const finish = async () => {
    setSaving(true);
    try {
      const extra: { key: string; value: unknown }[] = [{ key: 'profile.goals', value: goal ? [goal] : [] }, { key: 'profile.adultConfirmedAt', value: new Date(openedAt).toISOString() }, { key: 'planner.bedtime', value: bedtime }];
      // Learn opens straight on its first lesson; topics can be changed from Learn later.
      if (goal === 'learn') extra.push({ key: 'learn.selectedTopics', value: [STARTER_TOPIC] });
      await markDone(extra);
      onDone();
      go(action.route);
      if (action.route === 'plan') window.setTimeout(() => document.querySelector<HTMLInputElement>('.quick-add-field input')?.focus(), 300);
    } catch (error) { recordError('promise', error); setSaving(false); }
  };
  const restore = async () => { await markDone().catch(error => recordError('promise', error)); onDone(); go('you/backup'); };
  return <div className="welcome" role="dialog" aria-modal="true" aria-label="Welcome to NANDI">
    <div className="welcome-inner">
      <p className="welcome-steps" aria-label={`Step ${step + 1} of 3`}>{[0, 1, 2].map(index => <span key={index} className={index <= step ? 'on' : ''} />)}</p>
      {step === 0 && <>
        <Cast name="Nandi" pose="cheer" size={120} title="Nandi saying hello" />
        <h1>Hi, I'm Nandi.</h1>
        <p>Swap a little scrolling for things you'll be glad you did.</p>
        <p className="small">Your activity is saved on this phone. It leaves only when you back it up or share it.</p>
        <details className="welcome-privacy"><summary>Privacy</summary><p className="small">{PRIVACY_NOTE}</p></details>
        <label className="welcome-adult"><input type="checkbox" checked={adult} onChange={event => setAdult(event.target.checked)} /> I'm 18 or older.</label>
        <button type="button" disabled={!adult} onClick={() => setStep(1)}>Let's start</button>
        <button type="button" className="text-button" onClick={() => void restore()}>I have a backup to restore</button>
      </>}
      {step === 1 && <>
        <h1>Pick one to try first</h1>
        <p>Pick one to start. Everything else is one tap away later.</p>
        <div className="welcome-goals">{GOALS.map(item => <button type="button" key={item.id} className="welcome-goal" onClick={() => { setGoal(item.id); setStep(2); }}>{item.label}</button>)}</div>
      </>}
      {step === 2 && <>
        <Cast name="Kachhua" pose="rest" size={96} title="Kachhua resting" />
        <h1>When do you want to be asleep?</h1>
        <p>From this time, NANDI turns calm: no new lessons, just a gentle wind-down.</p>
        <label className="welcome-time">Bedtime<input type="time" required value={bedtime} onChange={event => setBedtime(event.target.value || WELCOME_BEDTIME)} /></label>
        <p className="small">You can change it any time in Settings.</p>
        <button type="button" disabled={saving} onClick={() => void finish()}>{action.label}</button>
      </>}
    </div>
  </div>;
}
