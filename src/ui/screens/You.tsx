import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { buildRecap } from '../../core/recap';
import { nightsBackOnPlan } from '../../core/nightPlan';
import { go } from '../shell/router';

export function You() {
  const sources = useLiveQuery(async () => {
    const [tasks, focus, sessions, quests, concepts, logs] = await Promise.all([
      db.tasks.toArray(), db.focus.toArray(), db.sessions.toArray(), db.quests.toArray(), db.learnConcepts.toArray(), db.dailyLog.toArray(),
    ]);
    return { tasks, focus, sessions, quests, concepts, logs };
  }, []);
  const recap = sources ? buildRecap(Date.now() + 7 * 86_400_000, sources) : null; // eslint-disable-line react-hooks/purity
  const recapLines = recap ? [
    [recap.tasks, `${recap.tasks} tasks finished`], [recap.focusHours, `${recap.focusHours} focus hours`],
    [recap.workouts, `${recap.workouts} workouts`], [recap.sideQuests, `${recap.sideQuests} side quests completed`],
    [recap.concepts, `${recap.concepts} concepts learned`], [recap.nights, `${recap.nights} nights back on plan`],
  ].filter(([count]) => Number(count) > 0) : [];
  const nights = sources ? nightsBackOnPlan(sources.logs) : 0;
  return <section className="screen you-screen"><p className="eyebrow">Your space</p><h1>You</h1>
    <section className="card you-week" aria-label="What your time became this week"><span className="pill">This week</span><h2>What your time became</h2>{recapLines.length ? <ul>{recapLines.map(([, line]) => <li key={line}>{line}</li>)}</ul> : <p>Your week is just beginning. One small step counts.</p>}</section>
    <div className="you-links"><button type="button" className="card you-link" onClick={() => go('you/train')}><span className="pill">Strength</span><strong>Train</strong><span>Program, session, history and metrics</span></button>
      <button type="button" className="card you-link" onClick={() => go('you/mind')}><span className="pill">Practice</span><strong>Mind & learning</strong><span>Boards, cases, reviews and tracks</span></button></div>
    {sources && sources.logs.some(row => !row.deleted && row.lightsOutAt) && <section className="card"><h2>Nights back on plan</h2><strong className="night-count">{nights}</strong><p>One night at a time. Back tonight.</p></section>}
    <section className="card mastery-slot"><span className="pill">Coming into focus</span><h2>Mastery map</h2><p>Your teaching journey will live here.</p></section>
    <button type="button" className="card you-link settings-link" onClick={() => go('you/settings')}><span className="pill">Preferences</span><strong>Settings</strong><span>Night plan, reminders, appearance and backup</span></button>
  </section>;
}
