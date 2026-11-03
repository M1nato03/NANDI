import { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../../data/db';
import { finishAttempt, recordChange, startAttempt } from '../../data/repos/skillPractice';
import { savePage } from '../../data/repos/notebook';
import { checkAnswer, stepLoop, type Answer, type CheckResult, type LoopState, type NarrowCheck } from '../../core/skillPractice';
import type { SkillLesson } from '../../data/packs/skillTrack';
import './skill.css';

const currentTime = () => Date.now();
/** A steady order for options and parts that is not the pack's order (the right answer is often written first). */
function steadyShuffle(items: readonly string[], seed: string): string[] {
  const hash = (value: string) => [...`${seed}|${value}`].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
  return [...items].sort((a, b) => hash(a) - hash(b));
}
const shown = (answer: Answer) => Array.isArray(answer) ? answer.join(' → ') : answer;
const RESULT: Record<CheckResult, string> = { right: 'Right', near: 'Nearly', wrong: 'Not yet' };

/** The answer area for one narrow check: tap an option, build an order, or type a short phrase. */
function NarrowInput({ check, seed, value, onChange, label }: { check: NarrowCheck; seed: string; value: Answer; onChange: (answer: Answer) => void; label: string }) {
  if (check.kind === 'choice') {
    return <div className="skill-options" role="radiogroup" aria-label={label}>{steadyShuffle(check.options, seed).map(option =>
      <button key={option} type="button" role="radio" aria-checked={value === option} className={`secondary skill-option${value === option ? ' chosen' : ''}`} onClick={() => onChange(option)}>{option}</button>)}</div>;
  }
  if (check.kind === 'order') {
    const picked = Array.isArray(value) ? value : [];
    return <div className="skill-order">
      <ol className="skill-order-picked" aria-label="Your order">{picked.map(part => <li key={part}>{part}</li>)}</ol>
      <div className="skill-options" role="group" aria-label={label}>{steadyShuffle(check.parts, seed).filter(part => !picked.includes(part)).map(part =>
        <button key={part} type="button" className="secondary skill-option" onClick={() => onChange([...picked, part])}>{part}</button>)}</div>
      {picked.length > 0 && <button type="button" className="text-button" onClick={() => onChange([])}>Start the order again</button>}
    </div>;
  }
  return <label className="skill-phrase">{label}<input type="text" autoComplete="off" value={typeof value === 'string' ? value : ''} onChange={event => onChange(event.target.value)} /></label>;
}
const complete = (check: NarrowCheck, answer: Answer) => check.kind === 'order' ? Array.isArray(answer) && answer.length === check.parts.length : typeof answer === 'string' && answer.trim().length > 0;

/**
 * Spec 43 (starter): one practice lesson, one stage per screen: a worked example, change one part (checked), a fresh
 * case (checked, or the learner's own words as a self-check), specific feedback with the answer shown, then save.
 * "Stop for now" is on every stage and nothing moves on by itself. Saving makes a private notebook page; there is no
 * notebook screen yet, so it just says "Saved." Nothing here pays XP.
 */
export function SkillPractice({ trackId, lesson, variantIndex = 0, retryOf, onStop }: { trackId: string; lesson: SkillLesson; variantIndex?: number; retryOf?: string; onStop: () => void }) {
  const fresh = lesson.fresh[variantIndex % lesson.fresh.length]!;
  const [state, setState] = useState<LoopState>({ stage: 'worked' });
  const [attempt, setAttempt] = useState<string | null>(null);
  const [changeAnswer, setChangeAnswer] = useState<Answer>('');
  const [changeFeedback, setChangeFeedback] = useState<{ result: CheckResult; feedback: string } | null>(null);
  const [freshAnswer, setFreshAnswer] = useState<Answer>('');
  const [freshFeedback, setFreshFeedback] = useState<{ result: CheckResult; feedback: string } | null>(null);
  const [ticks, setTicks] = useState<boolean[]>(lesson.checklist.map(() => false));
  const [message, setMessage] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startAttempt(db, { trackId, lessonId: lesson.lessonId, variantId: fresh.variantId, ...(retryOf ? { retryOf } : {}) }, currentTime()).then(setAttempt)
      .catch(() => setMessage('Could not start this practice. Try again.'));
  }, [trackId, lesson.lessonId, fresh.variantId, retryOf]);
  // Each new stage puts focus on its heading, so a screen reader hears where it is.
  useEffect(() => { heading.current?.focus(); }, [state.stage]);
  const seed = `${lesson.lessonId}|${fresh.variantId}`;
  const step = useMemo(() => ({ worked: 1, change: 2, fresh: 3, feedback: 4, saved: 5 } as const)[state.stage], [state.stage]);

  async function checkChange() {
    const outcome = checkAnswer(lesson.change.check as NarrowCheck, changeAnswer);
    setChangeFeedback(outcome);
    setState(current => stepLoop(current, { type: 'change', answer: changeAnswer, result: outcome.result }));
    if (attempt) await recordChange(db, attempt, changeAnswer, outcome.result, currentTime()).catch(() => setMessage('Could not save this check. It still counts here.'));
  }
  function checkFresh() {
    if (fresh.check) {
      const outcome = checkAnswer(fresh.check as NarrowCheck, freshAnswer);
      setFreshFeedback(outcome);
      setState(current => stepLoop(current, { type: 'fresh', answer: freshAnswer, result: outcome.result }));
    } else {
      setFreshFeedback(null);
      setState(current => stepLoop(current, { type: 'fresh', answer: freshAnswer, result: 'self' }));
    }
  }
  async function save() {
    if (!attempt || !state.fresh) return;
    try {
      const now = currentTime();
      const { pageId } = await savePage(db, { trackId, lessonId: lesson.lessonId, title: lesson.title, prompt: fresh.prompt, answer: shown(state.fresh.answer),
        checklist: lesson.checklist.map((text, i) => ({ text, ticked: ticks[i] ?? false })), status: 'practised' }, now);
      await finishAttempt(db, attempt, fresh.check ? { answer: state.fresh.answer, result: state.fresh.result } : { result: 'self' }, pageId, now);
      setMessage('');
      setState(current => stepLoop(current, { type: 'saved' }));
    } catch { setMessage('Could not save your answer. Try again.'); }
  }

  const stop = <button type="button" className="text-button skill-stop" onClick={onStop}>Stop for now</button>;
  return <section className="screen skill-practice" aria-label="Practice">
    <p className="eyebrow">{lesson.title} · step {step} of 5</p>
    {state.stage === 'worked' && <>
      <h1 ref={heading} tabIndex={-1}>See one done</h1>
      <p className="skill-scenario">{lesson.scenario}</p>
      <div className="card skill-worked"><p className="small">{lesson.worked.prompt}</p><p className="skill-answer">{lesson.worked.answer}</p>
        <ul className="skill-why">{lesson.worked.why.map(reason => <li key={reason}>{reason}</li>)}</ul></div>
      <button type="button" onClick={() => setState(current => stepLoop(current, { type: 'next' }))}>Change one part</button>
    </>}
    {state.stage === 'change' && <>
      <h1 ref={heading} tabIndex={-1}>Change one part</h1>
      <p>{lesson.change.prompt}</p>
      <NarrowInput check={lesson.change.check as NarrowCheck} seed={`${seed}|change`} value={changeAnswer} label="Your answer" onChange={answer => { setChangeAnswer(answer); setChangeFeedback(null); }} />
      {changeFeedback ? <>
        <p role="status" className={`skill-feedback ${changeFeedback.result}`}><strong>{RESULT[changeFeedback.result]}.</strong> {changeFeedback.feedback}</p>
        <button type="button" onClick={() => setState(current => stepLoop(current, { type: 'next' }))}>Try a fresh one</button>
      </> : <button type="button" disabled={!complete(lesson.change.check as NarrowCheck, changeAnswer)} onClick={() => void checkChange()}>Check</button>}
    </>}
    {state.stage === 'fresh' && <>
      <h1 ref={heading} tabIndex={-1}>Your turn</h1>
      <p>{fresh.prompt}</p>
      {fresh.check
        ? <NarrowInput check={fresh.check as NarrowCheck} seed={`${seed}|fresh`} value={freshAnswer} label="Your answer" onChange={setFreshAnswer} />
        : <label className="skill-own">In your own words<textarea rows={4} value={typeof freshAnswer === 'string' ? freshAnswer : ''} onChange={event => setFreshAnswer(event.target.value)} /></label>}
      <button type="button" disabled={fresh.check ? !complete(fresh.check as NarrowCheck, freshAnswer) : !(typeof freshAnswer === 'string' && freshAnswer.trim())} onClick={checkFresh}>{fresh.check ? 'Check' : 'Done writing'}</button>
    </>}
    {state.stage === 'feedback' && state.fresh && <>
      <h1 ref={heading} tabIndex={-1}>{freshFeedback ? RESULT[freshFeedback.result] : 'Check it yourself'}</h1>
      <div className="card"><p className="small">Your answer</p><p className="skill-answer">{shown(state.fresh.answer)}</p></div>
      {freshFeedback && fresh.check && <>
        <p role="status" className={`skill-feedback ${freshFeedback.result}`}>{freshFeedback.feedback}</p>
        {freshFeedback.result !== 'right' && <p className="skill-accepted">A clear answer: <strong>{fresh.check.kind === 'order' ? fresh.check.parts.join(' → ') : fresh.check.accepted[0]}</strong></p>}
      </>}
      {!fresh.check && <p className="small">This one is in your own words, so NANDI does not mark it. Tick what your answer does.</p>}
      <fieldset className="skill-checklist"><legend>Checklist</legend>{lesson.checklist.map((text, i) =>
        <label key={text}><input type="checkbox" checked={ticks[i] ?? false} onChange={event => setTicks(current => current.map((tick, j) => j === i ? event.target.checked : tick))} /> {text}</label>)}</fieldset>
      <div className="skill-actions">
        <button type="button" disabled={!attempt} onClick={() => void save()}>Save to My work</button>
        <button type="button" className="secondary" onClick={() => setState(current => stepLoop(current, { type: 'revise' }))}>Revise my answer</button>
      </div>
    </>}
    {state.stage === 'saved' && <>
      <h1 ref={heading} tabIndex={-1}>Saved.</h1>
      <p>Use it today: {lesson.useItToday}</p>
      <button type="button" onClick={onStop}>Done</button>
    </>}
    {message && <p role="alert">{message}</p>}
    {state.stage !== 'saved' && stop}
  </section>;
}
