import { useEffect, useState, type FormEvent } from 'react';
import type { TaskRow } from '../../data/types';
import type { MoveSnapshot, MoveTarget } from '../../data/repos/tasks';
import { dayKey } from '../../core/time/dayKey';
import { focusElapsedMs, isFocusRunning } from '../../core/tasks/focus';
import { Cast, type Pose } from '../cast/Cast';
import { taskGroups, visibleTasks } from './model';
import { GroupRow } from './TaskList';
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

export function MorList({ board, onDetail, avgHidden, hideAverage, outerMove }: { board: Board; onDetail: (task: TaskRow) => void; avgHidden: boolean; hideAverage: () => void; outerMove?: OuterMove }) {
  const today = dayKey(board.now);
  const [moment, setMoment] = useState<{ kind: MorMoment; at: number }>({ kind: 'open', at: 0 });
  const [noted, setNoted] = useState('');
  const [toast, setToast] = useState<{ text: string; undo?: () => void; at: number; writes?: number } | null>(null);
  const [title, setTitle] = useState('');
  const [timeOpen, setTimeOpen] = useState(false);
  const [time, setTime] = useState<number | undefined>();
  const [other, setOther] = useState('');
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(current => current?.at === toast.at ? null : current), 8000); return () => window.clearTimeout(timer); }, [toast]);
  const react = (kind: MorMoment) => setMoment(current => ({ kind, at: current.at + 1 }));
  const undo = (task: TaskRow, before: MoveSnapshot) => { void board.act((repos, now) => repos.undoMove(task.id, now, before), 'Move undone.'); };
  // Moves from the detail sheet get the same toast and Undo (Codex A item 91); a newer toast here replaces it.
  const [outerDone, setOuterDone] = useState(0);
  const offerUndo = (task: TaskRow, before: MoveSnapshot, text: string) => { setOuterDone(outerMove?.at ?? 0); setToast(current => ({ text, at: (current?.at ?? 0) + 1, writes: board.writesRef.current, undo: () => { undo(task, before); setToast(null); } })); };
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
  const shown: MorMoment = moment.kind === 'open' && nothingLeft ? 'rest' : moment.kind;
  const average = avgHidden ? undefined : averageLine(board.tasks);

  async function add(event: FormEvent) {
    event.preventDefault();
    const name = title.trim();
    if (!name) return;
    clearUndo();
    const picked = time ?? (other ? Number(other) : undefined);
    if (await board.act((repos, now) => repos.addToList(name, now, picked && Number.isFinite(picked) && picked > 0 ? Math.min(picked, 90) : undefined), 'Added to Today.')) {
      setTitle(''); setTime(undefined); setOther(''); setTimeOpen(false); react('add');
    }
  }
  async function done(task: TaskRow) {
    clearUndo();
    const open = board.focus.filter(row => row.taskId === task.id && row.endedAt == null && !row.deleted);
    const worked = Math.round(open.reduce((sum, row) => sum + focusElapsedMs(row, board.now), 0) / 60_000);
    const ok = await board.act(async (repos, now) => { for (const row of open) await repos.finishFocus(row.id, now); await repos.completeTask(task.id, now); }, 'Done.');
    if (!ok) return;
    if (open.length && worked > 0) { setNoted(notedLine(task, (task.actualMinutes ?? 0) + worked, true)); react('timed'); }
    else react('done');
  }
  async function stopForNow(task: TaskRow) {
    if (!running) return;
    clearUndo();
    const worked = Math.round(focusElapsedMs(running, board.now) / 60_000);
    if (await board.act((repos, now) => repos.finishFocus(running.id, now), 'Saved for now.')) { if (worked > 0) setNoted(notedLine(task, worked, false)); react('open'); }
  }
  // One focus at a time: Start ends any other open focus. From Tomorrow or Later it brings the task to Today first,
  // with Undo (Codex A item 91).
  async function start(task: TaskRow) {
    clearUndo();
    let before: MoveSnapshot | undefined;
    if (!await board.act(async (repos, now) => { before = await repos.startFromList(task.id, now); }, 'Focus started.')) return;
    setNoted(''); react('start');
    if (before) offerUndo(task, before, 'Moved to Today.');
  }
  async function move(task: TaskRow, target: MoveTarget, where: string) {
    clearUndo();
    let before: MoveSnapshot | undefined;
    const ok = await board.act(async (repos, now) => { before = await repos.moveTask(task.id, now, target); }, '');
    if (!ok || !before) return;
    react('move');
    offerUndo(task, before, `Moved to ${where}.`);
  }

  const row = (task: TaskRow, list: 'today' | 'tomorrow' | 'later') => <li className="task-row ui-list-row mor-row" key={task.id} data-list={list}>
    <button type="button" className="done-circle" aria-label={`Done: ${task.title}`} disabled={board.busy} onClick={() => void done(task)}><span aria-hidden="true">○</span></button>
    <div className="task-row-main"><button type="button" className="task-title-button" onClick={() => openDetail(task)}>{task.title}</button>
      {(task.timeSet || task.scheduledStart != null) && <span className="small">{task.scheduledStart != null ? new Date(task.scheduledStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : `${task.estimateMin} min`}</span>}</div>
    <div className="task-row-actions">
      {runningTask?.id !== task.id && <button type="button" className="secondary" disabled={board.busy} aria-label={`Start: ${task.title}`} onClick={() => void start(task)}>Start</button>}
      {list === 'today' ? <button type="button" className="secondary" disabled={board.busy} aria-label={`Tomorrow: ${task.title}`} onClick={() => void move(task, 'tomorrow', 'Tomorrow')}>Tomorrow →</button>
        : <button type="button" className="secondary" disabled={board.busy} aria-label={`Today: ${task.title}`} onClick={() => void move(task, 'today', 'Today')}>← Today</button>}
    </div>
  </li>;
  // Steps of a split task stay together under their task, with its progress and a whole-task drop.
  const groups = new Map(taskGroups(board.tasks).filter(group => group.total).map(group => [group.parent.id, group]));
  const list = (name: string, items: TaskRow[], key: 'today' | 'tomorrow' | 'later', empty: string) => {
    const seen = new Set<string>();
    const rows = items.flatMap(task => {
      const group = task.parentId ? groups.get(task.parentId) : undefined;
      if (!group) return [row(task, key)];
      if (seen.has(group.parent.id)) return [];
      seen.add(group.parent.id);
      return [<GroupRow key={group.parent.id} group={group} onDetail={openDetail} busy={board.busy} onDrop={id => void board.act((repos, now) => repos.dropTask(id, now), 'Split task dropped.')}><ul>{items.filter(step => step.parentId === group.parent.id).map(step => row(step, key))}</ul></GroupRow>];
    });
    return <section className="task-list mor-list" aria-label={name}>
      <div className="ui-section-header"><h2>{name} <span className="task-count">{items.length}</span></h2></div>
      {items.length ? <ul>{rows}</ul> : <p className="small">{empty}</p>}
    </section>;
  };

  return <div className="mor-plan">
    <div className="mor-header">
      <span className={`mor-friend mor-${shown}`} key={`${shown}-${moment.at}`} data-moment={shown}><Cast name="Mor" pose={POSE[shown]} size={64} title="Mor" /></span>
      <div className="mor-say">{noted ? <p className="mor-noted" role="status">{noted}</p> : <p className="small">{nothingLeft ? 'Nothing left for today.' : 'Your list for today.'}</p>}
        {average && <p className="small mor-average">{average} <button type="button" className="text-button" onClick={hideAverage}>Hide</button></p>}</div>
    </div>
    {runningTask && running && <section className="card mor-focus" aria-label="Focus">
      {/* A focus paused on the focus timer screen shows as paused, with Resume (Codex A item 91). */}
      <span className="eyebrow">{isFocusRunning(running) ? 'Working on' : 'Paused'}</span><h2>{runningTask.title}</h2>
      <p className="mor-clock" aria-live="off">{(() => { const ms = focusElapsedMs(running, board.now); const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; })()}</p>
      <div className="sheet-actions">{!isFocusRunning(running) && <button type="button" disabled={board.busy} onClick={() => { clearUndo(); void board.act((repos, now) => repos.resumeFocus(running.id, now), 'Focus resumed.'); }}>Resume</button>}<button type="button" className={isFocusRunning(running) ? '' : 'secondary'} disabled={board.busy} onClick={() => void done(runningTask)}>Done</button><button type="button" className="secondary" disabled={board.busy} onClick={() => void stopForNow(runningTask)}>Stop for now</button></div>
    </section>}
    <form className="mor-add" onSubmit={event => void add(event)}>
      <label className="quick-add-field">Add a task<span className="mor-add-row"><input maxLength={160} value={title} onChange={event => setTitle(event.target.value)} placeholder="Add a task" />
        {title.trim() && !timeOpen && <button type="button" className="text-button mor-time-chip" onClick={() => setTimeOpen(true)}>{time ? `${time} min` : '+ time'}</button>}</span></label>
      {timeOpen && <fieldset className="mor-time"><legend>Time <span className="small">Optional</span></legend>
        {TIME_CHIPS.map(value => <button type="button" key={value} className={time === value ? '' : 'secondary'} aria-pressed={time === value} onClick={() => { setTime(time === value ? undefined : value); setOther(''); }}>{value} min</button>)}
        <label>Other <input type="number" min="1" max="90" inputMode="numeric" value={other} onChange={event => { setOther(event.target.value); setTime(undefined); }} /></label>
        <button type="button" className="text-button" onClick={() => { setTime(undefined); setOther(''); setTimeOpen(false); }}>No time</button></fieldset>}
      <button type="submit" disabled={board.busy || !title.trim()}>Add</button>
    </form>
    {shownToast && <p className="mor-toast" role="status">{shownToast.text} {shownToast.undo && <button type="button" className="text-button" onClick={shownToast.undo}>Undo</button>}</p>}
    {!shownToast && board.message && <p className="small" role="status">{board.message}</p>}
    {list('Today', todayRows, 'today', 'Add one thing you want to do.')}
    {doneRows.length > 0 && <details className="mor-done"><summary>Done <span className="task-count">{doneRows.length}</span></summary><ul>{doneRows.map(task => <li key={task.id} className="task-row ui-list-row"><span className="done-circle done-mark" aria-label="Done"><span aria-hidden="true">✓</span></span><button type="button" className="task-title-button" onClick={() => openDetail(task)}>{task.title}</button>{(task.actualMinutes ?? 0) > 0 && <span className="small">{minutes(task.actualMinutes!)}</span>}</li>)}</ul></details>}
    {list('Tomorrow', tomorrowRows, 'tomorrow', 'Nothing yet.')}
    {list('Later', laterRows, 'later', 'Nothing waiting.')}
  </div>;
}
