import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { createTrainRepos, type Onboarding as OnboardingResult } from '../../data/repos/train';
import { Onboarding } from '../train/Onboarding';
import { Workout } from '../train/Workout';
import { Dashboard } from '../train/Dashboard';
import { errorMessage } from '../shell/errorMessage';
import { formatDayKey } from '../../core/time/formatDayKey';
import { dayKey } from '../../core/time';
import { go } from '../shell/router';
import '../train/train.css';
import { FriendStage } from '../cast/FriendStage';
import { trainLine } from '../economy/effortLines';

const reposPromise = getOrCreateDeviceId(db, Date.now()).then(id => createTrainRepos(db, id));

export function Train({ entry }: { entry?: string }) {
  const data = useLiveQuery(async () => ({ program: await db.programs.get('train-program'), sessions: await db.sessions.filter(row => row.deleted === 0).toArray(), sets: await db.sets.filter(row => row.deleted === 0).toArray(), prs: await db.prs.filter(row => row.deleted === 0).toArray(), state: await db.exState.filter(row => row.deleted === 0).toArray(), ledger: await db.ledger.filter(row => row.deleted === 0 && row.mode === 'train').toArray(), softFacts: await db.ledger.where('dayKey').equals(dayKey(Date.now())).filter(row => row.deleted === 0 && row.mode === 'soft').toArray(), bedtime: await db.settings.get('planner.bedtime'), beats: await db.settings.where('key').startsWith('train.beats:').toArray() }), []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const page = entry === 'history' || entry === 'settings' || entry === 'finish' || entry === 'retest' ? entry : 'today';
  const setPage = (next: typeof page) => go(next === 'today' ? 'train' : `train/${next}`);
  async function act(action: (repos: Awaited<typeof reposPromise>, now: number) => Promise<unknown>, success: string): Promise<boolean> {
    setBusy(true); setMessage('');
    try { await action(await reposPromise, Date.now()); setMessage(success); return true; }
    catch (error) { setMessage(errorMessage(error)); return false; }
    finally { setBusy(false); }
  }
  async function logSet(sessionId: string, exerciseId: string, slot: number, reps: number, loadKg: number, type?: 'warmup' | 'working', confirmedJump?: boolean): Promise<boolean> {
    setBusy(true); setMessage('');
    try {
      const result = await (await reposPromise).logSet(sessionId, exerciseId, slot, { reps, loadKg, type, confirmedJump }, Date.now());
      setMessage(result.prs.length ? 'Set saved. New best, checked at finish.' : 'Set saved.');
      return true;
    } catch (error) { setMessage(errorMessage(error)); return false; }
    finally { setBusy(false); }
  }
  if (!data) return <section className="screen"><p className="eyebrow">Train</p><h1>Loading</h1></section>;
  const { program, sessions, sets, prs, state, ledger, softFacts, beats } = data;
  const bedtime = data.bedtime && !data.bedtime.deleted && typeof data.bedtime.value === 'string' ? data.bedtime.value : undefined;
  // Spec 18: "Start easy" goes straight into the first workout on the easiest step of every move.
  const startEasy = (result: OnboardingResult) => { void act(async (repos, now) => { await repos.completeOnboarding(result, now); await repos.startSession(now, { readiness: 'unanswered:unanswered' }); }, 'Your first easy workout is ready.').then(ok => { if (ok) go('train/workout'); }); };
  if (!program) return <section className="screen"><Onboarding busy={busy} startEasy={startEasy} save={(result: OnboardingResult) => { void act((repos, now) => repos.completeOnboarding(result, now), 'Assessment saved. Your first session is ready.'); }} />{message && <p role="status">{message}</p>}</section>;
  const active = sessions.find(row => row.status === 'active');
  if (active && entry === 'workout') return <section className="screen"><Workout session={active} sets={sets.filter(set => set.sessionId === active.id)} state={state} equipment={program.equipment!} busy={busy} message={message}
    log={(exerciseId, slot, reps, loadKg, type, confirmedJump) => logSet(active.id, exerciseId, slot, reps, loadKg, type, confirmedJump)}
    pain={exerciseId => { void act((repos, now) => repos.flagPain(active.id, exerciseId, now), 'Exercise stopped. Choose an easier step or rest.'); }}
    effort={(exerciseId, value) => { void act((repos, now) => repos.setEffort(active.id, exerciseId, value, now), 'Effort saved.'); }}
    adjustRest={endAt => { void act((repos, now) => repos.setRestEnd(active.id, endAt, now), 'Rest updated.'); }}
    finish={() => { void act((repos, now) => repos.finishSession(active.id, now), 'Session saved.').then(ok => { if (ok) go('train/finish'); }); }} /></section>;
  const finished = sessions.filter(row => row.status !== 'active').sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))[0];
  return <section className="screen train-screen"><FriendStage area="train"><p className="eyebrow">The Proving Ground</p><h1>Train</h1></FriendStage>
    {message && <p role="status">{message}</p>}
    {page === 'finish' && finished && <div className="card train-finish"><p className="eyebrow">Your session</p><h2>Session finished</h2>{(() => { const earned = trainLine(data.ledger.find(row => row.id === `train-session:${finished.id}`)); return <>{earned && <p className="train-earned">{earned.line}</p>}{earned?.next && <p className="train-next small">{earned.next}</p>}<p>{finished.status === 'safety' ? 'Good call stopping. Rest or take an easier step next time.' : earned?.next ? 'Come back for the next session.' : 'Plan logged. Come back for the next session.'}</p></>; })()}<p>{formatDayKey(finished.dayKey)} · {finished.status === 'safety' ? 'Stopped for comfort' : 'Finished'}</p><button type="button" className="secondary" onClick={() => setPage('history')}>View history</button></div>}
    {active && page === 'today' && <div className="card"><h2>Session in progress</h2><button type="button" onClick={() => go('train/workout')}>Continue session</button></div>}
    <Dashboard data={{ program, sessions, sets, prs, state, ledger, softFacts, bedtime, beats }} page={page} setPage={setPage} startWorkout={() => go('train/workout')} busy={busy} message={message} act={act} />
  </section>;
}
