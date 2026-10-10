import { useState } from 'react';
import type { TaskRow } from '../../data/types';
import { dayKey } from '../../core/time/dayKey';
import { TaskQuickAdd } from '../tasks/TaskQuickAdd';
import { TaskList } from '../tasks/TaskList';
import { PostponeSheet } from '../tasks/PostponeSheet';
import { visibleTasks } from '../tasks/model';
import { useTaskBoard } from '../tasks/useTaskBoard';
import '../tasks/tasks.css';

export function Tasks() {
  const board = useTaskBoard();
  const [moving, setMoving] = useState<TaskRow | null>(null);
  const rows = visibleTasks(board.tasks);
  const today = dayKey(board.now);
  const planned = rows.filter((task) => task.status === 'planned' && task.dayKey === today).sort((a, b) => (a.scheduledStart ?? 0) - (b.scheduledStart ?? 0));
  const upcoming = rows.filter((task) => task.status === 'planned' && task.dayKey > today).sort((a, b) => (a.scheduledStart ?? 0) - (b.scheduledStart ?? 0));
  const unplaced = rows.filter((task) => task.status === 'unplaced');
  const someday = rows.filter((task) => task.status === 'someday');
  const complete = (id: string) => { void board.act(async (repos, now) => {
    for (const focus of board.focus.filter((row) => row.taskId === id && row.endedAt == null)) await repos.finishFocus(focus.id, now);
    await repos.completeTask(id, now);
  }, 'Task done.'); };
  return <section className="screen"><p className="eyebrow">Your plan</p><h1>Tasks</h1>
    <TaskQuickAdd run={board.act} />
    {board.message && <p role="status">{board.message}</p>}
    <TaskList title="Today" rows={planned} onComplete={complete} onMove={setMoving} busy={board.busy} />
    <TaskList title="Upcoming" rows={upcoming} onComplete={complete} onMove={setMoving} busy={board.busy} />
    <TaskList title="Unplaced" rows={unplaced} onComplete={complete} onMove={setMoving} busy={board.busy} />
    <TaskList title="Someday" rows={someday} onComplete={complete} onMove={setMoving} busy={board.busy} />
    {moving && <PostponeSheet key={moving.id} task={moving} run={board.act} close={() => setMoving(null)} />}
  </section>;
}
