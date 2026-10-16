import { useState } from 'react';
import { evaluateBodyweightPlacement, EXERCISE_LIBRARY, LADDERS, type LadderPattern } from '../../core/train';

const patterns: LadderPattern[] = ['squat', 'push-up', 'hinge', 'row', 'core-anti-ext', 'core-anti-rot', 'core-ext'];

export function Reassessment({ save, busy }: { save: (placement: Record<string, number>) => void; busy: boolean }) {
  const [index, setIndex] = useState(0);
  const [tests, setTests] = useState<{ reps: number; stepRank: number }[]>([]);
  const [reps, setReps] = useState(8);
  const [placement, setPlacement] = useState<Record<string, number>>({});
  const pattern = patterns[index]!;
  const rank = evaluateBodyweightPlacement(pattern, tests).finalStepRank;
  const step = LADDERS[pattern]![rank - 1]!;
  const hold = !!EXERCISE_LIBRARY[step.exerciseId]?.isHold;
  function record() {
    const result = evaluateBodyweightPlacement(pattern, [...tests, { reps, stepRank: rank }]);
    if (!result.complete) { setTests(old => [...old, { reps, stepRank: rank }]); return; }
    const next = { ...placement, [pattern]: result.finalStepRank };
    setPlacement(next); setTests([]); setReps(8);
    if (index === patterns.length - 1) save(next);
    else setIndex(index + 1);
  }
  return <div className="card"><p className="eyebrow">Re-test week</p><h2>{pattern.replaceAll('-', ' ')} · {index + 1}/{patterns.length}</h2><p>One clean test set at {EXERCISE_LIBRARY[step.exerciseId]?.name}. Stop if it hurts.</p><p>Step {rank}/{LADDERS[pattern]?.length} · test {tests.length + 1} of 3</p><label>Clean {hold ? 'seconds' : 'reps'} <input type="number" min="0" max="120" value={reps} onChange={event => setReps(Number(event.target.value))} /></label><div className="actions"><button type="button" disabled={busy || reps < 0} onClick={record}>Record test</button></div></div>;
}
