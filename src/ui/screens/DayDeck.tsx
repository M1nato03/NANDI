import { lazy, Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import PZ from '../../core/puzzles';
import { dailyBoard, featuredSpec } from '../../core/puzzles/daily';
import CaseGen from '../../core/mysteries';
import { EXERCISE_LIBRARY, LADDERS, PROGRAMS } from '../../core/train';
import { createTrainRepos } from '../../data/repos/train';
import { createQuestRepo } from '../../data/repos/quests';
import { getOrCreateDeviceId } from '../../data/device';
import { ulid } from 'ulidx';
import { tapHaptic } from '../../platform/haptics';
import { focusPhase, isFocusRunning } from '../../core/tasks/focus';
import { elapsed } from '../tasks/model';
import { RULES } from '../../core/rules.config';
import { effectiveShutdown } from '../../core/tasks/planner';
import { deckMode } from '../../core/deckMode';
import { dayKey } from '../../core/time/dayKey';
import { weekKey } from '../../core/quests';
import { db } from '../../data/db';
import { caseRunId } from '../../data/repos/mysteries';
import { dailyDropId } from '../learn/dropIds';
import { DelayedCardSkeleton } from '../shell/DelayedCardSkeleton';
import { preloadOnIdle } from '../shell/preloadOnIdle';
import { todayTasks } from '../tasks/model';
import type { useTaskBoard } from '../tasks/useTaskBoard';
import { deckNavigation, type DeckAction } from '../../core/deckNavigation';
import { deckIndex, go, goToCard, navigationEventName } from '../shell/router';
import { DeckGlyph, type Glyph } from '../DeckGlyph';
import { ReviewToday } from '../mind/ReviewToday';

const LearnDrop = lazy(() => import('../learn/LearnDrop').then(module => ({ default: module.LearnDrop })));
const WeeklyRecap = lazy(() => import('./WeeklyRecap').then(module => ({ default: module.WeeklyRecap })));
const WeekEndShare = lazy(() => import('./WeekEndShare').then(module => ({ default: module.WeekEndShare })));

type DeckCard = { id: string; tag: string; title: string; detail: string; action: string; href?: string; secondary?: string };
const questRepo = createQuestRepo(db);
const shortTime = (ms: number) => `${Math.floor(ms / 60_000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

export function DayDeck({ board }: { board: ReturnType<typeof useTaskBoard> }) {
  useEffect(() => preloadOnIdle(() => import('./Train')), []);
  const [index, setIndex] = useState(deckIndex);
  const [quickTitle, setQuickTitle] = useState('');
  const [message, setMessage] = useState('');
  const [animating, setAnimating] = useState('');
  const [confirmVolume, setConfirmVolume] = useState(false);
  const [cyclePreset, setCyclePreset] = useState<'25/5' | '50/10'>('25/5');
  const [taskResult, setTaskResult] = useState('');
  const touchY = useRef<number | null>(null);
  const today = dayKey(board.now);
  const settings = useLiveQuery(() => db.settings.toArray(), []) ?? [];
  const log = useLiveQuery(() => db.dailyLog.get(today), [today]);
  const dailyDrop = useLiveQuery(() => db.learnDrops.get(dailyDropId(board.now)), [today]);
  const learnDone = !!dailyDrop && dailyDrop.drop.cursor >= dailyDrop.drop.items.length;
  const quests = useLiveQuery(() => db.quests.where('week').equals(weekKey(board.now)).toArray(), [weekKey(board.now)]) ?? [];
  const runs = useLiveQuery(() => db.puzzleRuns.toArray(), []) ?? [];
  const trainProgram = useLiveQuery(() => db.programs.get('train-program'), []);
  const sessions = useLiveQuery(() => db.sessions.filter(row => !row.deleted).toArray(), []) ?? [];
  const activeWorkout = useLiveQuery(() => db.sessions.where('status').equals('active').filter(row => !row.deleted).first(), []);
  useEffect(() => { void questRepo.ensureWeek(Date.now()).catch(() => setMessage('Side quests could not load.')); }, []);
  const setting = (key: string, fallback: string) => {
    const value = settings.find(row => row.key === key && !row.deleted)?.value;
    return typeof value === 'string' ? value : fallback;
  };
  const bedtime = setting('planner.bedtime', RULES.night.defaultBedtime);
  const shutdown = effectiveShutdown(setting('planner.shutdown', RULES.night.defaultShutdown), bedtime);
  const night = deckMode(board.now, shutdown, bedtime, log?.windDownAt);
  const task = todayTasks(board.tasks, board.now)[0];
  const taskFocus = task ? board.focus.find(row => row.taskId === task.id && !row.endedAt) : undefined;
  const phase = taskFocus ? focusPhase(taskFocus, board.now) : null;
  const featured = featuredSpec(today);
  const puzzle = useMemo(() => night === 'day' ? dailyBoard(today) : null, [today, night]);
  const mystery = useMemo(() => night === 'day' ? CaseGen.daily(today) : null, [today, night]);
  const boardDone = runs.some(row => row.id === `daily:${today}:${featured.type}:${featured.diff}` && row.result === 'solved' && !row.deleted);
  const caseDone = runs.some(row => row.id === caseRunId(today) && (row.result === 'solved' || row.result === 'revealed') && !row.deleted);
  const questRows = quests.filter(row => row.status !== 'swapped' && !row.deleted);
  const questDone = questRows.filter(row => row.status === 'done').length;
  const quest = questRows.find(row => row.status === 'active' && !row.custom && row.progress === 0) ?? questRows.find(row => row.status === 'active') ?? questRows.find(row => row.status === 'done');
  const questWhy = quest ? quest.sourceId.includes('walk') || quest.sourceId.includes('stairs') ? 'A change of pace can clear your head.' : quest.sourceId.includes('read') || quest.sourceId.includes('book') ? 'Give an idea room to stay with you.' : quest.sourceId.includes('friend') || quest.sourceId.includes('family') || quest.sourceId.includes('meal') ? 'A small moment of attention can deepen a connection.' : 'A small real-world detour can make today memorable.' : '';
  const questTime = quest?.kind === 'total' ? '10 min today' : 'About 20 min';
  const plan = activeWorkout?.templateKey ? PROGRAMS[activeWorkout.templateKey] : trainProgram?.track === 'gym' ? PROGRAMS[(trainProgram.sessionsStarted ?? 0) % 2 ? 'gym-foundations-b' : 'gym-foundations-a'] : PROGRAMS['hostel-bodyweight'];
  const exercises = (activeWorkout?.planned ?? plan?.exercises ?? []).slice(0, 4).map(ex => {
    const ladder = ex.isBodyweightLadder ? LADDERS[ex.isBodyweightLadder] : undefined;
    const rank = Math.max(1, Math.min(ladder?.length ?? 1, trainProgram?.placement?.[ex.isBodyweightLadder ?? ''] ?? (trainProgram ? Math.ceil((ladder?.length ?? 1) / 2) : 1)));
    const id = ladder?.[rank - 1]?.exerciseId ?? ex.exerciseId;
    return { ...ex, name: EXERCISE_LIBRARY[id]?.name ?? id };
  });
  const trainDone = sessions.some(row => row.dayKey === today && row.status !== 'active' && row.status !== 'skipped');
  const doneTasks = board.tasks.filter(row => !row.deleted && row.doneAt && dayKey(row.doneAt) === today);
  const tomorrowDate = new Date(`${today}T12:00:00`); tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = dayKey(tomorrowDate.getTime());
  const tomorrowTask = board.tasks.find(row => !row.deleted && row.status !== 'done' && row.dayKey === tomorrow);
  const best = runs.filter(row => row.type === featured.type && row.diff === featured.diff && row.result === 'solved' && row.solveMs).sort((a, b) => (a.solveMs ?? 0) - (b.solveMs ?? 0))[0];
  const last = runs.filter(row => row.type === featured.type && row.diff === featured.diff && row.result === 'solved' && row.solveMs).sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))[0];
  const focusMinutes = Math.round(board.focus.filter(row => row.endedAt && dayKey(row.endedAt) === today).reduce((sum, row) => sum + (row.endedAt! - row.startedAt), 0) / 60_000);
  const summary = [doneTasks.length ? `Finished ${doneTasks.map(row => row.title).slice(0, 3).join(', ')}${doneTasks.length > 3 ? ` and ${doneTasks.length - 3} more` : ''}` : '', focusMinutes ? `Focused for ${focusMinutes} minutes` : '', trainDone ? 'Moved through a workout' : '', boardDone ? 'Solved the board' : '', caseDone ? 'Solved the case' : '', questDone ? `Completed ${questRows.filter(row => row.status === 'done').map(row => row.title).slice(0, 2).join(' and ')}` : ''].filter(Boolean);
  const recapDay = new Date(`${today}T12:00:00`).getDay() === 1;
  const dayCards: DeckCard[] = [
    ...(recapDay ? [{ id: 'recap', tag: 'Your week', title: 'What your time became', detail: '', action: 'Share' }] : []),
    { id: 'task', tag: 'First step', title: task?.title ?? 'Choose your first step.', detail: task ? `${task.firstStep ? `${task.firstStep} · ` : ''}${task.estimateMin ?? 25} minutes` : 'One small task is enough to begin.', action: 'Start', secondary: 'Done' },
    { id: 'train', tag: 'Move', title: plan?.name ?? "Today's workout", detail: activeWorkout ? 'Your session is in progress.' : trainProgram ? 'Your next session is ready.' : 'Start with easy bodyweight steps. Adjust your plan in Train later.', action: activeWorkout ? 'Continue session' : 'Start session', secondary: 'Just the minimum (10 min)' },
    { id: 'board', tag: 'Think', title: PZ.TYPES[featured.type].name, detail: `${featured.diff} board`, action: 'Play', href: 'you/mind/board' },
    { id: 'case', tag: 'Notice', title: mystery?.title ?? "Today's case", detail: mystery?.setup ?? 'A case is waiting for you.', action: 'Solve', href: 'you/mind/case' },
    { id: 'learn', tag: 'Learn', title: "Today's drop", detail: 'Five quick questions, one clearer idea.', action: 'Start learning' },
    { id: 'quest', tag: 'A little extra', title: quest?.title ?? 'A side quest for today', detail: quest ? `${questWhy} · ${questTime}` : 'A small detour will appear here.', action: 'I did it', secondary: 'Swap' },
    { id: 'end', tag: 'The day is yours', title: "That's today.", detail: summary.length ? summary.join(' · ') : 'The day is still open. One small step is enough.', action: "Plan tomorrow's first step", href: 'plan/shutdown', secondary: 'One more puzzle, just for fun' },
  ];
  const deck = dayCards;
  const complete: Record<string, boolean> = { task: doneTasks.length > 0, train: trainDone, board: boardDone, case: caseDone, quest: questDone > 0, learn: learnDone };
  const deckFinished = ['task', 'train', 'board', 'case', 'quest', 'learn'].every(id => complete[id]);
  const learnReady = learnDone;
  const at = Math.min(index, deck.length - 1);
  const card = deck[at]!;
  const area = ({ task: 'do', train: 'move', board: 'think', case: 'notice', learn: 'learn', quest: 'extra', end: 'end', recap: 'end' } as Record<string, Glyph>)[card.id] ?? 'do';
  const navigate = (action: DeckAction) => {
    const destination = deckNavigation({ index: at, length: deck.length }, action).index;
    if (destination !== at) goToCard(destination);
  };
  const next = () => navigate({ type: 'next' });
  const previous = () => navigate({ type: 'previous' });
  useEffect(() => {
    const update = () => setIndex(deckIndex());
    window.addEventListener('popstate', update);
    window.addEventListener(navigationEventName(), update);
    return () => { window.removeEventListener('popstate', update); window.removeEventListener(navigationEventName(), update); };
  }, []);
  useEffect(() => {
    if (night !== 'day') return;
    if (sessionStorage.getItem('nandi.deck.mode') === 'night') goToCard(0);
    sessionStorage.setItem('nandi.deck.mode', 'day');
  }, [night]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp'].includes(event.key)) return;
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes((event.target as HTMLElement).tagName)) return;
      event.preventDefault();
      const requested = deckNavigation({ index: deckIndex(), length: deck.length }, { type: event.key === 'ArrowUp' || event.key === 'PageUp' ? 'previous' : 'next' }).index;
      goToCard(requested);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [deck.length]);
  const celebrate = (id: string) => {
    setAnimating(id);
    window.setTimeout(() => setAnimating(current => current === id ? '' : current), 800);
    void tapHaptic(true).catch(() => undefined);
  };
  useEffect(() => {
    const pending = sessionStorage.getItem('nandi.deck.awaiting');
    const ready = pending === 'board' && boardDone || pending === 'case' && caseDone || pending === 'train' && trainDone || pending === 'learn' && learnReady;
    if (night === 'day' && pending && ready) {
      sessionStorage.removeItem('nandi.deck.awaiting');
      const timer = window.setTimeout(() => { setAnimating(pending); void tapHaptic(true).catch(() => undefined); }, 0);
      const clear = window.setTimeout(() => setAnimating(''), 800);
      return () => { window.clearTimeout(timer); window.clearTimeout(clear); };
    }
  }, [boardDone, caseDone, trainDone, learnReady, night]);
  const markTask = async () => {
    if (!task) return;
    const actual = Math.round(board.focus.filter(row => row.taskId === task.id).reduce((sum, row) => sum + elapsed(row, board.now), 0) / 60_000);
    const ok = await board.act(async (repos, now) => {
      for (const row of board.focus.filter(item => item.taskId === task.id && !item.endedAt)) await repos.finishFocus(row.id, now);
      await repos.completeTask(task.id, now);
    }, 'Task done.');
    if (ok) { setTaskResult(`Planned ${task.estimateMin ?? 25} min · Took ${actual} min`); celebrate('task'); }
  };
  const addTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    const ok = await board.act(async (repos, now) => { await repos.createTask({ title, size: 'S', estimateMin: 25, mustOrCould: 'could', scheduledStart: now, dayKey: dayKey(now) }, now); }, 'First step added.');
    if (ok) setQuickTitle('');
  };
  const startWorkout = async (small: boolean) => {
    if (activeWorkout) { if (!trainDone) sessionStorage.setItem('nandi.deck.awaiting', 'train'); go('you/train/workout'); return; }
    try {
      const now = board.now;
      const id = await getOrCreateDeviceId(db, now);
      const repos = createTrainRepos(db, id);
      if (!trainProgram) await repos.completeOnboarding({ track: 'bodyweight', equipment: { gymAccess: false, dumbbells: false, barbell: null, smallestPlate: null, resistanceBand: false, pullUpBar: false, sturdyAnchor: false }, days: [1, 3, 5], weeklyTarget: 3, restDay: 0, heatModeEnabled: false, placement: { squat: 1, 'push-up': 1, hinge: 1, row: 1, 'core-anti-ext': 1, 'core-anti-rot': 1, 'core-ext': 1 } }, now);
      await repos.startSession(now, { confirmVolume, readiness: small ? 'minimum:10-minutes' : 'deck' });
      if (!trainDone) sessionStorage.setItem('nandi.deck.awaiting', 'train');
      go('you/train/workout');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not start the session.'); }
  };
  const checkQuest = async () => {
    if (!quest || quest.status !== 'active') return;
    try {
      if (quest.kind === 'once') await questRepo.done(quest.id, board.now);
      else await questRepo.tap(quest.id, ulid(), quest.step, board.now);
      setMessage(quest.kind === 'total' && quest.progress + quest.step < quest.target ? 'Progress saved.' : 'Side quest done.');
      celebrate('quest');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save this side quest.'); }
  };
  const swapQuest = async () => {
    try { await questRepo.swap(board.now); setMessage('A fresh side quest is here.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not swap this side quest.'); }
  };
  const action = () => {
    if (card.id === 'task' && task) {
      if (taskFocus) void board.act((repos, now) => isFocusRunning(taskFocus) ? repos.pauseFocus(taskFocus.id, now) : repos.resumeFocus(taskFocus.id, now), isFocusRunning(taskFocus) ? 'Focus paused.' : 'Focus resumed.');
      else void board.act((repos, now) => repos.startFocus(task.id, now, cyclePreset), 'Focus started.');
    }
    else if (card.id === 'train') void startWorkout(false);
    else if (card.id === 'quest') void checkQuest();
    else if (card.href) { if (['board', 'case', 'learn'].includes(card.id) && !complete[card.id]) sessionStorage.setItem('nandi.deck.awaiting', card.id); go(card.href); }
  };
  const secondary = () => {
    if (card.id === 'task') void markTask();
    if (card.id === 'train') void startWorkout(true);
    if (card.id === 'quest') void swapQuest();
    if (card.id === 'end') go('you/mind/practice');
  };
  const previewSize = puzzle ? 'N' in puzzle ? puzzle.N : puzzle.type === 'sunmoon' ? 6 : puzzle.C : 0;
  const previewValues = puzzle ? puzzle.type === 'sudoku' ? puzzle.givens : puzzle.type === 'sunmoon' ? puzzle.given.map(value => value < 0 ? '' : value ? <span aria-hidden="true">☀</span> : <span aria-hidden="true">☾</span>) : puzzle.type === 'path' ? Array.from({ length: puzzle.R * puzzle.C }, (_, i) => puzzle.waypoints.includes(i) ? String(puzzle.waypoints.indexOf(i) + 1) : '') : puzzle.type === 'crowns' ? puzzle.region.map(() => '') : Array.from({ length: puzzle.N * puzzle.N }, (_, i) => puzzle.cages.find(cage => cage.cells[0] === i)?.target ?? '') : [];
  return <section className="screen deck-screen" aria-label="Now deck" onTouchStart={event => { if (card.id !== 'learn') touchY.current = event.touches[0]?.clientY ?? null; }} onTouchEnd={event => { if (touchY.current != null) { const distance = touchY.current - (event.changedTouches[0]?.clientY ?? touchY.current); if (distance > 55) next(); else if (distance < -55) previous(); } touchY.current = null; }}>
    <div className="deck-heading"><h1>Now</h1><span className="deck-count">{at + 1} of {deck.length}</span></div>
    <div className="deck-dashes" role="group" aria-label={`Card ${at + 1} of ${deck.length}`}>{deck.map((item, i) => <button type="button" key={item.id} className={complete[item.id] ? 'complete' : i === at ? 'active' : ''} data-area={item.id} aria-label={`Go to card ${i + 1}: ${item.tag}${complete[item.id] ? ', complete' : ''}`} aria-current={i === at ? 'step' : undefined} onClick={() => navigate({ type: 'jump', index: i })} />)}</div>
    <article className={`deck-card card deck-area-${area}${complete[card.id] ? ' is-complete' : ''}${animating === card.id ? ' just-completed' : ''}`} aria-label={`${card.tag} card`} key={card.id}><div className="deck-card-head"><DeckGlyph type={area} /><span className="deck-eyebrow">{card.tag}</span>{complete[card.id] && !(card.id === 'task' && task) && <span className="deck-check" aria-label="Complete">✓</span>}</div>{card.id === 'learn' ? <><ReviewToday day={today} /><Suspense fallback={<DelayedCardSkeleton insideCard />}><LearnDrop onDone={next} /></Suspense></> : card.id === 'recap' ? <Suspense fallback={<DelayedCardSkeleton insideCard />}><WeeklyRecap now={board.now} /></Suspense> : <><div className="deck-card-body"><h2>{card.title}</h2><p className="deck-context">{card.detail}</p>
      {card.id === 'task' && task && <><p className="deck-meta">{task.estimateMin ?? 25} min planned{task.firstStep ? ` · First: ${task.firstStep}` : ''}</p>{!taskFocus && <label className="deck-cycle">Focus cycle <select aria-label="Focus cycle" value={cyclePreset} onChange={event => setCyclePreset(event.target.value as '25/5' | '50/10')}><option value="25/5">25 min work / 5 min break</option><option value="50/10">50 min work / 10 min break</option></select></label>}{taskFocus && phase && <><div className="inline-timer" role="timer" aria-label="Focus countdown"><strong>{shortTime(phase.remainingMs)}</strong><span>{phase.paused ? 'Paused' : phase.phase === 'work' ? 'Focus in progress' : 'Break time'}</span></div><p role="status">{phase.paused ? 'Paused · ' : ''}{phase.phase === 'work' ? 'Focus' : phase.phase === 'longBreak' ? 'Long break' : 'Break'} · cycle {phase.cycle} · {shortTime(phase.remainingMs)} left</p>{phase.phase !== 'work' && <p>A quiet break is here. Stretch, drink water, or step away.</p>}</>}</>}
      {card.id === 'task' && !task && <form className="deck-add" onSubmit={event => void addTask(event)}><label htmlFor="deck-task-title">Your first step</label><input id="deck-task-title" value={quickTitle} maxLength={160} onChange={event => setQuickTitle(event.target.value)} placeholder="Name one small task" required /><button type="submit" disabled={board.busy}>Add</button></form>}
      {card.id === 'task' && taskResult && <p className="task-result" role="status">{taskResult}</p>}
      {card.id === 'train' && exercises.length > 0 && <ol className="deck-exercises">{exercises.map(ex => <li key={ex.exerciseId}><span>{ex.name}</span><strong>{ex.sets} × {ex.repMin}–{ex.repMax}{ex.isHold ? ' sec' : ''}</strong></li>)}</ol>}
      {card.id === 'board' && <><div className="deck-puzzle" role="img" aria-label={`Preview of ${card.title} board`} style={{ gridTemplateColumns: `repeat(${previewSize}, 1fr)` }}>{previewValues.map((value, i) => <span key={i} className={puzzle?.type === 'crowns' ? `region-${puzzle.region[i] ?? 0}` : ''}>{value || ''}</span>)}</div><p className="deck-meta">{featured.diff} · {best?.solveMs ? `Best ${shortTime(best.solveMs)}` : 'First try today'}{last?.solveMs ? ` · Last ${shortTime(last.solveMs)}` : ''}</p></>}
      {card.id === 'case' && mystery && <p className="deck-meta">{mystery.clues.length} clues to follow</p>}
      {card.id === 'quest' && quest && <p className="deck-meta">{quest.kind === 'total' ? `${quest.progress} of ${quest.target} ${quest.unit} · each tap adds ${quest.step}` : 'A one-time quest'} · {questTime}</p>}
      {card.id === 'end' && <div className="deck-end"><p><strong>Tomorrow's first step</strong><br />{tomorrowTask?.title ?? 'Pick one small step tonight.'}</p><p><strong>Lights-out</strong><br />{bedtime}</p>{deckFinished && <p className="deck-celebration" role="status">You made room for the whole day. Rest well. ✦</p>}<Suspense fallback={null}><WeekEndShare now={board.now} /></Suspense></div>}</div>
      <div className="deck-actions">{!(card.id === 'task' && !task) && <button type="button" onClick={action} disabled={card.id === 'quest' && (!quest || quest.status !== 'active')}>{card.id === 'task' && taskFocus ? isFocusRunning(taskFocus) ? 'Pause' : 'Resume' : card.action}</button>}{card.secondary && <button type="button" className="secondary" onClick={secondary} disabled={card.id === 'quest' && questRows.some(row => row.status === 'swapped')}>{card.secondary}</button>}{card.id === 'task' && task && <button type="button" className="text-button" onClick={next}>Not now</button>}{card.id === 'train' && message.includes('20%') && <label className="deck-confirm"><input type="checkbox" checked={confirmVolume} onChange={event => setConfirmVolume(event.target.checked)} /> Confirm the weekly hard-set increase</label>}</div></>}
    </article>
    {card.id !== 'learn' && (at < deck.length - 1 ? <button type="button" className="secondary deck-next" onClick={next}>Next</button> : <button type="button" className="secondary deck-next" onClick={previous} aria-label="Back to cards">Back to cards</button>)}
    {(board.message || message) && <p role="status">{board.message || message}</p>}
  </section>;
}
