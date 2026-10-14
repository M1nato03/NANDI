import { useState } from 'react';
import type { TaskRow } from '../../data/types';
import { dayKey } from '../../core/time/dayKey';
import { SideQuests } from '../quests/SideQuests';
import { PostponeSheet } from '../tasks/PostponeSheet';
import { TaskList } from '../tasks/TaskList';
import { TaskQuickAdd } from '../tasks/TaskQuickAdd';
import { taskGroups, todayTasks } from '../tasks/model';
import { useTaskBoard } from '../tasks/useTaskBoard';
import { go } from '../shell/router';
import '../tasks/tasks.css';

export function Plan() {
  const board = useTaskBoard();
  const [moving, setMoving] = useState<TaskRow | null>(null);
  const groups = taskGroups(board.tasks).filter(group => group.placement !== 'dropped');
  const today = dayKey(board.now);
  const isToday = (group: typeof groups[number]) => (group.placement === 'planned' || group.placement === 'done') && group.dayKey === today || group.steps.some(step => step.dayKey === today && step.status === 'done');
  const todayGroups = groups.filter(isToday).sort((a, b) => (a.scheduledStart ?? 0) - (b.scheduledStart ?? 0));
  const remaining = groups.filter(group => !todayGroups.includes(group));
  const upcoming = remaining.filter(group => group.placement === 'planned');
  const unplaced = remaining.filter(group => group.placement === 'unplaced');
  const someday = remaining.filter(group => group.placement === 'someday');
  const nextId = todayTasks(board.tasks, board.now)[0]?.id;
  const complete = (id: string) => { void board.act((repos, now) => repos.completeTask(id, now), 'Task done.'); };
  const dropGroup = (id: string) => { void board.act((repos, now) => repos.dropTask(id, now), 'Split task dropped.'); };
  const listProps = { onComplete: complete, onMove: setMoving, onDropGroup: dropGroup, busy: board.busy };
  return <section className="screen plan-screen"><p className="eyebrow">Make room for what matters</p><h1>Plan</h1>
    <TaskQuickAdd run={board.act} />
    {board.message && <p role="status">{board.message}</p>}
    <TaskList title="Today" groups={todayGroups} nextId={nextId} {...listProps} />
    <SideQuests />
    <details className="later card"><summary><strong>Later</strong><span>Tap to see what is waiting. Nothing here is late.</span></summary>
      <TaskList title="Upcoming" groups={upcoming} {...listProps} />
      <TaskList title="Unplaced" groups={unplaced} {...listProps} />
      <TaskList title="Someday" groups={someday} {...listProps} />
    </details>
    <div className="plan-rituals" aria-label="Planning routines"><button type="button" className="text-button" onClick={() => go('plan/morning')}>Morning plan</button><button type="button" className="text-button" onClick={() => go('plan/shutdown')}>Shutdown</button><button type="button" className="text-button" onClick={() => go('plan/review')}>Weekly review</button></div>
    {moving && <PostponeSheet key={moving.id} task={moving} run={board.act} close={() => setMoving(null)} />}
  </section>;
}
