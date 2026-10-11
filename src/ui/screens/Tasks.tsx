import { useState } from 'react';
import type { TaskRow } from '../../data/types';
import { dayKey } from '../../core/time/dayKey';
import { TaskQuickAdd } from '../tasks/TaskQuickAdd';
import { TaskList } from '../tasks/TaskList';
import { PostponeSheet } from '../tasks/PostponeSheet';
import { taskGroups } from '../tasks/model';
import { useTaskBoard } from '../tasks/useTaskBoard';
import { go } from '../shell/router';
import '../tasks/tasks.css';
import { SideQuests } from '../quests/SideQuests';

export function Tasks() {
  const board = useTaskBoard();
  const [moving, setMoving] = useState<TaskRow | null>(null);
  const groups = taskGroups(board.tasks);
  const today = dayKey(board.now);
  const planned = groups.filter((group) => group.placement === 'planned' && group.dayKey === today).sort((a, b) => (a.scheduledStart ?? 0) - (b.scheduledStart ?? 0));
  const upcoming = groups.filter((group) => group.placement === 'planned' && group.dayKey > today).sort((a, b) => (a.scheduledStart ?? 0) - (b.scheduledStart ?? 0));
  const unplaced = groups.filter((group) => group.placement === 'unplaced');
  const someday = groups.filter((group) => group.placement === 'someday');
  const complete = (id: string) => { void board.act(async (repos, now) => {
    for (const focus of board.focus.filter((row) => row.taskId === id && row.endedAt == null)) await repos.finishFocus(focus.id, now);
    await repos.completeTask(id, now);
  }, 'Task done.'); };
  const dropGroup = (id: string) => { void board.act((repos, now) => repos.dropTask(id, now), 'Split task dropped.'); };
  return <section className="screen"><p className="eyebrow">Your plan</p><h1>Tasks</h1>
    <div className="planner-nav"><button type="button" className="secondary" onClick={() => go('tasks/plan')}>Morning plan</button><button type="button" className="secondary" onClick={() => go('tasks/shutdown')}>Shutdown</button><button type="button" className="secondary" onClick={() => go('tasks/review')}>Weekly review</button></div>
    <TaskQuickAdd run={board.act} />
    {board.message && <p role="status">{board.message}</p>}
    <SideQuests />
    <TaskList title="Today" groups={planned} onComplete={complete} onMove={setMoving} onDropGroup={dropGroup} busy={board.busy} />
    <TaskList title="Upcoming" groups={upcoming} onComplete={complete} onMove={setMoving} onDropGroup={dropGroup} busy={board.busy} />
    <TaskList title="Unplaced" groups={unplaced} onComplete={complete} onMove={setMoving} onDropGroup={dropGroup} busy={board.busy} />
    <TaskList title="Someday" groups={someday} onComplete={complete} onMove={setMoving} onDropGroup={dropGroup} busy={board.busy} />
    {moving && <PostponeSheet key={moving.id} task={moving} run={board.act} close={() => setMoving(null)} />}
  </section>;
}
