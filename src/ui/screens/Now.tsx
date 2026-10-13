import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import PZ from '../../core/puzzles';
import { featuredSpec } from '../../core/puzzles/daily';
import { RULES } from '../../core/rules.config';
import { effectiveShutdown, nightWindow } from '../../core/tasks/planner';
import { dayKey } from '../../core/time/dayKey';
import { weekKey } from '../../core/quests';
import { chooseTrackDay } from '../../core/learn/tracks';
import { db } from '../../data/db';
import { caseRunId } from '../../data/repos/mysteries';
import { trackPacks } from '../mind/Tracks';
import { currentFocus, todayTasks } from '../tasks/model';
import { useTaskBoard } from '../tasks/useTaskBoard';
import { focusElapsedMs } from '../../core/tasks/focus';
import { parseMeditation } from '../../core/mind/meditation';
import { MEDITATION_KEY, MEDITATION_HISTORY } from '../../data/repos/meditation';
import { go } from '../shell/router';

type DeckCard = { id: string; tag: string; title: string; detail: string; action: string; href?: string; secondary?: string };

export function Now() {
  const board = useTaskBoard();
  const [index, setIndex] = useState(0);
  const touchY = useRef<number | null>(null);
  const today = dayKey(board.now);
  const settings = useLiveQuery(() => db.settings.toArray(), []) ?? [];
  const log = useLiveQuery(() => db.dailyLog.get(today), [today]);
  const quests = useLiveQuery(() => db.quests.where('week').equals(weekKey(board.now)).toArray(), [weekKey(board.now)]) ?? [];
  const runs = useLiveQuery(() => db.puzzleRuns.toArray(), []) ?? [];
  const cards = useLiveQuery(() => db.cards.toArray(), []) ?? [];
  const lessonProgress = useLiveQuery(() => db.lessonProg.toArray(), []) ?? [];
  const trainProgram = useLiveQuery(() => db.programs.get('train-program'), []);
  const activeWorkout = useLiveQuery(() => db.sessions.where('status').equals('active').filter(row => !row.deleted).first(), []);
  const setting = (key: string, fallback: string) => {
    const value = settings.find(row => row.key === key && !row.deleted)?.value;
    return typeof value === 'string' ? value : fallback;
  };
  const bedtime = setting('planner.bedtime', RULES.night.defaultBedtime);
  const shutdown = effectiveShutdown(setting('planner.shutdown', RULES.night.defaultShutdown), bedtime);
  const night = nightWindow(board.now, shutdown, bedtime, log?.windDownAt);
  const focus = currentFocus(board.focus);
  const task = focus ? board.tasks.find(row => row.id === focus.taskId && !row.deleted) : todayTasks(board.tasks, board.now)[0];
  const planned = todayTasks(board.tasks, board.now).length;
  const activeMeditation = parseMeditation(settings.find(row => row.key === MEDITATION_KEY && !row.deleted)?.value);
  const meditationDone = settings.some(row => row.key.startsWith(MEDITATION_HISTORY) && !row.deleted && parseMeditation(row.value)?.dayKey === today);
  const restDay = !!trainProgram?.days?.length && !trainProgram.days.includes(new Date(`${today}T12:00:00`).getDay());
  const featured = featuredSpec(today);
  const boardDone = runs.some(row => row.id === `daily:${today}:${featured.type}:${featured.diff}` && row.result === 'solved' && !row.deleted);
  const caseDone = runs.some(row => row.id === caseRunId(today) && (row.result === 'solved' || row.result === 'revealed') && !row.deleted);
  const dueCount = cards.filter(row => !row.deleted && row.due <= today).length;
  const activePack = trackPacks.find(pack => pack.id === settings.find(row => row.key === 'mind.activeTrack' && !row.deleted)?.value);
  const trackUnits = activePack?.body.modules.flatMap(module => module.units) ?? [];
  const completedUnits = activePack ? lessonProgress.filter(row => row.packId === activePack.id && row.doneDayKey && row.id.startsWith('track:')).map(row => ({ id: row.id.split(':').at(-1)!, day: row.doneDayKey! })) : [];
  const trackPlan = activePack ? chooseTrackDay({ day: today, active: true, unitIds: trackUnits.map(row => row.id), completed: completedUnits, dueReviews: dueCount }) : null;
  const learningUnit = trackPlan?.kind === 'new' ? trackUnits.find(row => row.id === trackPlan.unitId) : undefined;
  const questRows = quests.filter(row => row.status !== 'swapped' && !row.deleted);
  const questDone = questRows.filter(row => row.status === 'done').length;
  const focusMinutes = Math.round(board.focus.filter(row => row.endedAt && dayKey(row.endedAt) === today).reduce((sum, row) => sum + focusElapsedMs(row, row.endedAt!), 0) / 60_000);
  const taskCard: DeckCard = { id: 'task', tag: 'Your tasks', title: task?.title ?? 'Work, chores, life.', detail: focus ? 'Your focus timer is saved. Pick up where you left off.' : task ? `${task.firstStep ? `${task.firstStep} · ` : ''}${task.estimateMin ?? RULES.tasks.focus.workMin} minutes on your plan` : 'Add the things that matter today. Learning can wait for a free moment.', action: focus ? 'Continue focus' : task ? `Start ${RULES.tasks.focus.workMin} minutes` : 'Open Plan', href: task ? 'now/focus' : 'plan', secondary: task ? 'Done already' : undefined };
  const trainCard: DeckCard = { id: 'train', tag: 'Move', title: restDay && !activeWorkout ? 'Room for recovery.' : "Today's workout", detail: activeWorkout ? 'Your session is in progress.' : restDay ? 'Today is outside your training schedule. Rest or choose gentle movement.' : trainProgram ? `${trainProgram.track === 'gym' ? 'Gym foundations' : 'Hostel bodyweight'} · your next session is ready.` : 'Set your starting level to shape your program.', action: activeWorkout ? 'Continue session' : 'Open Train', href: 'you/train' };
  const meditationCard: DeckCard = { id: 'meditate', tag: 'Settle', title: activeMeditation ? 'Your quiet time is saved.' : meditationDone ? 'A little calm, already made.' : 'A few quiet minutes.', detail: meditationDone ? 'Your practice is saved for today. Return whenever you want.' : 'Breathe at your own pace before the day gets busy.', action: activeMeditation ? 'Continue meditation' : 'Open meditation', href: 'you/mind/meditate' };
  const dayCards: DeckCard[] = [
    { id: 'plan', tag: 'Plan your day', title: 'Shape your day.', detail: planned ? `${planned} ${planned === 1 ? 'task' : 'tasks'} planned. Make room for work, chores, movement and rest.` : 'Plan this morning or the night before. Choose a manageable first step.', action: log?.planDone ? 'Open Plan' : 'Plan my day', href: log?.planDone ? 'plan' : 'plan/morning', secondary: 'Plan tonight' },
    trainCard,
    meditationCard,
    taskCard,
    { id: 'learn', tag: 'In your free time', title: dueCount ? 'Keep your learning alive.' : learningUnit?.title ?? 'Learn something you care about.', detail: dueCount ? 'Your due reviews are ready for a short session.' : learningUnit && activePack ? `${activePack.body.track.name} · ${learningUnit.minutes} minute lesson plus a short check` : 'Choose a learning track or a short lesson when you have time.', action: dueCount ? 'Review cards' : 'Open Learn', href: dueCount ? 'you/learn/reviews' : 'you/learn' },
    { id: 'board', tag: 'Think', title: "Today's puzzle board", detail: `${PZ.TYPES[featured.type].name} · ${featured.diff}${boardDone ? ' · complete' : ''}. An optional break.`, action: boardDone ? 'See Mind' : 'Open board', href: boardDone ? 'you/mind' : 'you/mind/board' },
    { id: 'case', tag: 'Notice', title: "Today's mystery case", detail: caseDone ? 'Case complete.' : 'An optional small case, if you feel like it.', action: caseDone ? 'See Mind' : 'Open case', href: caseDone ? 'you/mind' : 'you/mind/case' },
    { id: 'quest', tag: 'A little extra', title: 'Side quest', detail: `${questDone} of ${questRows.length} side quests done this week. Take one into your day when it fits.`, action: 'See side quests', href: 'plan' },
    { id: 'end', tag: 'The day is yours', title: "That's today.", detail: `${focusMinutes} minutes on your focus timer · ${questDone} side quests done. You can put the app down.`, action: "Plan tomorrow's first step", href: 'plan/shutdown' },
  ];
  const nightCards: DeckCard[] = [
    { id: 'plan', tag: 'Plan tonight', title: 'Give tomorrow a first step.', detail: 'Set up tomorrow, then let today close.', action: "Plan tomorrow's first step", href: 'plan/shutdown' },
    meditationCard,
    { id: 'lights', tag: 'Lights-out', title: 'Let today close.', detail: log?.lightsOutAt ? 'Check-in saved. Rest when you are ready.' : `Your lights-out time is ${bedtime}.`, action: log?.lightsOutAt ? 'Check-in saved' : 'Lights-out check-in' },
  ];
  const priority = focus ? taskCard : activeWorkout ? trainCard : activeMeditation ? meditationCard : null;
  const routine = night === 'day' ? dayCards : nightCards;
  const deck = priority ? [priority, ...routine.filter(card => card.id !== priority.id)] : routine;
  const at = Math.min(index, deck.length - 1);
  const card = deck[at]!;
  const next = () => setIndex(value => Math.min(deck.length - 1, value + 1));
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowDown' && event.key !== 'PageDown') return;
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes((event.target as HTMLElement).tagName)) return;
      event.preventDefault();
      setIndex(value => Math.min(deck.length - 1, value + 1));
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [deck.length]);
  const action = () => {
    if (card.href) go(card.href);
    else if (card.id === 'lights' && !log?.lightsOutAt) void board.act((repos, now) => repos.recordLightsOut(now), 'Lights-out check-in saved.');
  };
  const secondary = () => {
    if (card.id === 'task' && task) { void board.act(async (repos, now) => { for (const row of board.focus.filter(row => row.taskId === task.id && !row.endedAt && !row.deleted)) await repos.finishFocus(row.id, now); await repos.completeTask(task.id, now); }, 'Task done.').then(ok => { if (ok) next(); }); }
    if (card.id === 'plan') go('plan/shutdown');
  };
  return <section className="screen deck-screen" aria-label="Now deck" onTouchStart={event => { touchY.current = event.touches[0]?.clientY ?? null; }} onTouchEnd={event => { if (touchY.current != null && touchY.current - (event.changedTouches[0]?.clientY ?? touchY.current) > 55) next(); touchY.current = null; }}>
    <div className="deck-heading"><div><p className="eyebrow">Your day, at your pace</p><h1>Now</h1></div><span className="deck-count">{at + 1} of {deck.length}</span></div>
    <p className="small">A suggested order. Skip anything; open any pillar from You.</p>
    <div className="deck-dashes" aria-label={`Card ${at + 1} of ${deck.length}`}>{deck.map((item, i) => <span key={item.id} className={i <= at ? 'active' : ''} />)}</div>
    <article className="deck-card card" aria-label={`${card.tag} card`} key={card.id}><div><span className="pill">{card.tag}</span><h2>{card.title}</h2><p>{card.detail}</p></div>
      <div className="deck-actions"><button type="button" onClick={action} disabled={card.id === 'lights' && !!log?.lightsOutAt}>{card.action}</button>{card.secondary && <button type="button" className="secondary" onClick={secondary}>{card.secondary}</button>}{card.id === 'task' && task && <button type="button" className="text-button" onClick={next}>Not now</button>}</div>
    </article>
    {at < deck.length - 1 && <button type="button" className="secondary deck-next" onClick={next}>Next</button>}
    {board.message && <p role="status">{board.message}</p>}
  </section>;
}
