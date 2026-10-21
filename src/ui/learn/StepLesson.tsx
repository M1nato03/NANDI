import { Fragment, useState } from 'react';
import type { StepVisual as StepVisualData, TopicStep } from '../../data/packs/schemas';
import { Cast, type CastName } from '../cast/Cast';
import { tapHaptic } from '../../platform/haptics';

// Content lists the right option first; show a stable shuffle so position never gives it away.
const hash = (value: string) => { let h = 2166136261; for (const char of value) h = Math.imul(h ^ char.charCodeAt(0), 16777619) >>> 0; return h; };
export const shuffled = <T extends { id: string }>(options: readonly T[], seed: string): T[] => [...options].sort((a, b) => hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`));
const motionOn = () => !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.motion !== 'reduce';

/** A small diagram drawn from the step's data: a flow of chips, two columns, or a scale with marks. */
export function StepVisual({ visual }: { visual: StepVisualData }) {
  if (visual.kind === 'flow') return <div className="step-visual step-flow" role="img" aria-label={visual.nodes.join(', then ')}>
    {visual.nodes.map((node, index) => <Fragment key={node}>{index > 0 && <span className="step-arrow" aria-hidden="true">→</span>}<span className="step-node">{node}</span></Fragment>)}
  </div>;
  if (visual.kind === 'compare') return <div className="step-visual step-compare" role="img" aria-label={`${visual.left.title}: ${visual.left.lines.join(', ')}. ${visual.right.title}: ${visual.right.lines.join(', ')}.`}>
    {[visual.left, visual.right].map(side => <div key={side.title} className="step-side"><strong>{side.title}</strong>{side.lines.map(line => <span key={line}>{line}</span>)}</div>)}
  </div>;
  return <div className="step-visual step-scale" role="img" aria-label={`${visual.label}: from ${visual.min} to ${visual.max}. ${visual.marks.map(mark => mark.text).join('. ')}.`}>
    <span className="step-scale-label">{visual.label}</span>
    <div className="step-scale-bar">{visual.marks.map(mark => <span key={mark.text} className="step-scale-mark" style={{ left: `${mark.at}%` }}><i /><b>{mark.text}</b></span>)}</div>
    <div className="step-scale-ends"><span>{visual.min}</span><span>{visual.max}</span></div>
  </div>;
}

export interface StepLessonResult { hookCorrect: boolean; spotCorrect: boolean; guidedFirstTry: boolean[] }
type Phase = { kind: 'hook' } | { kind: 'teach' } | { kind: 'show' } | { kind: 'guided'; index: number };

/**
 * Spec 14: show, guide, try. Hook guess → the idea in two sentences with a diagram → a worked example
 * (tap the part that shows the idea) → one or two guided tries with a hint. The your-turn items follow
 * as normal questions in the drop.
 */
export function StepLesson({ step, conceptTitle, friend, busy, onDone }: { step: TopicStep; conceptTitle: string; friend: CastName; busy: boolean; onDone: (result: StepLessonResult) => void }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'hook' });
  const [picked, setPicked] = useState<string>();
  const [hint, setHint] = useState(false);
  const [result, setResult] = useState<StepLessonResult>({ hookCorrect: false, spotCorrect: false, guidedFirstTry: [] });
  const phases: Phase[] = [{ kind: 'hook' }, { kind: 'teach' }, { kind: 'show' }, ...step.guided.map((_, index) => ({ kind: 'guided' as const, index }))];
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
    setResult(current => phase.kind === 'hook' ? { ...current, hookCorrect: right } : { ...current, guidedFirstTry: [...current.guidedFirstTry, right] });
  };
  const ask = phase.kind === 'hook' ? 'Guess first' : phase.kind === 'teach' ? 'The idea' : phase.kind === 'show' ? 'Tap the part that shows the idea' : 'Pick the best answer';
  const eyebrow = phase.kind === 'guided' ? `Try it · ${phase.index + 1} of ${step.guided.length}` : phase.kind === 'show' ? 'Show me' : `New idea · ${conceptTitle}`;
  const pose = chosen ? (chosen.correct ? 'cheer' : 'think') : phase.kind === 'show' && picked ? (picked === step.example.spot ? 'cheer' : 'think') : 'idle';
  const last = at === phases.length - 1;
  return <div className="step-lesson" data-lesson-phase={phase.kind === 'guided' ? `guided-${phase.index + 1}` : phase.kind}>
    <ol className="step-dots" aria-label={`Lesson part ${at + 1} of ${phases.length}`}>{phases.map((_, index) => <li key={index} className={index < at ? 'done' : index === at ? 'now' : ''} />)}</ol>
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
        {chosen && <div className={`learn-feedback learn-sheet ${chosen.correct ? 'right' : 'idea'}`} role="status"><strong className="learn-sheet-title">{chosen.correct ? 'Exactly.' : 'Good try. Here is the idea.'}</strong><p>{chosen.feedback}</p><button type="button" disabled={busy} onClick={next}>{last ? 'Your turn' : 'Continue'}</button></div>}
      </>}
      {phase.kind === 'teach' && <button type="button" className="step-continue" disabled={busy} onClick={next}>Continue</button>}
    </div>
  </div>;
}
