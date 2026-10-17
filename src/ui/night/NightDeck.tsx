import { lazy, memo, Suspense, useEffect, useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import PZ from '../../core/puzzles';
import { featuredSpec } from '../../core/puzzles/daily';
import { nightPuzzleBoard, selectNightPuzzle } from '../../core/puzzles/night';
import { dayKey } from '../../core/time/dayKey';
import { shutdownAt } from '../../core/tasks/planner';
import { nightPlanText, nightsBackOnPlan, readNightPlan } from '../../core/nightPlan';
import { weekKey } from '../../core/quests';
import { db } from '../../data/db';
import { createQuestRepo } from '../../data/repos/quests';
import { DelayedCardSkeleton } from '../shell/DelayedCardSkeleton';
import { preloadOnIdle } from '../shell/preloadOnIdle';
import { deckIndex, go, goToCard, navigationEventName } from '../shell/router';
import type { useTaskBoard } from '../tasks/useTaskBoard';
import { NightPlanSetting } from '../screens/NightPlanSetting';
import { DeckGlyph, type Glyph } from '../DeckGlyph';

const LearnDrop = lazy(() => import('../learn/LearnDrop').then(module => ({ default: module.LearnDrop })));

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
  return <><span className="pill">One calm puzzle</span><h2>{title}</h2><p>{choice.daily ? 'Today’s board is here when you want it.' : 'An easy board for a quiet moment.'}</p><div className="deck-puzzle" role="img" aria-label={`Preview of ${title} board`} data-board-seed={puzzle?.seed} style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>{values.map((value, i) => <span key={i} className={puzzle?.type === 'crowns' ? `region-${puzzle.region[i] ?? 0}` : ''}>{value || ''}</span>)}</div><p className="deck-meta">{choice.daily ? `${choice.diff} board` : 'Easy practice'}</p><div className="deck-actions"><button type="button" onClick={() => go(choice.daily ? 'you/mind/board/daily' : `you/mind/board/${choice.type}/easy/night`)}>Play</button></div></>;
});

const windDownIds = ['read-pages', 'book-notes', 'quiet-minutes'] as const;
const windDownText: Record<string, string> = {
  'read-pages': 'Read 5 pages of a book.',
  'book-notes': 'Write 3 lines about something you read.',
  'quiet-minutes': 'Spend 10 quiet minutes without a screen.',
};

export function NightDeck({ now, bedtime, board }: { now: number; bedtime: string; board: ReturnType<typeof useTaskBoard> }) {
  useEffect(() => preloadOnIdle(() => import('../learn/LearnDrop')), []);
  const today = dayKey(now);
  const [index, setIndex] = useState(deckIndex);
  const [tomorrowTitle, setTomorrowTitle] = useState('');
  const [phoneMoveDone, setPhoneMoveDone] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { void createQuestRepo(db).ensureWeek(Date.now()).catch(() => setMessage('Side quests could not load.')); }, []);
  const settings = useLiveQuery(() => db.settings.toArray(), []) ?? [];
  const logs = useLiveQuery(() => db.dailyLog.toArray(), []) ?? [];
  const log = logs.find(row => row.dayKey === today && !row.deleted);
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
  const dailySolved = runs.some(row => row.id === `daily:${today}:${featured.type}:${featured.diff}` && row.result === 'solved' && !row.deleted);
  const doneTasks = board.tasks.filter(row => !row.deleted && row.doneAt && dayKey(row.doneAt) === today);
  const focusMinutes = Math.round(board.focus.filter(row => row.endedAt && dayKey(row.endedAt) === today).reduce((sum, row) => sum + (row.endedAt! - row.startedAt), 0) / 60_000);
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
  const tomorrowTask = board.tasks.find(row => !row.deleted && row.status !== 'done' && row.dayKey === tomorrow);
  const suggestionId = windDownIds[Number(today.replaceAll('-', '')) % windDownIds.length]!;

  useEffect(() => {
    const update = () => setIndex(deckIndex());
    window.addEventListener('popstate', update);
    window.addEventListener(navigationEventName(), update);
    if (sessionStorage.getItem('nandi.deck.mode') !== 'night') goToCard(0);
    sessionStorage.setItem('nandi.deck.mode', 'night');
    return () => { window.removeEventListener('popstate', update); window.removeEventListener(navigationEventName(), update); };
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp'].includes(event.key)) return;
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes((event.target as HTMLElement).tagName)) return;
      if (at === NIGHT_CARDS.length - 1) return;
      event.preventDefault();
      goToCard(Math.max(0, Math.min(NIGHT_CARDS.length - 1, at + (event.key === 'ArrowUp' || event.key === 'PageUp' ? -1 : 1))));
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [at]);

  const saveTomorrow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = tomorrowTitle.trim();
    if (!title) return;
    const scheduledStart = new Date(`${tomorrow}T09:00:00`).getTime();
    const ok = await board.act((repos, at) => repos.createTask({ title, size: 'S', estimateMin: 15, mustOrCould: 'could', scheduledStart, dayKey: tomorrow }, at), 'Tomorrow’s first step saved.');
    if (ok) setTomorrowTitle('');
  };
  const checkIn = async () => {
    if (log?.lightsOutAt) return;
    const ok = await board.act((repos, at) => repos.recordLightsOut(at), 'Night back on plan.');
    if (!ok) setMessage('Could not save the check-in. Try again.');
  };
  const chooseMove = () => {
    setPhoneMoveDone(true);
    if (now >= shutdownAt(now, bedtime) - 30 * 60_000 && !log?.lightsOutAt) void checkIn();
  };
  const next = () => goToCard(Math.min(at + 1, NIGHT_CARDS.length - 1));

  return <section className="screen deck-screen deck-night" aria-label="Now deck">
    <div className="deck-heading"><h1>Now <span className="deck-night-label">Night</span></h1><span className="deck-count">{at + 1} of {NIGHT_CARDS.length}</span></div>
    {card.id !== 'stop' && <div className="deck-dashes" role="group" aria-label={`Card ${at + 1} of ${NIGHT_CARDS.length}`}>{NIGHT_CARDS.map((item, i) => <button type="button" key={item.id} className={i === at ? 'active' : ''} aria-current={i === at ? 'step' : undefined} aria-label={`Go to card ${i + 1}: ${item.tag}`} onClick={() => goToCard(i)} />)}</div>}
    <article className="deck-card card" aria-label={`${card.tag} card`} key={card.id}>
      <div className="deck-card-head"><DeckGlyph type={glyph} /><span className="deck-eyebrow">{card.tag}</span></div>
      {card.id === 'tonight' && (plan ? <><span className="pill">Tonight</span><h2>Your night plan</h2><p className="night-plan-words">{nightPlanText(plan)}</p><p>You opened NANDI instead. That counts.</p>{returned > 0 && <p className="deck-meta">{returned} {returned === 1 ? 'night' : 'nights'} back on plan</p>}</> : <NightPlanSetting firstRun />)}
      {card.id === 'learn' && <Suspense fallback={<DelayedCardSkeleton insideCard />}><LearnDrop night itemCount={3} onDone={next} /></Suspense>}
      {card.id === 'puzzle' && (puzzleRuns === undefined ? <DelayedCardSkeleton insideCard /> : <NightPuzzle today={today} dailySolved={dailySolved} type={featured.type} diff={featured.diff} />)}
      {card.id === 'words' && <><span className="pill">Today, in words</span><h2>What today held</h2>{summary.length ? <ul className="night-summary">{summary.map(line => <li key={line}>{line}</li>)}</ul> : <p>You made it to this moment. That is enough for tonight.</p>}<div className="deck-end"><p><strong>Tomorrow’s first step</strong></p>{tomorrowTask ? <p>{tomorrowTask.title}</p> : <form className="deck-add" onSubmit={event => void saveTomorrow(event)}><label htmlFor="night-tomorrow">Name one small step</label><input id="night-tomorrow" value={tomorrowTitle} onChange={event => setTomorrowTitle(event.target.value)} maxLength={160} placeholder="Tomorrow’s first step" required /><button type="submit" disabled={board.busy}>Save</button></form>}</div></>}
      {card.id === 'phone' && <><span className="pill">Phone-down move</span><h2>Take this offline.</h2><p>{windDownText[suggestionId]}</p><p className="deck-meta">One small move is enough. Leave the phone here.</p><div className="deck-actions"><button type="button" onClick={chooseMove} disabled={phoneMoveDone}>{phoneMoveDone ? 'Set for tonight' : "I’ll do it"}</button></div></>}
      {card.id === 'stop' && <><span className="pill">The stopping point</span><h2>That’s tonight. Phone down.</h2><p>Lights-out time: {bedtime}</p>{log?.lightsOutAt && <p className="deck-meta">Check-in saved. Rest when you are ready.</p>}<div className="deck-actions">{!log?.lightsOutAt && <button type="button" onClick={() => void checkIn()}>Lights-out check-in</button>}<button type="button" className="secondary" onClick={() => goToCard(0)}>Back to cards</button></div></>}
    </article>
    {card.id !== 'stop' && card.id !== 'learn' && <button type="button" className="secondary deck-next" onClick={next}>Next</button>}
    {card.id !== 'stop' && (board.message || message) && <p role="status">{board.message || message}</p>}
  </section>;
}
