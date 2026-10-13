import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { meditationElapsedMs, parseMeditation } from '../../core/mind/meditation';
import { dayKey } from '../../core/time/dayKey';
import { db } from '../../data/db';
import { MEDITATION_HISTORY } from '../../data/repos/meditation';

export function Progress() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const today = dayKey(now);
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) ?? [];
  const workouts = useLiveQuery(() => db.sessions.where('dayKey').equals(today).toArray(), [today]) ?? [];
  const lessons = useLiveQuery(() => db.lessonProg.toArray(), []) ?? [];
  const puzzles = useLiveQuery(() => db.puzzleRuns.where('dayKey').equals(today).toArray(), [today]) ?? [];
  const history = useLiveQuery(() => db.settings.where('key').startsWith(MEDITATION_HISTORY).toArray(), []) ?? [];
  const parents = new Set(tasks.filter(row => !row.deleted && row.parentId).map(row => row.parentId));
  const tasksDone = tasks.filter(row => !row.deleted && !parents.has(row.id) && row.status === 'done' && row.doneAt !== undefined && dayKey(row.doneAt) === today).length;
  const seconds = Math.floor(history.filter(row => !row.deleted).reduce((sum, row) => {
    const session = parseMeditation(row.value);
    return sum + (session?.dayKey === today && session.endedAt !== undefined ? meditationElapsedMs(session, session.endedAt) : 0);
  }, 0) / 1000);
  return <section className="card progress-card" aria-label="Today's progress"><span className="pill">Small steps, recorded</span><h2>Today’s progress</h2>
    <dl className="progress-list">
      <div><dt>Plan</dt><dd>{tasksDone} tasks done</dd></div>
      <div><dt>Train</dt><dd>{workouts.filter(row => !row.deleted && ['completed', 'minimum', 'partial'].includes(row.status)).length} sessions logged</dd></div>
      <div><dt>Mind</dt><dd>{Math.floor(seconds / 60)}m {seconds % 60}s meditated · {puzzles.filter(row => !row.deleted && row.result === 'solved').length} puzzles solved</dd></div>
      <div><dt>Learn</dt><dd>{lessons.filter(row => !row.deleted && row.doneDayKey === today).length} lessons or units completed</dd></div>
    </dl><p className="small">A record of what you did. You set the pace.</p>
  </section>;
}
