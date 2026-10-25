import { useEffect, useState, type FormEvent } from 'react';
import type { TaskRow } from '../../data/types';
import type { MoveSnapshot, MoveTarget } from '../../data/repos/tasks';
import { dayKey } from '../../core/time/dayKey';
import { focusElapsedMs } from '../../core/tasks/focus';
import { Cast, type Pose } from '../cast/Cast';
import { visibleTasks } from './model';
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

export function MorList({ board, onDetail, avgHidden, hideAverage }: { board: Board; onDetail: (task: TaskRow) => void; avgHidden: boolean; hideAverage: () => void }) {
  const today = dayKey(board.now);
  const [moment, setMoment] = useState<{ kind: MorMoment; at: number }>({ kind: 'open', at: 0 });
  const [noted, setNoted] = useState('');
  const [toast, setToast] = useState<{ text: string; undo?: () => void; at: number } | null>(null);
  const [title, setTitle] = useState('');
  const [timeOpen, setTimeOpen] = useState(false);
  const [time, setTime] = useState<number | undefined>();
  const [other, setOther] = useState('');
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(current => current?.at === toast.at ? null : current), 8000); return () => window.clearTimeout(timer); }, [toast]);
  const react = (kind: MorMoment) => setMoment(current => ({ kind, at: current.at + 1 }));

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
    const picked = time ?? (other ? Number(other) : undefined);
    if (await board.act((repos, now) => repos.addToList(name, now, picked && Number.isFinite(picked) && picked > 0 ? Math.min(picked, 90) : undefined), 'Added to Today.')) {
      setTitle(''); setTime(undefined); setOther(''); setTimeOpen(false); react('add');
    }
  }
  async function done(task: TaskRow) {
    const open = board.focus.filter(row => row.taskId === task.id && row.endedAt == null && !row.deleted);
    const worked = Math.round(open.reduce((sum, row) => sum + focusElapsedMs(row, board.now), 0) / 60_000);
    const ok = await board.act(async (repos, now) => { for (const row of open) await repos.finishFocus(row.id, now); await repos.completeTask(task.id, now); }, 'Done.');
    if (!ok) return;
    if (open.length && worked > 0) { setNoted(notedLine(task, (task.actualMinutes ?? 0) + worked, true)); react('timed'); }
    else react('done');
  }
  async function stopForNow(task: TaskRow) {
    if (!running) return;
    const worked = Math.round(focusElapsedMs(running, board.now) / 60_000);
    if (await board.act((repos, now) => repos.finishFocus(running.id, now), 'Saved for now.')) { if (worked > 0) setNoted(notedLine(task, worked, false)); react('open'); }
  }
  async function start(task: TaskRow) {
    if (await board.act((repos, now) => repos.startFocus(task.id, now), 'Focus started.')) { setNoted(''); react('start'); }
  }
  async function move(task: TaskRow, target: MoveTarget, where: string) {
    let before: MoveSnapshot | undefined;
    const ok = await board.act(async (repos, now) => { before = await repos.moveTask(task.id, now, target); }, '');
    if (!ok || !before) return;
    const saved = before;
    react('move');
    setToast(current => ({ text: `Moved to ${where}.`, at: (current?.at ?? moment.at) + 1, undo: () => { void board.act((repos, now) => repos.undoMove(task.id, now, saved), 'Move undone.'); setToast(null); } }));
  }

  const row = (task: TaskRow, list: 'today' | 'tomorrow' | 'later') => <li className="task-row ui-list-row mor-row" key={task.id} data-list={list}>
    <button type="button" className="done-circle" aria-label={`Done: ${task.title}`} disabled={board.busy} onClick={() => void done(task)}><span aria-hidden="true">○</span></button>
    <div className="task-row-main"><button type="button" className="task-title-button" onClick={() => onDetail(task)}>{task.title}</button>
      {(task.timeSet || task.scheduledStart != null) && <span className="small">{task.scheduledStart != null ? new Date(task.scheduledStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : `${task.estimateMin} min`}</span>}</div>
    <div className="task-row-actions">
      {list === 'today' && runningTask?.id !== task.id && <button type="button" className="secondary" disabled={board.busy} onClick={() => void start(task)}>Start</button>}
      {list === 'today' ? <button type="button" className="secondary" disabled={board.busy} aria-label={`Tomorrow: ${task.title}`} onClick={() => void move(task, 'tomorrow', 'Tomorrow')}>Tomorrow →</button>
        : <button type="button" className="secondary" disabled={board.busy} aria-label={`Today: ${task.title}`} onClick={() => void move(task, 'today', 'Today')}>← Today</button>}
    </div>
  </li>;
  const list = (name: string, items: TaskRow[], key: 'today' | 'tomorrow' | 'later', empty: string) => <section className="task-list mor-list" aria-label={name}>
    <div className="ui-section-header"><h2>{name} <span className="task-count">{items.length}</span></h2></div>
    {items.length ? <ul>{items.map(task => row(task, key))}</ul> : <p className="small">{empty}</p>}
  </section>;

  return <div className="mor-plan">
    <div className="mor-header">
      <span className={`mor-friend mor-${shown}`} key={`${shown}-${moment.at}`} data-moment={shown}><Cast name="Mor" pose={POSE[shown]} size={64} title="Mor" /></span>
      <div className="mor-say">{noted ? <p className="mor-noted" role="status">{noted}</p> : <p className="small">{nothingLeft ? 'Nothing left for today.' : 'Your list for today.'}</p>}
        {average && <p className="small mor-average">{average} <button type="button" className="text-button" onClick={hideAverage}>Hide</button></p>}</div>
    </div>
    {runningTask && running && <section className="card mor-focus" aria-label="Focus">
      <span className="eyebrow">Working on</span><h2>{runningTask.title}</h2>
      <p className="mor-clock" aria-live="off">{(() => { const ms = focusElapsedMs(running, board.now); const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; })()}</p>
      <div className="sheet-actions"><button type="button" disabled={board.busy} onClick={() => void done(runningTask)}>Done</button><button type="button" className="secondary" disabled={board.busy} onClick={() => void stopForNow(runningTask)}>Stop for now</button></div>
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
    {toast && <p className="mor-toast" role="status">{toast.text} {toast.undo && <button type="button" className="text-button" onClick={toast.undo}>Undo</button>}</p>}
    {!toast && board.message && <p className="small" role="status">{board.message}</p>}
    {list('Today', todayRows, 'today', 'Add one thing you want to do.')}
    {doneRows.length > 0 && <details className="mor-done"><summary>Done <span className="task-count">{doneRows.length}</span></summary><ul>{doneRows.map(task => <li key={task.id} className="task-row ui-list-row"><span className="done-circle done-mark" aria-label="Done"><span aria-hidden="true">✓</span></span><button type="button" className="task-title-button" onClick={() => onDetail(task)}>{task.title}</button>{(task.actualMinutes ?? 0) > 0 && <span className="small">{minutes(task.actualMinutes!)}</span>}</li>)}</ul></details>}
    {list('Tomorrow', tomorrowRows, 'tomorrow', 'Nothing yet.')}
    {list('Later', laterRows, 'later', 'Nothing waiting.')}
  </div>;
}
