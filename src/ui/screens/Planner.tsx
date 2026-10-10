import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import type { TaskRow } from '../../data/types';
import { RULES } from '../../core/rules.config';
import { dayKey } from '../../core/time/dayKey';
import { capacity, effectiveShutdown, stepDownOffer, suggestSlots, weeklySummary } from '../../core/tasks/planner';
import { postponeWeekKey } from '../../core/tasks/budget';
import { shareOrDownload } from '../../platform/files';
import { PostponeSheet } from '../tasks/PostponeSheet';
import { TaskQuickAdd } from '../tasks/TaskQuickAdd';
import { defaultSlot, localDateTime, visibleTasks } from '../tasks/model';
import { useTaskBoard } from '../tasks/useTaskBoard';
import { go } from '../shell/router';
import '../tasks/tasks.css';

function tomorrowSlot(now: number) {
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return localDateTime(date.getTime());
}
function setting(rows: { key: string; value: unknown; deleted: number }[], key: string, fallback: string) {
  const value = rows.find((row) => row.key === key && row.deleted === 0)?.value;
  return typeof value === 'string' ? value : fallback;
}
function isoFileWeek(key: string) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 3 - (date.getUTCDay() + 6) % 7);
  const year = date.getUTCFullYear();
  const first = new Date(Date.UTC(year, 0, 4));
  first.setUTCDate(first.getUTCDate() + 3 - (first.getUTCDay() + 6) % 7);
  const week = 1 + Math.round((date.getTime() - first.getTime()) / (7 * 86_400_000));
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function TriageRow({ task, board, onMove }: { task: TaskRow; board: ReturnType<typeof useTaskBoard>; onMove: (task: TaskRow) => void }) {
  const occupied = visibleTasks(board.tasks).filter((row) => row.status === 'planned' && row.scheduledStart != null).map((row) => ({ start: row.scheduledStart!, end: row.scheduledEnd ?? row.scheduledStart! + (row.estimateMin ?? 30) * 60_000 }));
  const slots = suggestSlots(board.now, task.estimateMin ?? 30, occupied);
  const [slot, setSlot] = useState(() => localDateTime(slots[0] ?? new Date(defaultSlot(board.now)).getTime()));
  const [priority, setPriority] = useState<'must' | 'could'>(task.mustOrCould ?? 'could');
  const [firstStep, setFirstStep] = useState(task.firstStep ?? '');
  async function place() {
    await board.act(async (repos, now) => {
      const start = new Date(slot).getTime();
      if (!Number.isFinite(start) || dayKey(start) !== dayKey(now)) throw new Error('Pick a time today.');
      await repos.postpone(task.id, now, { newStart: start, firstStep: firstStep.trim() || undefined });
      await repos.setPriority(task.id, priority, now);
    }, 'Placed for today.');
  }
  return <li className="planner-item"><strong>{task.title}</strong><p>{task.estimateMin} min {task.firstScheduledDayKey ? '· Missed slot' : '· New task'}</p>
    <label>Start time <input type="datetime-local" value={slot} onChange={(event) => setSlot(event.target.value)} /></label>
    <div className="planner-chips" aria-label={`Suggested times for ${task.title}`}>{slots.map((start) => <button key={start} type="button" className="secondary" onClick={() => setSlot(localDateTime(start))}>{new Date(start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</button>)}</div>
    {(task.postponeCount ?? 0) >= 1 && <label>First 10 minutes <input maxLength={120} value={firstStep} onChange={(event) => setFirstStep(event.target.value)} placeholder="A small first step" /></label>}
    <label>Priority <select value={priority} onChange={(event) => setPriority(event.target.value as 'must' | 'could')}><option value="could">Could</option><option value="must">Must</option></select></label>
    <div className="planner-actions"><button type="button" disabled={board.busy} onClick={() => void place()}>Place today</button><button type="button" className="secondary" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.postpone(task.id, now, { newStart: null, choice: 'someday' }), 'Parked in Someday.')}>Someday</button><button type="button" className="secondary" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.dropTask(task.id, now), 'Task dropped.')}>Drop</button></div>
    {(task.postponeCount ?? 0) >= 2 && <button type="button" className="text-button" onClick={() => onMove(task)}>See postpone choices</button>}
  </li>;
}

export function Planner({ mode }: { mode: 'plan' | 'shutdown' | 'review' }) {
  const board = useTaskBoard();
  const events = useLiveQuery(() => db.taskEvents.filter((row) => row.deleted === 0).toArray(), []) ?? [];
  const logs = useLiveQuery(() => db.dailyLog.filter((row) => row.deleted === 0).toArray(), []) ?? [];
  const settings = useLiveQuery(() => db.settings.filter((row) => row.deleted === 0).toArray(), []) ?? [];
  const [moving, setMoving] = useState<TaskRow | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [firstSaved, setFirstSaved] = useState(false);
  const [firstChoice, setFirstChoice] = useState('new');
  const [firstTitle, setFirstTitle] = useState('');
  const [firstTime, setFirstTime] = useState(() => tomorrowSlot(Date.now()));
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
  const shutdown = effectiveShutdown(setting(settings, 'planner.shutdown', RULES.night.defaultShutdown), setting(settings, 'planner.bedtime', RULES.night.defaultBedtime));
  const open = rows.filter((task) => task.status === 'unplaced' || (task.status === 'planned' && task.dayKey === today));
  const someday = rows.filter((task) => task.status === 'someday');
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
  const completed = logs.find((row) => row.dayKey === today);
  useEffect(() => { void board.act((repos, now) => repos.plannerBudget(now)); /* Set or advance the baseline week. */ }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function saveTomorrow() {
    const start = new Date(firstTime).getTime();
    const tomorrow = new Date(board.now); tomorrow.setDate(tomorrow.getDate() + 1);
    if (!Number.isFinite(start) || dayKey(start) !== dayKey(tomorrow.getTime()) || !firstPlace.trim() || !firstStep.trim() || (firstChoice === 'new' && !firstTitle.trim())) { setExportMessage('Add tomorrow’s task, first step, time, and place.'); return; }
    const ok = await board.act(async (repos, now) => {
      const id = firstChoice === 'new' ? (await repos.createTask({ title: firstTitle.trim(), size: 'M', estimateMin: 30, dayKey: dayKey(start), scheduledStart: start }, now)).id : firstChoice;
      if (firstChoice !== 'new') await repos.postpone(id, now, { newStart: start });
      await repos.setPlace(id, firstPlace, now);
      await repos.setFirstStep(id, firstStep, now);
    }, 'Tomorrow’s first task is set.');
    if (ok) { setFirstSaved(true); setExportMessage(''); }
  }
  async function exportWeek() {
    const name = `nandi-week-${isoFileWeek(weekKey)}.json`;
    try {
      const result = await shareOrDownload(new File([JSON.stringify({ ...summary, someday: someday.map((task) => ({ id: task.id, title: task.title })), exportedAt: board.now }, null, 2)], name, { type: 'application/json' }));
      setExportMessage(result === 'cancelled' ? 'Export cancelled.' : result === 'shared' ? 'Shared weekly summary.' : `Saved ${name}.`);
    } catch { setExportMessage('Could not export the weekly summary.'); }
  }
  return <section className="screen planner-screen"><button type="button" className="text-button" onClick={() => go('today')}>← Today</button><p className="eyebrow">Your plan</p><h1>{mode === 'plan' ? 'Morning plan' : mode === 'shutdown' ? 'Shutdown' : 'Weekly review'}</h1>
    {board.message && <p role="status">{board.message}</p>}{exportMessage && <p role="status">{exportMessage}</p>}
    {mode === 'plan' && <>
      <p>A few minutes to give the day a shape. You can skip this.</p>
      <TaskQuickAdd run={board.act} />
      <section className="card" aria-label="Capacity"><h2>Capacity</h2><progress max={room.available} value={Math.min(room.planned, room.available)} /><p>{room.planned} min planned with your {overrunRatio.toFixed(1)}× estimate ratio · {room.available} min available</p>{room.over && <p role="note">This is more than your usual capacity. Adjust if useful; the plan stays yours.</p>}</section>
      {!skipped ? <><section aria-label="Unplaced tray"><h2>Unplaced tray</h2>{unplaced.length ? <ul className="planner-list">{unplaced.map((task) => <TriageRow key={task.id} task={task} board={board} onMove={setMoving} />)}</ul> : <p>Tray clear.</p>}</section>
        <section aria-label="Today priorities"><h2>Musts {musts.length}/3</h2><p>Choose up to three. Each Must has a start time.</p>{planned.map((task) => <div className="planner-priority" key={task.id}><span>{task.title} · {task.scheduledStart ? new Date(task.scheduledStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}</span><button type="button" className="secondary" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.setPriority(task.id, task.mustOrCould === 'must' ? 'could' : 'must', now), 'Priority saved.')}>{task.mustOrCould === 'must' ? 'Make Could' : 'Make Must'}</button></div>)}</section>
        <div className="planner-actions"><button type="button" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.markRitual('planDone', now), 'Morning plan complete.')}>Finish morning plan</button><button type="button" className="secondary" onClick={() => setSkipped(true)}>Skip for now</button></div>
      </> : <section className="card"><h2>Pick your one Must</h2><p>One time and one task is enough to start.</p>{planned.map((task) => <button type="button" key={task.id} className="secondary" onClick={() => void board.act(async (repos, now) => { await repos.setPriority(task.id, 'must', now); await repos.markRitual('planDone', now); }, 'One Must picked.')}>{task.title}</button>)}<button type="button" className="text-button" onClick={() => setSkipped(false)}>Back to full plan</button></section>}
      {completed?.planDone && <p role="status">Plan complete for today.</p>}
    </>}
    {mode === 'shutdown' && <>
      <p>Close what is open, then give tomorrow a first step. Nudge time: {shutdown}.</p>
      <section aria-label="Close today"><h2>Close today</h2>{open.length ? <ul className="planner-list">{open.map((task) => <li key={task.id} className="planner-item"><strong>{task.title}</strong><div className="planner-actions"><button type="button" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.completeTask(task.id, now), 'Task done.')}>Done</button><button type="button" className="secondary" onClick={() => setMoving(task)}>Move</button><button type="button" className="secondary" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.postpone(task.id, now, { newStart: null, choice: 'someday' }), 'Parked in Someday.')}>Someday</button><button type="button" className="secondary" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.dropTask(task.id, now), 'Task dropped.')}>Drop</button></div></li>)}</ul> : <p>Today is closed.</p>}</section>
      <section className="card" aria-label="Tomorrow first task"><h2>Tomorrow’s first task</h2><label>Task <select value={firstChoice} onChange={(event) => setFirstChoice(event.target.value)}><option value="new">New task</option>{open.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>{firstChoice === 'new' && <label>Task name <input value={firstTitle} onChange={(event) => setFirstTitle(event.target.value)} /></label>}<label>First step <input maxLength={120} value={firstStep} onChange={(event) => setFirstStep(event.target.value)} placeholder="What are the first 10 minutes?" /></label><label>Time <input type="datetime-local" value={firstTime} onChange={(event) => setFirstTime(event.target.value)} /></label><label>Place <input value={firstPlace} onChange={(event) => setFirstPlace(event.target.value)} placeholder="Where will you start?" /></label><button type="button" disabled={board.busy} onClick={() => void saveTomorrow()}>Set first task</button></section>
      <label>Optional bedtime if-then <input value={ifThen} onChange={(event) => setIfThen(event.target.value)} placeholder="If I am in bed with my phone, then…" /></label>
      <button type="button" disabled={board.busy || open.length > 0 || !firstSaved} onClick={() => void board.act((repos, now) => repos.markRitual('shutdownDone', now, ifThen), 'Shutdown complete.')}>Complete shutdown</button>
      {completed?.shutdownDone && <p role="status">Shutdown complete. Wind-down has started.</p>}
      <p className="small">The shutdown nudge is in-app for now. {/* TODO(Android): schedule the self-set shutdown notification outside the engagement push budget. */}</p>
    </>}
    {mode === 'review' && <>
      <p>About ten minutes to see what happened and choose what comes next.</p>
      <div className="planner-actions"><button type="button" className="secondary" onClick={() => setWeekOffset(weekOffset - 1)}>Earlier week</button><button type="button" className="secondary" disabled={weekOffset >= 0} onClick={() => setWeekOffset(weekOffset + 1)}>Later week</button></div>
      <section className="card" aria-label="Weekly numbers"><h2>Week of {weekKey}</h2><p>Started within 15 min: {summary.startAdherence.met}/{summary.startAdherence.total}</p><p>Done on first scheduled day: {summary.firstDayDone.met}/{summary.firstDayDone.total}</p><p>Postpones: {summary.postpones} · Reached #3: {summary.reachedThree} ({summary.reachedThreeShare}%)</p><p>Reasons: {Object.entries(summary.reasons).map(([reason, count]) => `${reason} ${count}`).join(' · ') || 'None recorded'}</p><p>Budget: {summary.postpones}/{summary.budget}{summary.budgetOverrun ? ` · ${summary.budgetOverrun} over` : ` · ${summary.budgetRemaining} left`}{policy?.baselineStart && weekKey >= postponeWeekKey(new Date(`${policy.baselineStart}T12:00:00`).getTime()) && (policy.enforcementFromWeek == null || weekKey < policy.enforcementFromWeek) ? ' · Baseline week, enforcement off' : ''}</p><p>Estimate ratio: {Object.entries(summary.estimateRatio).map(([category, ratio]) => `${category} ${ratio}×`).join(' · ') || 'More timed tasks will show this'}</p><p>Switches per focus block: {summary.switchesPerBlock}</p><p>Rituals: plan {summary.rituals.plan} · shutdown {summary.rituals.shutdown} · review {summary.rituals.review}</p></section>
      {policy?.raisedAtWeek === currentWeek && <p role="status">Budget raised to {policy.budget}. Plans should fit real life.</p>}
      {lowerOffer != null && <div className="card"><p>You were under budget in at least three of the last four weeks.</p><button type="button" className="secondary" onClick={() => void board.act((repos, now) => repos.lowerBudget(now), `Budget lowered to ${lowerOffer}.`)}>Lower the budget by 1?</button></div>}
      <section aria-label="Someday items"><h2>Someday</h2>{someday.length ? <ul className="planner-list">{someday.map((task) => <li className="planner-item" key={task.id}><strong>{task.title}</strong>{summary.somedayMoved.includes(task.id) && <span>Moved this week</span>}<div className="planner-actions"><button type="button" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.postpone(task.id, now, { newStart: new Date(tomorrowSlot(now)).getTime() }), 'Task revived for tomorrow.')}>Revive</button><button type="button" className="secondary" disabled={board.busy} onClick={() => void board.act((repos, now) => repos.dropTask(task.id, now), 'Task removed.')}>Delete</button></div></li>)}</ul> : <p>No Someday items right now.</p>}</section>
      <section aria-label="Upcoming checkpoints"><h2>Upcoming checkpoints</h2>{rows.filter((task) => task.checkpointOf && task.status === 'planned' && task.dayKey >= today).map((task) => <p key={task.id}>{task.title} · {task.dayKey}</p>).length ? rows.filter((task) => task.checkpointOf && task.status === 'planned' && task.dayKey >= today).map((task) => <p key={task.id}>{task.title} · {task.dayKey}</p>) : <p>No upcoming checkpoints.</p>}</section>
      <div className="planner-actions"><button type="button" onClick={() => void board.act((repos, now) => repos.markRitual('reviewDone', now), 'Weekly review complete.')}>Finish review</button><button type="button" className="secondary" onClick={() => void exportWeek()}>Export summary</button></div>
      {completed?.reviewDone && <p className="small">Review recorded for today.</p>}
    </>}
    {moving && <PostponeSheet key={moving.id} task={moving} run={board.act} close={() => setMoving(null)} />}
  </section>;
}
