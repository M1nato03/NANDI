import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import type { TaskRow } from '../../data/types';
import { dayKey } from '../../core/time/dayKey';
import { chooseNowTask, needsFreshStart, steadyLine } from '../../core/tasks/complete';
import { dayHorizon, effectiveShutdown, suggestSlots } from '../../core/tasks/planner';
import { RULES } from '../../core/rules.config';
import { focusElapsedMs } from '../../core/tasks/focus';
import { SideQuests } from '../quests/SideQuests';
import { PostponeSheet } from '../tasks/PostponeSheet';
import { TaskList } from '../tasks/TaskList';
import { TaskQuickAdd } from '../tasks/TaskQuickAdd';
import { TaskDetail } from '../tasks/TaskDetail';
import { Reminders } from '../tasks/Reminders';
import { taskGroups, todayTasks } from '../tasks/model';
import { useTaskBoard } from '../tasks/useTaskBoard';
import { go } from '../shell/router';
import { DeckGlyph } from '../DeckGlyph';
import { MorningBackfill } from './MorningBackfill';
import { isAway } from '../../core/economy/away';
import { adaptiveNight, shiftOffKey } from '../../core/adaptive/day';
import '../tasks/tasks.css';
import { Cast } from '../cast/Cast';
import { CourtyardBanner } from '../courtyard/Courtyard';
import { StorybookCard } from '../courtyard/Storybook';

export function Plan({ questId }: { questId?: string }) {
  const board = useTaskBoard();
  const [moving, setMoving] = useState<TaskRow | null>(null);
  const [detail, setDetail] = useState<TaskRow | null>(null);
  const [pickMust, setPickMust] = useState(false);
  const [respace, setRespace] = useState<{ task: TaskRow; at: number } | null>(null);
  const logs = useLiveQuery(() => db.dailyLog.filter(row => row.deleted === 0).toArray(), []) ?? [];
  const settings = useLiveQuery(() => db.settings.filter(row => row.deleted === 0).toArray(), []) ?? [];
  const events = useLiveQuery(() => db.taskEvents.filter(row => row.deleted === 0).toArray(), []) ?? [];
  const groups = taskGroups(board.tasks).filter(group => group.placement !== 'dropped');
  const today = dayKey(board.now);
  const night = adaptiveNight(settings, board.tasks, today);
  const keepUsualNight = async () => { const now = Date.now(); await db.settings.put({ key: shiftOffKey(today), value: true, updatedAt: now, deleted: 0, deviceId: await getOrCreateDeviceId(db, now) }); }; // eslint-disable-line react-hooks/purity
  const awayToday = isAway(settings, today);
  const yesterday = dayKey(new Date(`${today}T12:00:00`).getTime() - 86_400_000);
  // Count only yesterday's facts through the dayKey index; the ledger grows every day.
  const yesterdayFacts = useLiveQuery(() => db.ledger.where('dayKey').equals(yesterday).filter(row => row.deleted === 0).count(), [yesterday]) ?? 0;
  const hadYesterday = logs.some(row => row.dayKey === yesterday) || yesterdayFacts > 0 || board.tasks.some(row => !row.deleted && (row.dayKey === yesterday || row.firstScheduledDayKey === yesterday || row.doneAt != null && dayKey(row.doneAt) === yesterday));
  const isToday = (group: typeof groups[number]) => (group.placement === 'planned' || group.placement === 'done') && group.dayKey === today || group.steps.some(step => step.dayKey === today && step.status === 'done');
  const todayGroups = groups.filter(isToday).sort((a, b) => (a.scheduledStart ?? 0) - (b.scheduledStart ?? 0));
  const remaining = groups.filter(group => !todayGroups.includes(group));
  const upcoming = remaining.filter(group => group.placement === 'planned');
  const unplaced = remaining.filter(group => group.placement === 'unplaced');
  const someday = remaining.filter(group => group.placement === 'someday');
  const nowTask = chooseNowTask(board.tasks, board.focus, board.now);
  const todayOpen = todayTasks(board.tasks, board.now);
  const nextId = nowTask?.id;
  const next = todayOpen.filter(task => task.id !== nowTask?.id).slice(0, 2);
  const taskFocus = board.focus.filter(row => row.taskId === nowTask?.id && row.endedAt == null).sort((a, b) => b.startedAt - a.startedAt)[0];
  const elapsed = taskFocus ? focusElapsedMs(taskFocus, board.now) : 0;
  const planned = (nowTask?.estimateMin ?? 0) * 60_000;
  const shutdown = settings.find(row => row.key === 'planner.shutdown')?.value;
  const bedtime = settings.find(row => row.key === 'planner.bedtime')?.value;
  const shutdownTime = effectiveShutdown(typeof shutdown === 'string' ? shutdown : RULES.night.defaultShutdown, typeof bedtime === 'string' ? bedtime : RULES.night.defaultBedtime);
  const dismissed = settings.find(row => row.key === 'planner.freshStartDismissed')?.value;
  const fresh = !awayToday && needsFreshStart(board.tasks, logs, today) && dismissed !== today;
  async function dismissFresh() { const at = board.now; await db.settings.put({ key: 'planner.freshStartDismissed', value: today, updatedAt: at, deleted: 0, deviceId: await getOrCreateDeviceId(db, at) }); }
  async function pinMust(task: TaskRow) {
    const occupied = todayOpen.filter(row => row.scheduledStart != null).map(row => ({ start: row.scheduledStart!, end: row.scheduledEnd ?? row.scheduledStart! + (row.estimateMin ?? 30) * 60_000 }));
    const slot = suggestSlots(board.now, task.estimateMin ?? 30, occupied).find(at => dayKey(at) === today);
    if (slot == null) return;
    const ok = await board.act(async (repos, at) => { if (task.status !== 'planned' || task.dayKey !== today) await repos.postpone(task.id, at, { newStart: slot }); await repos.setPriority(task.id, 'must', at); }, 'One Must picked.');
    if (ok) { await dismissFresh(); setPickMust(false); }
  }
  const complete = (id: string) => { void board.act(async (repos, now) => {
    for (const focus of board.focus.filter(row => row.taskId === id && row.endedAt == null)) await repos.finishFocus(focus.id, now);
    await repos.completeTask(id, now);
  }, 'Task done.'); };
  const dropGroup = (id: string) => { void board.act((repos, now) => repos.dropTask(id, now), 'Split task dropped.'); };
  const listProps = { onComplete: complete, onMove: setMoving, onDetail: setDetail, onDropGroup: dropGroup, busy: board.busy };
  if (questId) return <section className="screen plan-screen"><SideQuests selectedId={questId} /></section>;
  return <section className="screen plan-screen"><p className="eyebrow">Make room for what matters</p><div className="cast-inline"><h1>Plan</h1>{awayToday && <Cast name="Kachhua" pose="rest" size={48} title="Kachhua resting" />}</div><CourtyardBanner /><StorybookCard today={today} />{awayToday && <p>You're away. Rest well.</p>}{night.shift > 0 && <p className="small busy-day">Busy day: about {Math.round(night.plannedMinutes / 60)} h planned, so tonight starts {night.shift} min later (bedtime {night.bedtime}). <button type="button" className="text-button" onClick={() => void keepUsualNight()}>Keep my usual time</button></p>}<MorningBackfill today={today} now={board.now} logs={logs} hadYesterday={hadYesterday} />
    {fresh && <section className="card fresh-start" aria-label="Fresh start"><p>Yesterday didn't go to plan. That's data, not a verdict.</p><div className="sheet-actions"><button type="button" onClick={() => { void dismissFresh(); go('plan/morning'); }}>Plan today</button><button type="button" className="secondary" onClick={() => setPickMust(true)}>Pick one Must</button></div>{pickMust && <div>{board.tasks.filter(task => !task.deleted && task.status !== 'done' && task.status !== 'dropped' && !board.tasks.some(child => child.parentId === task.id && !child.deleted)).map(task => <button type="button" className="secondary fresh-choice" key={task.id} onClick={() => void pinMust(task)}>{task.title}</button>)}</div>}</section>}
    {nowTask && <section className="card plan-now-card" aria-label="Now card"><span className="eyebrow">Now</span><h2><button type="button" className="task-title-button" onClick={() => setDetail(nowTask)}>{nowTask.title}</button></h2>{nowTask.firstStep && <p>First: {nowTask.firstStep}</p>}<div className={`timer-ring plan-ring${elapsed > planned ? ' overtime' : ''}`} style={{ '--progress': `${planned ? Math.max(0, (planned - elapsed) / planned * 100) : 0}%` } as React.CSSProperties}><span>{elapsed > planned ? `+${Math.floor((elapsed - planned) / 60_000)}m` : `${Math.ceil(Math.max(0, planned - elapsed) / 60_000)}m`}</span></div><p className="small">{elapsed > planned ? `Planned ${nowTask.estimateMin}m · +${Math.floor((elapsed - planned) / 60_000)}m` : `Planned ${nowTask.estimateMin}m`}</p><div className="now-actions"><button type="button" onClick={() => void board.act((repos, at) => repos.startFocus(nowTask.id, at), 'Focus started.').then(ok => { if (ok) go('plan/focus'); })}>Start focus</button><button type="button" className="secondary" onClick={() => complete(nowTask.id)}>Done</button><button type="button" className="secondary" onClick={() => setMoving(nowTask)}>Move</button></div>{next.length > 0 && <div className="next-strip"><h3>Next</h3>{next.map(task => <p key={task.id}>{task.title}<span>{task.scheduledStart ? new Date(task.scheduledStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : `${task.estimateMin} min`}</span></p>)}</div>}<p className="day-horizon">{dayHorizon(todayOpen.reduce((sum, task) => sum + (task.estimateMin ?? 0), 0), board.now, shutdownTime)}</p></section>}
    <button type="button" className="secondary" onClick={() => go('plan/focus')}>Focus timer</button>
    <TaskQuickAdd run={board.act} tasks={board.tasks} focus={board.focus} />
    {!awayToday && <p className="small steady-line">{steadyLine(board.tasks, board.focus, today)}</p>}
    {board.message && <p role="status">{board.message}</p>}
    <TaskList title="Today" groups={todayGroups} nextId={nextId} {...listProps} />
    <Reminders />
    <SideQuests />
    <details className="later card"><summary><strong>Later</strong><span>Tap to see what is waiting. Nothing here is late.</span></summary>
      <TaskList title="Upcoming" groups={upcoming} {...listProps} />
      <TaskList title="Unplaced" groups={unplaced} {...listProps} />
      <TaskList title="Someday" groups={someday} {...listProps} />
    </details>
    <section className="plan-rituals" aria-label="Planning routines"><div className="ui-section-header"><span className="eyebrow">Make it easier</span><h2>Rituals</h2></div><div className="ritual-buttons"><button type="button" onClick={() => go('plan/morning')}><DeckGlyph type="do" />Morning plan<small>2 min</small></button><button type="button" onClick={() => go('plan/shutdown')}><DeckGlyph type="night" />Shutdown<small>5 min</small></button><button type="button" onClick={() => go('plan/review')}><DeckGlyph type="extra" />Weekly review<small>Sundays</small></button></div></section>
    {detail && <TaskDetail key={detail.id} task={board.tasks.find(row => row.id === detail.id) ?? detail} tasks={board.tasks} focus={board.focus} events={events} run={board.act} close={() => setDetail(null)} move={() => { setMoving(detail); setDetail(null); }} />}
    {moving && <PostponeSheet key={moving.id} task={moving} run={board.act} close={() => setMoving(null)} onMoved={at => setRespace({ task: moving, at })} />}
    {respace && <div className="sheet-backdrop"><section className="task-sheet" role="dialog" aria-modal="true" aria-label="Re-space checkpoints"><h2>Re-space the remaining checkpoints?</h2><div className="sheet-actions"><button type="button" onClick={() => void board.act((repos, now) => repos.respaceRemainingCheckpoints(respace.task.id, respace.at, now), 'Checkpoints updated.').then(() => setRespace(null))}>Re-space</button><button type="button" className="secondary" onClick={() => setRespace(null)}>Keep them</button></div></section></div>}
  </section>;
}
