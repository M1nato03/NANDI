import type { TaskRow } from '../../data/types';

export function TaskList({ title, rows, onComplete, onMove, busy }: { title: string; rows: TaskRow[]; onComplete: (id: string) => void; onMove: (task: TaskRow) => void; busy: boolean }) {
  return <section className="task-list" aria-label={title}><h2>{title} <span className="task-count">{rows.length}</span></h2>
    {rows.length === 0 ? <p className="small">Nothing here yet.</p> : <ul>{rows.map((task) => <li className="task-row" key={task.id}>
      <div className="task-row-main"><strong>{task.title}</strong><span className="small">{task.mustOrCould === 'must' ? 'Must' : 'Could'} · {task.estimateMin ?? 0} min{task.scheduledStart ? ` · ${new Date(task.scheduledStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}{task.postponeCount ? ` · moved ${task.postponeCount}×` : ''}</span>{task.firstStep && <span className="small">First: {task.firstStep}</span>}</div>
      <div className="task-row-actions"><button type="button" disabled={busy} onClick={() => onComplete(task.id)}>Done</button><button type="button" className="secondary" disabled={busy} onClick={() => onMove(task)}>{task.status === 'someday' ? 'Plan' : 'Move'}</button></div>
    </li>)}</ul>}</section>;
}
