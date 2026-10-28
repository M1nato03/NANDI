import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { TaskRow } from '../../data/types';
import type { MoveSnapshot, MoveTarget } from '../../data/repos/tasks';
import { dayKey } from '../../core/time/dayKey';
import { isFocusRunning, taskFocusMs } from '../../core/tasks/focus';
import { Cast, type Pose } from '../cast/Cast';
import { taskGroups, visibleTasks, type TaskGroup } from './model';
import { FriendStage } from '../cast/FriendStage';
import type { useTaskBoard } from './useTaskBoard';

type Board = ReturnType<typeof useTaskBoard>;
/** The moments Mor reacts to (spec 27 table). Each one runs once per action. */
export type MorMoment = 'open' | 'add' | 'done' | 'move' | 'start' | 'timed' | 'rest';
const POSE: Record<MorMoment, Pose> = { open: 'idle', add: 'idle', done: 'cheer', move: 'idle', start: 'think', timed: 'cheer', rest: 'rest' };
const minutes = (count: number) => `${count} minute${count === 1 ? '' : 's'}`;
const TIME_CHIPS = [15, 30, 60];

/** Which list a task sits in: Today (today and anything left from earlier days), Tomorrow, or Later. */
export function listOf(task: TaskRow, today: string): 'today' | 'tomorrow' | 'later' | 'done' | undefined {
  if (task.deleted || task.status === 'dropped') return undefined;
  if (task.status === 'done') return task.doneAt != null && dayKey(task.doneAt) === today ? 'done' : undefined;
  if (task.status === 'someday') return 'later';
  const tomorrow = dayKey(new Date(`${today}T12:00:00`).getTime() + 86_400_000);
  if (task.dayKey <= today) return 'today';
  return task.dayKey === tomorrow ? 'tomorrow' : 'later';
}

/** Mor's line after a timed task: what it took, and what was set if a time was set. No judgement words. */
export function notedLine(task: TaskRow, workedMinutes: number, finished: boolean): string {
  const set = task.timeSet && task.estimateMin ? ` You set ${task.estimateMin}.` : '';
  return finished ? `Noted: '${task.title}' took ${minutes(workedMinutes)}.${set}` : `Noted: ${minutes(workedMinutes)} on '${task.title}' so far.`;
}

/** The optional average line: shown once there are 5 or more timed, finished tasks. */
export function averageLine(tasks: TaskRow[]): string | undefined {
  const timed = tasks.filter(task => !task.deleted && task.status === 'done' && (task.actualMinutes ?? 0) > 0);
  if (timed.length < 5) return undefined;
  const mean = Math.round(timed.reduce((sum, task) => sum + (task.actualMinutes ?? 0), 0) / timed.length);
  return `Your timed tasks so far: about ${minutes(mean)} each.`;
}

/** A move made elsewhere on Plan (the detail sheet's Another day or Later) that the list should offer to undo. */
export type OuterMove = { task: TaskRow; before: MoveSnapshot; where: string; at: number; writes: number };

/** A Start tapped on a step in the detail sheet: the list runs it, so Mor reacts and a move to Today gets Undo. */
export type StartRequest = { task: TaskRow; at: number };

/** Mor's list sits under Mor's stage at the top of Plan: the stage's Mor is the one that reacts (item 135, one Mor per screen). */
export function MorList({ board, onDetail, avgHidden, hideAverage, outerMove, startRequest, heading, away }: { board: Board; onDetail: (task: TaskRow) => void; avgHidden: boolean; hideAverage: () => void; outerMove?: OuterMove; startRequest?: StartRequest; heading?: ReactNode; away?: boolean }) {
  const today = dayKey(board.now);
  const [moment, setMoment] = useState<{ kind: MorMoment; at: number }>({ kind: 'open', at: 0 });
  const [noted, setNoted] = useState('');
  const [toast, setToast] = useState<{ text: string; undo?: () => void; at: number; writes?: number } | null>(null);
  const [title, setTitle] = useState('');
  const [timeOpen, setTimeOpen] = useState(false);
  const [time, setTime] = useState<number | undefined>();
  const [other, setOther] = useState('');
  const [confirmAll, setConfirmAll] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(current => current?.at === toast.at ? null : current), 8000); return () => window.clearTimeout(timer); }, [toast]);
  const react = (kind: MorMoment) => setMoment(current => ({ kind, at: current.at + 1 }));
  const undo = (task: TaskRow, before: MoveSnapshot) => { void board.act((repos, now) => repos.undoMove(task.id, now, before), 'Move undone.'); };
  // Moves from the detail sheet get the same toast and Undo (Codex A item 91); a newer toast here replaces it.
  const [outerDone, setOuterDone] = useState(0);
  const offerUndo = (moved: [TaskRow, MoveSnapshot][], text: string) => { setOuterDone(outerMove?.at ?? 0); setToast(current => ({ text, at: (current?.at ?? 0) + 1, writes: board.writesRef.current, undo: () => { void board.act(async (repos, now) => { for (const [task, before] of moved) await repos.undoMove(task.id, now, before); }, 'Move undone.'); setToast(null); } })); };
  const outerToast = outerMove && outerMove.at !== outerDone && outerMove.writes === board.writes ? { text: `Moved to ${outerMove.where}.`, at: outerMove.at, undo: () => { undo(outerMove.task, outerMove.before); setOuterDone(outerMove.at); } } : null;
  useEffect(() => { if (!outerToast) return; const timer = window.setTimeout(() => setOuterDone(outerToast.at), 8000); return () => window.clearTimeout(timer); }, [outerToast?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  // Central rule: any write after the move (from anywhere on Plan) ends its Undo (Codex A item 93).
  const shownToast = outerToast ?? (toast && (toast.writes === undefined || toast.writes === board.writes) ? toast : null);
  // Undo is one step and lasts only until the next action (Codex A item 92, the spec owner's call).
  const clearUndo = () => { setToast(null); setOuterDone(outerMove?.at ?? 0); };
  const openDetail = (task: TaskRow) => { clearUndo(); onDetail(task); };

  const rows = visibleTasks(board.tasks);
  const by = (list: string) => rows.filter(task => listOf(task, today) === list).sort((a, b) => (a.scheduledStart ?? Number.MAX_SAFE_INTEGER) - (b.scheduledStart ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id));
  const todayRows = by('today'), tomorrowRows = by('tomorrow'), laterRows = by('later'), doneRows = by('done');
  const running = board.focus.filter(row => !row.deleted && row.endedAt == null).sort((a, b) => b.startedAt - a.startedAt).find(row => todayRows.some(task => task.id === row.taskId));
  const runningTask = running && todayRows.find(task => task.id === running.taskId);
  const nothingLeft = todayRows.length === 0 && doneRows.length > 0;
  const shown: MorMoment = moment.kind === 'open' && (nothingLeft || away) ? 'rest' : moment.kind;
  const average = avgHidden ? undefined : averageLine(board.tasks);

  async function add(event: FormEvent) {
    event.preventDefault();
    const name = title.trim();
    if (!name) return;
    clearUndo();
    const picked = time ?? (other ? Number(other) : undefined);
    if (await board.act((repos, now) => repos.addToList(name, now, picked && Number.isFinite(picked) && picked > 0 ? Math.min(picked, 90) : undefined), 'Added to Today.')) {
      // Clear only what was added: a next task typed while the save was running stays in the field (CI caught the race).
      setTitle(current => current.trim() === name ? '' : current); setTime(undefined); setOther(''); setTimeOpen(false); react('add');
    }
  }
  async function done(task: TaskRow) {
    clearUndo();
    const open = board.focus.filter(row => row.taskId === task.id && row.endedAt == null && !row.deleted);
    // The whole time on the task, across Stop for now and Start again, so the Done line agrees with the clock.
    const worked = Math.round(taskFocusMs(board.focus, task.id, board.now) / 60_000);
    const ok = await board.act(async (repos, now) => { for (const row of open) await repos.finishFocus(row.id, now); await repos.completeTask(task.id, now); }, 'Done.');
    if (!ok) return;
    if (worked > 0) { setNoted(notedLine(task, worked, true)); react('timed'); }
    else react('done');
  }
  // A split task's own circle finishes every step still open, after one inline check (item 135).
  async function doneAll(group: TaskGroup) {
    clearUndo(); setConfirmAll(null);
    const open = group.steps.filter(step => !step.deleted && step.status !== 'done' && step.status !== 'dropped');
    const focus = board.focus.filter(row => row.endedAt == null && !row.deleted && open.some(step => step.id === row.taskId));
    if (await board.act(async (repos, now) => { for (const row of focus) await repos.finishFocus(row.id, now); for (const step of open) await repos.completeTask(step.id, now); }, 'All steps done.')) react('done');
  }
  async function stopForNow(task: TaskRow) {
    if (!running) return;
    clearUndo();
    const worked = Math.round(taskFocusMs(board.focus, task.id, board.now) / 60_000);
    if (await board.act((repos, now) => repos.finishFocus(running.id, now), 'Saved for now.')) { if (worked > 0) setNoted(notedLine(task, worked, false)); react('open'); }
  }
  // One focus at a time: Start ends any other open focus. From Tomorrow or Later it brings the task to Today first,
  // with Undo (Codex A item 91).
  async function start(task: TaskRow) {
    clearUndo();
    let before: MoveSnapshot | undefined;
    if (!await board.act(async (repos, now) => { before = await repos.startFromList(task.id, now); }, 'Focus started.')) return;
    setNoted(''); react('start');
    if (before) offerUndo([[task, before]], 'Moved to Today.');
  }
  const startedAt = useRef(0);
  useEffect(() => { if (!startRequest || startRequest.at === startedAt.current) return; startedAt.current = startRequest.at; void start(startRequest.task); }, [startRequest?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  // A stepped task's row moves every open step in its list together, and Undo brings them all back.
  async function move(tasks: TaskRow[], target: MoveTarget, where: string) {
    clearUndo();
    const moved: [TaskRow, MoveSnapshot][] = [];
    const ok = await board.act(async (repos, now) => { for (const task of tasks) moved.push([task, await repos.moveTask(task.id, now, target)]); }, '');
    if (!ok || !moved.length) return;
    react('move');
    offerUndo(moved, `Moved to ${where}.`);
  }

  const groups = new Map(taskGroups(board.tasks).filter(group => group.total).map(group => [group.parent.id, group]));
  const timeOf = (task: TaskRow) => (task.timeSet || task.scheduledStart != null) && <span className="small mor-time" id={`time-${task.id}`}>{task.scheduledStart != null ? new Date(task.scheduledStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : `${task.estimateMin} min`}</span>;
  // Spec 27: one move on the row itself. Today rows go to Tomorrow; Tomorrow and Later rows come back to Today.
  // Later and another day sit in the detail sheet.
  const MOVE: Record<'today' | 'tomorrow' | 'later', { target: MoveTarget; where: string; label: string }> = {
    today: { target: 'tomorrow', where: 'Tomorrow', label: 'Tomorrow →' },
    tomorrow: { target: 'today', where: 'Today', label: '← Today' },
    later: { target: 'today', where: 'Today', label: '← Today' },
  };
  const moveButton = (tasks: TaskRow[], name: string, list: 'today' | 'tomorrow' | 'later') => <button type="button" className="text-button mor-move" disabled={board.busy} aria-label={`${MOVE[list].where}: ${name}`} onClick={() => void move(tasks, MOVE[list].target, MOVE[list].where)}>{MOVE[list].label}</button>;
  // Every row has exactly three controls: the circle, Start and the move (spec 27).
  const row = (task: TaskRow, list: 'today' | 'tomorrow' | 'later') => <li className="task-row ui-list-row mor-row" key={task.id} data-list={list}>
    <button type="button" className="done-circle" aria-label={`Done: ${task.title}`} disabled={board.busy} onClick={() => void done(task)}><span aria-hidden="true">○</span></button>
    <div className="task-row-main"><button type="button" className="task-title-button" aria-label={task.title} aria-describedby={task.timeSet || task.scheduledStart != null ? `time-${task.id}` : undefined} onClick={() => openDetail(task)}><span className="mor-title">{task.title}</span>{timeOf(task)}</button></div>
    {runningTask?.id !== task.id && <button type="button" className="secondary mor-start" disabled={board.busy} aria-label={`Start: ${task.title}`} onClick={() => void start(task)}>Start</button>}
    {moveButton([task], task.title, list)}
  </li>;
  // A split task is one row: its circle finishes every open step after an inline check (item 135), Start starts its
  // next open step here, and the move takes its open steps here along. The steps themselves live in its detail sheet.
  const parentRow = (group: TaskGroup, here: TaskRow[], list: 'today' | 'tomorrow' | 'later') => {
    const left = group.steps.filter(step => !step.deleted && step.status !== 'done' && step.status !== 'dropped').length;
    const next = here.find(step => step.id !== runningTask?.id);
    return <li className="task-row ui-list-row mor-row mor-parent" key={group.parent.id} data-list={list}>
      <button type="button" className="done-circle" aria-label={`Done: ${group.parent.title}`} aria-expanded={confirmAll === group.parent.id} disabled={board.busy || !left} onClick={() => setConfirmAll(current => current === group.parent.id ? null : group.parent.id)}><span aria-hidden="true">○</span></button>
      <div className="task-row-main"><button type="button" className="task-title-button" aria-label={group.parent.title} aria-describedby={`progress-${group.parent.id}`} onClick={() => openDetail(group.parent)}><span className="mor-title">{group.parent.title}</span><span className="small" id={`progress-${group.parent.id}`}>{group.done}/{group.total} steps</span></button></div>
      {next && <button type="button" className="secondary mor-start" disabled={board.busy} aria-label={`Start: ${group.parent.title}`} onClick={() => void start(next)}>Start</button>}
      {moveButton(here, group.parent.title, list)}
      {confirmAll === group.parent.id && <div className="mor-confirm" role="group" aria-label={`Finish ${group.parent.title}`}><span>{left === 1 ? 'Mark the last step done?' : `Mark all ${left} steps done?`}</span><button type="button" disabled={board.busy} onClick={() => void doneAll(group)}>Mark done</button><button type="button" className="secondary" onClick={() => setConfirmAll(null)}>Cancel</button></div>}
    </li>;
  };
  const list = (name: string, items: TaskRow[], key: 'today' | 'tomorrow' | 'later', empty: string) => {
    const seen = new Set<string>();
    const rows = items.flatMap(task => {
      const group = task.parentId ? groups.get(task.parentId) : undefined;
      if (!group) return [row(task, key)];
      if (seen.has(group.parent.id)) return [];
      seen.add(group.parent.id);
      return [parentRow(group, items.filter(step => step.parentId === group.parent.id), key)];
    });
    return <section className="task-list mor-list" aria-label={name}>
      <div className="ui-section-header"><h2>{name} <span className="task-count">{rows.length}</span></h2></div>
      {items.length ? <ul>{rows}</ul> : <p className="small">{empty}</p>}
    </section>;
  };

  return <div className="mor-plan">
    <FriendStage area="plan" compact art={<span className={`mor-friend mor-${shown}`} key={`${shown}-${moment.at}`} data-moment={shown}><Cast name="Mor" pose={POSE[shown]} size={64} title="Mor" /></span>}>{heading}</FriendStage>
    {runningTask && running && <section className="card mor-focus" aria-label="Focus">
      {/* Pause holds the clock; Resume carries on from the same second. The clock is the task's whole time, so Start
          after Stop for now continues from where it left off (item 214). */}
      <span className="eyebrow">{isFocusRunning(running) ? 'Working on' : 'Paused'}</span><h2>{runningTask.title}</h2>
      <p className="mor-clock" aria-live="off">{(() => { const ms = taskFocusMs(board.focus, runningTask.id, board.now); const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; })()}</p>
      <div className="sheet-actions">{isFocusRunning(running) ? <button type="button" className="secondary" disabled={board.busy} onClick={() => { clearUndo(); void board.act((repos, now) => repos.pauseFocus(running.id, now), 'Focus paused.'); }}>Pause</button> : <button type="button" disabled={board.busy} onClick={() => { clearUndo(); void board.act((repos, now) => repos.resumeFocus(running.id, now), 'Focus resumed.'); }}>Resume</button>}<button type="button" className={isFocusRunning(running) ? '' : 'secondary'} disabled={board.busy} onClick={() => void done(runningTask)}>Done</button><button type="button" className="secondary" disabled={board.busy} onClick={() => void stopForNow(runningTask)}>Stop for now</button></div>
    </section>}
    <form className="mor-add" onSubmit={event => void add(event)}>
      <label className="quick-add-field"><span className="visually-hidden">Add a task</span><span className="mor-add-row"><input maxLength={160} value={title} onChange={event => setTitle(event.target.value)} placeholder="Add a task" />
        {title.trim() && !timeOpen && <button type="button" className="text-button mor-time-chip" onClick={() => setTimeOpen(true)}>{time ? `${time} min` : '+ time'}</button>}</span></label>
      {timeOpen && <fieldset className="mor-time"><legend>Time <span className="small">Optional</span></legend>
        {TIME_CHIPS.map(value => <button type="button" key={value} className={time === value ? '' : 'secondary'} aria-pressed={time === value} onClick={() => { setTime(time === value ? undefined : value); setOther(''); }}>{value} min</button>)}
        <label>Other <input type="number" min="1" max="90" inputMode="numeric" value={other} onChange={event => { setOther(event.target.value); setTime(undefined); }} /></label>
        <button type="button" className="text-button" onClick={() => { setTime(undefined); setOther(''); setTimeOpen(false); }}>No time</button></fieldset>}
      <button type="submit" disabled={board.busy || !title.trim()}>Add</button>
    </form>
    {noted && <p className="small mor-noted" role="status">{noted}</p>}
    {average && <p className="small mor-average">{average} <button type="button" className="text-button" onClick={hideAverage}>Hide</button></p>}
    {shownToast && <p className="mor-toast" role="status">{shownToast.text} {shownToast.undo && <button type="button" className="text-button" onClick={shownToast.undo}>Undo</button>}</p>}
    {!shownToast && board.message && <p className="small" role="status">{board.message}</p>}
    {list('Today', todayRows, 'today', 'Add one thing you want to do.')}
    {doneRows.length > 0 && <details className="mor-done"><summary>Done <span className="task-count">{doneRows.length}</span></summary><ul>{doneRows.map(task => <li key={task.id} className="task-row ui-list-row"><span className="done-circle done-mark" aria-label="Done"><span aria-hidden="true">✓</span></span><button type="button" className="task-title-button" onClick={() => openDetail(task)}>{task.title}</button>{(task.actualMinutes ?? 0) > 0 && <span className="small">{minutes(task.actualMinutes!)}</span>}</li>)}</ul></details>}
    {list('Tomorrow', tomorrowRows, 'tomorrow', 'Nothing yet.')}
    {list('Later', laterRows, 'later', 'Nothing waiting.')}
  </div>;
}
