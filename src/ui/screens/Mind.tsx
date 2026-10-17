import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { effectiveShutdown, nightWindow } from '../../core/tasks/planner';
import { RULES } from '../../core/rules.config';
import { shuffleOptions, duePlan } from '../../core/learn/learn';
import { masteryMapState } from '../../core/learn/engine';
import { buildReviewSession, type DeckPack, type ReviewEntry } from '../../core/learn/deck';
import PZ, { type PuzzleBoard, type PuzzleDifficulty, type PuzzleType } from '../../core/puzzles';
import { featuredSpec, needsIntro } from '../../core/puzzles/daily';
import { nightPracticeSeed } from '../../core/puzzles/night';
import { nextHint } from '../../core/puzzles/hint';
import { checkRules, type PuzzleState } from '../../core/puzzles/rules';
import { dayKey } from '../../core/time';
import { formatDayKey } from '../../core/time/formatDayKey';
import { trackWrite } from '../../core/pendingWrites';
import { db } from '../../data/db';
import { bundledPacks } from '../../data/packs/seed';
import { getOrCreateDeviceId } from '../../data/device';
import { answerPlan, loadLessonDraft, saveLessonDraft, seedDeckCards, type LessonDraft } from '../../data/repos/learn';
import type { Lesson } from '../../data/packs/schemas';
import { accrueActive, bestPuzzleMs, initialGrid, openPuzzleRun, savePuzzleRun } from '../../data/repos/puzzleRuns';
import type { PuzzleRunRow } from '../../data/types';
import { recordError } from '../errorRing';
import { back, go } from '../shell/router';
import { PuzzleBoardView } from '../mind/Boards';
import { LessonPlayer } from '../mind/LessonPlayer';
import { Reviews } from '../mind/Reviews';
import { Tracks, trackCardContent } from '../mind/Tracks';
import { economyVisible, nightMindNote } from '../mind/economyVisibility';
import { trackWindDownTime } from '../mind/windDown';
import { CaseScreen } from '../mind/CaseScreen';
import { caseRunId } from '../../data/repos/mysteries';
import { chosenTopics, dailyDropId, selectedTopicKey, topics } from '../learn/flow';
import '../mind/mind.css';

type Selection = { type: PuzzleType; diff: PuzzleDifficulty; daily: boolean; intro?: boolean; night?: boolean; attempt?: number };
const types: PuzzleType[] = ['sudoku', 'crowns', 'sunmoon', 'path', 'calc'];
const diffs: PuzzleDifficulty[] = ['easy', 'medium', 'hard'];
const lessonPacks = bundledPacks.filter((pack): pack is Extract<typeof pack, { kind: 'lessons' }> => pack.kind === 'lessons');
const deck = bundledPacks.find((pack): pack is DeckPack => pack.kind === 'deck');

function timeText(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function Mind({ entry }: { entry?: string }) {
  const [now, setNow] = useState(() => Date.now());
  const today = dayKey(now);
  const featured = featuredSpec(today);
  const [selection, setSelection] = useState<Selection | null>(null);
  const practice = entry === 'practice';
  const entryHandled = useRef(false);
  const [caseOpen, setCaseOpen] = useState(false);
  useEffect(() => {
    if (!caseOpen) return;
    const closeOnBack = () => setCaseOpen(false);
    window.addEventListener('popstate', closeOnBack);
    return () => window.removeEventListener('popstate', closeOnBack);
  }, [caseOpen]);
  const [board, setBoard] = useState<PuzzleBoard | null>(null);
  const [run, setRun] = useState<PuzzleRunRow | null>(null);
  const [dailyDoneKey, setDailyDoneKey] = useState<string | null>(null);
  const dailyDone = dailyDoneKey === today;
  const [best, setBest] = useState<number | undefined>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saving');
  const [lessonDraft, setLessonDraft] = useState<LessonDraft | null>(null);
  const [reviews, setReviews] = useState<ReviewEntry[] | null>(null);
  const lessonProgress = useLiveQuery(() => db.lessonProg.toArray(), []) ?? [];
  const cards = useLiveQuery(() => db.cards.toArray(), []) ?? [];
  const itemProgress = useLiveQuery(() => db.deckProg.toArray(), []) ?? [];
  const flags = useLiveQuery(() => db.flags.toArray(), []) ?? [];
  const puzzleRuns = useLiveQuery(() => db.puzzleRuns.toArray(), []) ?? [];
  // Live, so the Today chip flips to Done as soon as the daily board is solved.
  const dailySolvedLive = puzzleRuns.some(row => row.id === `daily:${today}:${featured.type}:${featured.diff}` && row.result === 'solved');
  const concepts = useLiveQuery(() => db.learnConcepts.toArray(), []) ?? [];
  const dailyDrop = useLiveQuery(() => db.learnDrops.get(dailyDropId(now)), [today]);
  const plans = useLiveQuery(() => db.plans.toArray(), []) ?? [];
  const settingRows = useLiveQuery(() => db.settings.toArray(), []);
  const settings = settingRows ?? [];
  const showEconomy = economyVisible(settings, today);
  const log = useLiveQuery(() => db.dailyLog.get(today), [today]);
  const caseRun = useLiveQuery(async () => (await db.puzzleRuns.get(caseRunId(today))) ?? null, [today]);
  const solvedCases = useLiveQuery(() => db.puzzleRuns.where('type').equals('mystery').filter(row => row.result === 'solved' && !row.deleted).count(), []);
  const caseReady = caseRun !== undefined && solvedCases !== undefined;
  const caseDiff = caseRun?.diff === 'easy' || caseRun?.diff === 'medium' || caseRun?.diff === 'hard' ? caseRun.diff : (solvedCases ?? 0) < RULES.mind.onboardingEasyCases ? 'easy' : RULES.mind.caseDiffByWeekday[new Date(`${today}T12:00:00`).getDay() as keyof typeof RULES.mind.caseDiffByWeekday];
  const caseDone = caseRun?.result === 'solved' || caseRun?.result === 'revealed';
  const bedtime = String(settings.find(row => row.key === 'planner.bedtime' && !row.deleted)?.value ?? RULES.night.defaultBedtime);
  const shutdown = effectiveShutdown(String(settings.find(row => row.key === 'planner.shutdown' && !row.deleted)?.value ?? RULES.night.defaultShutdown), bedtime);
  const night = nightWindow(now, shutdown, bedtime, log?.windDownAt);
  const windDownUsed = Number(settings.find(row => row.key === `mind.windDownMs:${today}` && !row.deleted)?.value ?? 0);
  const windDownOverride = settings.some(row => row.key === `mind.windDownOverride:${today}` && row.value === true && !row.deleted);
  const windDownCapped = night === 'windDown' && windDownUsed >= RULES.night.windDownCapMin * 60_000 && !windDownOverride;
  const selectedTopics = chosenTopics(settings.find(row => row.key === selectedTopicKey && !row.deleted)?.value);
  const strongConcepts = concepts.filter(row => !row.deleted && ['Strong', 'Mastered'].includes(masteryMapState(row))).length;
  const masterySummary = selectedTopics.length ? `${selectedTopics.length} ${selectedTopics.length === 1 ? 'topic' : 'topics'} in your drops · ${strongConcepts ? `${strongConcepts} strong concepts` : 'your first ideas are taking shape'}` : `${topics.length} topics ready to explore`;
  const learnDone = !!dailyDrop && dailyDrop.drop.cursor >= dailyDrop.drop.items.length;
  const hiddenCards = new Set(flags.filter(row => row.hidden && !row.deleted).map(row => row.refId));
  const dueCount = cards.filter(row => !row.deleted && !hiddenCards.has(`card:${row.id}`) && row.due <= today).length;
  const bestByType = Object.fromEntries(types.map(type => [type, puzzleRuns.filter(row => row.type === type && !row.deleted && row.result === 'solved' && row.solveMs !== undefined).reduce<number | undefined>((best, row) => best === undefined ? row.solveMs : Math.min(best, row.solveMs!), undefined)])) as Record<PuzzleType, number | undefined>;
  const pendingDraft = settings.find(row => row.key === 'mind.lessonDraft' && !row.deleted)?.value as LessonDraft | null | undefined;
  const dayLessons = lessonProgress.filter(row => row.doneDayKey === today && !row.deleted);
  const nextLessons = lessonPacks.map(pack => ({ pack, next: pack.body.lessons.find(lesson => !lessonProgress.some(row => row.id === lesson.id && row.doneDayKey)) })).filter(row => row.next);
  const lessonSlotDone = dayLessons.length > 0 || nextLessons.length === 0;
  const activeLesson = lessonDraft && lessonPacks.flatMap(pack => pack.body.lessons.map((lesson, i) => ({ pack, lesson, index: i }))).find(row => row.lesson.id === lessonDraft.lessonId);
  const lessonCards: Record<string, [string, string]> = {};
  for (const pack of lessonPacks) for (const lesson of pack.body.lessons) lesson.cards.forEach((pair, index) => { lessonCards[`${pack.body.course.id}-${lesson.id}-${index + 1}`] = pair; });
  Object.assign(lessonCards, trackCardContent());
  const current = useRef<PuzzleRunRow | null>(null);
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  const saveVersion = useRef(0);
  const nightRef = useRef(night);
  useEffect(() => { nightRef.current = night; }, [night]);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (night !== 'windDown' || !settingRows || windDownOverride || windDownCapped) return;
    return trackWindDownTime((used, time) => {
      void getOrCreateDeviceId(db, time).then(deviceId => trackWrite(() => db.transaction('rw', db.settings, async () => {
        const key = `mind.windDownMs:${today}`;
        const previous = await db.settings.get(key);
        await db.settings.put({ key, value: Math.max(Number(previous?.value ?? 0), used), updatedAt: time, deleted: 0, deviceId });
      }))).catch(error => recordError('window', error));
    }, windDownUsed, RULES.night.windDownCapMin * 60_000);
  }, [night, settingRows, windDownUsed, windDownOverride, windDownCapped, today]);

  const overrideWindDown = async () => {
    const time = Date.now(), deviceId = await getOrCreateDeviceId(db, time);
    await trackWrite(() => db.transaction('rw', [db.settings, db.dailyLog], async () => {
      await db.settings.put({ key: `mind.windDownOverride:${today}`, value: true, updatedAt: time, deleted: 0, deviceId });
      const currentLog = await db.dailyLog.get(today);
      await db.dailyLog.put({ ...currentLog, dayKey: today, nightOverrides: (currentLog?.nightOverrides ?? 0) + 1, updatedAt: time, deleted: 0, deviceId });
    }));
  };

  useEffect(() => {
    let live = true;
    void loadLessonDraft(db).then(draft => { if (live && entry === 'lesson' && draft?.day === today && draft.step < 7) setLessonDraft(current => current ?? draft); }).catch(error => recordError('window', error));
    if (deck) void seedDeckCards(db, deck).catch(error => recordError('window', error));
    return () => { live = false; };
  }, [today, entry]);

  const startLesson = async (packId: string, lesson: Lesson, review = false) => {
    const pack = lessonPacks.find(value => value.id === packId);
    if (!pack) return;
    const saved = await loadLessonDraft(db);
    if (saved?.day === today && saved.lessonId === lesson.id && saved.review === review && saved.step < 7) { go('you/mind/lesson'); return; }
    if (!review && (night !== 'day' || dayLessons.some(row => row.packId === packId))) return;
    const draft: LessonDraft = { courseId: pack.body.course.id, lessonId: lesson.id, review, day: today, step: 0, order: { guess: shuffleOptions(lesson.o.length), transfer: shuffleOptions(lesson.tr.o.length), why: shuffleOptions(lesson.wy.o.length) }, picked: {} };
    await saveLessonDraft(db, draft);
    go('you/mind/lesson');
  };
  const startReviews = () => {
    if (!deck) return;
    go('you/mind/reviews');
  };
  const finishReviews = async () => {
    const now = Date.now(), deviceId = await getOrCreateDeviceId(db, now);
    await trackWrite(() => db.settings.put({ key: `mind.reviewsDone:${today}`, value: true, updatedAt: now, deleted: 0, deviceId }));
    back('you/mind');
  };

  const persist = useCallback((row: PuzzleRunRow) => {
    const savedRow = row.result === 'solved' ? { ...row, afterBedtime: row.afterBedtime ?? nightRef.current === 'lightsOut' } : row;
    current.current = savedRow;
    setRun(savedRow);
    setElapsed(savedRow.activeMs ?? 0);
    setSaveState('saving');
    const version = ++saveVersion.current;
    const write = trackWrite(() => writes.current.then(() => savePuzzleRun(db, savedRow, Date.now(), nightRef.current === 'lightsOut')));
    writes.current = write.then(() => {
      if (saveVersion.current === version) setSaveState('saved');
    }).catch(error => {
      if (saveVersion.current === version) setSaveState('error');
      recordError('window', error);
    });
  }, []);

  useEffect(() => {
    let live = true;
    void db.puzzleRuns.get(`daily:${today}:${featured.type}:${featured.diff}`).then(row => { if (live) setDailyDoneKey(row?.result === 'solved' ? today : null); });
    return () => { live = false; };
  }, [today, featured.type, featured.diff]);

  useEffect(() => {
    if (!selection) return;
    let live = true;
    const worker = new Worker(new URL('../../workers/puzzle.worker.ts', import.meta.url), { type: 'module' });
    const seed = selection.night ? nightPracticeSeed(today, selection.type) : PZ.hash(`${selection.daily ? 'daily' : 'practice'}:${today}:${selection.type}:${selection.diff}${selection.daily ? '' : `:${selection.attempt ?? 0}`}`);
    worker.onmessage = (event: MessageEvent<{ board?: PuzzleBoard | null; error?: string }>) => {
      if (!live) return;
      if (event.data.error || !event.data.board) { setMessage(event.data.error ?? 'Could not build this board.'); setBusy(false); return; }
      const generated = event.data.board;
      void openPuzzleRun(db, generated, today, selection.daily, Date.now(), selection.attempt).then(async row => {
        if (!live) return;
        await writes.current;
        const opened = selection.intro ? { ...row, intro: true } : row;
        if (selection.intro && !row.intro) await savePuzzleRun(db, opened);
        current.current = opened;
        setBoard(generated); setRun(opened); setElapsed(opened.activeMs ?? 0);
        setSaveState('saved');
        setBest(await bestPuzzleMs(db, generated.type, generated.diff));
        setBusy(false);
      }).catch(error => { setBusy(false); recordError('window', error); setMessage('Could not open the saved board.'); });
    };
    worker.onerror = event => { setBusy(false); setMessage(event.message); recordError('window', event.message); };
    worker.postMessage(selection.daily ? { kind: 'daily', day: today } : { kind: 'practice', day: today, type: selection.type, diff: selection.diff, seed });
    return () => { live = false; worker.terminate(); };
  }, [selection, today]);

  useEffect(() => {
    if (!current.current || current.current.result) return;
    const tick = () => {
      const row = current.current;
      if (!row || row.result || document.visibilityState !== 'visible') return;
      setElapsed((row.activeMs ?? 0) + Math.min(Math.max(0, Date.now() - (row.lastActiveAt ?? Date.now())), 60_000));
    };
    const interval = window.setInterval(tick, 1000);
    const save = () => {
      const row = current.current;
      if (row && !row.result) persist(accrueActive(row, Date.now()));
    };
    const visibility = () => {
      if (document.visibilityState === 'hidden') save();
      else if (current.current && !current.current.result) current.current = { ...current.current, lastActiveAt: Date.now() };
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', save);
    window.addEventListener('pageshow', visibility);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', save); window.removeEventListener('pageshow', visibility); save(); };
  }, [run?.id, run?.result, persist]);

  const commit = (state: PuzzleState, extra: Partial<PuzzleRunRow> = {}) => {
    const row = current.current;
    if (!board || !row || row.result) return;
    const checked = checkRules(board, state);
    const now = Date.now();
    const next = { ...accrueActive(row, now), grid: state.grid, path: state.path, ...extra };
    if (checked.solved) {
      next.result = 'solved'; next.solveMs = next.activeMs; next.finishedAt = now;
      if (next.daily) setDailyDoneKey(today);
      setBest(previous => previous === undefined ? next.solveMs : Math.min(previous, next.solveMs ?? previous));
      setMessage('');
    } else if (checked.complete) setMessage('Board full. Check the marked rules.');
    else setMessage('');
    persist(next);
  };
  const commitRef = useRef(commit);
  useEffect(() => { commitRef.current = commit; });

  useEffect(() => {
    if (import.meta.env.VITE_E2E !== '1' || !new URLSearchParams(location.search).has('e2e') || !board || !current.current) return;
    const hook = { solveKnownSolution: () => {
      const state: PuzzleState = board.type === 'path' ? { grid: [], path: board.solution.slice() }
        : board.type === 'crowns' ? { grid: Array(board.N * board.N).fill(0).map((_, i) => board.solution[Math.floor(i / board.N)] === i % board.N ? 2 : 0), path: [] }
          : { grid: board.solution.slice(), path: [] };
      commitRef.current(state);
    } };
    (window as Window & { __nandiMindTest?: typeof hook }).__nandiMindTest = hook;
    return () => { delete (window as Window & { __nandiMindTest?: typeof hook }).__nandiMindTest; };
  }, [board, run?.id]);

  const open = (item: Selection) => go(item.daily ? 'you/mind/board' : `you/mind/board/${item.type}/${item.diff}`);
  useEffect(() => {
    if (entryHandled.current || !entry) return;
    if (entry === 'case' && !caseReady) return;
    const timer = window.setTimeout(() => {
      if (entryHandled.current) return;
      entryHandled.current = true;
      if (entry === 'board' || entry.startsWith('board/')) {
        setBoard(null); setRun(null); current.current = null; setBusy(true); setMessage(''); setSaveState('saving');
        const [, practiceType, practiceDiff, variant] = entry.split('/');
        const type = types.find(value => value === practiceType);
        const diff = diffs.find(value => value === practiceDiff);
        if (practiceType === 'daily') {
          setSelection({ type: featured.type, diff: featured.diff, daily: true });
          return;
        }
        if (type && diff === 'easy' && variant === 'night') {
          setSelection({ type, diff, daily: false, night: true, attempt: -2 });
          return;
        }
        void db.puzzleRuns.where('type').equals(type ?? featured.type).toArray().then(rows => {
          if (type && diff) {
            const matching = rows.filter(row => !row.deleted && !row.daily && row.dayKey === today && row.diff === diff && row.practiceAttempt !== -2);
            const unfinished = matching.find(row => !row.result);
            const attempt = unfinished?.practiceAttempt ?? (matching.length ? Math.max(...matching.map(row => row.practiceAttempt ?? 0)) + 1 : 0);
            setSelection({ type, diff, daily: false, attempt });
          } else setSelection(needsIntro(featured.type, rows) ? { type: featured.type, diff: 'easy', daily: false, intro: true, attempt: -1 } : { type: featured.type, diff: featured.diff, daily: true });
        }).catch(error => { recordError('window', error); setMessage('Could not open today’s board.'); setBusy(false); });
      }
      else if (entry === 'case') setCaseOpen(true);
      else if (entry === 'reviews' && deck) void Promise.all([db.cards.toArray(), db.deckProg.toArray(), db.ratings.toArray(), db.flags.toArray()]).then(([allCards, progress, allRatings, allFlags]) => {
        const hidden = new Set(allFlags.filter(row => row.hidden && !row.deleted).map(row => row.refId));
        setReviews(buildReviewSession(today, allCards, progress, allRatings, hidden, deck));
      }).catch(error => recordError('window', error));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [entry, caseReady, featured.type, featured.diff, today]);
  const state: PuzzleState = { grid: run?.grid ?? (board ? initialGrid(board) : []), path: run?.path ?? [] };
  const checked = board ? checkRules(board, state) : null;
  const name = board ? PZ.TYPES[board.type].name : '';

  if (windDownCapped) return <section className="screen mind-hub"><div className="card"><h1>Wind-down pause.</h1><p>Ten active minutes in Mind are up for tonight.</p><button type="button" className="secondary" onClick={() => void overrideWindDown()}>Continue anyway</button></div></section>;
  if (activeLesson && lessonDraft) return <LessonPlayer key={`${lessonDraft.lessonId}:${lessonDraft.review}`} lesson={activeLesson.lesson} packId={activeLesson.pack.id} courseName={activeLesson.pack.body.course.name} total={activeLesson.pack.body.lessons.length} completed={activeLesson.pack.body.lessons.filter(lesson => lessonProgress.some(row => row.id === lesson.id && row.doneDayKey)).length} draft={lessonDraft} afterBedtime={night === 'lightsOut'} economyVisible={showEconomy} onLeave={() => back('you/mind')} onDone={() => {}} teaser={activeLesson.pack.body.lessons[activeLesson.index + 1]?.t} />;
  if (reviews && deck) return <Reviews entries={reviews} cards={cards} progress={itemProgress} deck={deck} lessonCards={lessonCards} afterBedtime={night === 'lightsOut'} economyVisible={showEconomy} onDone={() => void finishReviews()} />;
  if (caseOpen) return <CaseScreen day={today} diff={caseDiff} afterBedtime={night === 'lightsOut'} onExit={() => entry === 'case' ? go('you/mind') : history.back()} />;
  if (selection) return <section className="screen mind-board" data-save-state={saveState} data-board-seed={board?.seed}>
    {(night === 'lightsOut' || busy || !board || !run) && <div role="status">
      {night === 'lightsOut' && <p>{nightMindNote(showEconomy)}</p>}
      {(busy || !board || !run) && <p>{message || 'Building board…'}</p>}
    </div>}
    {busy || !board || !run ? <h1>{PZ.TYPES[selection.type].name}</h1> : <>
      <p className="eyebrow">{selection.intro ? `Intro board · ${board.diff}` : selection.daily ? `Daily board · ${formatDayKey(today)}` : `Practice · ${board.diff}`}</p>
      <h1>{name}</h1>
      <p className="rule">{PZ.TYPES[board.type].rule}</p>
      {run.result === 'solved' ? <div className="card mind-result" aria-label="Puzzle result"><h2>Board complete</h2><p>Time {timeText(run.solveMs ?? 0)} · {run.hintsUsed ?? 0} hints · Best {timeText(best ?? run.solveMs ?? 0)}</p></div> : <>
        <p className="small mind-timer pill" aria-label="Active time">Time {timeText(elapsed)}</p>
        <PuzzleBoardView key={board.seed} board={board} state={state} conflicts={checked?.conflicts ?? []} notes={run.notes ?? []} notesMode={!!run.notesMode} onGrid={(grid, notes) => commit({ ...state, grid }, notes ? { notes } : {})} onPath={path => commit({ ...state, path })} onNotesMode={() => { const row = current.current; if (row) persist({ ...row, notesMode: !row.notesMode }); }} done={false} />
        <div className="mind-actions"><button type="button" className="secondary" onClick={() => { const row = current.current; if (row) commit({ grid: initialGrid(board), path: [] }, { notes: Array(board.solution.length).fill(0), hintsUsed: row.hintsUsed }); }}>Restart</button><button type="button" className="secondary" onClick={() => { const hint = nextHint(board, state); if (hint.changed) commit(hint.state, { hintsUsed: (run.hintsUsed ?? 0) + 1, hintRungs: [...(run.hintRungs ?? []), 3] }); setMessage(hint.message); }}>Hint</button></div>
        {message && <p>{message}</p>}
      </>}
    </>}
  </section>;

  return <section className="screen mind-hub">
    <p className="eyebrow">Practice</p><h1>Mind &amp; learning</h1>
    {night === 'lightsOut' && <p role="status">{nightMindNote(showEconomy)}</p>}
    <section className="mind-today" aria-label="Today"><h2>Today</h2><div className="mind-today-chips">
      <button type="button" className="mind-today-chip" disabled={!caseReady} onClick={() => go('you/mind/case')} aria-label={`Case: ${caseDone ? 'done' : 'not done'}`}><strong>Case</strong><span>{caseDone ? 'Done' : 'Not done'}</span></button>
      <button type="button" className="mind-today-chip" onClick={() => open({ ...featured, daily: true })} aria-label={`Board: ${dailyDone || dailySolvedLive ? 'done' : 'not done'}`}><strong>Board</strong><span>{dailyDone || dailySolvedLive ? 'Done' : 'Not done'}</span></button>
      <button type="button" className="mind-today-chip" onClick={() => go('you/learn')} aria-label={`Learn drop: ${learnDone ? 'done' : 'not done'}`}><strong>Learn drop</strong><span>{learnDone ? 'Done' : 'Not done'}</span></button>
    </div></section>
    <section className="card mind-practice"><h2>Practice boards</h2><p>Choose a board and difficulty.</p><button type="button" onClick={() => practice ? back('you/mind') : go('you/mind/practice')} aria-expanded={practice}>Practice</button>
      {types.some(type => bestByType[type] !== undefined) && <div className="mind-best-times"><h3>Best times</h3><ul>{types.filter(type => bestByType[type] !== undefined).map(type => <li key={type}><span>{PZ.TYPES[type].name}</span><strong>{timeText(bestByType[type]!)}</strong></li>)}</ul></div>}
      {practice && <div className="mind-practice-options">{types.map(type => <div key={type}><h3>{PZ.TYPES[type].name}</h3>{diffs.filter(diff => type !== 'sunmoon' || diff !== 'medium').map(diff => <button type="button" className="secondary" key={diff} onClick={() => open({ type, diff, daily: false })}>{diff}</button>)}</div>)}</div>}
    </section>
    <section className="card"><h2>Reviews</h2>{dueCount ? <><p>{dueCount} {dueCount === 1 ? 'card' : 'cards'} due</p><button type="button" className="secondary" onClick={startReviews}>Review due cards</button></> : <p>You're all caught up for now.</p>}</section>
    <section className="card"><h2>Learn</h2><p>{masterySummary}</p><button type="button" className="secondary" onClick={() => go('you/learn')}>Open Learn</button></section>
    <details className="card mind-courses" open={entry === 'unit' ? true : undefined}><summary>Courses and past lessons</summary>
      <div className="card mind-old-lesson"><h2>Today's lesson</h2>{lessonSlotDone ? <p>Complete for today.</p> : pendingDraft?.day === today && !pendingDraft.review && pendingDraft.step < 7 ? <button type="button" onClick={() => { const row = lessonPacks.find(pack => pack.body.course.id === pendingDraft.courseId); const lesson = row?.body.lessons.find(value => value.id === pendingDraft.lessonId); if (row && lesson) void startLesson(row.id, lesson); }}>Continue lesson</button> : night !== 'day' ? <p>New lessons wait for the morning.</p> : <><p>{nextLessons[0]?.next?.t}</p><button type="button" onClick={() => { const row = nextLessons[0]; if (row?.next) void startLesson(row.pack.id, row.next); }}>Start lesson</button></>}</div>
      {lessonPacks.map(pack => <div className="mind-course" key={pack.id}><h3>{pack.body.course.name}</h3><p>{pack.body.course.blurb}</p>{pack.body.lessons.filter(lesson => lessonProgress.some(row => row.id === lesson.id && row.doneDayKey)).map(lesson => <button type="button" className="secondary" key={lesson.id} onClick={() => void startLesson(pack.id, lesson, true)}>Review: {lesson.t}</button>)}{!dayLessons.some(row => row.packId === pack.id) && pack.body.lessons.find(lesson => !lessonProgress.some(row => row.id === lesson.id && row.doneDayKey)) && night === 'day' && <button type="button" className="secondary" onClick={() => { const lesson = pack.body.lessons.find(value => !lessonProgress.some(row => row.id === value.id && row.doneDayKey)); if (lesson) void startLesson(pack.id, lesson); }}>Start {pack.body.course.short} lesson</button>}</div>)}
      <Tracks day={today} afterBedtime={night === 'lightsOut'} showUnit={entry === 'unit'} />
      {plans.filter(plan => duePlan(plan.madeDayKey, today, plan.fired)).slice(0, 1).map(plan => <div className="card" key={plan.id}><h2>Did your plan fire yesterday?</h2><p>If {plan.ifText}, then I will {plan.thenText}.</p><div className="mind-review-actions">{(['yes', 'partly', 'no', 'na'] as const).map(value => <button type="button" className="secondary" key={value} onClick={() => void answerPlan(db, plan, value)}>{value === 'na' ? 'Didn’t come up' : value}</button>)}</div></div>)}
    </details>
  </section>;
}
