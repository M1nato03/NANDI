import { useState } from 'react';
import type { TaskRow } from '../../data/types';
import { focusPhase, isFocusRunning } from '../../core/tasks/focus';
import { PostponeSheet } from '../tasks/PostponeSheet';
import { currentFocus, elapsed, minutes, taskGroups, todayTasks, visibleTasks } from '../tasks/model';
import { useTaskBoard } from '../tasks/useTaskBoard';
import { go } from '../shell/router';
import '../tasks/tasks.css';

export function Today() {
  const board = useTaskBoard();
  const [moving, setMoving] = useState<TaskRow | null>(null);
  const [justFinished, setJustFinished] = useState<{ planned: number; actual: number } | null>(null);
  const [cyclePreset, setCyclePreset] = useState<'25/5' | '50/10'>('25/5');
  const focus = currentFocus(board.focus);
  const scheduled = todayTasks(board.tasks, board.now);
  const task = (focus && visibleTasks(board.tasks).find(row => row.id === focus.taskId && row.status !== 'done')) ?? scheduled[0];
  const group = task?.parentId ? taskGroups(board.tasks).find(row => row.parent.id === task.parentId) : undefined;
  const step = group && task ? group.steps.findIndex(row => row.id === task.id) + 1 : 0;
  const taskFocus = task ? board.focus.filter(row => row.taskId === task.id && row.endedAt == null).sort((a, b) => b.startedAt - a.startedAt)[0] : undefined;
  const plannedMs = (task?.estimateMin ?? 25) * 60_000;
  const elapsedMs = taskFocus ? elapsed(taskFocus, board.now) : 0;
  const phase = taskFocus ? focusPhase(taskFocus, board.now) : null;
  const remaining = Math.max(0, plannedMs - elapsedMs);
  const percent = Math.max(0, Math.min(100, remaining / plannedMs * 100));
  async function finish() {
    if (!task) return;
    const current = task;
    const actual = board.focus.filter(row => row.taskId === current.id).reduce((sum, row) => sum + elapsed(row, Date.now()), 0);
    const ok = await board.act((repos, now) => repos.completeTask(current.id, now), 'Task done.');
    if (ok) setJustFinished({ planned: current.estimateMin ?? 0, actual: Math.round(actual / 60_000) });
  }
  return <section className="screen focus-screen"><button type="button" className="text-button" onClick={() => go('now')}>← Now</button><p className="eyebrow">One step at a time</p><h1>Focus</h1>
    {board.message && <p role="status">{board.message}</p>}
    {justFinished && <p className="task-result" role="status">Planned {justFinished.planned} min · Took {justFinished.actual} min</p>}
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
