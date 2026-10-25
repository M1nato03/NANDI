import { Fragment, useEffect, useRef, useState } from 'react';
import type { StepVisual as StepVisualData, TopicStep } from '../../data/packs/schemas';
import { Cast, type CastName } from '../cast/Cast';
import { tapHaptic } from '../../platform/haptics';
import { revealSheet } from './revealSheet';
import { seededShuffle } from '../../core/learn/engine/shuffle';

// Content lists the right option first; show a stable, even shuffle so position never gives it away (item 71, B1).
export const shuffled = <T extends { id: string }>(options: readonly T[], seed: string): T[] => seededShuffle(options, seed);
const motionOn = () => !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.motion !== 'reduce';

/** A small diagram drawn from the step's data: a flow of chips, two columns, or a scale with marks. */
export function StepVisual({ visual }: { visual: StepVisualData }) {
  if (visual.kind === 'flow') return <div className="step-visual step-flow" role="img" aria-label={visual.nodes.join(', then ')}>
    {visual.nodes.map((node, index) => <Fragment key={node}>{index > 0 && <span className="step-arrow" aria-hidden="true">↓</span>}<span className="step-node">{node}</span></Fragment>)}
  </div>;
  if (visual.kind === 'compare') return <div className="step-visual step-compare" role="img" aria-label={`${visual.left.title}: ${visual.left.lines.join(', ')}. ${visual.right.title}: ${visual.right.lines.join(', ')}.`}>
    {[visual.left, visual.right].map(side => <div key={side.title} className="step-side"><strong>{side.title}</strong>{side.lines.map(line => <span key={line}>{line}</span>)}</div>)}
  </div>;
  return <div className="step-visual step-scale" role="img" aria-label={`${visual.label}: from ${visual.min} to ${visual.max}. ${visual.marks.map(mark => mark.text).join('. ')}.`}>
    <span className="step-scale-label">{visual.label}</span>
    {/* Numbered dots on the bar and the words in a list under it, so labels never overprint or widen the page (cj2 lesson walk #3, #4). */}
    <div className="step-scale-bar">{visual.marks.map((mark, index) => <span key={mark.text} className="step-scale-mark" style={{ left: `${Math.min(100, Math.max(0, mark.at))}%` }} aria-hidden="true">{index + 1}</span>)}</div>
    <div className="step-scale-ends"><span>{visual.min}</span><span>{visual.max}</span></div>
    <ol className="step-scale-list">{visual.marks.map(mark => <li key={mark.text}>{mark.text}</li>)}</ol>
  </div>;
}

/** Spec 26 M1: `hookPick` is the option first picked on the hook, sealed in the matka (never edited). */
export interface StepLessonResult { hookCorrect: boolean; hookPick?: string; spotCorrect: boolean; guidedFirstTry: boolean[] }
type Phase = { kind: 'hook' } | { kind: 'teach' } | { kind: 'show' } | { kind: 'guided'; index: number };

/**
 * Spec 14: show, guide, try. Hook guess → the idea in two sentences with a diagram → a worked example
 * (tap the part that shows the idea) → one guided try with a hint. Spec 16 §5: a claim is asked at
 * most 3 times in a lesson (hook, spot, one guided try); questions on other ideas follow in the drop.
 */
const guidedTries = (step: TopicStep) => step.guided.slice(0, 1);
/** Screens in a step lesson: hook, idea, show me, then the guided try. */
export const lessonScreens = (step: TopicStep) => 3 + guidedTries(step).length;

export function StepLesson({ step, conceptTitle, friend, busy, progress, more = true, onDone }: { step: TopicStep; conceptTitle: string; friend: CastName; busy: boolean; progress?: { before: number; total: number }; more?: boolean; onDone: (result: StepLessonResult) => void }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'hook' });
  const [picked, setPicked] = useState<string>();
  const [hint, setHint] = useState(false);
  const [result, setResult] = useState<StepLessonResult>({ hookCorrect: false, spotCorrect: false, guidedFirstTry: [] });
  const phases: Phase[] = [{ kind: 'hook' }, { kind: 'teach' }, { kind: 'show' }, ...guidedTries(step).map((_, index) => ({ kind: 'guided' as const, index }))];
  const at = phases.findIndex(candidate => candidate.kind === phase.kind && (candidate.kind !== 'guided' || (phase.kind === 'guided' && candidate.index === phase.index)));
  const next = () => {
    setPicked(undefined); setHint(false);
    const following = phases[at + 1];
    if (following) setPhase(following); else onDone(result);
  };
  const press = () => { if (motionOn()) void tapHaptic(true, 8); };
  const question = phase.kind === 'hook' ? step.hook : phase.kind === 'guided' ? step.guided[phase.index]! : undefined;
  const chosen = question?.options.find(option => option.id === picked);
  const pick = (id: string) => {
    if (picked || !question) return;
    press();
    setPicked(id);
    const right = question.options.find(option => option.id === id)?.correct === true;
    setResult(current => phase.kind === 'hook' ? { ...current, hookCorrect: right, hookPick: id } : { ...current, guidedFirstTry: [...current.guidedFirstTry, right] });
  };
  const ask = phase.kind === 'hook' ? 'Guess first' : phase.kind === 'teach' ? 'The idea' : phase.kind === 'show' ? step.example.ask : 'Pick the best answer';
  const eyebrow = phase.kind === 'guided' ? 'Try it' : phase.kind === 'show' ? 'Show me' : `New idea · ${conceptTitle}`;
  const pose = chosen ? (chosen.correct ? 'cheer' : 'think') : phase.kind === 'show' && picked ? (picked === step.example.spot ? 'cheer' : 'think') : 'idle';
  const last = at === phases.length - 1;
  const root = useRef<HTMLDivElement>(null);
  // The sheet opens below the options; bring it into its own place so it never sits over the right answer.
  useEffect(() => { if (picked !== undefined) revealSheet(root.current?.querySelector('.learn-sheet')); }, [picked, at]);
  return <div ref={root} className="step-lesson" data-lesson-phase={phase.kind === 'guided' ? `guided-${phase.index + 1}` : phase.kind}>
    {/* QA 21 Oct: one bar for the whole drop; the lesson fills its share of it, screen by screen. */}
    {progress ? <div className="learn-progress" role="progressbar" aria-label={`Lesson part ${at + 1} of ${phases.length}`} aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.before + at}><span style={{ width: `${(progress.before + at) / progress.total * 100}%` }} /></div>
      : <ol className="step-dots" aria-label={`Lesson part ${at + 1} of ${phases.length}`}>{phases.map((_, index) => <li key={index} className={index < at ? 'done' : index === at ? 'now' : ''} />)}</ol>}
    <div className="learn-q" key={at}>
      <div className="learn-ask-row"><span className="learn-friend"><Cast name={friend} pose={pose} size={72} title={`${friend} ${pose === 'cheer' ? 'cheering' : pose === 'think' ? 'thinking' : 'watching'}`} /></span>
        <div className="learn-ask-bubble"><p className="eyebrow">{eyebrow}</p><p className="learn-ask">{ask}</p></div></div>
      {phase.kind === 'teach' && <div className="step-teach"><h2>{step.title}</h2><p className="step-teach-text">{step.teach}</p><StepVisual visual={step.visual} /></div>}
      {phase.kind === 'show' && <>
        <p className="step-example" role="group" aria-label="Example sentence">{step.example.parts.map((part, index) => {
          const isSpot = part === step.example.spot;
          const state = picked === undefined ? '' : isSpot ? ' right' : picked === part ? ' wrong' : '';
          return <Fragment key={index}>{index > 0 && ' '}<button type="button" className={`step-part${state}`} disabled={picked !== undefined} onClick={() => { press(); setPicked(part); setResult(current => ({ ...current, spotCorrect: isSpot })); }}>{part.trim()}</button></Fragment>;
        })}</p>
        {picked !== undefined && <div className={`learn-feedback learn-sheet ${picked === step.example.spot ? 'right' : 'idea'}`} role="status"><strong className="learn-sheet-title">{picked === step.example.spot ? 'Spot on.' : 'Here it is.'}</strong><p>{step.example.feedback}</p><button type="button" disabled={busy} onClick={next}>Continue</button></div>}
      </>}
      {question && <>
        <h2>{question.stem}</h2>
        {phase.kind === 'guided' && !picked && (hint ? <p className="step-hint" role="note">Hint: {step.guided[phase.index]!.hint}</p> : <button type="button" className="text-button step-hint-button" onClick={() => setHint(true)}>Show hint</button>)}
        <div className="learn-options">{shuffled(question.options, `${step.id}:${phase.kind === 'guided' ? phase.index : 'hook'}`).map(option => <button type="button" key={option.id} disabled={!!picked} className={`ui-list-row ${picked === option.id ? 'selected' : ''} ${picked && option.correct ? 'right-option' : ''} ${picked === option.id && !option.correct ? 'wrong-option' : ''}`} onClick={() => pick(option.id)}>{option.text}{picked && option.correct && <span className="learn-option-check" aria-hidden="true">✓</span>}</button>)}</div>
        {chosen && <div className={`learn-feedback learn-sheet ${chosen.correct ? 'right' : 'idea'}`} role="status"><strong className="learn-sheet-title">{chosen.correct ? 'Exactly.' : 'Good try. Here is the idea.'}</strong><p>{chosen.feedback}</p><button type="button" disabled={busy} onClick={next}>{last ? (more ? 'Your turn' : 'Done') : 'Continue'}</button></div>}
      </>}
      {phase.kind === 'teach' && <button type="button" className="step-continue" disabled={busy} onClick={next}>Continue</button>}
    </div>
  </div>;
}
