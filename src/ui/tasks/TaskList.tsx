import { useState, type ReactNode } from 'react';
import type { TaskRow } from '../../data/types';
import { taskGroups, type TaskGroup } from './model';

export function GroupRow({ group, children, onDrop, busy }: { group: TaskGroup; children: ReactNode; onDrop: (id: string) => void; busy: boolean }) {
  const [confirm, setConfirm] = useState(false);
  return <li className="task-row task-group"><details><summary><strong>{group.parent.title}</strong> · {group.done} of {group.total} steps done</summary>{children}</details>
    {confirm ? <div className="task-row-actions"><span>Drop this task and its remaining steps?</span><button type="button" disabled={busy} onClick={() => { onDrop(group.parent.id); setConfirm(false); }}>Confirm drop</button><button type="button" className="secondary" onClick={() => setConfirm(false)}>Cancel</button></div> : <button type="button" className="secondary" disabled={busy} onClick={() => setConfirm(true)}>Drop whole task</button>}
  </li>;
}

export function TaskList({ title, groups, onComplete, onMove, onDropGroup, busy, nextId }: { title: string; groups: TaskGroup[]; onComplete: (id: string) => void; onMove: (task: TaskRow) => void; onDropGroup: (id: string) => void; busy: boolean; nextId?: string }) {
  const row = (task: TaskRow) => <li className="task-row" key={task.id}>
    <div className="task-row-main"><strong>{task.title}</strong>{task.id === nextId && <span className="pill">Next</span>}<span className="small">{task.mustOrCould === 'must' ? 'Must' : 'Could'} · {task.estimateMin ?? 0} min{task.scheduledStart ? ` · ${new Date(task.scheduledStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}{task.postponeCount ? ` · moved ${task.postponeCount}×` : ''}</span>{task.firstStep && <span className="small">First: {task.firstStep}</span>}</div>
    {task.status !== 'done' && task.status !== 'dropped' ? <div className="task-row-actions"><button type="button" className="done-circle" aria-label="Done" disabled={busy} onClick={() => onComplete(task.id)}><span aria-hidden="true">✓</span></button><button type="button" className="secondary" disabled={busy} onClick={() => onMove(task)}>{task.status === 'someday' ? 'Plan' : 'Move'}</button></div> : task.status === 'done' ? <span className="done-circle done-mark" aria-label="Done"><span aria-hidden="true">✓</span></span> : null}
  </li>;
  return <section className="task-list" aria-label={title}><h2>{title} <span className="task-count">{groups.length}</span></h2>
    {groups.length === 0 ? <p className="small">{title === 'Today' ? 'A little room for your next step.' : 'Nothing waiting here right now.'}</p> : <ul>{groups.map((group) => group.total ? <GroupRow key={group.parent.id} group={group} onDrop={onDropGroup} busy={busy}><ul>{group.steps.map(row)}</ul></GroupRow> : row(group.parent))}</ul>}</section>;
}

export function GroupedSteps({ all, selected, render, onDropGroup, busy }: { all: TaskRow[]; selected: TaskRow[]; render: (task: TaskRow) => ReactNode; onDropGroup: (id: string) => void; busy: boolean }) {
  const byParent = new Map(taskGroups(all).map((group) => [group.parent.id, group]));
  const seen = new Set<string>();
  return <ul className="planner-list">{selected.map((task) => {
    if (!task.parentId) return <li key={task.id} className="planner-item">{render(task)}</li>;
    if (seen.has(task.parentId)) return null;
    seen.add(task.parentId);
    const group = byParent.get(task.parentId);
    if (!group) return <li key={task.id} className="planner-item">{render(task)}</li>;
    return <GroupRow key={group.parent.id} group={group} onDrop={onDropGroup} busy={busy}><ul className="planner-list">{group.steps.map((step) => <li key={step.id} className="planner-item">{selected.some((item) => item.id === step.id) ? render(step) : <><strong>{step.title}</strong><span className="small">{step.status}</span></>}</li>)}</ul></GroupRow>;
  })}</ul>;
}
