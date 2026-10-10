import { useState, type FormEvent } from 'react';
import { RULES } from '../../core/rules.config';
import { dayKey } from '../../core/time/dayKey';
import { defaultSlot, splitEstimates } from './model';
import type { TaskRepos } from './useTaskBoard';

type Run = (operation: (repos: TaskRepos, at: number) => Promise<unknown>, success?: string) => Promise<boolean>;

export function TaskQuickAdd({ run }: { run: Run }) {
  const [title, setTitle] = useState('');
  const [size, setSize] = useState<'S' | 'M' | 'L'>('M');
  const [estimate, setEstimate] = useState('30');
  const [priority, setPriority] = useState<'must' | 'could'>('could');
  const [schedule, setSchedule] = useState<'today' | 'unplaced' | 'someday'>('today');
  const [slot, setSlot] = useState(() => defaultSlot(Date.now()));
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const trimmed = title.trim();
    const count = Number(estimate);
    if (!trimmed || !Number.isInteger(count) || count <= 0) { setFeedback('Add a title and a whole-minute estimate.'); return; }
    const scheduledStart = schedule === 'today' ? new Date(slot).getTime() : undefined;
    if (schedule === 'today' && (!Number.isFinite(scheduledStart) || Number.isNaN(scheduledStart))) { setFeedback('Pick a date and time.'); return; }
    const parts = count > RULES.tasks.maxEstimateMin ? splitEstimates(count) : null;
    if (count > RULES.tasks.maxEstimateMin && !parts) { setFeedback('Try an estimate that can split into 25 to 60 minute steps.'); return; }
    setSubmitting(true);
    try {
      const ok = parts
        ? await run((repos, now) => repos.createSplitTask(trimmed, parts, now, scheduledStart), 'Added as smaller steps.')
        : await run(async (repos, now) => {
          const task = await repos.createTask({ title: trimmed, size, estimateMin: count, mustOrCould: priority, scheduledStart, dayKey: dayKey(scheduledStart ?? now) }, now);
          if (schedule === 'someday') await repos.postpone(task.id, now + 1, { newStart: null, choice: 'someday', baselineWeek: true });
        }, 'Task added.');
      if (ok) { setTitle(''); setOpen(false); setFeedback(''); }
    } finally {
      setSubmitting(false);
    }
  }
  return <div className="quick-add">
    <button type="button" className="quick-add-toggle" onClick={() => setOpen(!open)} aria-expanded={open} disabled={submitting}>{open ? 'Close quick add' : '+ Add task'}</button>
    {open && <form className="card task-form" onSubmit={(event) => void submit(event)}>
      <h2>Quick add</h2>
      <label>Task <input autoFocus required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs doing?" /></label>
      <div className="task-form-grid"><label>Size <select value={size} onChange={(event) => { const value = event.target.value as typeof size; setSize(value); setEstimate(value === 'S' ? '15' : value === 'M' ? '30' : '60'); }}><option value="S">Small</option><option value="M">Medium</option><option value="L">Large</option></select></label>
      <label>Minutes <input type="number" min="1" max="600" inputMode="numeric" value={estimate} onChange={(event) => setEstimate(event.target.value)} /></label></div>
      <fieldset><legend>Priority</legend><label><input type="radio" name="priority" checked={priority === 'could'} onChange={() => setPriority('could')} /> Could</label><label><input type="radio" name="priority" checked={priority === 'must'} onChange={() => setPriority('must')} /> Must</label></fieldset>
      <fieldset><legend>Place it</legend><label><input type="radio" name="schedule" checked={schedule === 'today'} onChange={() => setSchedule('today')} /> Today / time</label><label><input type="radio" name="schedule" checked={schedule === 'unplaced'} onChange={() => setSchedule('unplaced')} /> Unplaced</label><label><input type="radio" name="schedule" checked={schedule === 'someday'} onChange={() => setSchedule('someday')} /> Someday</label></fieldset>
      {schedule === 'today' && <label>Start time <input type="datetime-local" required value={slot} onChange={(event) => setSlot(event.target.value)} /></label>}
      <button type="submit" disabled={submitting}>{submitting ? 'Adding task…' : 'Add task'}</button>{feedback && <p role="alert">{feedback}</p>}
    </form>}
  </div>;
}
