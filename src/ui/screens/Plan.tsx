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

export function Plan({ questId }: { questId?: string }) {
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
  const complete = (id: string) => { void board.act(async (repos, now) => {
    for (const focus of board.focus.filter(row => row.taskId === id && row.endedAt == null)) await repos.finishFocus(focus.id, now);
    await repos.completeTask(id, now);
  }, 'Task done.'); };
  const dropGroup = (id: string) => { void board.act((repos, now) => repos.dropTask(id, now), 'Split task dropped.'); };
  const listProps = { onComplete: complete, onMove: setMoving, onDropGroup: dropGroup, busy: board.busy };
  if (questId) return <section className="screen plan-screen"><SideQuests selectedId={questId} /></section>;
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
    <section className="plan-rituals" aria-label="Planning routines"><h2>Rituals</h2><div className="ritual-buttons"><button type="button" onClick={() => go('plan/morning')}>Morning plan<small>2 min</small></button><button type="button" onClick={() => go('plan/shutdown')}>Shutdown<small>5 min</small></button><button type="button" onClick={() => go('plan/review')}>Weekly review<small>Sundays</small></button></div></section>
    {moving && <PostponeSheet key={moving.id} task={moving} run={board.act} close={() => setMoving(null)} />}
  </section>;
}
