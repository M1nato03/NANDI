import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { TaskRow } from '../../data/types';
import { db } from '../../data/db';
import { RULES } from '../../core/rules.config';
import { dayKey } from '../../core/time/dayKey';
import { dayHorizon, effectiveShutdown, nightWindow } from '../../core/tasks/planner';
import { isFocusRunning } from '../../core/tasks/focus';
import { TaskQuickAdd } from '../tasks/TaskQuickAdd';
import { PostponeSheet } from '../tasks/PostponeSheet';
import { currentFocus, elapsed, minutes, todayTasks, visibleTasks } from '../tasks/model';
import { useTaskBoard } from '../tasks/useTaskBoard';
import { go } from '../shell/router';
import '../tasks/tasks.css';

export function Today() {
  const board = useTaskBoard();
  const settings = useLiveQuery(() => db.settings.toArray(), []) ?? [];
  const log = useLiveQuery(() => db.dailyLog.get(dayKey(board.now)), [dayKey(board.now)]);
  const savedTime = (key: string, fallback: string) => { const value = settings.find((row) => row.key === key && row.deleted === 0)?.value; return typeof value === 'string' ? value : fallback; };
  const shutdown = effectiveShutdown(savedTime('planner.shutdown', RULES.night.defaultShutdown), savedTime('planner.bedtime', RULES.night.defaultBedtime));
  const bedtime = savedTime('planner.bedtime', RULES.night.defaultBedtime);
  const night = nightWindow(board.now, shutdown, bedtime, log?.windDownAt);
  const [moving, setMoving] = useState<TaskRow | null>(null);
  const [justFinished, setJustFinished] = useState<{ planned: number; actual: number } | null>(null);
  const focus = currentFocus(board.focus);
  const scheduled = todayTasks(board.tasks, board.now);
  const plannedMinutes = scheduled.reduce((sum, task) => sum + (task.estimateMin ?? 0), 0);
  const nowTask = (focus && visibleTasks(board.tasks).find((task) => task.id === focus.taskId && task.status !== 'done')) ?? scheduled[0];
  const taskFocus = nowTask ? board.focus.filter((row) => row.taskId === nowTask.id && row.endedAt == null).sort((a, b) => b.startedAt - a.startedAt)[0] : undefined;
  const next = scheduled.filter((task) => task.id !== nowTask?.id).slice(0, 2);
  const plannedMs = (nowTask?.estimateMin ?? 25) * 60_000;
  const elapsedMs = taskFocus ? elapsed(taskFocus, board.now) : 0;
  const remaining = Math.max(0, plannedMs - elapsedMs);
  const percent = Math.max(0, Math.min(100, remaining / plannedMs * 100));
  async function finish() {
    if (!nowTask) return;
    const task = nowTask;
    const actual = board.focus.filter((row) => row.taskId === task.id).reduce((sum, row) => sum + elapsed(row, Date.now()), 0);
    const ok = await board.act(async (repos, now) => {
      for (const row of board.focus.filter((item) => item.taskId === task.id && item.endedAt == null)) await repos.finishFocus(row.id, now);
      await repos.completeTask(task.id, now);
    }, 'Task done.');
    if (ok) setJustFinished({ planned: task.estimateMin ?? 0, actual: Math.round(actual / 60_000) });
  }
  return <section className="screen"><p className="eyebrow">Your space</p><h1>Today</h1>
    <TaskQuickAdd run={board.act} />
    <p className="day-horizon">{dayHorizon(plannedMinutes, board.now, shutdown)}</p>
    {night === 'windDown' && <p role="status">Wind-down has started. Shutdown is here when you are ready.</p>}
    {night === 'lightsOut' && <p role="status">Lights-out time. A quiet check-in is here when you are ready.</p>}
    {night !== 'day' && !log?.lightsOutAt && <button type="button" className="secondary" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.recordLightsOut(now), 'Lights-out check-in saved.')}>Lights-out check-in</button>}
    <div className="planner-nav"><button type="button" className="secondary" onClick={() => go('tasks/plan')}>Morning plan</button><button type="button" className="secondary" onClick={() => go('tasks/shutdown')}>Shutdown</button><button type="button" className="secondary" onClick={() => go('tasks/review')}>Weekly review</button></div>
    {board.message && <p role="status">{board.message}</p>}
    {justFinished && <p className="task-result" role="status">Planned {justFinished.planned} min · Took {justFinished.actual} min</p>}
    <section className="card now-card" aria-label="Now"><p className="eyebrow">Now</p>
      {nowTask ? <><h2>{nowTask.title}</h2>{nowTask.firstStep && <p>First: {nowTask.firstStep}</p>}
        <div className={`timer-ring${taskFocus && elapsedMs > plannedMs ? ' overtime' : ''}`} style={{ '--progress': `${percent}%` } as React.CSSProperties} aria-label={taskFocus ? `Focus time ${minutes(elapsedMs)}` : `Planned ${nowTask.estimateMin} minutes`}><span>{taskFocus ? elapsedMs > plannedMs ? `+${minutes(elapsedMs - plannedMs)}` : minutes(remaining) : `${nowTask.estimateMin}m`}</span></div>
        {taskFocus && <p className="timer-caption">{elapsedMs > plannedMs ? `+${Math.floor((elapsedMs - plannedMs) / 60_000)} min over plan. Keep going or wrap up?` : isFocusRunning(taskFocus) ? `Elapsed ${minutes(elapsedMs)}` : `Paused · ${minutes(elapsedMs)} elapsed`}</p>}
        <div className="now-actions">{!taskFocus ? <button type="button" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.startFocus(nowTask.id, now))}>Start focus</button> : isFocusRunning(taskFocus) ? <button type="button" className="secondary" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.pauseFocus(taskFocus.id, now))}>Pause</button> : <button type="button" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.resumeFocus(taskFocus.id, now))}>Resume</button>}
          <button type="button" className="secondary" disabled={board.busy} onClick={() => void finish()}>Finish</button><button type="button" className="text-button" onClick={() => setMoving(nowTask)}>Postpone</button></div>
      </> : <p>Nothing planned yet. Add one task to begin.</p>}
    </section>
    <section className="next-strip" aria-label="Next"><h2>Next</h2>{next.length ? next.map((task) => <p key={task.id}><strong>{task.title}</strong><span>{task.scheduledStart ? new Date(task.scheduledStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''} · {task.estimateMin} min</span></p>) : <p>No more blocks planned.</p>}</section>
    {moving && <PostponeSheet key={moving.id} task={moving} run={board.act} close={() => setMoving(null)} />}
  </section>;
}
