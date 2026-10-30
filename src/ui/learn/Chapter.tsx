import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { effectiveBedtime } from '../../data/repos/night';
import { saveChikuPlayed } from '../../data/repos/learn-engine';
import { saveHaveliRebuilt } from '../../data/repos/moti';
import { saveChapterDone } from '../../data/repos/books';
import { bookDone, bookTitle, chapterRef, chapterTakeaway, libraryOrder, nextChapter, untaughtSteps } from '../../core/learn/books';
import type { ChikuScene } from '../../core/learn/chiku';
import { dayKey, isAfterBedtime } from '../../core/time';
import { chapterLine } from '../economy/effortLines';
import { topics } from './flow';
import { LearnDrop } from './LearnDrop';
import { earlierQuestion, IdeaSitting, nextIdea } from './IdeaSitting';
import { Haveli } from './Haveli';
import { ChikuStage } from './ChikuStage';
import { Cast } from '../cast/Cast';
import { go } from '../shell/router';
import './read.css';

const currentTime = () => Date.now();

type View = 'read' | 'wait' | 'check' | 'done';

/**
 * Spec 33 §3, spec 41: a chapter is read one idea a sitting (IdeaSitting), each ending on a real stop: "One more idea"
 * or "That's enough for now". After its last idea a chapter with Moti's haveli rebuild or Teach Chiku plays that check;
 * a chapter with a quiz is done at once, and its three questions come the next day as Home's Book check. No new
 * reading after bedtime: what is left of a chapter waits for tomorrow.
 */
export function Chapter({ topicId, moduleId }: { topicId: string; moduleId: string }) {
  const pack = topics.find(row => row.body.topic.id === topicId);
  const index = pack?.body.modules.findIndex(row => row.id === moduleId) ?? -1;
  const module = index >= 0 ? pack!.body.modules[index] : undefined;
  const [openedAt] = useState(currentTime);
  const data = useLiveQuery(async () => ({
    ledger: await db.ledger.where('kind').anyOf('learn-lesson', 'chapter').toArray(),
    bedtime: await effectiveBedtime(db, openedAt),
  }), [openedAt]);
  const [step, setStep] = useState<'check' | 'done' | null>(null);
  // Spec 41: the idea just finished, shown on its end card until the reader picks one more or stops.
  const [ended, setEnded] = useState<{ title: string; takeaway: string } | null>(null);
  const rebuilt = useRef(false);
  const taught = new Set((data?.ledger ?? []).filter(fact => fact.kind === 'learn-lesson' && !fact.deleted).map(fact => fact.refId));
  const done = new Set((data?.ledger ?? []).filter(fact => fact.kind === 'chapter' && !fact.deleted).map(fact => fact.refId));
  const wasDone = !!data && done.has(chapterRef(topicId, moduleId));
  const left = module ? untaughtSteps(module, taught).length : 0;
  const afterBedtime = !!data && isAfterBedtime(currentTime(), data.bedtime);
  // A chapter opened again after it was finished shows its done card; otherwise the reading comes first.
  const quiz = (module?.check ?? 'quiz') === 'quiz';
  const view: View = step === 'done' || (wasDone && step === null) ? 'done' : left > 0 || ended ? (afterBedtime && !ended ? 'wait' : 'read') : quiz ? 'done' : 'check';
  const finishing = useRef(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [playNote, setPlayNote] = useState('');
  const saveDone = () => {
    finishing.current = true;
    setSaveFailed(false);
    void saveChapterDone(db, topicId, moduleId, currentTime(), { rebuilt: rebuilt.current }).catch(() => { finishing.current = false; setSaveFailed(true); });
  };
  useEffect(() => {
    if (view !== 'done' || wasDone || finishing.current) return;
    saveDone();
  }, [view, wasDone, topicId, moduleId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!pack || !module) return <section className="screen learn-screen"><h1>Chapter not found</h1><button type="button" onClick={() => go('read')}>Back to library</button></section>;
  if (!data) return <section className="screen learn-screen" role="status">Opening the chapter…</section>;
  const title = bookTitle(pack);
  const head = <header className="read-chapter-head"><p className="eyebrow">{title} · Chapter {index + 1}</p><h1>{module.title}</h1></header>;
  const toDone = () => setStep('done');

  if (view === 'wait') return <section className="screen learn-screen">{head}<div className="card read-wait" role="status"><p>That is enough reading for tonight. The rest of this chapter opens tomorrow.</p><p className="small">Your idea checks stay open tonight.</p><button type="button" className="secondary" onClick={() => go(`read/book/${topicId}`)}>Back to the book</button></div></section>;
  if (view === 'read') {
    const ideas = module.concepts.filter(concept => concept.steps?.length).length;
    if (ended) return <section className="screen learn-screen">{head}<div className="card read-done-card idea-end" role="status">
      <p className="eyebrow">Idea done</p><h2>{ended.title}</h2><p className="read-takeaway">{ended.takeaway}</p>
      <div className="idea-end-actions"><button type="button" onClick={() => setEnded(null)}>One more idea</button>
        <button type="button" className="secondary" onClick={() => go(`read/book/${topicId}`)}>That's enough for now</button></div>
    </div></section>;
    const idea = nextIdea(module, taught);
    if (!idea) return <section className="screen learn-screen" role="status">Saving your place…</section>;
    const isLast = idea.index === ideas - 1;
    return <section className="screen learn-screen read-chapter-screen">{head}<IdeaSitting key={idea.concept.id} topicId={topicId} module={module} concept={idea.concept} ideaIndex={idea.index} ideaCount={ideas} ledger={data.ledger}
      earlier={idea.index === 0 && taught.size === 0 ? undefined : earlierQuestion(pack.body.modules, data.ledger, dayKey(openedAt))}
      onFinished={() => { if (!isLast) setEnded({ title: idea.concept.title, takeaway: idea.concept.steps!.at(-1)!.takeaway ?? idea.concept.title }); }} /></section>;
  }

  if (view === 'check') {
    const kind = module.check ?? 'quiz';
    const recall = kind === 'recall' ? module.concepts.find(concept => concept.recall) : undefined;
    const chiku = kind === 'chiku' ? module.concepts.find(concept => concept.chiku) : undefined;
    if (recall?.recall) return <Haveli ideas={[{ id: recall.id, title: recall.title, topicId, topicTitle: title, recall: recall.recall, steps: (recall.steps ?? []).map(row => row.id) }]}
      lit={[]} everLit={[]} cap={1} day={dayKey(currentTime())}
      onRebuilt={async idea => { await saveHaveliRebuilt(db, idea.id, currentTime()); rebuilt.current = true; }}
      onLeave={() => rebuilt.current ? toDone() : go(`read/book/${topicId}`)} />;
    if (chiku?.chiku) return <section className="screen learn-screen">{head}<ChikuStage scene={chiku.chiku as ChikuScene} seed={`${chiku.id}:${dayKey(openedAt)}`}
      onPlayed={(card, matched) => { const at = currentTime(); void getOrCreateDeviceId(db, at).then(deviceId => saveChikuPlayed(db, { conceptId: chiku.id, card, matched, deviceId, now: at })).then(() => setPlayNote(''), () => setPlayNote('Could not save that play. The chapter still finishes.')); }}
      onDone={toDone} />{playNote && <p className="small" role="alert">{playNote}</p>}</section>;
    return <section className="screen learn-screen"><header className="read-chapter-head"><p className="eyebrow">{title} · Chapter {index + 1}</p><h1>{module.title}</h1><p className="small read-check-label">Chapter check · three questions</p></header><LearnDrop key="check" daily={false} practiceTopicId={topicId} chapter={{ topicId, moduleId, kind: 'check' }} onDone={toDone} /></section>;
  }

  // Done: the takeaway in one line, then the next chapter, or the next book when this one is finished.
  const doneNow = new Set([...done, chapterRef(topicId, moduleId)]);
  const following = nextChapter(pack, doneNow);
  const finishedBook = bookDone(pack, doneNow);
  const nextBook = finishedBook ? libraryOrder(topics).find(row => row !== pack && !bookDone(row, doneNow)) : undefined;
  // Until the chapter's row is saved the card says so; it never shows "done" for a chapter that was not kept.
  if (!wasDone && saveFailed) return <section className="screen learn-screen">{head}<div className="card read-done-card" role="alert">
    <p>This chapter could not be saved on this phone.</p>
    <button type="button" onClick={saveDone}>Try saving again</button>
    <button type="button" className="secondary" onClick={() => go(`read/book/${topicId}`)}>Back to the book</button>
  </div></section>;
  if (!wasDone) return <section className="screen learn-screen">{head}<div className="card read-done-card" role="status"><p>Saving the chapter…</p></div></section>;
  return <section className="screen learn-screen">
    <div className="card read-done-card" role="status">
      <Cast name="Chiku" pose="cheer" size={96} moment="hop" at={1} title="Chiku cheering" />
      {finishedBook ? <><p className="eyebrow">Book finished</p><h1>You finished {title}.</h1></> : <><p className="eyebrow">Chapter {index + 1} done</p><h1>{module.title}</h1></>}
      {(() => { const line = chapterLine(data.ledger, chapterRef(topicId, moduleId)); return line ? <p className="read-earned">{line}</p> : null; })()}
      <p className="read-takeaway">{finishedBook ? `${pack.body.modules.length} chapters and ${pack.body.modules.reduce((sum, row) => sum + row.concepts.length, 0)} ideas, read.` : chapterTakeaway(module)}</p>
      {!finishedBook && following && <button type="button" onClick={() => go(`read/chapter/${topicId}/${following.id}`)}>Next chapter</button>}
      {finishedBook && nextBook && <button type="button" onClick={() => go(`read/book/${nextBook.body.topic.id}`)}>Next book: {bookTitle(nextBook)}</button>}
      <button type="button" className="secondary" onClick={() => go('read')}>Back to library</button>
    </div>
  </section>;
}
