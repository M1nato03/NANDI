import { useState } from 'react';
import { evaluateBodyweightPlacement, getBodyweightPlacementStartStep, LADDERS, EXERCISE_LIBRARY, type EquipmentSetting, type LadderPattern, type Track } from '../../core/train';
import type { Onboarding as OnboardingResult } from '../../data/repos/train';

const patterns: LadderPattern[] = ['squat', 'push-up', 'hinge', 'row', 'core-anti-ext', 'core-anti-rot', 'core-ext'];
const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const initialEquipment: EquipmentSetting = { gymAccess: false, dumbbells: false, barbell: null, smallestPlate: null, resistanceBand: false, pullUpBar: false, sturdyAnchor: false };

export function Onboarding({ save, busy }: { save: (result: OnboardingResult) => void; busy: boolean }) {
  const [stage, setStage] = useState<'setup' | 'placement'>('setup');
  const [track, setTrack] = useState<Track>('bodyweight');
  const [equipment, setEquipment] = useState(initialEquipment);
  const [target, setTarget] = useState<2 | 3>(3);
  const [days, setDays] = useState([1, 3, 5]);
  const [restDay, setRestDay] = useState(0);
  const [hot, setHot] = useState(new Date().getMonth() >= 3 && new Date().getMonth() <= 9);
  const [index, setIndex] = useState(0);
  const [tests, setTests] = useState<{ reps: number; stepRank: number }[]>([]);
  const [reps, setReps] = useState(8);
  const [placement, setPlacement] = useState<Record<string, number>>({});
  const pattern = patterns[index];
  const current = pattern ? evaluateBodyweightPlacement(pattern, tests).finalStepRank : 1;
  const step = pattern ? LADDERS[pattern]?.[current - 1] : undefined;
  const toggle = (key: keyof EquipmentSetting) => setEquipment(old => ({ ...old, [key]: !old[key] }));
  const result = { track, equipment, days, weeklyTarget: target, restDay, heatModeEnabled: hot, placement };
  function record() {
    if (!pattern) return;
    const next = [...tests, { reps, stepRank: current }];
    const evaluation = evaluateBodyweightPlacement(pattern, next);
    if (evaluation.complete) {
      setPlacement(old => ({ ...old, [pattern]: evaluation.finalStepRank }));
      setTests([]);
      setReps(8);
      if (index === patterns.length - 1) save({ ...result, placement: { ...placement, [pattern]: evaluation.finalStepRank } });
      else setIndex(index + 1);
    } else setTests(next);
  }
  return <section className="train-onboarding"><p className="eyebrow">Rank assessment · about 3 minutes</p><h1>Train</h1>
    {stage === 'setup' ? <>
      <div className="card"><h2>Set your starting line</h2><p>General fitness information, not medical advice. Start easy. Clean reps count.</p>
        <label>Track <select aria-label="Training track" value={track} onChange={event => setTrack(event.target.value as Track)}><option value="bodyweight">Hostel Bodyweight</option><option value="gym">Gym Foundations</option></select></label>
        {track === 'gym' && <p>Your first session is a light load check. Start very light. Find a load for 12 clean reps, adding only your smallest available step. Use that load for the first two sessions.</p>}
        <div className="train-checks"><label><input type="checkbox" checked={equipment.gymAccess} onChange={() => toggle('gymAccess')} /><span>Gym access</span></label><label><input type="checkbox" checked={equipment.dumbbells} onChange={() => toggle('dumbbells')} /><span>Dumbbells</span></label><label><input type="checkbox" checked={equipment.resistanceBand} onChange={() => toggle('resistanceBand')} /><span>Resistance band</span></label><label><input type="checkbox" checked={equipment.pullUpBar} onChange={() => toggle('pullUpBar')} /><span>Pull-up bar</span></label><label><input type="checkbox" checked={equipment.sturdyAnchor} onChange={() => toggle('sturdyAnchor')} /><span>Sturdy row anchor</span></label></div>
        <label>Barbell <select value={equipment.barbell ?? ''} onChange={event => setEquipment(old => ({ ...old, barbell: event.target.value ? Number(event.target.value) as 15 | 20 : null }))}><option value="">None</option><option value="15">15 kg</option><option value="20">20 kg</option></select></label>
        {equipment.barbell && <label>Smallest plate, kg <input type="number" min="0.5" step="0.5" value={equipment.smallestPlate ?? 2.5} onChange={event => setEquipment(old => ({ ...old, smallestPlate: Number(event.target.value) }))} /></label>}
      </div>
      <div className="card"><h2>Training days</h2><div className="actions"><button type="button" className={target === 3 ? '' : 'secondary'} onClick={() => { setTarget(3); setDays([1, 3, 5]); }}>3 days</button><button type="button" className={target === 2 ? '' : 'secondary'} onClick={() => { setTarget(2); setDays([1, 4]); }}>2 days</button></div>
        <div className="train-days" aria-label="Training days">{names.map((name, day) => <button type="button" key={name} className={days.includes(day) ? '' : 'secondary'} aria-pressed={days.includes(day)} onClick={() => setDays(old => old.includes(day) ? old.filter(item => item !== day) : old.length < target ? [...old, day].sort() : old)}>{name}</button>)}</div>
        <label>Weekly rest day <select value={restDay} onChange={event => setRestDay(Number(event.target.value))}>{names.map((name, day) => <option key={name} value={day}>{name}</option>)}</select></label>
        <label className="train-switch"><input type="checkbox" checked={hot} onChange={event => setHot(event.target.checked)} /> Hot-day mode</label><p>Ahmedabad default: hot-day mode starts with fewer sets. Choose a late-evening or indoor session.</p>
      </div>
      <button type="button" disabled={days.length !== target || busy} onClick={() => track === 'bodyweight' ? setStage('placement') : save(result)}>{track === 'bodyweight' ? 'Start placement' : 'Save assessment'}</button>
    </> : <div className="card"><h2>{pattern?.replaceAll('-', ' ')} · test {tests.length + 1} of 3</h2><p>Try one clean set at the suggested step. Stop if it hurts.</p><p className="train-step">{step ? EXERCISE_LIBRARY[step.exerciseId]?.name : getBodyweightPlacementStartStep(pattern!).exerciseId} · step {current}/{LADDERS[pattern!]?.length}</p>
      <label>Clean {step && EXERCISE_LIBRARY[step.exerciseId]?.isHold ? 'seconds' : 'reps'} <input type="number" min="0" max="120" value={reps} onChange={event => setReps(Number(event.target.value))} /></label>
      <button type="button" disabled={busy || reps < 0} onClick={record}>Record test</button><p>{index + 1} of {patterns.length} patterns</p>
    </div>}
  </section>;
}
