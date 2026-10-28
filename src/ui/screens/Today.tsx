import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import type { TaskRow } from '../../data/types';
import { focusPhase, isFocusRunning, taskFocusMs } from '../../core/tasks/focus';
import { PostponeSheet } from '../tasks/PostponeSheet';
import { currentFocus, minutes, taskGroups, todayTasks, visibleTasks } from '../tasks/model';
import { useTaskBoard } from '../tasks/useTaskBoard';
import { go } from '../shell/router';
import { isAway } from '../../core/economy/away';
import { dayKey } from '../../core/time';
import '../tasks/tasks.css';

export function Today() {
  const board = useTaskBoard();
  const rewardSettings = useLiveQuery(() => db.settings.where('key').anyOf(['planner.reward', 'planner.rewardEnabled']).toArray(), []) ?? [];
  const awaySettings = useLiveQuery(() => db.settings.where('key').equals('economy.away').toArray(), []) ?? [];
  const awayToday = isAway(awaySettings, dayKey(board.now));
  const rewardOn = rewardSettings.find(row => row.key === 'planner.rewardEnabled')?.value === true;
  const reward = rewardSettings.find(row => row.key === 'planner.reward')?.value;
  const [moving, setMoving] = useState<TaskRow | null>(null);
  const [justFinished, setJustFinished] = useState<{ planned: number; actual: number } | null>(null);
  const [cyclePreset, setCyclePreset] = useState<'25/5' | '50/10'>('25/5');
  const focus = currentFocus(board.focus);
  const scheduled = todayTasks(board.tasks, board.now);
  // A focus on a task moved off today no longer holds the timer screen (item 83).
  const task = (focus && visibleTasks(board.tasks).find(row => row.id === focus.taskId && row.status !== 'done' && row.status !== 'someday' && row.dayKey === dayKey(board.now))) ?? scheduled[0];
  const group = task?.parentId ? taskGroups(board.tasks).find(row => row.parent.id === task.parentId) : undefined;
  const step = group && task ? group.steps.findIndex(row => row.id === task.id) + 1 : 0;
  const taskFocus = task ? board.focus.filter(row => row.taskId === task.id && row.endedAt == null).sort((a, b) => b.startedAt - a.startedAt)[0] : undefined;
  const plannedMs = (task?.estimateMin ?? 25) * 60_000;
  // The task's whole time, across every focus it has had, so Start after Stop for now carries on (item 214).
  const elapsedMs = taskFocus && task ? taskFocusMs(board.focus, task.id, board.now) : 0;
  const phase = taskFocus ? focusPhase(taskFocus, board.now) : null;
  const remaining = Math.max(0, plannedMs - elapsedMs);
  const percent = Math.max(0, Math.min(100, remaining / plannedMs * 100));
  async function finish() {
    if (!task) return;
    const current = task;
    const actual = taskFocusMs(board.focus, current.id, board.now);
    const ok = await board.act(async (repos, now) => {
      for (const row of board.focus.filter(item => item.taskId === current.id && item.endedAt == null)) await repos.finishFocus(row.id, now);
      await repos.completeTask(current.id, now);
    }, 'Task done.');
    if (ok) setJustFinished({ planned: current.estimateMin ?? 0, actual: Math.round(actual / 60_000) });
  }
  return <section className="screen focus-screen"><button type="button" className="text-button" onClick={() => go('plan')} aria-label="Back to Plan"><span aria-hidden="true">←</span> Plan</button><p className="eyebrow">One step at a time</p><h1>Focus</h1>{awayToday && <p>You're away. Rest well.</p>}
    {board.message && <p role="status">{board.message}</p>}
    {justFinished && <p className="task-result" role="status">Planned {justFinished.planned} min · Took {justFinished.actual} min ({justFinished.planned ? (justFinished.actual / justFinished.planned).toFixed(1) : '0.0'}x)</p>}
    {rewardOn && typeof reward === 'string' && reward.trim() && ((taskFocus && phase && phase.phase !== 'work') || (justFinished && justFinished.actual >= 25)) && <p className="task-result" role="status">Block done. Time for {reward}.</p>}
    <section className="card now-card" aria-label="Focus task">{task ? <><span className="pill">{group ? `Step ${step} of ${group.total}` : 'Today'}</span><h2>{task.title}</h2>{task.firstStep && <p>First: {task.firstStep}</p>}
      <div className={`timer-ring${taskFocus && elapsedMs > plannedMs ? ' overtime' : ''}`} style={{ '--progress': `${percent}%` } as React.CSSProperties} aria-label={taskFocus ? `Focus time ${minutes(elapsedMs)}` : `Planned ${task.estimateMin} minutes`}><span>{phase ? minutes(phase.remainingMs) : `${task.estimateMin}m`}</span></div>
      {phase && <p role="status">{phase.paused ? 'Paused · ' : ''}{phase.phase === 'work' ? 'Focus' : phase.phase === 'longBreak' ? 'Long break' : 'Break'} · cycle {phase.cycle} · {minutes(phase.remainingMs)} left</p>}
      {phase && phase.phase !== 'work' && <p className="timer-caption">A quiet break is here. Stretch, drink water, or step away.</p>}
      {taskFocus && <p className="timer-caption">{elapsedMs > plannedMs ? `+${Math.floor((elapsedMs - plannedMs) / 60_000)} min over plan. Keep going or wrap up?` : isFocusRunning(taskFocus) ? `Elapsed ${minutes(elapsedMs)}` : `Paused · ${minutes(elapsedMs)} elapsed`}</p>}
      {!taskFocus && <label>Focus cycle <select aria-label="Focus cycle" value={cyclePreset} onChange={event => setCyclePreset(event.target.value as '25/5' | '50/10')}><option value="25/5">25 min work / 5 min break</option><option value="50/10">50 min work / 10 min break</option></select></label>}
      <div className="now-actions">{!taskFocus ? <button type="button" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.startFocus(task.id, now, cyclePreset), 'Focus started.')}>Start focus</button> : isFocusRunning(taskFocus) ? <button type="button" className="secondary" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.pauseFocus(taskFocus.id, now), 'Focus paused.')}>Pause</button> : <button type="button" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.resumeFocus(taskFocus.id, now), 'Focus resumed.')}>Resume</button>}
        {taskFocus && phase?.phase === 'work' && <button type="button" className="secondary" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.extendFocus(taskFocus.id, now), 'Focus extended by 10 min.')}>+10 min</button>}
        <button type="button" className="secondary" disabled={board.busy} onClick={() => void finish()}>Finish</button><button type="button" className="text-button" onClick={() => setMoving(task)}>Move in Plan</button></div>
    </> : <><h2>Focus complete.</h2><p>Choose another step in Plan when you are ready.</p><button type="button" onClick={() => go('plan')}>Open Plan</button></>}</section>
    {moving && <PostponeSheet key={moving.id} task={moving} run={board.act} close={() => setMoving(null)} />}
  </section>;
}
