import { useEffect, useState } from 'react';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time/dayKey';
import { logHasActivity } from '../../core/guard';
import { firstAction, GOALS, toggleGoal, WELCOME_BEDTIME, type Goal } from '../../core/welcome';
import { isAfterBedtime } from '../../core/time/nightTimeline';
import { Cast } from '../cast/Cast';
import { recordError } from '../errorRing';
import { go } from '../shell/router';
import './welcome.css';

const DONE_KEY = 'welcome.done';
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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bedtime, setBedtime] = useState(WELCOME_BEDTIME);
  const [saving, setSaving] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const action = firstAction(goals, isAfterBedtime(openedAt, bedtime));
  const finish = async () => {
    setSaving(true);
    try {
      await markDone([{ key: 'profile.goals', value: goals }, { key: 'planner.bedtime', value: bedtime }]);
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
        <p>Swap a little scrolling for things you'll be glad you did: sleep, learning, training, puzzles and your own plans.</p>
        <p className="small">Everything stays on this phone. No account, no ads.</p>
        <button type="button" onClick={() => setStep(1)}>Let's start</button>
        <button type="button" className="text-button" onClick={() => void restore()}>I have a backup to restore</button>
      </>}
      {step === 1 && <>
        <h1>What do you want more of?</h1>
        <p>Pick two. You can do everything later; this is just where we start.</p>
        <div className="welcome-goals">{GOALS.map(goal => <button type="button" key={goal.id} className={`welcome-goal${goals.includes(goal.id) ? ' picked' : ''}`} aria-pressed={goals.includes(goal.id)} onClick={() => setGoals(toggleGoal(goals, goal.id))}>{goal.label}</button>)}</div>
        <button type="button" disabled={!goals.length} onClick={() => setStep(2)}>Next</button>
      </>}
      {step === 2 && <>
        <Cast name="Kachhua" pose="rest" size={96} title="Kachhua resting" />
        <h1>When do you want to be asleep?</h1>
        <p>As this time gets close, NANDI turns calm: no new lessons, just a gentle wind-down.</p>
        <label className="welcome-time">Bedtime<input type="time" required value={bedtime} onChange={event => setBedtime(event.target.value || WELCOME_BEDTIME)} /></label>
        <p className="small">You can change it any time in Settings.</p>
        <button type="button" disabled={saving} onClick={() => void finish()}>{action.label}</button>
      </>}
    </div>
  </div>;
}
