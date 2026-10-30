import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { saveChapterCheck } from '../../data/repos/books';
import { bookTitle } from '../../core/learn/books';
import { topics } from './flow';
import { LearnDrop } from './LearnDrop';
import { go } from '../shell/router';
import './read.css';

type Tried = 'yes' | 'partly' | 'not-yet';

/**
 * Spec 41 §2.4: the day after a chapter's last idea, its Book check: three of its questions (never one a sitting
 * already asked on its screen 5), then "Did you try it?". The right first answers pay outside the chapter's cap.
 */
export function BookCheck({ topicId, moduleId }: { topicId: string; moduleId: string }) {
  const pack = topics.find(row => row.body.topic.id === topicId);
  const index = pack?.body.modules.findIndex(row => row.id === moduleId) ?? -1;
  const module = index >= 0 ? pack!.body.modules[index] : undefined;
  const checked = useLiveQuery(() => db.ledger.get(`read-check:${topicId}:${moduleId}`), [topicId, moduleId]);
  const [stage, setStage] = useState<'questions' | 'tried' | 'saved'>('questions');
  const [failed, setFailed] = useState(false);
  if (!pack || !module) return <section className="screen learn-screen"><h1>Book check not found</h1><button type="button" onClick={() => go('read')}>Back to library</button></section>;
  const head = <header className="read-chapter-head"><p className="eyebrow">Book check · {bookTitle(pack)} · Chapter {index + 1}</p><h1>{module.title}</h1></header>;
  const answer = (tried: Tried) => { setFailed(false); void saveChapterCheck(db, topicId, moduleId, tried, Date.now()).then(() => setStage('saved'), () => setFailed(true)); };
  if (stage === 'saved' || (checked && !checked.deleted && stage !== 'tried')) return <section className="screen learn-screen">{head}<div className="card read-done-card" role="status">
    <p className="read-takeaway">Book check done. The chapter is yours.</p>
    <button type="button" onClick={() => go('yatra')}>Back to Yatra</button>
  </div></section>;
  if (stage === 'tried') return <section className="screen learn-screen">{head}<div className="card book-check-tried">
    <h2>Did you try it?</h2>
    <p className="small">The plan from this chapter's ideas, in your own day.</p>
    <div className="book-check-answers" role="group" aria-label="Did you try it?">
      <button type="button" className="secondary" onClick={() => answer('yes')}>Yes</button>
      <button type="button" className="secondary" onClick={() => answer('partly')}>Partly</button>
      <button type="button" className="secondary" onClick={() => answer('not-yet')}>Not yet</button>
    </div>
    {failed && <p role="alert">That could not be saved on this phone. Try again.</p>}
  </div></section>;
  return <section className="screen learn-screen">{head}<p className="small read-check-label">Three questions from this chapter</p>
    <LearnDrop key="book-check" daily={false} practiceTopicId={topicId} chapter={{ topicId, moduleId, kind: 'check' }} onDone={() => setStage('tried')} /></section>;
}
