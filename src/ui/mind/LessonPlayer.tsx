import { useRef, useState } from 'react';
import { LESSON_STEPS, confidencePercent, isCorrect, type Confidence } from '../../core/learn/learn';
import { db } from '../../data/db';
import type { Lesson } from '../../data/packs/schemas';
import { completeLesson, saveLessonDraft, type LessonDraft } from '../../data/repos/learn';
import { recordError } from '../errorRing';
import { Diagram } from './Diagram';
import { nightMindNote } from './economyVisibility';

type Props = { lesson: Lesson; packId: string; courseName: string; total: number; completed: number; draft: LessonDraft; afterBedtime: boolean; economyVisible: boolean; onLeave: () => void; onDone: () => void; teaser?: string };
type QuizKey = 'guess' | 'transfer' | 'why';

export function LessonPlayer({ lesson, packId, courseName, total, completed, draft: initial, afterBedtime, economyVisible, onLeave, onDone, teaser }: Props) {
  const [draft, setDraft] = useState(initial);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [iast, setIast] = useState(false);
  const [busy, setBusy] = useState(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const version = useRef(0);
  const save = (next: LessonDraft) => {
    setDraft(next); setSaveState('saving');
    const ownVersion = ++version.current;
    queue.current = queue.current.catch(() => {}).then(() => saveLessonDraft(db, next)).then(() => { if (version.current === ownVersion) setSaveState('saved'); }).catch(error => { recordError('window', error); if (version.current === ownVersion) setSaveState('error'); });
  };
  const advance = (step: number) => { save({ ...draft, step }); window.scrollTo(0, 0); };
  const pick = (key: QuizKey, position: number) => save({ ...draft, picked: { ...draft.picked, [key]: position } });
  const quiz = (key: QuizKey, data: { q: string; o: string[]; a: number; w?: string; f?: string }, reveal: boolean) => {
    const selected = draft.picked[key];
    const order = draft.order[key];
    const correct = isCorrect(order, selected ?? null, data.a);
    return <><p className="mind-lesson-question">{data.q}</p><div className="mind-lesson-options">{order.map((sourceIndex, position) => <button type="button" key={position} className={`secondary${selected === position ? ' selected' : ''}`} disabled={reveal && selected !== undefined} onClick={() => pick(key, position)}>{String.fromCharCode(65 + position)}. {data.o[sourceIndex]}</button>)}</div>{reveal && selected !== undefined && <div className="mind-feedback" role="status"><strong>{correct ? 'Right.' : 'Not quite.'}</strong>{!correct && <p>Answer: {data.o[data.a]}</p>}<p>{data.w ?? data.f}</p></div>}</>;
  };
  const step = LESSON_STEPS[draft.step];
  const goDone = async (savePlan: boolean) => {
    setBusy(true);
    try {
      await queue.current;
      await completeLesson(db, { ...draft, step: 7, savedPlan: savePlan }, packId, lesson.cards.length, { guess: lesson.a, transfer: lesson.tr.a, why: lesson.wy.a }, afterBedtime);
      setDraft(value => ({ ...value, step: 7 })); setSaveState('saved'); onDone(); window.scrollTo(0, 0);
    } catch (error) { setSaveState('error'); recordError('window', error); }
    finally { setBusy(false); }
  };
  return <section className="screen mind-lesson" data-save-state={saveState}>
    <p className="eyebrow">{courseName} · {draft.review ? 'Review' : 'Today’s lesson'} · {draft.step + 1} of 8</p>
    <h1>{lesson.t}</h1>
    {afterBedtime && <p role="status">{nightMindNote(economyVisible)}</p>}
    <p className="mind-save" role="status">{saveState === 'saved' ? 'Saved' : saveState === 'saving' ? 'Saving…' : 'Save failed. Try again.'}</p>
    <article className="card" aria-label={`${step} screen`}>
      {step === 'guess' && <><p className="mind-scene">{lesson.scene}</p>{quiz('guess', lesson, false)}{draft.picked.guess !== undefined && <><p>How confident are you?</p><div className="mind-lesson-options">{(['sure', 'think', 'guess'] as Confidence[]).map(value => <button key={value} type="button" onClick={() => { save({ ...draft, confidence: value, step: 1 }); window.scrollTo(0, 0); }}>{value === 'sure' ? 'Sure' : value === 'think' ? 'Think so' : 'Guessing'} · {confidencePercent(value)}%</button>)}</div></>}</>}
      {step === 'reveal' && <><h2>{isCorrect(draft.order.guess, draft.picked.guess ?? null, lesson.a) ? 'You called it.' : 'Not quite.'}</h2>{!isCorrect(draft.order.guess, draft.picked.guess ?? null, lesson.a) && <p>Answer: {lesson.o[lesson.a]}</p>}{!isCorrect(draft.order.guess, draft.picked.guess ?? null, lesson.a) && draft.confidence === 'sure' && <p>Surprised? Confident misses are the ones you remember best.</p>}<p>{lesson.rv}</p><Diagram data={lesson.pic} /><button type="button" onClick={() => advance(2)}>Continue</button></>}
      {step === 'source' && <><h2>Name it · {lesson.term.w}</h2><p>{lesson.term.g}</p>{lesson.v ? <>{lesson.v.map(verse => <div className="mind-source" key={verse.ref}><strong>Gita {verse.ref} · {verse.who}</strong><p>{verse.s}</p><p>{verse.m}</p>{verse.n && <p>{verse.n}</p>}{iast && <p>{verse.i}</p>}</div>)}<button type="button" className="secondary" aria-expanded={iast} onClick={() => setIast(value => !value)}>Exact pronunciation (IAST)</button>{lesson.par && <div className="mind-source"><h3>Modern parallel</h3><p>{lesson.par}</p><p>Ancient insight, modern parallel: not the same thing, but pointing the same way.</p></div>}</> : <><div className="mind-source"><strong>Charaka Samhita · New Edition · {lesson.src?.ref}</strong><p>{lesson.src?.s}</p><p>{lesson.src?.line}</p><p>{lesson.src?.n}</p></div><div className="mind-source"><h3>Evidence grade: {lesson.grade?.g}</h3><p>{lesson.grade?.n}</p></div><div className="mind-source"><h3>What research says</h3><p>{lesson.sci}</p></div><p>Educational, not medical advice.</p></>}<button type="button" onClick={() => advance(3)}>Continue</button></>}
      {step === 'story' && <><h2>The story</h2>{lesson.st.map((beat, index) => <p key={index}>{beat}</p>)}<div className="mind-source"><strong>The rule</strong><p>{lesson.rule}</p></div><button type="button" onClick={() => advance(4)}>Continue</button></>}
      {step === 'transfer' && <><h2>Try it somewhere new</h2><p className="mind-scene">{lesson.tr.s}</p>{quiz('transfer', lesson.tr, true)}{draft.picked.transfer !== undefined && <button type="button" onClick={() => advance(5)}>Continue</button>}</>}
      {step === 'why' && <><h2>Why does it work?</h2>{quiz('why', lesson.wy, true)}{draft.picked.why !== undefined && <button type="button" onClick={() => advance(6)}>Continue</button>}</>}
      {step === 'plan' && <><h2>Make one if-then plan</h2><label>If…<select value={lesson.pl.i.includes(draft.planIf ?? '') ? draft.planIf : draft.planIf ? 'own' : ''} onChange={event => save({ ...draft, planIf: event.target.value })}><option value="">Choose a cue</option>{lesson.pl.i.map(value => <option key={value}>{value}</option>)}<option value="own">Write my own</option></select></label>{draft.planIf && !lesson.pl.i.includes(draft.planIf) && <input aria-label="My cue" maxLength={120} value={draft.planIf === 'own' ? '' : draft.planIf} onChange={event => save({ ...draft, planIf: event.target.value })} />}<label>…then I will<select value={lesson.pl.t.includes(draft.planThen ?? '') ? draft.planThen : draft.planThen ? 'own' : ''} onChange={event => save({ ...draft, planThen: event.target.value })}><option value="">Choose an action</option>{lesson.pl.t.map(value => <option key={value}>{value}</option>)}<option value="own">Write my own</option></select></label>{draft.planThen && !lesson.pl.t.includes(draft.planThen) && <input aria-label="My action" maxLength={120} value={draft.planThen === 'own' ? '' : draft.planThen} onChange={event => save({ ...draft, planThen: event.target.value })} />}<p>{draft.planIf && draft.planThen ? `If ${draft.planIf}, then I will ${draft.planThen}.` : 'Pick one of each.'}</p><button type="button" className="secondary" disabled={busy} onClick={() => void goDone(false)}>Skip</button><button type="button" disabled={busy || !draft.planIf || !draft.planThen || draft.planIf === 'own' || draft.planThen === 'own'} onClick={() => void goDone(true)}>Save plan</button></>}
      {step === 'done' && <><h2>{draft.review ? 'Review done.' : 'Lesson done.'}</h2>{!draft.review && <p>2 cards added to your deck. First review tomorrow.</p>}<p>{courseName} · {completed} of {total} complete</p>{teaser && <p>Tomorrow: {teaser}</p>}<button type="button" onClick={onLeave}>Done</button></>}
    </article>
  </section>;
}
