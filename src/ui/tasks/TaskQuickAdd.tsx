import { REPEATS, type Repeat } from '../../core/tasks/repeat';
import { useState, type FormEvent } from 'react';
import { RULES } from '../../core/rules.config';
import type { TaskRow, FocusRow } from '../../data/types';
import { calibration, calibratedMinutes } from '../../core/tasks/complete';
import { dayKey } from '../../core/time/dayKey';
import { defaultSlot, splitEstimates, splitPreview, type SplitPlacement } from './model';
import type { TaskRepos } from './useTaskBoard';
import { useModalFocus } from '../shell/useModalFocus';
import { askNotificationsOnce } from '../../platform/notifyPermission';

type Run = (operation: (repos: TaskRepos, at: number) => Promise<unknown>, success?: string) => Promise<boolean>;

export function TaskQuickAdd({ run, tasks = [], focus = [], label = 'Add a task' }: { run: Run; tasks?: TaskRow[]; focus?: FocusRow[]; label?: string }) {
  const [title, setTitle] = useState('');
  const [size, setSize] = useState<'S' | 'M' | 'L'>('M');
  const [estimate, setEstimate] = useState('30');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState<'must' | 'could'>('could');
  const [schedule, setSchedule] = useState<'today' | 'unplaced' | 'someday'>('today');
  const [repeat, setRepeat] = useState<Repeat | ''>('');
  const [slot, setSlot] = useState(() => defaultSlot(Date.now()));
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [preview, setPreview] = useState<{ title: string; total: number; priority: 'must' | 'could'; placement: SplitPlacement; scheduledStart?: number; count: number; names: string[] } | null>(null);
  const dialog = useModalFocus<HTMLElement>(() => setPreview(null));
  const parsed = title.trim().match(/^(.*?)\s+(\d+)(m|h)$/i);
  const taskTitle = parsed ? (parsed[1] ?? '').trim() : title.trim();
  const taskMinutes = parsed ? Number(parsed[2]) * (parsed[3]?.toLowerCase() === 'h' ? 60 : 1) : Number(estimate);
  const calibrated = calibration(tasks, focus, category);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const trimmed = taskTitle;
    const count = taskMinutes;
    if (!trimmed || !Number.isInteger(count) || count <= 0) { setFeedback('Add a title and a whole-minute estimate.'); return; }
    const scheduledStart = schedule === 'today' ? new Date(slot).getTime() : undefined;
    if (schedule === 'today' && (!Number.isFinite(scheduledStart) || Number.isNaN(scheduledStart))) { setFeedback('Pick a date and time.'); return; }
    const parts = count > RULES.tasks.maxEstimateMin ? splitEstimates(count) : null;
    if (count > RULES.tasks.maxEstimateMin && !parts) { setFeedback('Try an estimate that can split into 25 to 60 minute steps.'); return; }
    if (parts) {
      const draft = splitPreview(trimmed, count, priority, schedule, scheduledStart, parts.length);
      if (draft) setPreview({ title: trimmed, total: count, priority, placement: schedule, scheduledStart, count: parts.length, names: draft.steps.map((step) => step.title) });
      return;
    }
    setSubmitting(true);
    try {
      const ok = await run(async (repos, now) => {
          const task = await repos.createTask({ title: trimmed, size, estimateMin: count, mustOrCould: priority, category, scheduledStart, dayKey: dayKey(scheduledStart ?? now), ...(repeat && schedule === 'today' ? { repeat } : {}) }, now);
          if (schedule === 'someday') await repos.postpone(task.id, now + 1, { newStart: null, choice: 'someday', baselineWeek: true });
        }, 'Task added.');
      if (ok) { setTitle(''); setRepeat(''); setOpen(false); setFeedback(''); if (scheduledStart !== undefined) void askNotificationsOnce().catch(() => undefined); }
    } finally {
      setSubmitting(false);
    }
  }
  async function savePreview() {
    if (!preview || submitting) return;
    const parts = splitEstimates(preview.total, preview.count);
    if (!parts || preview.names.some((name) => !name.trim())) { setFeedback('Name every step.'); return; }
    setSubmitting(true);
    try {
      const ok = await run((repos, now) => repos.createSplitTask(preview.title, parts, now, preview.scheduledStart, { titles: preview.names, priority: preview.priority, placement: preview.placement, category }), 'Split task saved.');
      if (ok) { setPreview(null); setTitle(''); setOpen(false); setFeedback(''); if (preview.scheduledStart !== undefined) void askNotificationsOnce().catch(() => undefined); }
    } finally { setSubmitting(false); }
  }
  const counts = preview ? Array.from({ length: Math.floor(preview.total / 25) - 1 }, (_, index) => index + 2).filter((count) => splitEstimates(preview.total, count)) : [];
  const previewParts = preview ? splitEstimates(preview.total, preview.count) : null;
  return <div className="quick-add">
    <label className="quick-add-field">{label}<input form="plan-add-form" required maxLength={160} value={title} onFocus={() => setOpen(true)} onChange={(event) => { setTitle(event.target.value); setOpen(true); }} onBlur={() => { if (parsed) { setTitle(taskTitle); setEstimate(String(taskMinutes)); } }} placeholder="Add a task, e.g. call bank 15m" /></label>
    {open && <form id="plan-add-form" className="card task-form" onSubmit={(event) => void submit(event)}>
      <h2>Task details</h2>
      {parsed && <p className="small">{taskMinutes} minutes picked up from your task.</p>}
      <div className="task-form-grid"><label>Size <select value={size} onChange={(event) => { const value = event.target.value as typeof size; setSize(value); setEstimate(value === 'S' ? '15' : value === 'M' ? '30' : '60'); }}><option value="S">Small</option><option value="M">Medium</option><option value="L">Large</option></select></label>
      <label>Minutes <input type="number" min="1" max="600" inputMode="numeric" value={estimate} onChange={(event) => setEstimate(event.target.value)} /></label></div>
      <label>Category <select value={category} onChange={event => setCategory(event.target.value)}>{['general', 'study', 'project', 'admin', 'personal', 'trading', 'health'].map(item => <option key={item}>{item}</option>)}</select></label>
      {calibrated && <p className="small">Your {category} tasks usually take about {calibrated.ratio.toFixed(1)}x the estimate. <button type="button" className="text-button" onClick={() => setEstimate(String(calibratedMinutes(taskMinutes, calibrated.ratio)))}>Use {calibratedMinutes(taskMinutes, calibrated.ratio)} min</button>?</p>}
      <fieldset><legend>Priority</legend><label><input type="radio" name="priority" checked={priority === 'could'} onChange={() => setPriority('could')} /> Could</label><label><input type="radio" name="priority" checked={priority === 'must'} onChange={() => setPriority('must')} /> Must</label></fieldset>
      <fieldset><legend>Place it</legend><label><input type="radio" name="schedule" checked={schedule === 'today'} onChange={() => setSchedule('today')} /> Today / time</label><label><input type="radio" name="schedule" checked={schedule === 'unplaced'} onChange={() => setSchedule('unplaced')} /> Unplaced</label><label><input type="radio" name="schedule" checked={schedule === 'someday'} onChange={() => setSchedule('someday')} /> Someday</label></fieldset>
      {schedule === 'today' && <label>Repeat <select value={repeat} onChange={(event) => setRepeat(event.target.value as Repeat | '')}><option value="">Does not repeat</option>{REPEATS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
      {schedule === 'today' && <label>Start time <input type="datetime-local" required value={slot} onChange={(event) => setSlot(event.target.value)} /></label>}
      <button type="submit" disabled={submitting}>{submitting ? 'Adding task…' : 'Add task'}</button>{feedback && <p role="alert">{feedback}</p>}
    </form>}
    {preview && previewParts && <div className="sheet-backdrop"><section ref={dialog} tabIndex={-1} className="task-sheet" role="dialog" aria-modal="true" aria-label="Split preview">
      <h2>Split preview</h2><p>This is big. It will be saved as {preview.count} steps of about {Math.round(preview.total / preview.count)} min.</p>
      <label>Number of steps <select value={preview.count} onChange={(event) => {
        const count = Number(event.target.value);
        const draft = splitPreview(preview.title, preview.total, preview.priority, preview.placement, preview.scheduledStart, count);
        const previous = splitPreview(preview.title, preview.total, preview.priority, preview.placement, preview.scheduledStart, preview.count);
        if (draft) setPreview({ ...preview, count, names: draft.steps.map((step, index) => !preview.names[index] || preview.names[index] === previous?.steps[index]?.title ? step.title : preview.names[index]) });
      }}>{counts.map((count) => <option key={count} value={count}>{count} steps</option>)}</select></label>
      {previewParts.map((minutes, index) => <label key={index}>Step {index + 1} name <input required maxLength={200} value={preview.names[index] ?? ''} onChange={(event) => setPreview({ ...preview, names: preview.names.map((name, at) => at === index ? event.target.value : name) })} /><span className="small">{minutes} min · {preview.priority === 'must' ? 'Must' : 'Could'} · {preview.placement === 'someday' ? 'Someday' : preview.placement === 'today' && index === 0 ? 'Today at a time' : 'Unplaced'}</span></label>)}
      {feedback && <p role="alert">{feedback}</p>}
        <div className="sheet-actions"><button type="button" disabled={submitting} onClick={() => void savePreview()}>Save</button><button type="button" className="secondary" disabled={submitting} onClick={() => { setPreview(null); setFeedback(''); }}>Edit task</button></div>
    </section></div>}
  </div>;
}
