import { lazy, memo, Suspense, useEffect, useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import PZ from '../../core/puzzles';
import { featuredSpec } from '../../core/puzzles/daily';
import { nightPuzzleBoard, selectNightPuzzle } from '../../core/puzzles/night';
import { dayKey, lightsOutNightKey } from '../../core/time/dayKey';
import { nightPlanText, nightsBackOnPlan, readNightPlan } from '../../core/nightPlan';
import { selectWinddownMove } from '../../core/winddown';
import { weekKey } from '../../core/quests';
import { focusElapsedMs } from '../../core/tasks/focus';
import winddown from '../../../content/winddown/winddown.core.json';
import { db } from '../../data/db';
import { createQuestRepo } from '../../data/repos/quests';
import { DelayedCardSkeleton } from '../shell/DelayedCardSkeleton';
import { preloadOnIdle } from '../shell/preloadOnIdle';
import { deckIndex, go, goToCard, navigationEventName } from '../shell/router';
import type { useTaskBoard } from '../tasks/useTaskBoard';
import { NightPlanSetting } from '../screens/NightPlanSetting';
import { DeckGlyph, type Glyph } from '../DeckGlyph';
import { ReviewToday } from '../mind/ReviewToday';
import { announceFinish } from '../shell/finish';
import { FriendStage } from '../cast/FriendStage';
import { featuredDailyDone } from '../../core/puzzles/shelf';

const LearnDrop = lazy(() => import('../learn/LearnDrop').then(module => ({ default: module.LearnDrop })));
let rememberedSwaps = { day: '', count: 0 };
function finishNightOnce(day: string): void {
  const key = `finish.night:${day}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, 'seen');
  } catch { /* Storage may be unavailable; keep the finish visible. */ }
  announceFinish('night');
}

export const NIGHT_CARDS = [
  { id: 'tonight', tag: 'Tonight' },
  { id: 'learn', tag: 'Night drop' },
  { id: 'puzzle', tag: 'Think' },
  { id: 'words', tag: 'Today, in words' },
  { id: 'phone', tag: 'Phone-down move' },
  { id: 'stop', tag: 'That’s tonight' },
] as const;

const NightPuzzle = memo(function NightPuzzle({ today, dailySolved, type, diff }: { today: string; dailySolved: boolean; type: ReturnType<typeof featuredSpec>['type']; diff: ReturnType<typeof featuredSpec>['diff'] }) {
  const choice = selectNightPuzzle(type, diff, dailySolved);
  const puzzle = nightPuzzleBoard(today, choice);
  const title = PZ.TYPES[choice.type].name;
  const size = puzzle ? 'N' in puzzle ? puzzle.N : puzzle.type === 'sunmoon' ? 6 : puzzle.C : 0;
  const values = puzzle ? puzzle.type === 'sudoku' ? puzzle.givens : puzzle.type === 'sunmoon' ? puzzle.given.map(value => value < 0 ? '' : value ? '☀' : '☾') : puzzle.type === 'path' ? Array.from({ length: puzzle.R * puzzle.C }, (_, i) => puzzle.waypoints.includes(i) ? String(puzzle.waypoints.indexOf(i) + 1) : '') : puzzle.type === 'crowns' ? puzzle.region.map(() => '') : Array.from({ length: puzzle.N * puzzle.N }, (_, i) => puzzle.cages.find(cage => cage.cells[0] === i)?.target ?? '') : [];
  return <><span className="pill">One calm puzzle</span><h2>{title}</h2><p>{choice.daily ? 'Today’s board is here when you want it.' : 'An easy board for a quiet moment.'}</p><div className="deck-puzzle" role="img" aria-label={`Preview of ${title} board`} data-board-seed={puzzle?.seed} style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>{values.map((value, i) => <span key={i} className={puzzle?.type === 'crowns' ? `region-${puzzle.region[i] ?? 0}` : ''}>{value || ''}</span>)}</div><p className="deck-meta">{choice.daily ? `${choice.diff} board` : 'Easy practice'}</p><div className="deck-actions"><button type="button" onClick={() => go(choice.daily ? 'mind/board/daily' : `mind/board/${choice.type}/easy/night`)}>Play</button></div></>;
});

/**
 * Spec 24 Park it (cj5-calm §5): put tomorrow on paper. Up to 5 lines, each a tomorrow Could task at 9:00. Parking pays
 * nothing (a task pays when done), and the cap keeps bedtime from turning into work.
 */
const PARK_LINES = 5;
function ParkTomorrow({ tomorrow, board }: { tomorrow: string; board: ReturnType<typeof useTaskBoard> }) {
  const [title, setTitle] = useState('');
  const [finished, setFinished] = useState(false);
  const parked = board.tasks.filter(row => !row.deleted && row.source === 'park' && row.dayKey === tomorrow).sort((a, b) => a.id < b.id ? -1 : 1);
  const full = parked.length >= PARK_LINES;
  const park = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const line = title.trim();
    if (!line || full) return;
    const scheduledStart = new Date(`${tomorrow}T09:00:00`).getTime();
    if (await board.act((repos, at) => repos.createTask({ title: line, size: 'S', estimateMin: 15, mustOrCould: 'could', scheduledStart, dayKey: tomorrow, source: 'park' }, at))) setTitle('');
  };
  return <div className="deck-end night-park"><p><strong>Park tomorrow</strong></p>
    {parked.length > 0 && <ol className="night-parked" aria-label="Parked for tomorrow">{parked.map(row => <li key={row.id}>{row.title}</li>)}</ol>}
    {finished || full ? <p className="night-parked-done">It’s written down: Plan · Tomorrow, 9:00. It can wait till morning.</p> : <>
      <form className="deck-add" onSubmit={event => void park(event)}><label htmlFor="night-park">{parked.length ? 'Another line' : 'Write it so tomorrow-you knows the first move'}</label><input id="night-park" value={title} onChange={event => setTitle(event.target.value)} maxLength={160} placeholder={parked.length ? undefined : 'Email Riya the slides'} required /><button type="submit" disabled={board.busy}>Park</button></form>
      <p className="small">Up to {PARK_LINES} lines, about 3 minutes.</p>
      {parked.length > 0 && <button type="button" className="text-button" onClick={() => setFinished(true)}>That’s all</button>}
    </>}
  </div>;
}

export function NightDeck({ now, bedtime, board }: { now: number; bedtime: string; board: ReturnType<typeof useTaskBoard> }) {
  useEffect(() => preloadOnIdle(() => import('../learn/LearnDrop')), []);
  const today = dayKey(now);
  const [index, setIndex] = useState(deckIndex);
  const [phoneMoveState, setPhoneMoveState] = useState(() => ({ day: today, swaps: rememberedSwaps.day === today ? rememberedSwaps.count : 0, done: false }));
  const phoneMove = phoneMoveState.day === today ? phoneMoveState : { day: today, swaps: rememberedSwaps.day === today ? rememberedSwaps.count : 0, done: false };
  const [message, setMessage] = useState('');
  useEffect(() => { void createQuestRepo(db).ensureWeek(Date.now()).catch(() => setMessage('Side quests could not load.')); }, []);
  const settings = useLiveQuery(() => db.settings.toArray(), []) ?? [];
  const logs = useLiveQuery(() => db.dailyLog.toArray(), []) ?? [];
  // The check-in is filed under the night it closes (see recordLightsOut), so read that night's row.
  const nightKey = lightsOutNightKey(now);
  const log = logs.find(row => row.dayKey === nightKey && !row.deleted);
  const puzzleRuns = useLiveQuery(() => db.puzzleRuns.toArray(), []);
  const runs = puzzleRuns ?? [];
  const sessions = useLiveQuery(() => db.sessions.filter(row => !row.deleted).toArray(), []) ?? [];
  const quests = useLiveQuery(() => db.quests.where('week').equals(weekKey(now)).toArray(), [today]) ?? [];
  const plan = readNightPlan(settings);
  const returned = nightsBackOnPlan(logs);
  const at = Math.min(index, NIGHT_CARDS.length - 1);
  const card = NIGHT_CARDS[at]!;
  const glyph = ({ tonight: 'night', learn: 'learn', puzzle: 'think', words: 'end', phone: 'extra', stop: 'do' } as Record<string, Glyph>)[card.id] ?? 'night';
  const featured = featuredSpec(today);
  const dailySolved = featuredDailyDone(runs, today);
  const doneTasks = board.tasks.filter(row => !row.deleted && row.doneAt && dayKey(row.doneAt) === today);
  const focusMinutes = Math.round(board.focus.filter(row => row.endedAt && dayKey(row.endedAt) === today).reduce((sum, row) => sum + focusElapsedMs(row, row.endedAt!), 0) / 60_000);
  const workoutDone = sessions.some(row => row.dayKey === today && row.status !== 'active' && row.status !== 'skipped');
  const questDone = quests.filter(row => row.status === 'done' && !row.deleted);
  const summary = [
    ...doneTasks.slice(0, 3).map(row => `Finished ${row.title}`),
    focusMinutes > 0 ? `Focused for ${focusMinutes} minutes` : '',
    workoutDone ? 'Moved through a workout' : '',
    dailySolved ? 'Solved today’s board' : '',
    ...questDone.slice(0, 2).map(row => `Completed ${row.title}`),
  ].filter(Boolean);
  const tomorrowDate = new Date(`${today}T12:00:00`);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = dayKey(tomorrowDate.getTime());
  const suggestion = selectWinddownMove(today, winddown.body.moves, phoneMove.swaps);

  useEffect(() => {
    const update = () => setIndex(deckIndex());
    window.addEventListener('popstate', update);
    window.addEventListener(navigationEventName(), update);
    return () => { window.removeEventListener('popstate', update); window.removeEventListener(navigationEventName(), update); };
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp'].includes(event.key)) return;
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes((event.target as HTMLElement).tagName)) return;
      if (at === NIGHT_CARDS.length - 1) return;
      event.preventDefault();
      const destination = Math.max(0, Math.min(NIGHT_CARDS.length - 1, at + (event.key === 'ArrowUp' || event.key === 'PageUp' ? -1 : 1)));
      if (at === NIGHT_CARDS.length - 2 && destination === NIGHT_CARDS.length - 1) finishNightOnce(today);
      goToCard(destination);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [at, today]);

  const checkIn = async () => {
    if (log?.lightsOutAt) return;
    const ok = await board.act((repos, at) => repos.recordLightsOut(at), 'Night back on plan.');
    if (!ok) setMessage('Could not save the check-in. Try again.');
  };
  const chooseMove = () => {
    setPhoneMoveState({ ...phoneMove, done: true });
  };
  const anotherIdea = () => {
    if (phoneMove.swaps >= 3) return;
    const swaps = phoneMove.swaps + 1;
    rememberedSwaps = { day: today, count: swaps };
    setPhoneMoveState({ ...phoneMove, swaps });
  };
  const next = () => { if (at === NIGHT_CARDS.length - 2) finishNightOnce(today); goToCard(Math.min(at + 1, NIGHT_CARDS.length - 1)); };

  return <section className="screen deck-screen deck-night" aria-label="Now deck">
    <div className="deck-heading"><h1>Tonight</h1><span className="deck-count">{at + 1} of {NIGHT_CARDS.length}</span><button type="button" className="night-close" aria-label="Leave night deck" onClick={() => go('plan')}><span aria-hidden="true">×</span></button></div>
    {card.id !== 'stop' && <div className="deck-dashes" role="group" aria-label={`Card ${at + 1} of ${NIGHT_CARDS.length}`}>{NIGHT_CARDS.map((item, i) => <button type="button" key={item.id} className={i === at ? 'active' : ''} aria-current={i === at ? 'step' : undefined} aria-label={`Go to card ${i + 1}: ${item.tag}`} onClick={() => { if (at === NIGHT_CARDS.length - 2 && i === NIGHT_CARDS.length - 1) finishNightOnce(today); goToCard(i); }} />)}</div>}
    <article className="deck-card card" aria-label={`${card.tag} card`} key={card.id}>
      <div className="deck-card-head"><DeckGlyph type={glyph} /><span className="deck-eyebrow">{card.tag}</span></div>
      {card.id === 'tonight' && <FriendStage area="night" pose="rest" size={72} />}{card.id === 'tonight' && <button type="button" className="secondary night-kolam" onClick={() => go('kolam')}>Trace tonight's kolam</button>}{card.id === 'tonight' && (plan ? <><span className="pill">Tonight</span><h2>Your night plan</h2><p className="night-plan-words">{nightPlanText(plan)}</p><p>You opened NANDI instead. That counts.</p>{returned > 0 && <p className="deck-meta">{returned} {returned === 1 ? 'night' : 'nights'} back on plan</p>}</> : <NightPlanSetting firstRun />)}
      {card.id === 'learn' && <><ReviewToday day={today} /><Suspense fallback={<DelayedCardSkeleton insideCard />}><LearnDrop night itemCount={3} onDone={next} /></Suspense></>}
      {card.id === 'puzzle' && (puzzleRuns === undefined ? <DelayedCardSkeleton insideCard /> : <NightPuzzle today={today} dailySolved={dailySolved} type={featured.type} diff={featured.diff} />)}
      {card.id === 'words' && <><span className="pill">Today, in words</span><h2>What today held</h2>{summary.length ? <ul className="night-summary">{summary.map(line => <li key={line}>{line}</li>)}</ul> : <p>You made it to this moment. That is enough for tonight.</p>}<ParkTomorrow tomorrow={tomorrow} board={board} /></>}
      {card.id === 'phone' && <><span className="pill">Phone-down move</span><h2>Take this offline.</h2><p>{suggestion.text}</p><p className="deck-meta">One small move is enough. Leave the phone here.</p><div className="deck-actions"><button type="button" onClick={chooseMove} disabled={phoneMove.done}>{phoneMove.done ? 'Set for tonight' : "I’ll do it"}</button></div>{!phoneMove.done && phoneMove.swaps < 3 && <button type="button" className="text-button" onClick={anotherIdea}>Another idea</button>}</>}
      {card.id === 'stop' && <><span className="pill">The stopping point</span><h2>That’s tonight. Phone down.</h2><p>Lights-out time: {bedtime}</p>{log?.lightsOutAt && <p className="deck-meta">Check-in saved. Rest when you are ready.</p>}<div className="deck-actions">{!log?.lightsOutAt && <button type="button" onClick={() => void checkIn()}>Lights-out check-in</button>}<button type="button" className="secondary" onClick={() => go('plan')}>Close</button></div></>}
    </article>
    {card.id !== 'stop' && card.id !== 'learn' && <button type="button" className="secondary deck-next" onClick={next}>Next</button>}
    {card.id !== 'stop' && (board.message || message) && <p role="status">{board.message || message}</p>}
  </section>;
}
