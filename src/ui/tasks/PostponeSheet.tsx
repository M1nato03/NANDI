import { useState } from 'react';
import type { TaskRow } from '../../data/types';
import type { PostponeReason, RealReason } from '../../core/tasks/postponeGate';
import { defaultSlot, splitEstimates } from './model';
import type { TaskRepos } from './useTaskBoard';
import { useModalFocus } from '../shell/useModalFocus';
import { errorMessage } from '../shell/errorMessage';
import { RULES } from '../../core/rules.config';
import { isActualPostpone } from '../../core/tasks/task-machine';
import { coreTask } from '../../data/repos/tasks';

type Run = (operation: (repos: TaskRepos, at: number) => Promise<unknown>, success?: string) => Promise<boolean>;
const reasons: PostponeReason[] = ['underestimated', 'blocked', 'low energy', 'avoided it'];
const realReasons: RealReason[] = ['class moved', 'illness', 'travel'];

function counts(task: TaskRow, next: number): boolean {
  try { return isActualPostpone(coreTask(task), next, Date.now()); } catch { return false; }
}
/** True when moving the task to this time would be its 4th counted move, which parks it in Someday instead. */
export function wouldPark(task: TaskRow, next: number): boolean {
  return (task.postponeCount ?? 0) + 1 >= RULES.tasks.postpone.autoSomedayAt && Number.isFinite(next) && counts(task, next);
}

export function PostponeSheet({ task, run, close, onMoved, notice = '', initialStart }: { task: TaskRow; run: Run; close: () => void; onMoved?: (newStart: number) => void; notice?: string; initialStart?: string }) {
  const dialog = useModalFocus<HTMLElement>(close);
  const [slot, setSlot] = useState(() => initialStart ?? defaultSlot(Math.max(Date.now(), task.scheduledStart ?? Date.now()) + 86_400_000));
  const [firstStep, setFirstStep] = useState(task.firstStep ?? '');
  const [reason, setReason] = useState<PostponeReason | ''>('');
  const [realReason, setRealReason] = useState<RealReason | ''>('');
  const [split, setSplit] = useState(false);
  const [parts, setParts] = useState<number[]>(() => splitEstimates(task.estimateMin ?? 0) ?? []);
  const [error, setError] = useState(notice);
  const count = task.postponeCount ?? 0;
  const choice = count === 2;
  const next = new Date(slot).getTime();
  // Item 83: the 4th counted move parks the task in Someday whatever date is picked, so the button says so.
  const toSomeday = !choice && wouldPark(task, next);
  // A refusal from the rules shows here, next to Save, not on the screen behind the sheet (item 83).
  async function save(operation: Parameters<Run>[0], success: string): Promise<boolean> {
    let failure = '';
    const ok = await run(async (repos, at) => { try { return await operation(repos, at); } catch (caught) { failure = errorMessage(caught); throw caught; } }, success);
    if (!ok) setError(failure || 'That did not save. Try again.');
    return ok;
  }
  async function move(action: 'anyway' | 'someday' | 'do10' | 'real' | 'normal') {
    if ((action === 'normal' || action === 'anyway' || action === 'real') && !Number.isFinite(next)) { setError('Pick a date and time.'); return; }
    if ((action === 'normal' || action === 'anyway') && count >= 1 && !toSomeday && !firstStep.trim()) { setError('Add a first step of 10 minutes or less.'); return; }
    if (action === 'anyway' && !reason) { setError('Pick a quick reason.'); return; }
    if (action === 'real' && !realReason) { setError('Pick what changed.'); return; }
    setError('');
    const ok = await save((repos, now) => repos.postpone(task.id, now, {
      newStart: action === 'someday' || action === 'do10' ? null : next,
      choice: action === 'anyway' || action === 'someday' || action === 'do10' ? action : undefined,
      firstStep: firstStep.trim() || undefined,
      reason: reason || undefined,
      realReason: action === 'real' ? realReason || undefined : undefined,
    }), action === 'do10' ? 'Focus started.' : 'Plan updated.');
    if (ok) { close(); if (task.checkpointOf && Number.isFinite(next) && action !== 'someday' && action !== 'do10') onMoved?.(next); }
  }
  async function saveSplit() {
    if (parts.length < 2 || parts.some((part) => part < 25 || part > 60) || parts.reduce((sum, part) => sum + part, 0) !== task.estimateMin) {
      setError('Use 2 or more steps of 25 to 60 minutes that add up to the estimate.'); return;
    }
    if (await save((repos, now) => repos.split(task.id, now, parts.length, parts, reason || undefined), 'Split into smaller steps.')) close();
  }
  return <div className="sheet-backdrop" onClick={close}>
    <section ref={dialog} tabIndex={-1} className="task-sheet" role="dialog" aria-modal="true" aria-label={`Move ${task.title}`} onClick={(event) => event.stopPropagation()}>
      <div className="sheet-heading"><h2>{choice ? 'This one keeps slipping' : count === 1 ? 'Make it smaller' : 'Move task'}</h2><button type="button" className="secondary" onClick={close} aria-label="Close move task">Close</button></div>
      <p className="sheet-task-title">{task.title}</p>
      <p>{choice ? 'Split it, do 10 minutes now, or park it in Someday. All fine.' : count === 1 ? 'First 10 minutes?' : 'When will you do it? Pick a time.'}</p>
      <label>First step {count < 1 && <span className="small">Optional for now</span>}<input maxLength={120} value={firstStep} onChange={(event) => setFirstStep(event.target.value)} placeholder="A step of 10 minutes or less" /></label>
      {!split && <><label>New date and time <input type="datetime-local" value={slot} onChange={(event) => setSlot(event.target.value)} /></label>
        <fieldset><legend>Quick reason {count < 2 && <span className="small">Optional unless the weekly budget is full</span>}</legend>{reasons.map((item) => <label key={item}><input type="radio" name="postpone-reason" checked={reason === item} onChange={() => setReason(item)} /> {item}</label>)}</fieldset>
        <div className="sheet-actions">{choice ? <><button type="button" onClick={() => setSplit(true)}>Split into steps</button><button type="button" className="secondary" onClick={() => void move('do10')}>Do 10 min now</button><button type="button" className="secondary" onClick={() => void move('someday')}>Move to Someday</button><button type="button" className="text-button" onClick={() => void move('anyway')}>Postpone anyway</button></> : <button type="button" onClick={() => void move('normal')}>{toSomeday ? 'Move to Someday' : 'Save new time'}</button>}</div>
        {toSomeday && <p className="small postpone-someday-note">This would be its 4th move, so it rests in Someday instead of the new date. Plan it again from Later whenever you like.</p>}
        <details><summary>Schedule changed for a real reason?</summary><fieldset><legend>What changed?</legend>{realReasons.map((item) => <label key={item}><input type="radio" name="real-reason" checked={realReason === item} onChange={() => setRealReason(item)} /> {item}</label>)}</fieldset><button type="button" className="secondary" onClick={() => void move('real')}>Move with reason</button></details>
        {!choice && <button type="button" className="text-button" onClick={() => setSplit(true)}>Split task</button>}
      </>}
      {split && <div><h3>Split into steps</h3><fieldset><legend>Quick reason <span className="small">Needed only when this week's moves are used up</span></legend>{reasons.map((item) => <label key={item}><input type="radio" name="split-reason" checked={reason === item} onChange={() => setReason(item)} /> {item}</label>)}</fieldset>{parts.length ? parts.map((part, index) => <label key={index}>Step {index + 1} minutes <input type="number" min="25" max="60" value={part} onChange={(event) => setParts(parts.map((value, position) => position === index ? Number(event.target.value) : value))} /></label>) : <p>This estimate is too small to split into 25 minute steps.</p>}<div className="sheet-actions"><button type="button" disabled={!parts.length} onClick={() => void saveSplit()}>Save split</button><button type="button" className="secondary" onClick={() => setSplit(false)}>Previous step</button></div></div>}
      {error && <p role="alert">{error}</p>}
    </section>
  </div>;
}
