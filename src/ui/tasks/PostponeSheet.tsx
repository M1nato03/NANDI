import { useState } from 'react';
import type { TaskRow } from '../../data/types';
import { dayKey } from '../../core/time/dayKey';
import { splitEstimates } from './model';
import type { TaskRepos } from './useTaskBoard';
import type { MoveSnapshot, MoveTarget } from '../../data/repos/tasks';
import { useModalFocus } from '../shell/useModalFocus';
import { errorMessage } from '../shell/errorMessage';

type Run = (operation: (repos: TaskRepos, at: number) => Promise<unknown>, success?: string) => Promise<boolean>;

/**
 * Spec 27: the move sheet never refuses. Tomorrow and Later move at once; "Another day" takes a date and an
 * optional time. After three moves it offers, and only offers, a smaller version or Later.
 */
export function PostponeSheet({ task, run, close, onMoved, onUndoable }: { task: TaskRow; run: Run; close: () => void; onMoved?: (newStart: number) => void; onUndoable?: (task: TaskRow, before: MoveSnapshot, where: string) => void }) {
  const dialog = useModalFocus<HTMLElement>(close);
  const [day, setDay] = useState(() => { const tomorrow = dayKey(new Date(`${dayKey(Date.now())}T12:00:00`).getTime() + 86_400_000); return task.dayKey > tomorrow ? task.dayKey : tomorrow; });
  const [time, setTime] = useState('');
  const [error, setError] = useState('');
  const parts = splitEstimates(task.estimateMin ?? 0);
  const moved = (task.postponeCount ?? 0) >= 3;
  async function move(target: MoveTarget, where: string) {
    let before: MoveSnapshot | undefined, failure = '';
    const ok = await run(async (repos, now) => { try { before = await repos.moveTask(task.id, now, target); } catch (caught) { failure = errorMessage(caught); throw caught; } }, `Moved to ${where}.`);
    if (!ok) { setError(failure || 'That did not save. Try again.'); return; }
    close();
    if (before) onUndoable?.(task, before, where);
    // A moved checkpoint offers to re-space the rest; with no time picked it counts from 9:00 that day.
    if (task.checkpointOf && typeof target === 'object') onMoved?.(target.start ?? new Date(`${target.day}T09:00:00`).getTime());
  }
  function another() {
    if (!day) { setError('Pick a day.'); return; }
    const start = time ? new Date(`${day}T${time}`).getTime() : undefined;
    if (start != null && !Number.isFinite(start)) { setError('Pick a time, or leave it empty.'); return; }
    const key = start != null ? dayKey(start) : day;
    void move({ day: key, start }, new Date(`${key}T12:00:00`).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }));
  }
  async function split() {
    if (!parts) return;
    if (await run((repos, now) => repos.split(task.id, now, parts.length, parts, 'underestimated'), 'Split into smaller steps.')) close();
  }
  return <div className="sheet-backdrop" onClick={close}>
    <section ref={dialog} tabIndex={-1} className="task-sheet" role="dialog" aria-modal="true" aria-label={`Move ${task.title}`} onClick={(event) => event.stopPropagation()}>
      <div className="sheet-heading"><h2>Move task</h2><button type="button" className="secondary" onClick={close} aria-label="Close move task">Close</button></div>
      <p className="sheet-task-title">{task.title}</p>
      <div className="sheet-actions"><button type="button" onClick={() => void move('tomorrow', 'Tomorrow')}>Tomorrow</button><button type="button" className="secondary" onClick={() => void move('later', 'Later')}>Later</button></div>
      <fieldset className="move-another"><legend>Another day</legend>
        <label>Day <input type="date" value={day} onChange={(event) => setDay(event.target.value)} /></label>
        <label>Time <span className="small">Optional</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
        <p className="small">Times before 4 am count as the night before.</p>
        <button type="button" className="secondary" onClick={another}>Move to this day</button>
      </fieldset>
      {moved && <p className="small move-offer">This one has moved a few times.{parts ? <> <button type="button" className="text-button" onClick={() => void split()}>Make it smaller?</button></> : null} <button type="button" className="text-button" onClick={() => void move('later', 'Later')}>Move it to Later?</button></p>}
      {!moved && parts && <button type="button" className="text-button" onClick={() => void split()}>Split into smaller steps</button>}
      {error && <p role="alert">{error}</p>}
    </section>
  </div>;
}
