import { useState } from 'react';
import type { FocusRow, TaskEventRow, TaskRow } from '../../data/types';
import { calibration, calibratedMinutes, proposeCheckpoints } from '../../core/tasks/complete';
import type { TaskRepos } from './useTaskBoard';
import { useModalFocus } from '../shell/useModalFocus';
import { REPEATS, type Repeat } from '../../core/tasks/repeat';

type Run = (operation: (repos: TaskRepos, at: number) => Promise<unknown>, success?: string) => Promise<boolean>;
const categories = ['general', 'study', 'project', 'admin', 'personal', 'trading', 'health'];
export function TaskDetail({ task, tasks, focus, events, run, close, move }: { task: TaskRow; tasks: TaskRow[]; focus: FocusRow[]; events: TaskEventRow[]; run: Run; close: () => void; move: () => void }) {
  const dialog = useModalFocus<HTMLElement>(close);
  const [title, setTitle] = useState(task.title);
  const [estimate, setEstimate] = useState(task.estimateMin ?? 30);
  const [priority, setPriority] = useState(task.mustOrCould ?? 'could');
  const [category, setCategory] = useState(task.category || 'general');
  const [place, setPlace] = useState(task.place ?? '');
  const [firstStep, setFirstStep] = useState(task.firstStep ?? '');
  const [repeat, setRepeat] = useState<Repeat | ''>(task.repeat ?? '');
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [proposal, setProposal] = useState(false);
  const [error, setError] = useState('');
  const calibrated = calibration(tasks, focus, category);
  const availableCategories = categories.includes(category) ? categories : [...categories, category];
  const checkpoints = tasks.filter(row => row.checkpointOf === task.id && !row.deleted);
  const proposed = proposeCheckpoints(task, Date.now()); // eslint-disable-line react-hooks/purity
  const history = events.filter(event => event.taskId === task.id && (event.kind === 'postponed' || event.kind === 'realReasonMove')).sort((a, b) => a.at - b.at);
  const subtasks = tasks.filter(row => row.parentId === task.id && !row.deleted);
  async function save() {
    const ok = await run((repos, now) => repos.editTask(task.id, { title, estimateMin: estimate, mustOrCould: priority, category, place, firstStep, repeat: repeat || undefined }, now), 'Task saved.');
    if (ok) close(); else setError(priority === 'must' ? 'If this makes four Musts, make it a Could.' : 'Check the task details.');
  }
  return <div className="sheet-backdrop" onClick={close}><section ref={dialog} tabIndex={-1} className="task-sheet" role="dialog" aria-modal="true" aria-label={`Task detail ${task.title}`} onClick={event => event.stopPropagation()}>
    <div className="sheet-heading"><h2>Task detail</h2><button type="button" className="secondary" onClick={close}>Close</button></div>
    <label>Title <input value={title} maxLength={160} onChange={event => setTitle(event.target.value)} /></label>
    <label>Estimate in minutes <input type="number" min="1" max="90" value={estimate} onChange={event => setEstimate(Number(event.target.value))} /></label>
    {calibrated && <p className="small">Your {category} tasks usually take about {calibrated.ratio.toFixed(1)}x the estimate. <button type="button" className="text-button" onClick={() => setEstimate(calibratedMinutes(estimate, calibrated.ratio))}>Use {calibratedMinutes(estimate, calibrated.ratio)} min</button>?</p>}
    <label>Priority <select value={priority} onChange={event => setPriority(event.target.value as 'must' | 'could')}><option value="could">Could</option><option value="must">Must</option></select></label>
    <label>Category <select value={category} onChange={event => setCategory(event.target.value)}>{availableCategories.map(item => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}</select></label>
    <label>Place <input value={place} onChange={event => setPlace(event.target.value)} /></label>
    <label>First step <input maxLength={120} value={firstStep} onChange={event => setFirstStep(event.target.value)} /></label>
    <label>Repeat <select value={repeat} onChange={event => setRepeat(event.target.value as Repeat | '')}><option value="">Does not repeat</option>{REPEATS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    {error && <p role="alert">{error} <button type="button" className="secondary" onClick={() => setPriority('could')}>Make it a Could</button></p>}
    <div className="sheet-actions"><button type="button" onClick={() => void save()}>Save task</button><button type="button" className="secondary" onClick={move}>Another day…</button></div>
    {history.length > 0 && <section><h3>History</h3>{history.map(event => <p className="small" key={event.id}>{new Date(event.at).toLocaleDateString()} · {event.kind === 'realReasonMove' ? 'Moved for a real reason' : 'Moved'}{event.reason ? ` · ${event.reason}` : ''}</p>)}</section>}
    {subtasks.length > 0 && <section><h3>Steps</h3>{subtasks.map(row => <p key={row.id}>{row.title} · {row.status}</p>)}</section>}
    {proposed.length > 0 && checkpoints.length === 0 && <section><button type="button" className="secondary" onClick={() => setProposal(true)}>Add checkpoints</button>{proposal && <><p>Make room for smaller steps before the due date.</p>{proposed.map(item => <p key={item.scheduledStart}>{item.title} · {new Date(item.scheduledStart).toLocaleDateString()}</p>)}<button type="button" onClick={() => void run((repos, now) => repos.addCheckpoints(task.id, proposed, now), 'Checkpoints added.').then(ok => { if (ok) close(); })}>Accept checkpoints</button></>}</section>}
    <div className="sheet-actions"><button type="button" className="secondary" onClick={move}>Split</button>{confirmDrop ? <><button type="button" onClick={() => void run((repos, now) => repos.dropTask(task.id, now), 'Task dropped.').then(ok => { if (ok) close(); })}>Confirm drop</button><button type="button" className="secondary" onClick={() => setConfirmDrop(false)}>Cancel</button></> : <button type="button" className="secondary" onClick={() => setConfirmDrop(true)}>Drop</button>}</div>
  </section></div>;
}
