import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import type { TaskRow } from '../../data/types';
import { RULES } from '../../core/rules.config';
import { dayKey } from '../../core/time/dayKey';
import { formatDayKey } from '../../core/time/formatDayKey';
import { capacity, stepDownOffer, suggestSlots, weeklySummary } from '../../core/tasks/planner';
import { minutesInWords, moveReasonInWords, weekInWords, weekInWordsSummary } from '../../core/tasks/plannerCopy';
import { postponeWeekKey } from '../../core/tasks/budget';
import { shareOrDownload } from '../../platform/files';
import { buildWeeklySummary, isoFileWeek } from '../../core/weeklySummary';
import { PostponeSheet } from '../tasks/PostponeSheet';
import { TaskDetail } from '../tasks/TaskDetail';
import { TaskQuickAdd } from '../tasks/TaskQuickAdd';
import { GroupedSteps } from '../tasks/TaskList';
import { defaultSlot, localDateTime, visibleTasks } from '../tasks/model';
import { useTaskBoard } from '../tasks/useTaskBoard';
import { LearningTask } from '../mind/LearningTask';
import { EmptyState } from '../EmptyState';
import { AgencyCheck } from '../tasks/AgencyCheck';
import '../tasks/tasks.css';

function tomorrowSlot(now: number) {
  const date = new Date(now);
  // The planning day runs to 04:00, so a shutdown at 00:30 still means "tomorrow" is the coming morning (item 83).
  if (date.getHours() < 4) date.setDate(date.getDate() - 1);
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return localDateTime(date.getTime());
}
function TriageRow({ task, board, onMove, onDetail }: { task: TaskRow; board: ReturnType<typeof useTaskBoard>; onMove: (task: TaskRow) => void; onDetail: (task: TaskRow) => void }) {
  const occupied = visibleTasks(board.tasks).filter((row) => row.status === 'planned' && row.scheduledStart != null).map((row) => ({ start: row.scheduledStart!, end: row.scheduledEnd ?? row.scheduledStart! + (row.estimateMin ?? 30) * 60_000 }));
  const slots = suggestSlots(board.now, task.estimateMin ?? 30, occupied);
  const [slot, setSlot] = useState(() => localDateTime(slots[0] ?? new Date(defaultSlot(board.now)).getTime()));
  const [priority, setPriority] = useState<'must' | 'could'>(task.mustOrCould ?? 'could');
  const [firstStep, setFirstStep] = useState(task.firstStep ?? '');
  async function place() {
    // Spec 27: placing never goes through a move gate.
    await board.act(async (repos, now) => {
      const start = new Date(slot).getTime();
      if (!Number.isFinite(start) || dayKey(start) !== dayKey(now)) throw new Error('Pick a time today.');
      await repos.moveTask(task.id, now, { day: dayKey(start), start });
      if (firstStep.trim()) await repos.setFirstStep(task.id, firstStep.trim(), now);
      await repos.setPriority(task.id, priority, now);
    }, 'Placed for today.');
  }
  return <div><button type="button" className="task-title-button" onClick={() => onDetail(task)}>{task.title}</button><p>{task.estimateMin} min {task.firstScheduledDayKey ? '· Missed slot' : '· New task'}</p>
    <label>Start time <input type="datetime-local" value={slot} onChange={(event) => setSlot(event.target.value)} /></label>
    <div className="planner-chips" aria-label={`Suggested times for ${task.title}`}>{slots.map((start) => <button key={start} type="button" className="secondary" onClick={() => setSlot(localDateTime(start))}>{new Date(start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</button>)}</div>
    {(task.postponeCount ?? 0) >= 1 && <label>First 10 minutes <input maxLength={120} value={firstStep} onChange={(event) => setFirstStep(event.target.value)} placeholder="A small first step" /></label>}
    <label>Priority <select value={priority} onChange={(event) => setPriority(event.target.value as 'must' | 'could')}><option value="could">Could</option><option value="must">Must</option></select></label>
    <div className="planner-actions"><button type="button" disabled={board.busy} onClick={() => void place()}>Place today</button><button type="button" className="secondary" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.postpone(task.id, now, { newStart: null, choice: 'someday' }), 'Parked in Someday.')}>Someday</button><button type="button" className="secondary" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.dropTask(task.id, now), 'Task dropped.')}>Drop</button></div>
    {(task.postponeCount ?? 0) >= 2 && <button type="button" className="text-button" onClick={() => onMove(task)}>See postpone choices</button>}
  </div>;
}

export function Planner({ mode }: { mode: 'plan' | 'shutdown' | 'review' }) {
  const board = useTaskBoard();
  const events = useLiveQuery(() => db.taskEvents.filter((row) => row.deleted === 0).toArray(), []) ?? [];
  const logs = useLiveQuery(() => db.dailyLog.filter((row) => row.deleted === 0).toArray(), []) ?? [];
  const sessions = useLiveQuery(() => db.sessions.filter((row) => row.deleted === 0).toArray(), []) ?? [];
  const settings = useLiveQuery(() => db.settings.filter((row) => row.deleted === 0).toArray(), []) ?? [];
  const [moving, setMoving] = useState<TaskRow | null>(null);
  // Item 83 + spec 27: Shutdown's "Move to tomorrow" moves the task straight to tomorrow 9:00 and says so. No move is refused.
  async function moveTomorrow(task: TaskRow) {
    const at = new Date(tomorrowSlot(Date.now())).getTime();
    const when = new Date(at).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    await board.act((repos, now) => repos.moveTask(task.id, now, { day: dayKey(at), start: at }), `Moved to ${when}.`);
  }
  const [detail, setDetail] = useState<TaskRow | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [skipTomorrow, setSkipTomorrow] = useState(false);
  const [firstChoice, setFirstChoice] = useState('new');
  const [firstTitle, setFirstTitle] = useState('');
  const [firstTime, setFirstTime] = useState('');
  const [firstPlace, setFirstPlace] = useState('');
  const [firstStep, setFirstStep] = useState('');
  const [ifThen, setIfThen] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [weekOffset, setWeekOffset] = useState(() => new Date().getDay() === 1 ? -1 : 0);
  const rows = visibleTasks(board.tasks);
  const today = dayKey(board.now);
  const unplaced = rows.filter((task) => task.status === 'unplaced');
  const planned = rows.filter((task) => task.status === 'planned' && task.dayKey === today);
  const musts = planned.filter((task) => task.mustOrCould === 'must');
  const total = planned.reduce((sum, task) => sum + (task.estimateMin ?? 0), 0);
  const timed = board.focus.filter((row) => row.endedAt != null).map((row) => ({ row, task: board.tasks.find((task) => task.id === row.taskId) })).filter((item) => item.task?.estimateMin);
  const overrunRatio = timed.length ? timed.reduce((sum, item) => sum + ((item.row.endedAt! - item.row.startedAt) / 60_000), 0) / timed.reduce((sum, item) => sum + item.task!.estimateMin!, 0) : 1;
  const room = capacity(total, overrunRatio, board.now);
  const open = rows.filter((task) => task.status === 'unplaced' || (task.status === 'planned' && task.dayKey === today));
  const someday = rows.filter((task) => task.status === 'someday');
  const dropGroup = (id: string) => { void board.act((repos, now) => repos.dropTask(id, now), 'Split task dropped.'); };
  const currentWeek = postponeWeekKey(board.now);
  const week = new Date(`${currentWeek}T12:00:00`);
  week.setDate(week.getDate() + weekOffset * 7);
  const weekKey = dayKey(week);
  const policy = settings.find((row) => row.key === 'planner.budget')?.value as { budget?: number; baselineStart?: string; baselineComplete?: boolean; enforcementFromWeek?: string; raisedAtWeek?: string; steppedDownAtWeek?: string } | undefined;
  const seasonStart = new Date(`${currentWeek}T12:00:00`).getDate() <= 7;
  const priorWeeks = Array.from({ length: 4 }, (_, index) => { const date = new Date(`${currentWeek}T12:00:00`); date.setDate(date.getDate() - (4 - index) * 7); return dayKey(date); });
  const priorCounts = priorWeeks.map((start) => events.filter((row) => row.kind === 'postponed' && row.budgetCounted && postponeWeekKey(row.at) === start).length);
  const lowerOffer = seasonStart && policy?.steppedDownAtWeek !== currentWeek ? stepDownOffer(policy?.budget ?? RULES.tasks.postpone.weeklyBudget, priorCounts) : null;
  const summary = weeklySummary({ weekStart: weekKey, budget: policy?.budget ?? RULES.tasks.postpone.weeklyBudget, tasks: board.tasks, events, focus: board.focus, logs: logs.filter((row) => row.dayKey >= weekKey && row.dayKey < dayKey(new Date(week.getTime() + 7 * 86_400_000))) });
  const nextWeek = dayKey(new Date(week.getTime() + 7 * 86_400_000));
  const inWeek = (key: string) => key >= weekKey && key < nextWeek;
  const weekStartAt = new Date(`${weekKey}T04:00:00`).getTime();
  const doneThisWeek = board.tasks.filter((task) => !task.deleted && task.doneAt != null && task.doneAt >= weekStartAt && task.doneAt < weekStartAt + 7 * 86_400_000).length;
  const trainingThisWeek = sessions.filter((session) => inWeek(session.dayKey) && session.status === 'completed').length;
  const nightsOnPlan = logs.filter((log) => inWeek(log.dayKey) && log.lightsOutAt != null && log.bedtimeTarget != null && log.lightsOutAt <= log.bedtimeTarget).length;
  const leadingReason = Object.entries(summary.reasons).sort((a, b) => b[1] - a[1])[0];
  const movedTasks = new Set(events.filter((event) => event.kind === 'postponed' && event.budgetCounted && event.at >= weekStartAt && event.at < weekStartAt + 7 * 86_400_000).map((event) => event.taskId)).size;
  const completed = logs.find((row) => row.dayKey === today);
  useEffect(() => { void board.act((repos, now) => repos.plannerBudget(now)); /* Set or advance the baseline week. */ }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function saveTomorrow() {
    const start = new Date(firstTime || tomorrowSlot(board.now)).getTime();
    // Tomorrow is the planning day after today's (which runs to 04:00), the same day tomorrowSlot uses.
    const tomorrowKey = dayKey(new Date(`${dayKey(board.now)}T12:00:00`).getTime() + 86_400_000);
    if (!Number.isFinite(start) || dayKey(start) !== tomorrowKey || !firstTitle.trim()) { setExportMessage('Add a task for tomorrow and check its time.'); return false; }
    const ok = await board.act(async (repos, now) => {
      const id = firstChoice === 'new' ? (await repos.createTask({ title: firstTitle.trim(), size: 'M', estimateMin: 30, dayKey: dayKey(start), scheduledStart: start }, now)).id : firstChoice;
      if (firstChoice !== 'new') await repos.moveTask(id, now, { day: dayKey(start), start });
      if (firstPlace.trim()) await repos.setPlace(id, firstPlace, now);
      if (firstStep.trim()) await repos.setFirstStep(id, firstStep, now);
    }, 'Tomorrow’s first task is set.');
    if (ok) setExportMessage('');
    return ok;
  }
  async function completeShutdown() {
    if (!skipTomorrow && !await saveTomorrow()) return;
    await board.act((repos, now) => repos.markRitual('shutdownDone', now, ifThen), 'Shutdown saved.');
  }
  async function exportWeek() {
    const name = `nandi-week-${isoFileWeek(weekKey)}.json`;
    try {
      const source = await db.transaction('r', [db.tasks, db.taskEvents, db.focus, db.dailyLog, db.sessions, db.prs, db.programs, db.puzzleRuns, db.lessonProg, db.plans, db.flags, db.ledger, db.quests, db.settings, db.exState], async () => {
        const [tasks, events, focus, logs, sessions, prs, programs, puzzleRuns, lessonProg, plans, flags, ledger, quests, settings, exState] = await Promise.all([db.tasks.toArray(), db.taskEvents.toArray(), db.focus.toArray(), db.dailyLog.toArray(), db.sessions.toArray(), db.prs.toArray(), db.programs.toArray(), db.puzzleRuns.toArray(), db.lessonProg.toArray(), db.plans.toArray(), db.flags.toArray(), db.ledger.toArray(), db.quests.toArray(), db.settings.toArray(), db.exState.toArray()]);
        return { tasks, events, focus, logs, sessions, prs, programs, puzzleRuns, lessonProg, plans, flags, ledger, quests, settings, exState };
      });
      const complete = buildWeeklySummary(weekKey, source, policy?.budget ?? RULES.tasks.postpone.weeklyBudget);
      const result = await shareOrDownload(new File([JSON.stringify(complete, null, 2)], name, { type: 'application/json' }));
      setExportMessage(result === 'cancelled' ? 'Export cancelled.' : result === 'shared' ? 'Shared weekly summary.' : `Saved ${name}.`);
    } catch { setExportMessage('Could not export the weekly summary.'); }
  }
  return <section className="screen planner-screen"><p className="eyebrow">Your plan</p><h1>{mode === 'plan' ? 'Morning plan' : mode === 'shutdown' ? 'Shutdown' : 'Weekly review'}</h1>
    {(board.message || exportMessage) && <div role="status">{board.message && <p>{board.message}</p>}{exportMessage && <p>{exportMessage}</p>}</div>}
    {mode === 'plan' && <>
      <section className="card planner-capacity" aria-label="Time for today"><h2>Today you have about {minutesInWords(Math.max(0, room.available - room.planned))} free</h2><progress max={room.available} value={Math.min(room.planned, room.available)} aria-label="Time planned" /><p>{minutesInWords(room.planned)} planned</p><details><summary>How is this worked out?</summary><p>Your tasks usually take {overrunRatio.toFixed(1)}× your guess, so NANDI plans with that. You have about {minutesInWords(room.available)} available today.</p></details>{room.over && <p role="note">This is more than your usual time. Adjust your plan if useful.</p>}</section>
      <p>A few minutes to give the day a shape. You can skip this.</p>
      <TaskQuickAdd run={board.act} tasks={board.tasks} focus={board.focus} />
      <LearningTask day={today} />
      {!skipped ? <>{unplaced.length > 0 && <section aria-label="Not scheduled yet"><h2>Not scheduled yet</h2><GroupedSteps all={board.tasks} selected={unplaced} render={(task) => <TriageRow task={task} board={board} onMove={setMoving} onDetail={setDetail} />} onDetail={setDetail} onDropGroup={dropGroup} busy={board.busy} /></section>}
        <section aria-label="Top 3 for today"><h2>Top 3 for today <span className="small">{musts.length}/3</span></h2><p>Choose up to three. Give each one a start time.</p>{planned.length > 0 && <GroupedSteps all={board.tasks} selected={planned} render={(task) => <div className="planner-priority"><span><button type="button" className="task-title-button" onClick={() => setDetail(task)}>{task.title}</button> · {task.scheduledStart ? new Date(task.scheduledStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}</span><button type="button" className="secondary" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.setPriority(task.id, task.mustOrCould === 'must' ? 'could' : 'must', now), 'Priority saved.')}>{task.mustOrCould === 'must' ? 'Remove from top 3' : 'Add to top 3'}</button></div>} onDetail={setDetail} onDropGroup={dropGroup} busy={board.busy} />}</section>
        <div className="planner-actions"><button type="button" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.markRitual('planDone', now), 'Morning plan complete.')}>Finish morning plan</button><button type="button" className="secondary" onClick={() => setSkipped(true)}>Skip for now</button></div>
      </> : <section className="card"><h2>Pick your one Must</h2><p>One time and one task is enough to start.</p>{planned.length > 0 && <GroupedSteps all={board.tasks} selected={planned} render={(task) => <button type="button" className="secondary" onClick={() => void board.act(async (repos, now) => { await repos.setPriority(task.id, 'must', now); await repos.markRitual('planDone', now); }, 'One Must picked.')}>{task.title}</button>} onDetail={setDetail} onDropGroup={dropGroup} busy={board.busy} />}<button type="button" className="text-button" onClick={() => setSkipped(false)}>Show full plan</button></section>}
      {completed?.planDone && <p role="status">Plan complete for today.</p>}
    </>}
    {mode === 'shutdown' && <>
      <p>A few minutes to leave today here and make tomorrow easier.</p>
      <section className="card planner-step" aria-label="Close today"><h2><span className="step-number">1</span> Close today</h2>{open.length ? <GroupedSteps all={board.tasks} selected={open} render={(task) => <><button type="button" className="task-title-button" onClick={() => setDetail(task)}>{task.title}</button><div className="planner-actions"><button type="button" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.completeTask(task.id, now), 'Task done.')}>Done</button><button type="button" className="secondary" disabled={board.busy} onClick={() => void moveTomorrow(task)}>Move to tomorrow</button></div><details><summary>Other choices</summary><div className="planner-actions"><button type="button" className="secondary" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.postpone(task.id, now, { newStart: null, choice: 'someday' }), 'Parked in Someday.')}>Someday</button><button type="button" className="secondary" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.dropTask(task.id, now), 'Task dropped.')}>Drop</button></div></details></>} onDetail={setDetail} onDropGroup={dropGroup} busy={board.busy} /> : <EmptyState area="do">Nothing left open.</EmptyState>}</section>
      <section className="card planner-step" aria-label="Tomorrow's first step"><h2><span className="step-number">2</span> Tomorrow's first step</h2>{!skipTomorrow ? <><label>Task name <input value={firstTitle} onChange={(event) => { setFirstTitle(event.target.value); setFirstChoice('new'); }} placeholder="What will you start with?" /></label><label>Time (optional) <input type="datetime-local" value={firstTime} onChange={(event) => setFirstTime(event.target.value)} /></label><p className="small">Leave time blank to start at 9:00 AM.</p><details><summary>More details</summary><label>Choose an open task <select value={firstChoice} onChange={(event) => { const id = event.target.value; setFirstChoice(id); setFirstTitle(open.find((task) => task.id === id)?.title ?? ''); }}><option value="new">New task</option>{open.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label><label>First 10 minutes <input maxLength={120} value={firstStep} onChange={(event) => setFirstStep(event.target.value)} placeholder="A small first step" /></label><label>Place <input value={firstPlace} onChange={(event) => setFirstPlace(event.target.value)} placeholder="Where will you start?" /></label></details><button type="button" className="text-button" onClick={() => setSkipTomorrow(true)}>Skip tomorrow's step</button></> : <><p>Tomorrow's step skipped for now.</p><button type="button" className="text-button" onClick={() => setSkipTomorrow(false)}>Add tomorrow's step</button></>}</section>
      <section className="card planner-step" aria-label="Tonight's if-then"><h2><span className="step-number">3</span> Tonight's if-then <span className="small">Optional</span></h2><label>If this happens, then I will… <input value={ifThen} onChange={(event) => setIfThen(event.target.value)} placeholder="If I am in bed with my phone, then…" /></label></section>
      <button type="button" disabled={board.busy || (!skipTomorrow && !firstTitle.trim())} onClick={() => void completeShutdown()}>Complete shutdown</button>
      {completed?.shutdownDone && <p role="status">Shutdown complete. Wind-down has started.</p>}
    </>}
    {mode === 'review' && <>
      <p>About ten minutes to see what happened and choose what comes next.</p>
      <div className="planner-actions"><button type="button" className="secondary" onClick={() => setWeekOffset(weekOffset - 1)}>Earlier week</button><button type="button" className="secondary" disabled={weekOffset >= 0} onClick={() => setWeekOffset(weekOffset + 1)}>Later week</button></div>
      <section className="card planner-week-words" aria-label="This week, in words"><p className="small">Week of {weekInWords(weekKey)}</p><h2>This week, in words</h2><p>{weekInWordsSummary(doneThisWeek, trainingThisWeek, nightsOnPlan)}</p></section>
      <section className="card" aria-label="What helped"><h2>What helped</h2>{summary.startAdherence.total > 0 && <p>You started on time for {summary.startAdherence.met} of {summary.startAdherence.total} {summary.startAdherence.total === 1 ? 'task' : 'tasks'}.</p>}{summary.firstDayDone.total > 0 && <p>You finished {summary.firstDayDone.met} of {summary.firstDayDone.total} {summary.firstDayDone.total === 1 ? 'task' : 'tasks'} on the day you first planned {summary.firstDayDone.total === 1 ? 'it' : 'them'}.</p>}{summary.startAdherence.total === 0 && summary.firstDayDone.total === 0 && <p>There is nothing to compare yet. Notice what made starting easier.</p>}</section>
      <section className="card" aria-label="What got in the way"><h2>What got in the way</h2>{movedTasks > 0 ? <p>You moved {movedTasks} {movedTasks === 1 ? 'task' : 'tasks'} this week.</p> : <p>No tasks needed moving this week.</p>}{leadingReason && leadingReason[1] > 0 && <p>The most common reason: {moveReasonInWords(leadingReason[0])}.</p>}</section>
      <details className="card planner-numbers" aria-label="Numbers"><summary>Numbers</summary><p>Task moves: {summary.postpones}.{summary.reachedThree > 0 ? ` ${summary.reachedThree} reached a third move (${summary.reachedThreeShare}%).` : ''}</p><p>Move reasons: {Object.entries(summary.reasons).map(([reason, count]) => `${moveReasonInWords(reason)} ${count}`).join(' · ') || 'None recorded'}</p><p>Weekly move budget: {summary.postpones} of {summary.budget} used; {summary.budgetOverrun ? `${summary.budgetOverrun} over` : `${summary.budgetRemaining} left`}.{policy?.baselineStart && weekKey >= postponeWeekKey(new Date(`${policy.baselineStart}T12:00:00`).getTime()) && (policy.enforcementFromWeek == null || weekKey < policy.enforcementFromWeek) ? ' This is a baseline week, so the limit is not enforced yet.' : ''}</p><p>How long tasks took compared with your guesses: {Object.entries(summary.estimateRatio).map(([category, ratio]) => `${category} ${ratio}×`).join(' · ') || 'Time a few tasks to see this.'}</p><p>Task switches per focus block: {summary.switchesPerBlock}</p><p>Times you checked in: morning plan {summary.rituals.plan} · shutdown {summary.rituals.shutdown} · weekly review {summary.rituals.review}</p></details>
      {policy?.raisedAtWeek === currentWeek && <p role="status">Budget raised to {policy.budget}. Plans should fit real life.</p>}
      {lowerOffer != null && <div className="card"><p>You were under budget in at least three of the last four weeks.</p><button type="button" className="secondary" onClick={() => void board.act((repos, now) => repos.lowerBudget(now), `Budget lowered to ${lowerOffer}.`)}>Lower the budget by 1?</button></div>}
      <section aria-label="Someday items"><h2>Someday</h2>{someday.length ? <GroupedSteps all={board.tasks} selected={someday} render={(task) => <><button type="button" className="task-title-button" onClick={() => setDetail(task)}>{task.title}</button>{summary.somedayMoved.includes(task.id) && <span>Moved this week</span>}<div className="planner-actions"><button type="button" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.postpone(task.id, now, { newStart: new Date(tomorrowSlot(now)).getTime() }), 'Task revived for tomorrow.')}>Revive</button><button type="button" className="secondary" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.dropTask(task.id, now), 'Task removed.')}>Delete</button></div></>} onDetail={setDetail} onDropGroup={dropGroup} busy={board.busy} /> : <p>No Someday items right now.</p>}</section>
      <section aria-label="Upcoming checkpoints"><h2>Upcoming checkpoints</h2>{rows.filter((task) => task.checkpointOf && task.status === 'planned' && task.dayKey >= today).map((task) => <p key={task.id}><button type="button" className="task-title-button" onClick={() => setDetail(task)}>{task.title}</button> · {formatDayKey(task.dayKey)}</p>).length ? rows.filter((task) => task.checkpointOf && task.status === 'planned' && task.dayKey >= today).map((task) => <p key={task.id}><button type="button" className="task-title-button" onClick={() => setDetail(task)}>{task.title}</button> · {formatDayKey(task.dayKey)}</p>) : <p>No upcoming checkpoints.</p>}</section>
      <AgencyCheck now={board.now} />
      <div className="planner-actions"><button type="button" onClick={() => void board.act((repos, now) => repos.markRitual('reviewDone', now), 'Weekly review complete.')}>Finish review</button><button type="button" className="secondary" onClick={() => void exportWeek()}>Export summary</button></div>
      {completed?.reviewDone && <p className="small">Review recorded for today.</p>}
    </>}
    {detail && <TaskDetail key={detail.id} task={board.tasks.find(row => row.id === detail.id) ?? detail} tasks={board.tasks} focus={board.focus} events={events} run={board.act} close={() => setDetail(null)} move={() => { setMoving(detail); setDetail(null); }} />}
    {moving && <PostponeSheet key={moving.id} task={moving} run={board.act} close={() => setMoving(null)} />}
  </section>;
}
