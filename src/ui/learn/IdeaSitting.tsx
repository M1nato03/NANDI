import { Fragment, useRef, useState } from 'react';
import type { TopicConcept, TopicModule } from '../../data/packs/schemas';
import type { LedgerRow } from '../../data/types';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { saveDrop, saveLessonDone } from '../../data/repos/learn-engine';
import { saveIdeaDone } from '../../data/repos/books';
import { sittingContent } from '../../data/sittings';
import { lessonItemId } from '../../core/learn/steps';
import { seededShuffle } from '../../core/learn/engine/shuffle';
import type { Drop } from '../../core/learn/engine';
import { dailyDropId } from './dropIds';
import { StepVisual } from './StepLesson';
import { Cast } from '../cast/Cast';

type Screen = 'hook' | 'story' | 'example' | 'try' | 'earlier' | 'plan';
type Choice = { id: string; text: string; correct: boolean; feedback: string };

/**
 * Spec 41: a sitting is ONE idea, six short screens with no scrolling: the guess (its first step's hook), the idea as
 * one scene with its diagram, an Indian worked example, a try (the guided try on odd ideas, spot-the-part on even
 * ones, so sittings don't all feel the same), one question from an idea read on an earlier day, and a try-it-today
 * plan. A book whose extra screens are not written yet shows its teach lines and skips the example and the plan.
 * Finishing writes the idea's steps as taught (through a one-idea reading drop, the day's drop when it is free) and
 * one idea fact.
 */
export function IdeaSitting({ topicId, module, concept, ideaIndex, ideaCount, ledger, earlier, onFinished }: {
  topicId: string; module: TopicModule; concept: TopicConcept; ideaIndex: number; ideaCount: number; ledger: readonly LedgerRow[];
  earlier?: { concept: TopicConcept; item: TopicConcept['items'][number] }; onFinished: () => void;
}) {
  const steps = concept.steps ?? [];
  const first = steps[0]!;
  const tryStep = steps.at(-1)!;
  const extra = sittingContent(topicId, concept.id);
  const spot = (ideaIndex + 1) % 2 === 0;
  const screens: Screen[] = ['hook', 'story', ...(extra ? ['example' as const] : []), 'try', ...(earlier ? ['earlier' as const] : []), ...(extra ? ['plan' as const] : [])];
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const result = useRef({ hookCorrect: false, spotCorrect: false, guidedFirstTry: [] as boolean[] });
  const screen = screens[at]!;
  const last = at === screens.length - 1;

  async function finish() {
    setSaving(true); setFailed(false);
    try {
      const now = Date.now(); // eslint-disable-line react-hooks/purity
      const deviceId = await getOrCreateDeviceId(db, now);
      const taught = new Set(ledger.filter(row => row.kind === 'learn-lesson' && !row.deleted).map(row => row.refId));
      const left = steps.filter(step => !taught.has(step.id));
      const daily = await db.learnDrops.get(dailyDropId(now));
      const free = !daily || !!daily.deleted || (daily.drop.cursor === 0 && !daily.drop.pendingFeedback);
      let drop: Drop = { id: free ? dailyDropId(now) : `drop:chapter:${topicId}:${module.id}:${concept.id}:${now}`, cursor: 0, ending: { kind: 'stopping-screen' }, chapter: { topicId, moduleId: module.id, kind: 'read' },
        items: left.map(step => ({ itemId: lessonItemId(step.id), conceptId: concept.id, optionOrder: [], mode: 'new' as const, lesson: step.id })) };
      await saveDrop(db, drop, deviceId, now);
      for (const step of left) {
        const own = step.id === first.id;
        await saveLessonDone(db, drop, { stepId: step.id, conceptId: concept.id, dropId: drop.id, hookCorrect: own && result.current.hookCorrect, spotCorrect: step.id === tryStep.id && result.current.spotCorrect, guidedFirstTry: step.id === tryStep.id ? result.current.guidedFirstTry : [] }, deviceId, now);
        drop = { ...drop, cursor: drop.cursor + 1 };
      }
      await saveIdeaDone(db, { topicId, moduleId: module.id, conceptId: concept.id, dropId: free ? drop.id : undefined, askedItem: earlier?.item.id }, now);
      onFinished();
    } catch { setFailed(true); setSaving(false); }
  }
  const next = () => { setPicked(undefined); if (last) void finish(); else setAt(at + 1); };

  const question: { stem: string; options: readonly Choice[]; seed: string } | undefined =
    screen === 'hook' ? { stem: first.hook.stem, options: first.hook.options, seed: `${first.id}:hook` }
    : screen === 'try' && !spot ? { stem: tryStep.guided[0]!.stem, options: tryStep.guided[0]!.options, seed: `${tryStep.id}:guided` }
    : screen === 'earlier' && earlier ? { stem: earlier.item.stem, options: earlier.item.options, seed: earlier.item.id } : undefined;
  const chosen = question?.options.find(option => option.id === picked);
  const pick = (option: Choice) => {
    if (picked) return;
    setPicked(option.id);
    if (screen === 'hook') result.current.hookCorrect = option.correct;
    if (screen === 'try') result.current.guidedFirstTry = [option.correct];
  };
  const eyebrow = { hook: 'Guess first', story: concept.title, example: extra?.example.situation ?? '', try: spot ? 'Spot it' : 'Try it', earlier: 'From an earlier day', plan: 'Try it today' }[screen];

  return <section className="screen learn-screen idea-sitting" aria-label={`Idea ${ideaIndex + 1} of ${ideaCount}`}>
    <header className="idea-head">
      <div className="idea-count"><span className="small">Idea {ideaIndex + 1} of {ideaCount}</span>
        <ol className="idea-dots" aria-label={`Idea ${ideaIndex + 1} of ${ideaCount}`}>{Array.from({ length: ideaCount }, (_, index) => <li key={index} className={index < ideaIndex ? 'done' : index === ideaIndex ? 'now' : ''} />)}</ol></div>
      <ol className="step-dots" aria-label={`Screen ${at + 1} of ${screens.length}`}>{screens.map((_, index) => <li key={index} className={index < at ? 'done' : index === at ? 'now' : ''} />)}</ol>
    </header>
    <div className="learn-q" key={at}>
      <p className="eyebrow">{eyebrow}</p>
      {screen === 'story' && <div className="step-teach">
        {extra ? <p className="step-teach-text">{extra.story.text}</p> : steps.map(step => <p key={step.id} className="step-teach-text">{step.teach}</p>)}
        <StepVisual visual={first.visual} />
      </div>}
      {screen === 'example' && extra && <div className="idea-example card"><p>{extra.example.text}</p></div>}
      {screen === 'plan' && extra && <div className="idea-plan card"><p className="idea-plan-line">{extra.plan.ifThen}</p><p className="small">Keep it in mind today. Nothing to tick.</p></div>}
      {screen === 'try' && spot && <>
        <h2>{tryStep.example.ask}</h2>
        <p className="step-example" role="group" aria-label="Example sentence">{tryStep.example.parts.map((part, index) => {
          const isSpot = part === tryStep.example.spot;
          const state = picked === undefined ? '' : isSpot ? ' right' : picked === part ? ' wrong' : '';
          return <Fragment key={index}>{index > 0 && ' '}<button type="button" className={`step-part${state}`} disabled={picked !== undefined} onClick={() => { setPicked(part); result.current.spotCorrect = isSpot; }}>{part.trim()}</button></Fragment>;
        })}</p>
        {picked !== undefined && <div className={`learn-feedback learn-sheet ${picked === tryStep.example.spot ? 'right' : 'idea'}`} role="status"><strong className="learn-sheet-title">{picked === tryStep.example.spot ? 'Spot on.' : 'Here it is.'}</strong><p>{tryStep.example.feedback}</p><button type="button" disabled={saving} onClick={next}>{last ? 'Finish the idea' : 'Continue'}</button></div>}
      </>}
      {question && <>
        <h2>{question.stem}</h2>
        <div className="learn-options">{seededShuffle([...question.options], question.seed).map(option => <button type="button" key={option.id} disabled={!!picked} className={`ui-list-row ${picked === option.id ? 'selected' : ''} ${picked && option.correct ? 'right-option' : ''} ${picked === option.id && !option.correct ? 'wrong-option' : ''}`} onClick={() => pick(option)}>{option.text}{picked && option.correct && <span className="learn-option-check" aria-hidden="true">✓</span>}</button>)}</div>
        {chosen && <div className={`learn-feedback learn-sheet ${chosen.correct ? 'right' : 'idea'}`} role="status"><strong className="learn-sheet-title">{chosen.correct ? 'Exactly.' : 'Good try. Here is the idea.'}</strong><p>{chosen.feedback}</p><button type="button" disabled={saving} onClick={next}>{last ? 'Finish the idea' : 'Continue'}</button></div>}
      </>}
      {(screen === 'story' || screen === 'example' || screen === 'plan') && <button type="button" className="step-continue" disabled={saving} onClick={next}>{last ? 'Finish the idea' : 'Continue'}</button>}
      {failed && <div role="alert"><p>This idea could not be saved on this phone.</p><button type="button" onClick={() => void finish()}>Try saving again</button></div>}
    </div>
    <span className="idea-friend" aria-hidden="true"><Cast name="Chiku" pose={chosen ? (chosen.correct ? 'cheer' : 'think') : 'idle'} size={48} /></span>
  </section>;
}

/** The next idea to read in a chapter: the first with a step not yet taught. */
export function nextIdea(module: TopicModule, taught: ReadonlySet<string>): { concept: TopicConcept; index: number } | undefined {
  const ideas = module.concepts.filter(concept => concept.steps?.length);
  const index = ideas.findIndex(concept => concept.steps!.some(step => !taught.has(step.id)));
  return index < 0 ? undefined : { concept: ideas[index]!, index };
}

/**
 * Screen 5: one question on an idea of this book whose steps were all taught on an EARLIER day (never today's), picked
 * steadily for the day; none before the book's first finished day.
 */
export function earlierQuestion(modules: readonly TopicModule[], ledger: readonly LedgerRow[], today: string): { concept: TopicConcept; item: TopicConcept['items'][number] } | undefined {
  const taughtOn = new Map(ledger.filter(row => row.kind === 'learn-lesson' && !row.deleted).map(row => [row.refId, row.dayKey]));
  const ideas = modules.flatMap(module => module.concepts).filter(concept => concept.steps?.length && concept.items.length && concept.steps.every(step => (taughtOn.get(step.id) ?? '9999') < today));
  if (!ideas.length) return undefined;
  const concept = seededShuffle(ideas.map(idea => ({ ...idea })), `earlier:${today}`)[0]!;
  const item = seededShuffle(concept.items.map(row => ({ ...row })), `earlier:${today}:${concept.id}`)[0]!;
  return { concept, item };
}

