import { useState } from 'react';
import { dayKey } from '../../core/time';
import { formatDayKey } from '../../core/time/formatDayKey';
import { EXERCISE_LIBRARY, LADDERS, PROGRAMS, calculatePlates, isRetestWeek, type Track } from '../../core/train';
import type { ProgramRow, SessionRow, SetRow, PrRow, ExStateRow, LedgerRow } from '../../data/types';
import type { createTrainRepos } from '../../data/repos/train';
import { Reassessment } from './Reassessment';
import { EmptyState } from '../EmptyState';

type Page = 'today' | 'history' | 'settings' | 'finish' | 'retest';
type Repos = ReturnType<typeof createTrainRepos>;
type Data = { program: ProgramRow; sessions: SessionRow[]; sets: SetRow[]; prs: PrRow[]; state: ExStateRow[]; ledger: LedgerRow[] };
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const mondayOf = (at: number) => { const date = new Date(at); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return dayKey(date.getTime()); };
const sessionWords: Record<string, string> = { completed: 'Finished', minimum: 'Short session', partial: 'Partly finished', safety: 'Stopped for comfort' };
const patternWords: Record<string, string> = { squat: 'Squat', hinge: 'Hinge', 'push-up': 'Push', row: 'Pull', 'core-anti-ext': 'Core hold', 'core-anti-rot': 'Side core', 'core-ext': 'Back strength' };
const bestWords: Record<string, string> = { load: 'load', repsAtLoad: 'reps', e1rm: 'estimated strength', ladderStep: 'step', hold: 'hold' };

export function Dashboard({ data, page, setPage, startWorkout, busy, message, act }: { data: Data; page: Page; setPage: (page: Page) => void; startWorkout?: () => void; busy: boolean; message: string; act: (action: (repos: Repos, now: number) => Promise<unknown>, success: string) => Promise<boolean> }) {
  const { program, sessions, sets, prs, state, ledger } = data;
  const [slept, setSlept] = useState<boolean | null>(null);
  const [sore, setSore] = useState<boolean | null>(null);
  const [confirmVolume, setConfirmVolume] = useState(false);
  const [plateLoad, setPlateLoad] = useState(40);
  const [plateInventory, setPlateInventory] = useState('20, 10, 5, 2.5');
  const [draftDays, setDraftDays] = useState(() => program.days ?? [1, 3, 5]);
  const [now] = useState(() => Date.now());
  const completed = sessions.filter(row => row.status !== 'active' && row.status !== 'skipped').sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0));
  const thisWeek = completed.filter(row => row.startedAt != null && mondayOf(row.startedAt) === mondayOf(now));
  const target = program.weeklyTarget ?? 3;
  const last28 = Array.from({ length: 28 }, (_, i) => { const date = new Date(now); date.setDate(date.getDate() - 27 + i); return dayKey(date.getTime()); });
  let consecutiveWeeks = 0;
  for (let i = 0; i < 52; i++) { const date = new Date(now); date.setDate(date.getDate() - 7 * i); if (completed.filter(row => row.startedAt != null && mondayOf(row.startedAt) === mondayOf(date.getTime())).length < 2) break; consecutiveWeeks++; }
  const plan = program.track === 'gym' ? PROGRAMS[(program.sessionsStarted ?? 0) % 2 ? 'gym-foundations-b' : 'gym-foundations-a']! : PROGRAMS['hostel-bodyweight']!;
  const hardSets: Record<string, number> = {};
  for (const set of sets.filter(row => row.type === 'working' && thisWeek.some(session => session.id === row.sessionId))) { const muscle = EXERCISE_LIBRARY[set.exerciseId]?.muscle ?? 'other'; hardSets[muscle] = (hardSets[muscle] ?? 0) + 1; }
  const graph = [...prs].filter(pr => pr.kind === 'load' || pr.kind === 'hold' || pr.kind === 'repsAtLoad').sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
  const best = graph.filter(pr => pr.exerciseId === graph[0]?.exerciseId).slice(0, 8).reverse();
  const max = Math.max(1, ...best.map(pr => pr.value ?? 0));
  const retestWeek = Math.floor((now - (program.startedAt ?? now)) / (7 * 86_400_000));
  const retestDue = isRetestWeek(program.startedAt ?? now, now) && program.lastRetestWeek !== retestWeek;
  if (page === 'finish') return null;
  if (page === 'retest') return <Reassessment busy={busy} save={placement => { void act((repos, at) => repos.recordRetest(placement, at), 'Steps updated.').then(ok => { if (ok) setPage('today'); }); }} />;
  if (page === 'history') return <div className="card"><h2>History</h2>{completed.length === 0 ? <EmptyState area="move">Your sessions will appear here.</EmptyState> : <ol className="train-history">{completed.map(row => <li key={row.id}><strong>{formatDayKey(row.dayKey)}</strong><span>{PROGRAMS[row.templateKey ?? '']?.name ?? 'Workout'} · {sessionWords[row.status] ?? 'Finished'}</span></li>)}</ol>}</div>;
  if (page === 'settings') return <div className="card"><h2>Training settings</h2><p>General fitness information, not medical advice.</p>
    <label>Track <select aria-label="Training track" value={program.track} onChange={event => { void act((repos, now) => repos.updateProgram({ track: event.target.value as Track }, now), 'Track saved.'); }}><option value="bodyweight">Hostel Bodyweight</option><option value="gym">Gym Foundations</option></select></label>
    <label>Weekly target <select value={target} onChange={event => { const next = Number(event.target.value) as 2 | 3; void act((repos, now) => repos.updateProgram({ weeklyTarget: next, days: next === 2 ? [1, 4] : [1, 3, 5] }, now), 'Training days saved.'); }}><option value="3">3 days</option><option value="2">2 days</option></select></label>
    <label>Rest day <select value={program.restDay ?? 0} onChange={event => { void act((repos, now) => repos.updateProgram({ restDay: Number(event.target.value) }, now), 'Rest day saved.'); }}>{days.map((name, i) => <option key={name} value={i}>{name}</option>)}</select></label>
    <div className="train-days" aria-label="Training days">{days.map((name, i) => <button type="button" key={name} className={draftDays.includes(i) ? '' : 'secondary'} aria-pressed={draftDays.includes(i)} onClick={() => setDraftDays(old => old.includes(i) ? old.filter(day => day !== i) : old.length < target ? [...old, i].sort() : old)}>{name}</button>)}</div><button type="button" className="secondary" disabled={draftDays.length !== target} onClick={() => { void act((repos, now) => repos.updateProgram({ days: draftDays }, now), 'Training days saved.'); }}>Save days</button>
    <label><input type="checkbox" checked={!!program.heatModeEnabled} onChange={event => { void act((repos, now) => repos.updateProgram({ heatModeEnabled: event.target.checked }, now), 'Hot-day mode saved.'); }} /> Hot-day mode</label>
    <label><input type="checkbox" checked={!!program.equipment?.dumbbells} onChange={event => { void act((repos, now) => repos.updateProgram({ equipment: { ...program.equipment!, dumbbells: event.target.checked } }, now), 'Equipment saved.'); }} /> Dumbbells</label>
    <label><input type="checkbox" checked={!!program.equipment?.resistanceBand} onChange={event => { void act((repos, now) => repos.updateProgram({ equipment: { ...program.equipment!, resistanceBand: event.target.checked } }, now), 'Equipment saved.'); }} /> Resistance band</label>
    <label><input type="checkbox" checked={!!program.equipment?.sturdyAnchor} onChange={event => { void act((repos, now) => repos.updateProgram({ equipment: { ...program.equipment!, sturdyAnchor: event.target.checked } }, now), 'Equipment saved.'); }} /> Sturdy row anchor</label>
    <label>Barbell <select value={program.equipment?.barbell ?? ''} onChange={event => { void act((repos, now) => repos.updateProgram({ equipment: { ...program.equipment!, barbell: event.target.value ? Number(event.target.value) as 15 | 20 : null } }, now), 'Equipment saved.'); }}><option value="">None</option><option value="15">15 kg</option><option value="20">20 kg</option></select></label>
    {program.equipment?.barbell && <><label>Smallest plate, kg <input type="number" min="0.5" step="0.5" value={program.equipment.smallestPlate ?? 2.5} onChange={event => { void act((repos, now) => repos.updateProgram({ equipment: { ...program.equipment!, smallestPlate: Number(event.target.value) } }, now), 'Equipment saved.'); }} /></label><h3>Plate calculator</h3><label>Target kg <input type="number" min={program.equipment.barbell} step="0.5" value={plateLoad} onChange={event => setPlateLoad(Number(event.target.value))} /></label><label>Plates per side <input type="text" value={plateInventory} onChange={event => setPlateInventory(event.target.value)} /></label><p>{(() => { const plates = calculatePlates(plateLoad, program.equipment!.barbell!, plateInventory.split(',').map(Number)); return plates ? `Each side: ${plates.length ? plates.join(' + ') : 'bar only'}` : 'This load is not possible with those plates.'; })()}</p></>}
    </div>;
  return <>
    <div className="card train-hero"><p className="eyebrow">Today's session</p><h2>{plan.name}</h2><p>{target} days a week · {program.days?.map(day => days[day]).join(' / ')}</p><p>{plan.exercises.length} movements. Start with one set of each if today is tight.</p>
      {program.track === 'bodyweight' && !program.equipment?.sturdyAnchor && <p>Rows use a backpack or band today. Limited pulling until you have a sturdy anchor.</p>}
      <div className="train-readiness"><p>Quick readiness check (optional)</p><button type="button" className={slept === true ? '' : 'secondary'} aria-pressed={slept === true} onClick={() => setSlept(true)}>Slept OK</button><button type="button" className={slept === false ? '' : 'secondary'} aria-pressed={slept === false} onClick={() => setSlept(false)}>Not much sleep</button><button type="button" className={sore === true ? '' : 'secondary'} aria-pressed={sore === true} onClick={() => setSore(true)}>Very sore</button><button type="button" className={sore === false ? '' : 'secondary'} aria-pressed={sore === false} onClick={() => setSore(false)}>Soreness OK</button></div>
      {(slept === false || sore === true) && <p>Try the minimum session: one set of each movement.</p>}
      {program.heatModeEnabled && <p>Hot-day mode: fewer sets at first. Choose indoors or late evening.</p>}
      {isRetestWeek(program.startedAt ?? now, now) && <p>Re-test week: today's volume is lighter.</p>}
      {retestDue && program.track === 'bodyweight' && <button type="button" className="secondary" onClick={() => setPage('retest')}>Re-test ladder steps</button>}
      {retestDue && program.track === 'gym' && <p>Use a light session to check your working loads.</p>}
      <button type="button" disabled={busy || sessions.some(row => row.status === 'active')} onClick={() => { void act((repos, now) => repos.startSession(now, { confirmVolume, readiness: `${slept ?? 'unanswered'}:${sore ?? 'unanswered'}` }), 'Session started.').then(ok => { if (ok) startWorkout?.(); }); }}>Start session</button>
      {message.includes('20%') && <label><input type="checkbox" checked={confirmVolume} onChange={event => setConfirmVolume(event.target.checked)} /> Confirm the weekly hard-set increase</label>}
    </div>
    <div className="actions"><button type="button" className="secondary" onClick={() => setPage('history')}>History</button><button type="button" className="secondary" onClick={() => setPage('settings')}>Settings</button></div>
    <div className="card"><h2>Consistency</h2><p>{thisWeek.length ? `${thisWeek.length} of ${target} sessions this week` : 'A fresh week. Start with one session.'}{consecutiveWeeks ? ` · ${consecutiveWeeks} steady ${consecutiveWeeks === 1 ? 'week' : 'weeks'}` : ''}</p><div className="train-heatmap" aria-label="Last 28 days of training">{last28.map(key => {
      const isTrained = completed.some(row => row.dayKey === key);
      const isRest = ledger.some(row => row.id === `train-rest:${key}`);
      const statusText = isTrained ? 'trained' : isRest ? 'rest' : 'no data';
      return <span key={key} className={isTrained ? 'trained' : ''} title={key} aria-label={`${key}: ${statusText}`}>{isTrained ? '·' : ''}</span>;
    })}</div></div>
    <div className="card"><h2>Progression</h2>{program.track === 'bodyweight' && <ul className="train-metrics">{Object.entries(program.placement ?? {}).map(([pattern, rank]) => { const ladder = LADDERS[pattern]; const actual = state.find(row => row.id === ladder?.[rank - 1]?.exerciseId)?.ladderStep ?? rank; return <li key={pattern}><strong>{patternWords[pattern] ?? pattern.replaceAll('-', ' ')}</strong><span>Step {actual} of {ladder?.length ?? actual} · {EXERCISE_LIBRARY[ladder?.[actual - 1]?.exerciseId ?? '']?.name ?? 'Your current step'}</span></li>; })}</ul>}
      <h3>Recent bests</h3>{graph.length ? <ul className="train-metrics">{graph.slice(0, 5).map(pr => <li key={pr.id}>{EXERCISE_LIBRARY[pr.exerciseId]?.name ?? pr.exerciseId} · {bestWords[pr.kind] ?? 'best'} {pr.value}</li>)}</ul> : <p>Your best sets will appear as you train.</p>}
      {best.length > 1 && <div className="train-chart" role="img" aria-label={`Best-set trend for ${EXERCISE_LIBRARY[best[0]!.exerciseId]?.name ?? best[0]!.exerciseId}`}><svg viewBox="0 0 240 80" preserveAspectRatio="none"><polyline points={best.map((pr, i) => `${i * 240 / (best.length - 1)},${78 - (pr.value ?? 0) / max * 70}`).join(' ')} /></svg></div>}
    </div>
    <div className="card"><h2>Weekly hard sets</h2>{Object.entries(hardSets).length ? <ul className="train-metrics">{Object.entries(hardSets).map(([muscle, count]) => <li key={muscle}>{muscle} · {count}</li>)}</ul> : <p>Log a set to see this week's volume.</p>}</div>
    {completed[0] && <p className="small">Last session: {formatDayKey(completed[0].dayKey)} · {sessionWords[completed[0].status] ?? 'Finished'}</p>}
    <div className="card"><h2>Rest-day check</h2><p>On a non-session day, take a 10-minute walk or mobility break, then check in.</p><button type="button" className="secondary" disabled={busy || ledger.some(row => row.id === `train-rest:${dayKey(now)}`)} onClick={() => { void act((repos, at) => repos.restDayCheck(at, 10), 'Rest-day check saved.'); }}>I moved for 10 minutes</button></div>
  </>;
}
