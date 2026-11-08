import { useCallback, useEffect, useState } from 'react';
import { LARGE_TEXT_ROOT_PX, useRootPx } from '../shell/useRootPx';
import { useLiveQuery } from 'dexie-react-hooks';
import { minutesLabel } from '../../core/units';
import { masteryMapState, type Drop } from '../../core/learn/engine';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { LearnDrop } from '../learn/LearnDrop';
import { chosenTopics, dailyDropId, nightDropId, selectedTopicKey, topics } from '../learn/flow';
import { go } from '../shell/router';
import { chestReady } from '../../core/economy/gamify';
import { goldItems } from '../../core/learn/steps';
import { dayKey, isAfterBedtime } from '../../core/time';
import { effectiveBedtime } from '../../data/repos/night';
import { RULES } from '../../core/rules.config';
import { completedModuleKey, UnitScene } from '../cast/UnitScene';
import { bookCheckDue, bookConcepts, bookDone, bookMinutes, bookTitle, bookUnitId, chapterRef, chapterState, currentBook, libraryOrder, libraryShelves, nextChapter, readingState, type ChapterState } from '../../core/learn/books';
import { Cover } from '../learn/Cover';
import '../learn/read.css';
import { Cast } from '../cast/Cast';

// Chiku waits at each checkpoint and cheers once every idea before it is strong (item 135: Learn is Chiku's area only).
import { playCastSound } from '../cast/sound';
import { finishedIdeas, haveliPicks, lastVisits, type HaveliIdea } from '../../core/moti/haveli';
import { matkaPicks, sealedOptions, type MatkaItem } from '../../core/moti/matka';
import { findStep } from '../../core/learn/steps';
import { formatEstimate, sliderScale, type EstimateItem } from '../../core/learn/estimate';
import { weekStart } from '../../core/economy/deriveEconomy';
import { saveHaveliRebuilt, saveMatkaAnswer } from '../../data/repos/moti';
import { Haveli } from '../learn/Haveli';
import { Matka, type MatkaContext } from '../learn/Matka';

// Spec 26: every idea with recall pieces, in topic order (content lands with editor sign-off).
const HAVELI_IDEAS: HaveliIdea[] = topics.flatMap(pack => pack.body.modules.flatMap(module => module.concepts.filter(concept => concept.recall).map(concept => ({ id: concept.id, title: concept.title, topicId: pack.body.topic.id, topicTitle: pack.title, recall: concept.recall!, steps: (concept.steps ?? []).map(step => step.id) }))));
const ALL_CONCEPTS = topics.flatMap(pack => pack.body.modules.flatMap(module => module.concepts));
const matkaContext = (item: MatkaItem): MatkaContext => {
  if (item.level === 2) {
    const found = ALL_CONCEPTS.flatMap(concept => concept.items).find(row => row.id === item.itemId);
    const estimate = found && found.type === 'estimate' ? found as unknown as EstimateItem : undefined;
    return { title: estimate ? 'Your first number' : 'Your first guess', scale: estimate ? sliderScale(estimate) : undefined, format: estimate ? (value: number) => formatEstimate(value, estimate.answer.unit) : undefined };
  }
  const ref = item.stepId ? findStep(ALL_CONCEPTS, item.stepId) : undefined;
  return { title: ref ? `Your first guess on ${ref.step.title}, before the lesson` : 'Your first guess', options: item.level === 1 ? sealedOptions(item, ref?.step.hook.options ?? []) : undefined };
};
// Spec 26 M1: a Matka 1 item is asked only while its sealed options can still be shown fairly (Codex B item 115).
// Read at the tap, not during render.
const currentTime = () => Date.now();
const matkaAskable = (item: MatkaItem) => {
  if (item.level !== 1) return true;
  const ref = item.stepId ? findStep(ALL_CONCEPTS, item.stepId) : undefined;
  return !!ref && sealedOptions(item, ref.step.hook.options) !== undefined;
};
// Spec 26: the haveli entry counts new diyas to light and lit ideas ready for a visit separately (Codex B item 115).
const haveliCount = (picks: readonly HaveliIdea[], litToday: readonly string[], visits: ReadonlyMap<string, string>, cap: number) => {
  const open = picks.filter(idea => !litToday.includes(idea.id)).slice(0, Math.max(0, Math.min(cap, picks.length) - litToday.length));
  const visit = open.filter(idea => visits.has(idea.id)).length, light = open.length - visit;
  const parts = [light ? `${light} to light` : '', visit ? `${visit} ready for a visit` : ''].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'quiet for today';
};
import { chikuOpen, type ChikuScene } from '../../core/learn/chiku';
import { ChikuStage } from '../learn/ChikuStage';
import { AreaScope } from '../shell/AreaScope';
import { FriendStage } from '../cast/FriendStage';
import { CardReviews } from '../grow/CardReviews';
import { LearningHolding } from './LearningHolding';
import { saveChikuPlayed } from '../../data/repos/learn-engine';
import '../learn/readToday.css';

type Practice = { conceptId?: string; topicId?: string; reviewDue?: boolean; goldReview?: boolean };

const STATE_LABEL: Record<ChapterState, string> = { 'not-started': 'Not started', 'in-progress': 'In progress', done: 'Done', due: 'Due for review' };

/**
 * Spec 571 stage 2 (rows 89-90, placed 7 Nov): "Today's idea" is the first row on Grow › Read, so ring → Read → drop is
 * one tap. Before: the topic; during: where the drop is; done: its takeaway as a quiet tick, with no "do it again". It
 * opens the drop's one home (read/drop), where the topic picker still runs on the first drop.
 */
function TodayIdea({ drop, selected }: { drop?: Drop; selected: readonly string[] }) {
  const concepts = topics.flatMap(pack => pack.body.modules.flatMap(module => module.concepts));
  const packOf = (conceptId?: string) => conceptId ? topics.find(pack => pack.body.modules.some(module => module.concepts.some(concept => concept.id === conceptId))) : undefined;
  if (drop && drop.items.length > 0 && drop.cursor >= drop.items.length) {
    const lesson = drop.items.find(item => item.lesson)?.lesson;
    const taught = lesson ? findStep(concepts, lesson) : undefined;
    return <section className="card read-today-idea" data-state="done" aria-label="Today's idea">
      <p className="eyebrow"><span aria-hidden="true">✓ </span>Today's idea</p>
      <p className="small">{taught?.step.takeaway ?? 'Done for today.'}</p>
    </section>;
  }
  const during = !!drop && drop.items.length > 0 && (drop.cursor > 0 || !!drop.pendingFeedback);
  const pack = packOf(drop?.items[0]?.conceptId) ?? (selected.length === 1 ? topics.find(row => row.body.topic.id === selected[0]) : undefined);
  return <button type="button" className="card read-today-idea" data-state={during ? 'during' : 'before'} data-testid="today-idea-link" onClick={() => go('read/drop')}>
    <span className="eyebrow">Today's idea</span>
    <strong>{during ? `Continue · ${Math.min(drop!.cursor + 1, drop!.items.length)} of ${drop!.items.length}` : pack ? bookTitle(pack) : 'One idea, about five minutes'}</strong>
    <span className="read-today-arrow" aria-hidden="true">›</span>
  </button>;
}

/** Spec 33: Read (Continue, the Library) and each book's page; spec 571: Moti's Remember door. */
export function Learn({ entry, book: bookParam }: { entry?: string; book?: string }) {
  const [practice, setPractice] = useState<Practice>();
  // CLS (gate-s2): on Remember, how learning holds appears once Card reviews above it has landed.
  const [reviewsReady, setReviewsReady] = useState(false);
  const reviewsLanded = useCallback(() => setReviewsReady(true), []);
  const [moti, setMoti] = useState<'haveli' | 'matka' | null>(null);
  const [chikuFor, setChikuFor] = useState<{ conceptId: string; title: string; scene: ChikuScene } | null>(null);
  const [chikuBack, setChikuBack] = useState<string>();
  // Closing Chiku returns focus to that idea's card (the chip is gone once played, so its Practice button).
  useEffect(() => {
    if (!chikuBack || chikuFor) return;
    const target = [...document.querySelectorAll<HTMLElement>('button[aria-label]')].find(node => node.getAttribute('aria-label') === `Teach Chiku: ${chikuBack}` || node.getAttribute('aria-label') === `Practice this idea: ${chikuBack}`);
    target?.focus();
  }, [chikuBack, chikuFor]);
  const [openedAt] = useState(() => Date.now());
  const [message, setMessage] = useState('');
  // b2 (gate-rem2): covers are px pictures, so at large text each Library tile also shows its title as live text.
  const largeText = useRootPx() >= LARGE_TEXT_ROOT_PX;
  const data = useLiveQuery(async () => ({
    setting: await db.settings.get(selectedTopicKey),
    sound: await db.settings.get('economy.soundOn'),
    states: await db.learnConcepts.toArray(),
    daily: await db.learnDrops.get(dailyDropId(openedAt)),
    night: await db.learnDrops.get(nightDropId(openedAt)),
    ledger: await db.ledger.toArray(),
    bedtime: await effectiveBedtime(db, openedAt),
  }), [openedAt]);
  // The card follows the drop's bedtime rule, so it is checked again while the screen stays open.
  const [now, setNow] = useState(openedAt);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer); }, []);
  const afterBedtime = !!data && isAfterBedtime(now, data.bedtime);
  const selected = chosenTopics(data?.setting?.value);
  const stateById = new Map((data?.states ?? []).map(row => [row.id, row]));
  const [unitScene, setUnitScene] = useState<string>();
  const learned = new Set((data?.states ?? []).filter(row => !!row.firstLearnedAt).map(row => row.id));
  // Spec 33: a book is the unit (its chapters are smaller), under the id the unit had before.
  const completedUnit = data && completedModuleKey(topics.map(pack => ({ id: bookUnitId(pack), concepts: bookConcepts(pack) })), learned, id => localStorage.getItem(`cast.unit:${id}`) === 'seen');
  useEffect(() => {
    if (!completedUnit || matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce') return;
    try { localStorage.setItem(`cast.unit:${completedUnit}`, 'seen'); } catch { /* Scene remains optional when storage is blocked. */ }
    playCastSound('chest', data?.sound?.value === true && !data.sound.deleted);
    queueMicrotask(() => setUnitScene(completedUnit));
  }, [completedUnit, data?.sound]);
  const scene = unitScene && <UnitScene moduleId={unitScene} close={() => setUnitScene(undefined)} />;
  const isDue = (id: string) => {
    const state = stateById.get(id);
    return !!state && ((!!state.memory && state.memory.dueAt <= openedAt) || ([7, 30] as const).some(day =>
      !!state.firstLearnedAt && openedAt >= state.firstLearnedAt + day * 86_400_000 && !state.retentionChecks?.[day]));
  };
  const dueCount = topics.filter(pack => selected.includes(pack.body.topic.id))
    .flatMap(pack => pack.body.modules.flatMap(module => module.concepts)).filter(concept => isDue(concept.id)).length;
  // Spec 26: Moti's haveli (finished ideas with pieces) and, on Sundays before bedtime, Moti's matka.
  const today = dayKey(now);
  const haveliIdeas = finishedIdeas(HAVELI_IDEAS, data?.ledger ?? []);
  const haveliCap = RULES.moti.haveliDailyCap;
  const dueAt = new Map((data?.states ?? []).filter(row => row.memory).map(row => [row.id, row.memory!.dueAt]));
  const haveliToday = haveliPicks(haveliIdeas, data?.ledger ?? [], dueAt, now, today, haveliCap);
  const visits = lastVisits(data?.ledger ?? []);
  const litToday = haveliIdeas.filter(idea => visits.get(idea.id) === today).map(idea => idea.id);
  const week = weekStart(today);
  const sunday = new Date(`${today}T12:00:00`).getDay() === 0;
  const matkaItems = afterBedtime ? [] : matkaPicks(data?.ledger ?? [], today, week, sunday, matkaAskable);
  const matkaDone = (data?.ledger ?? []).filter(row => row.kind === 'matka' && row.refId.startsWith(`${week}.`)).map(row => String(row.inputs.sourceFactId));
  if (moti === 'haveli') return <Haveli ideas={haveliToday} lit={litToday} everLit={[...visits.keys()]} cap={haveliCap} day={today} onRebuilt={idea => saveHaveliRebuilt(db, idea.id, Date.now())} onLeave={() => setMoti(null)} />;
  if (moti === 'matka') return <Matka items={matkaItems} answered={matkaDone} context={matkaContext} onAnswer={(item, recalled) => saveMatkaAnswer(db, { week, item, recalled, now: currentTime() })} onLeave={() => setMoti(null)} />;
  // Spec 30 second door: ideas finished before their scene existed can still teach Chiku once (Codex B item 110).
  const taughtSteps = new Set((data?.ledger ?? []).filter(fact => fact.kind === 'learn-lesson' && !fact.deleted).map(fact => fact.refId));
  const chikuPlayedIds = new Set((data?.ledger ?? []).filter(fact => fact.kind === 'chiku' && !fact.deleted).map(fact => fact.refId));
  if (chikuFor) return <section className="screen learn-screen"><ChikuStage scene={chikuFor.scene} seed={`${chikuFor.conceptId}:${dayKey(now)}`} onPlayed={(card, matched) => { const at = Date.now(); void getOrCreateDeviceId(db, at).then(deviceId => saveChikuPlayed(db, { conceptId: chikuFor.conceptId, card, matched, deviceId, now: at })).catch(() => setMessage("Could not save Chiku's turn.")); }} onDone={() => { setChikuBack(chikuFor.title); setChikuFor(null); }} />{message && <p role="status">{message}</p>}</section>;
  if (entry === 'drop') return <section className="screen learn-screen"><p className="eyebrow">Today</p><h1>Today's drop</h1><LearnDrop daily itemCount={5} onDone={() => go('learn')} />{scene}</section>;
  if (practice) return <section className="screen learn-screen">{(practice.reviewDue || practice.goldReview) && <AreaScope area="review" />}<LearnDrop daily={false} itemCount={practice.goldReview ? 5 : 3} preferredConceptId={practice.conceptId} practiceTopicId={practice.topicId} reviewDue={practice.reviewDue} goldReview={practice.goldReview} onDone={() => setPractice(undefined)} />{scene}</section>;
  // Spec 33: chapters done, books touched most recently, and each idea's place in the trail (Practice, Teach Chiku, Gold).
  const { done: chaptersDone, lastTouched } = readingState(topics, data?.ledger ?? []);
  const taughtOn = Object.fromEntries((data?.ledger ?? []).filter(fact => fact.kind === 'learn-lesson' && !fact.deleted).map(fact => [fact.refId, fact.dayKey]));
  const gold = new Set((data?.ledger ?? []).filter(fact => fact.kind === 'gold-review').map(fact => fact.refId));
  const stateOf = (topicId: string, module: (typeof topics)[number]['body']['modules'][number]) => chapterState({ topicId, module, taught: taughtSteps, done: chaptersDone, due: isDue });
  const ideaRows = (topicId: string, concepts: ReturnType<typeof bookConcepts>) => <div className="learn-trail">{concepts.map((concept, index) => {
    const state = gold.has(concept.id) ? 'Gold' : masteryMapState(stateById.get(concept.id));
    const triedToday = (data?.ledger ?? []).some(fact => fact.kind === 'gold-attempt' && fact.refId === `${concept.id}:${new Date(openedAt).toISOString().slice(0, 10)}`);
    return <div key={concept.id} className="learn-trail-node learn-idea-row" data-state={state === 'Not started' ? 'new' : state.toLowerCase()}><span className="learn-trail-dot" aria-hidden="true">{index + 1}</span><div><strong>{concept.title}</strong><small>{state}</small></div>
      <button type="button" className="secondary" aria-label={`Practice this idea: ${concept.title}`} onClick={() => setPractice({ conceptId: concept.id, topicId })}>Practice</button>
      {chikuOpen(concept, taughtSteps, chikuPlayedIds, afterBedtime) && <button type="button" className="secondary learn-chiku-chip" aria-label={`Teach Chiku: ${concept.title}`} onClick={() => { if (data && isAfterBedtime(Date.now(), data.bedtime)) return; setChikuFor({ conceptId: concept.id, title: concept.title, scene: concept.chiku as ChikuScene }); }}>Teach Chiku</button>}
      {state === 'Mastered' && goldItems(concept, taughtOn, dayKey(openedAt)) && <button type="button" className="secondary" disabled={triedToday} onClick={() => setPractice({ conceptId: concept.id, topicId, goldReview: true })}>Gold review</button>}</div>;
  })}</div>;

  // Spec 571 M3: Grow › Remember, Moti's door: the review card (idea checks, haveli, matka), card reviews and how learning holds.
  const motiWaiting = dueCount > 0 || haveliIdeas.length > 0 || (matkaItems.length > 0 && matkaDone.length < matkaItems.length);
  if (entry === 'remember') return <section className="screen learn-screen remember-screen"><FriendStage area="review"><p className="eyebrow">Moti by the keepsake wall</p><h1>Remember</h1></FriendStage>
    <section className="card learn-moti" data-area="review" aria-label="Review with Moti" data-testid="moti-review">
      <h2>Review with Moti</h2>
      {!motiWaiting && <p className="small">Nothing waiting now. Ideas you read come back here.</p>}
      {dueCount > 0 && <><button type="button" className="learn-review-action" onClick={() => setPractice({ reviewDue: true })}>Idea checks · {Math.min(dueCount, 3)} today</button>{dueCount > 3 && <p className="deck-meta">{dueCount} ideas waiting</p>}</>}
      {haveliIdeas.length > 0 && <button type="button" className="secondary learn-haveli-action" onClick={() => setMoti('haveli')}>Haveli · {haveliCount(haveliToday, litToday, visits, haveliCap)}</button>}
      {matkaItems.length > 0 && matkaDone.length < matkaItems.length && <button type="button" className="secondary learn-matka-action" onClick={() => setMoti('matka')}>Matka · {matkaItems.length - matkaDone.length} sealed guesses</button>}
    </section>
    <CardReviews onReady={reviewsLanded} />
    {reviewsReady && <LearningHolding />}
    {message && <p role="status">{message}</p>}{scene}
  </section>;

  if (entry === 'book') {
    const pack = topics.find(row => row.body.topic.id === bookParam);
    if (!pack) return <section className="screen learn-screen"><h1>Book not found</h1><button type="button" onClick={() => go('read')}>Back to library</button>{scene}</section>;
    const topicId = pack.body.topic.id, book = pack.body.book;
    const next = nextChapter(pack, chaptersDone);
    const started = pack.body.modules.some(module => stateOf(topicId, module) !== 'not-started');
    const concepts = bookConcepts(pack);
    const mastered = new Set(concepts.filter(concept => masteryMapState(stateById.get(concept.id)) === 'Mastered' || gold.has(concept.id)).map(concept => concept.id));
    const chest = chestReady(concepts.map(concept => concept.id), mastered);
    // Spec 571 stage 2 (row 85): the next-day Book check lives on its book, on the due chapter's row.
    const checkDue = bookCheckDue(data?.ledger ?? [], today);
    return <section className="screen learn-screen read-book-page">
      <div className="read-book-head"><Cover pack={pack} size="large" /><div><h1>{bookTitle(pack)}</h1><p>{book?.author ?? 'NANDI'}{book?.year ? ` · ${book.year}` : ''}</p></div></div>
      {book && <p className="read-blurb">{book.blurb}</p>}
      <p className="small">{pack.body.modules.length} chapters · {minutesLabel(bookMinutes(pack))}</p>
      {book?.rights === 'public-domain' && <p className="small read-rights">Based on the {book.year ?? ''} edition, free to use in India</p>}
      {book?.rights === 'private' && <p className="small read-rights">Private copy on this phone</p>}
      {!next ? <p className="pill">Finished</p> : afterBedtime ? <p className="small" role="status">New chapters open tomorrow. Your idea checks stay open tonight.</p>
        : <button type="button" className="read-start" onClick={() => go(`read/chapter/${topicId}/${next.id}`)}>{started ? 'Continue' : 'Start'} · Chapter {pack.body.modules.indexOf(next) + 1}</button>}
      <ol className="read-chapters" aria-label="Chapters">{pack.body.modules.map((module, index) => {
        const state = stateOf(topicId, module);
        return <li key={module.id} className="card read-chapter" data-state={state}>
          <button type="button" className="read-chapter-open" aria-label={`Chapter ${index + 1}: ${module.title}, ${STATE_LABEL[state]}`} onClick={() => go(`read/chapter/${topicId}/${module.id}`)}>
            <span className="read-chapter-num" aria-hidden="true">{index + 1}</span><span className="read-chapter-text"><strong>{module.title}</strong><span className="small">{minutesLabel(module.minutes ?? 0)} · {module.concepts.length} ideas</span></span><span className="pill">{STATE_LABEL[state]}</span>
          </button>
          {checkDue?.topicId === topicId && checkDue.moduleId === module.id && <button type="button" className="secondary read-check-link" data-testid="book-check-link" onClick={() => go(`read/check/${topicId}/${module.id}`)}>Tried it? · Check</button>}
          <details className="read-chapter-ideas"><summary>{module.concepts.length} ideas<span className="read-chevron" aria-hidden="true">▸</span></summary>{ideaRows(topicId, module.concepts)}</details>
        </li>;
      })}</ol>
      <div className="learn-trail-chest"><Cast name="Chiku" pose={chest ? 'cheer' : 'idle'} size={44} />Book chest · {chest ? 'Opened' : 'Keep reading'} · {RULES.gamify.unitChestShards} Shards</div>
      {message && <p role="status">{message}</p>}{scene}
    </section>;
  }

  const library = libraryOrder(topics);
  const current = currentBook(library, { done: chaptersDone, lastTouched });
  const upNext = current && nextChapter(current, chaptersDone);
  const upNextState = current && upNext ? stateOf(current.body.topic.id, upNext) : undefined;
  const shelves = libraryShelves(library, chaptersDone);
  return <section className="screen learn-screen read-screen"><FriendStage area="learn"><p className="eyebrow">Chiku on the reading rock</p><h1>Read</h1></FriendStage>
    <TodayIdea drop={data?.daily && !data.daily.deleted ? data.daily.drop : undefined} selected={selected} />
    <section className="card read-continue" aria-label="Continue">
      {current && upNext ? <>
        <Cover pack={current} size="thumb" />
        <div className="read-continue-text"><p className="eyebrow">{upNextState === 'in-progress' ? 'Continue' : 'Up next'}</p><h2>{bookTitle(current)}</h2><p>Chapter {current.body.modules.indexOf(upNext) + 1} · {minutesLabel(upNext.minutes ?? 0)}</p><p className="small">{upNext.title}</p></div>
        {afterBedtime ? <p className="small read-night-note" role="status">New chapters open tomorrow. Your idea checks stay open tonight.</p>
          : <button type="button" onClick={() => go(`read/chapter/${current.body.topic.id}/${upNext.id}`)}>{upNextState === 'in-progress' ? 'Continue' : 'Start'}</button>}
      </> : <p className="read-empty">Every book here is finished. New books are on their way.</p>}
    </section>
    {/* Spec 571 (one place): Moti's review card lives on Grow › Remember; Read keeps Chiku's books only. */}
    <section className={`read-library${largeText ? ' large-text' : ''}`} aria-label="Library"><h2>Library</h2>
      {shelves.map(shelf => <section key={shelf.shelf} className="read-shelf" aria-label={shelf.title}><h3>{shelf.title}</h3>
        <ul className="read-shelf-row">{shelf.books.map(pack => {
          const chapters = pack.body.modules.length, read = pack.body.modules.filter(module => chaptersDone.has(chapterRef(pack.body.topic.id, module.id))).length;
          return <li key={pack.id}><button type="button" className="read-book-tile" aria-label={`${bookTitle(pack)} · ${bookDone(pack, chaptersDone) ? 'finished' : `${read} of ${chapters} chapters`}`} onClick={() => go(`read/book/${pack.body.topic.id}`)}>
            <Cover pack={pack} /><span className="read-book-title" aria-hidden="true">{bookTitle(pack)}</span><span className="small">{bookDone(pack, chaptersDone) ? 'Finished' : `${read} of ${chapters} chapters`}</span></button></li>;
        })}</ul></section>)}
      <section className="read-shelf" aria-label="Courses"><h3>Courses</h3><button type="button" className="card you-link you-courtyard-link read-courses-link" onClick={() => go('read/courses')}><strong>Short courses</strong><span>Lessons and tracks from before the books</span></button></section>
    </section>
    {message && <p role="status">{message}</p>}{scene}
  </section>;
}
