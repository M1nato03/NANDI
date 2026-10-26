import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import type { TaskRow } from '../../data/types';
import { dayKey } from '../../core/time/dayKey';
import { needsFreshStart } from '../../core/tasks/complete';
import { dayHorizon, effectiveShutdown, suggestSlots } from '../../core/tasks/planner';
import { RULES } from '../../core/rules.config';
import { SideQuests } from '../quests/SideQuests';
import { PostponeSheet } from '../tasks/PostponeSheet';
import { MorList, type OuterMove } from '../tasks/MorList';
import { TaskQuickAdd } from '../tasks/TaskQuickAdd';
import { TaskDetail } from '../tasks/TaskDetail';
import { Reminders } from '../tasks/Reminders';
import { PhoneChhutti } from '../tasks/PhoneChhutti';
import { todayTasks } from '../tasks/model';
import { useTaskBoard } from '../tasks/useTaskBoard';
import { go } from '../shell/router';
import { DeckGlyph } from '../DeckGlyph';
import { MorningBackfill } from './MorningBackfill';
import { isAway } from '../../core/economy/away';
import { adaptiveNight, shiftOffKey } from '../../core/adaptive/day';
import '../tasks/tasks.css';
import { Cast } from '../cast/Cast';
import { FriendStage } from '../cast/FriendStage';
import { CourtyardBanner } from '../courtyard/Courtyard';
import { StorybookCard } from '../courtyard/Storybook';
import { AgencyCheck } from '../tasks/AgencyCheck';
import { agencyAnsweredRecently } from '../../core/guard';
import { SoftChip, SoftHome, softMoreKey, useSoftFacts } from '../soft/SoftDay';
import { softToday, yesterdayWasSoft } from '../../core/soft/soft';
import { isAfterBedtime } from '../../core/time';
import { useModalFocus } from '../shell/useModalFocus';
import { errorMessage } from '../shell/errorMessage';

export function Plan({ questId }: { questId?: string }) {
  const board = useTaskBoard();
  const [moving, setMoving] = useState<TaskRow | null>(null);
  const [outerMove, setOuterMove] = useState<OuterMove | undefined>();
  const [detail, setDetail] = useState<TaskRow | null>(null);
  // Task events load only for the task whose details are open (cj2 heavy data #6: Plan read all ~4.6k a year).
  const events = useLiveQuery(() => detail ? db.taskEvents.where('taskId').equals(detail.id).filter(row => row.deleted === 0).toArray() : [], [detail?.id]) ?? [];
  const [pickMust, setPickMust] = useState(false);
  // Item 83/88: a Pick one Must message shows on the tapped choice's own row.
  const [pickNote, setPickNote] = useState<{ id: string; text: string } | null>(null);
  // It also takes focus and scrolls into view, so a tap near the bottom of a 360 px screen still shows it (item 89).
  const pickNoteRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (pickNote) { pickNoteRef.current?.focus(); pickNoteRef.current?.scrollIntoView({ block: 'nearest' }); } }, [pickNote]);
  const [respace, setRespace] = useState<{ task: TaskRow; at: number } | null>(null);
  const respaceDialog = useModalFocus<HTMLElement>(() => setRespace(null));
  const logs = useLiveQuery(() => db.dailyLog.filter(row => row.deleted === 0).toArray(), []) ?? [];
  const settings = useLiveQuery(() => db.settings.filter(row => row.deleted === 0).toArray(), []) ?? [];
  const softFacts = useSoftFacts();
  const today = dayKey(board.now);
  const night = adaptiveNight(settings, board.tasks, today);
  // The weekly agency check comes to Plan on Sundays; once answered it stays for the rest of that day.
  const askAgency = new Date(`${today}T12:00:00`).getDay() === 0 && (!agencyAnsweredRecently(logs, today) || logs.some(row => row.dayKey === today && row.agency1to5 !== undefined));
  const keepUsualNight = async () => { const now = Date.now(); await db.settings.put({ key: shiftOffKey(today), value: true, updatedAt: now, deleted: 0, deviceId: await getOrCreateDeviceId(db, now) }); }; // eslint-disable-line react-hooks/purity
  const awayToday = isAway(settings, today);
  const yesterday = dayKey(new Date(`${today}T12:00:00`).getTime() - 86_400_000);
  // Count only yesterday's facts through the dayKey index; the ledger grows every day.
  const yesterdayFacts = useLiveQuery(() => db.ledger.where('dayKey').equals(yesterday).filter(row => row.deleted === 0).count(), [yesterday]) ?? 0;
  const hadYesterday = logs.some(row => row.dayKey === yesterday) || yesterdayFacts > 0 || board.tasks.some(row => !row.deleted && (row.dayKey === yesterday || row.firstScheduledDayKey === yesterday || row.doneAt != null && dayKey(row.doneAt) === yesterday));
  const todayOpen = todayTasks(board.tasks, board.now);
  const avgHidden = settings.some(row => row.key === 'plan.averageHidden' && row.value === true);
  async function hideAverage() { const at = Date.now(); await db.settings.put({ key: 'plan.averageHidden', value: true, updatedAt: at, deleted: 0, deviceId: await getOrCreateDeviceId(db, at) }); }
  const shutdown = settings.find(row => row.key === 'planner.shutdown')?.value;
  const bedtime = settings.find(row => row.key === 'planner.bedtime')?.value;
  const shutdownTime = effectiveShutdown(typeof shutdown === 'string' ? shutdown : RULES.night.defaultShutdown, typeof bedtime === 'string' ? bedtime : RULES.night.defaultBedtime);
  const dismissed = settings.find(row => row.key === 'planner.freshStartDismissed')?.value;
  const fresh = !awayToday && needsFreshStart(board.tasks, logs, today) && dismissed !== today;
  async function dismissFresh() { const at = board.now; await db.settings.put({ key: 'planner.freshStartDismissed', value: today, updatedAt: at, deleted: 0, deviceId: await getOrCreateDeviceId(db, at) }); }
  async function pinMust(task: TaskRow) {
    const occupied = todayOpen.filter(row => row.scheduledStart != null).map(row => ({ start: row.scheduledStart!, end: row.scheduledEnd ?? row.scheduledStart! + (row.estimateMin ?? 30) * 60_000 }));
    const slot = suggestSlots(board.now, task.estimateMin ?? 30, occupied).find(at => dayKey(at) === today);
    if (slot == null) { setPickNote({ id: task.id, text: 'No free time left today. Open the task and choose a time.' }); return; }
    setPickNote(null);
    // A refusal (say, a first step needed) shows next to the choices, not far down Plan (Codex A item 87).
    let failure = '';
    const ok = await board.act(async (repos, at) => { try { if (task.status !== 'planned' || task.dayKey !== today) await repos.moveTask(task.id, at, { day: today, start: slot }); await repos.setPriority(task.id, 'must', at); } catch (caught) { failure = errorMessage(caught); throw caught; } }, 'One Must picked.');
    if (!ok) setPickNote({ id: task.id, text: failure ? `${failure} Open the task to move it.` : 'That did not save. Try again.' });
    if (ok) { await dismissFresh(); setPickMust(false); }
  }
  if (questId) return <section className="screen plan-screen"><SideQuests selectedId={questId} /></section>;
  // Spec 15: on a tired or low day Plan shows one gentle card only, until the person says they feel okay or want more.
  const soft = softToday(softFacts, today);
  const softMore = settings.some(row => row.key === softMoreKey(today) && row.value === true);
  const afterBed = isAfterBedtime(board.now, typeof bedtime === 'string' ? bedtime : RULES.night.defaultBedtime);
  if (soft.state && !softMore) return <section className="screen plan-screen soft-screen"><FriendStage area="plan" size={64} compact><p className="eyebrow">Go gently</p><h1>Plan</h1></FriendStage><SoftHome state={soft.state} today={today} done={!!soft.done} facts={softFacts} settings={settings} tasks={board.tasks} act={board.act} /></section>;
  return <section className="screen plan-screen"><FriendStage area="plan" size={64} compact><p className="eyebrow">Make room for what matters</p><h1>Plan</h1></FriendStage><div className="cast-inline">{awayToday && <Cast name="Kachhua" pose="rest" size={48} title="Kachhua resting" />}</div>{awayToday && <p>You're away. Rest well.</p>}
    {/* Spec 27 (and Codex A item 91, the spec owner's call): the three lists come first; the older cards follow. */}
    <MorList board={board} onDetail={setDetail} avgHidden={avgHidden} hideAverage={() => void hideAverage()} outerMove={outerMove} />
    {!soft.state && !awayToday && <SoftChip afterBedtime={afterBed} />}{yesterdayWasSoft(softFacts, today) && <p className="small soft-note">Yesterday was a soft day. You still showed up.</p>}
    {fresh && <section className="card fresh-start" aria-label="Fresh start"><p>Yesterday didn't go to plan. That's data, not a verdict.</p><div className="sheet-actions"><button type="button" onClick={() => { void dismissFresh(); go('plan/morning'); }}>Plan today</button><button type="button" className="secondary" onClick={() => setPickMust(true)}>Pick one Must</button></div>{pickMust && <div>{board.tasks.filter(task => !task.deleted && task.status !== 'done' && task.status !== 'dropped' && !board.tasks.some(child => child.parentId === task.id && !child.deleted)).map(task => <div key={task.id}><button type="button" className="secondary fresh-choice" onClick={() => void pinMust(task)}>{task.title}</button>{pickNote?.id === task.id && <p role="alert" tabIndex={-1} ref={pickNoteRef}>{pickNote.text}</p>}</div>)}</div>}</section>}
    <MorningBackfill today={today} now={board.now} logs={logs} hadYesterday={hadYesterday} />{askAgency && <AgencyCheck now={board.now} />}<StorybookCard today={today} /><CourtyardBanner />
    {/* Spec 26: from 20:00 (until the 04:00 day line), Kachhua's kolam for tonight. */}
    {(new Date(board.now).getHours() >= 20 || new Date(board.now).getHours() < 4) && <section className="card kolam-card" aria-label="Tonight's kolam"><h2>Tonight's kolam</h2><p className="small">One slow line around every dot, with Kachhua.</p><button type="button" className="secondary" onClick={() => go('kolam')}>Trace it</button></section>}
    <PhoneChhutti />
    <SideQuests />
    <details className="card plan-more"><summary><strong>More</strong><span className="small">Routines, focus timer, reminders</span></summary>
      <section className="plan-rituals" aria-label="Planning routines"><h2>Rituals</h2><div className="ritual-buttons"><button type="button" onClick={() => go('plan/morning')}><DeckGlyph type="do" />Morning plan<small>2 min</small></button><button type="button" onClick={() => go('plan/shutdown')}><DeckGlyph type="night" />Shutdown<small>5 min</small></button><button type="button" onClick={() => go('plan/review')}><DeckGlyph type="extra" />Weekly review<small>Sundays</small></button></div></section>
      {/* A fuller add form (size, priority, a start time, repeat, split preview) for those who want it. */}
      <TaskQuickAdd run={board.act} tasks={board.tasks} focus={board.focus} label="Add with details" />
      <button type="button" className="secondary" onClick={() => go('plan/focus')}>Focus timer with breaks</button>
      {night.shift > 0 && <p className="small busy-day">Busy day: about {Math.round(night.plannedMinutes / 60)} h planned, so tonight starts {night.shift} min later (bedtime {night.bedtime}). <button type="button" className="text-button" onClick={() => void keepUsualNight()}>Keep my usual time</button></p>}
      <p className="day-horizon small">{dayHorizon(todayOpen.reduce((sum, task) => sum + (task.estimateMin ?? 0), 0), board.now, shutdownTime)}</p>
      <Reminders />
    </details>
    {detail && <TaskDetail key={detail.id} task={board.tasks.find(row => row.id === detail.id) ?? detail} tasks={board.tasks} focus={board.focus} events={events} run={board.act} close={() => setDetail(null)} move={() => { setMoving(detail); setDetail(null); }} />}
    {moving && <PostponeSheet key={moving.id} task={moving} run={board.act} close={() => setMoving(null)} onMoved={at => setRespace({ task: moving, at })} onUndoable={(task, before, where) => setOuterMove(current => ({ task, before, where, at: (current?.at ?? 0) + 1, writes: board.writesRef.current }))} />}
    {respace && <div className="sheet-backdrop"><section ref={respaceDialog} tabIndex={-1} className="task-sheet" role="dialog" aria-modal="true" aria-label="Re-space checkpoints"><h2>Re-space the remaining checkpoints?</h2><div className="sheet-actions"><button type="button" onClick={() => void board.act((repos, now) => repos.respaceRemainingCheckpoints(respace.task.id, respace.at, now), 'Checkpoints updated.').then(() => setRespace(null))}>Re-space</button><button type="button" className="secondary" onClick={() => setRespace(null)}>Keep them</button></div></section></div>}
  </section>;
}
