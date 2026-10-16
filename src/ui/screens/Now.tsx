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
import { todayTasks } from '../tasks/model';
import { useTaskBoard } from '../tasks/useTaskBoard';
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
  const task = todayTasks(board.tasks, board.now)[0];
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
  const focusMinutes = Math.round(board.focus.filter(row => row.endedAt && dayKey(row.endedAt) === today).reduce((sum, row) => sum + (row.endedAt! - row.startedAt), 0) / 60_000);
  const dayCards: DeckCard[] = [
    { id: 'task', tag: 'First step', title: task?.title ?? 'Choose your first step.', detail: task ? `${task.firstStep ? `${task.firstStep} · ` : ''}${task.estimateMin ?? 25} minutes on your plan` : 'One small task is enough to begin.', action: task ? 'Start 25 minutes' : 'Open Plan', href: task ? 'now/focus' : 'plan', secondary: task ? 'Done already' : undefined },
    { id: 'train', tag: 'Move', title: "Today's workout", detail: activeWorkout ? 'Your session is in progress.' : trainProgram ? `${trainProgram.track === 'gym' ? 'Gym foundations' : 'Hostel bodyweight'} · your next session is ready.` : 'Set your starting level to shape your program.', action: activeWorkout ? 'Continue session' : 'Open Train', href: 'you/train' },
    { id: 'board', tag: 'Think', title: "Today's puzzle board", detail: `${PZ.TYPES[featured.type].name} · ${featured.diff}${boardDone ? ' · complete' : ''}`, action: boardDone ? 'See Mind' : 'Open board', href: boardDone ? 'you/mind' : 'you/mind/board' },
    { id: 'case', tag: 'Notice', title: "Today's mystery case", detail: caseDone ? 'Case complete.' : 'A small case is waiting for you.', action: caseDone ? 'See Mind' : 'Open case', href: caseDone ? 'you/mind' : 'you/mind/case' },
    { id: 'learn', tag: 'Learn', title: dueCount ? `${dueCount} reviews due` : learningUnit?.title ?? "Today's learning unit", detail: dueCount ? 'A short review keeps the thread alive.' : learningUnit && activePack ? `${activePack.body.track.name} · ${learningUnit.minutes + 3} minutes` : 'Continue your learning track or daily lesson.', action: dueCount ? 'Review cards' : 'Open learning', href: dueCount ? 'you/mind/reviews' : 'you/mind' },
    { id: 'quest', tag: 'A little extra', title: 'Side quest', detail: `${questDone} of ${questRows.length || 3} side quests done this week.`, action: 'See side quests', href: 'plan' },
    { id: 'end', tag: 'The day is yours', title: "That's today.", detail: `${focusMinutes} minutes of focus · ${questDone} side quests done · lights-out ${bedtime}`, action: "Plan tomorrow's first step", href: 'plan/shutdown', secondary: 'One more puzzle, just for fun' },
  ];
  const nightCards: DeckCard[] = [
    { id: 'lights', tag: 'Lights-out', title: 'Let today close.', detail: log?.lightsOutAt ? 'Check-in saved. Rest when you are ready.' : `Your lights-out time is ${bedtime}.`, action: log?.lightsOutAt ? 'Check-in saved' : 'Lights-out check-in' },
    { id: 'reviews', tag: 'Gentle review', title: 'Reviews can wait or be done now.', detail: dueCount ? `${dueCount} cards are due.` : 'No cards are due right now.', action: 'Open reviews', href: 'you/mind/reviews' },
  ];
  const deck = night === 'lightsOut' ? nightCards : dayCards;
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
    if (card.id === 'task' && task) { void board.act((repos, now) => repos.completeTask(task.id, now), 'Task done.').then(ok => { if (ok) next(); }); }
    if (card.id === 'end') go('you/mind/practice');
  };
  return <section className="screen deck-screen" aria-label="Now deck" onTouchStart={event => { touchY.current = event.touches[0]?.clientY ?? null; }} onTouchEnd={event => { if (touchY.current != null && touchY.current - (event.changedTouches[0]?.clientY ?? touchY.current) > 55) next(); touchY.current = null; }}>
    <div className="deck-heading"><div><p className="eyebrow">One thing at a time</p><h1>Now</h1></div><span className="deck-count">{at + 1} of {deck.length}</span></div>
    <div className="deck-dashes" aria-label={`Card ${at + 1} of ${deck.length}`}>{deck.map((item, i) => <span key={item.id} className={i <= at ? 'active' : ''} />)}</div>
    <article className="deck-card card" aria-label={`${card.tag} card`} key={card.id}><div><span className="pill">{card.tag}</span><h2>{card.title}</h2><p>{card.detail}</p></div>
      <div className="deck-actions"><button type="button" onClick={action} disabled={card.id === 'lights' && !!log?.lightsOutAt}>{card.action}</button>{card.secondary && <button type="button" className="secondary" onClick={secondary}>{card.secondary}</button>}{card.id === 'task' && task && <button type="button" className="text-button" onClick={next}>Not now</button>}</div>
    </article>
    {at < deck.length - 1 && <button type="button" className="secondary deck-next" onClick={next}>Next</button>}
    {board.message && <p role="status">{board.message}</p>}
  </section>;
}
