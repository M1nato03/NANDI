import { useEffect, useState } from 'react';
import type { ExStateRow, SessionRow, SetRow } from '../../data/types';
import { EXERCISE_LIBRARY, LADDERS, calculateWarmupRamp, getSmallestIncrement, remainingRestMs, heatAdvice, type EquipmentSetting } from '../../core/train';
import { keepScreenAwake } from '../../platform/awake';

type Log = (exerciseId: string, slot: number, reps: number, loadKg: number, type?: 'warmup' | 'working', confirmedJump?: boolean) => Promise<boolean>;

function SetLine({ exerciseId, slot, target, load, isHold, done, log, pain, busy, warmup = false }: { exerciseId: string; slot: number; target: number; load: number; isHold?: boolean; done: boolean; log: Log; pain: () => void; busy: boolean; warmup?: boolean }) {
  const [reps, setReps] = useState(target);
  const [kg, setKg] = useState(load);
  const [confirm, setConfirm] = useState(false);
  return <div className="train-set"><span>{warmup ? `Warm-up ${slot + 3}` : `Set ${slot + 1}`}</span>
    <label><span className="sr-only">{exerciseId} {warmup ? 'warm-up' : `set ${slot + 1}`} {isHold ? 'seconds' : 'reps'}</span><input type="number" min="1" value={reps} disabled={done || busy} onChange={event => setReps(Number(event.target.value))} /> <small>{isHold ? 's' : 'reps'}</small></label>
    {!isHold && <label><span className="sr-only">{exerciseId} set {slot + 1} load kg</span><input type="number" min="0" step="0.5" value={kg} disabled={done || busy} onChange={event => setKg(Number(event.target.value))} /> <small>kg</small></label>}
    <button type="button" disabled={done || busy} onClick={() => void log(exerciseId, slot, reps, kg, warmup ? 'warmup' : 'working', confirm)}>{done ? 'Done' : 'Log set'}</button>
    <button type="button" className="secondary train-pain" disabled={busy} onClick={pain}>Pain</button>
    {confirm && <span className="small">Load checked</span>}
    {!done && kg > load * 1.5 && load > 0 && <label className="train-confirm"><input type="checkbox" checked={confirm} onChange={event => setConfirm(event.target.checked)} /> Confirm load</label>}
  </div>;
}

export function Workout({ session, sets, state, equipment, busy, message, log, pain, effort, adjustRest, finish }: { session: SessionRow; sets: SetRow[]; state: ExStateRow[]; equipment: EquipmentSetting; busy: boolean; message: string; log: Log; pain: (exerciseId: string) => void; effort: (exerciseId: string, value: 'easy' | 'solid' | 'near') => void; adjustRest: (endAt: number) => void; finish: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const [stopAdvice, setStopAdvice] = useState(false);
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('pageshow', update);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', update); window.removeEventListener('pageshow', update); };
  }, []);
  useEffect(() => keepScreenAwake(), []);
  const rest = session.restEndsAt ? remainingRestMs(session.restEndsAt, now) : 0;
  const painNames = (session.painExerciseIds ?? []).map(id => EXERCISE_LIBRARY[id]?.name ?? id);
  return <section className="train-workout"><p className="eyebrow">Session in progress</p><h1>Train</h1><p>One clean set at a time. Solid effort means a few reps left.</p>
    {message && <p role="status">{message} {message.includes('New best') && <span className="train-pr-badge">PR</span>}</p>}
    {session.templateKey?.startsWith('gym') && <p>Pick a load you can lift for 12 clean reps. Start light and use your smallest available step.</p>}
    {rest > 0 && <div className="train-rest" role="timer" aria-label={`Rest ${Math.ceil(rest / 1000)} seconds`}>Rest · {Math.floor(rest / 60000)}:{String(Math.ceil(rest / 1000) % 60).padStart(2, '0')} <button type="button" className="secondary" disabled={busy} onClick={() => adjustRest(now)}>Skip rest</button><button type="button" className="secondary" disabled={busy} onClick={() => adjustRest((session.restEndsAt ?? now) + 30_000)}>+30 s</button></div>}
    {session.heatMode === 'on' && <div className="card"><h2>Hot-day mode</h2>{heatAdvice({ hotMode: true, celsius: Number(temperature), humid: Number(humidity) > 75 }).map(line => <p key={line}>{line}</p>)}<label>Temperature °C <input type="number" value={temperature} onChange={event => setTemperature(event.target.value)} /></label><label>Humidity % <input type="number" value={humidity} onChange={event => setHumidity(event.target.value)} /></label><button type="button" className="secondary" onClick={() => setStopAdvice(true)}>Dizzy or confused?</button>{stopAdvice && <p className="train-safety" role="alert">{heatAdvice({ hotMode: true, dizzy: true }).join(' ')}</p>}</div>}
    {session.planned?.map((ex, index) => {
      const name = EXERCISE_LIBRARY[ex.exerciseId]?.name ?? ex.exerciseId;
      const logged = sets.filter(set => set.exerciseId === ex.exerciseId);
      const working = logged.filter(set => set.type === 'working');
      const stopped = session.painExerciseIds?.includes(ex.exerciseId);
      const last = state.find(row => row.id === ex.exerciseId);
      const load = last?.loadKg ?? last?.lastLoadKg ?? 0;
      const target = last?.lastReps ?? ex.repMin;
      const warmups = session.templateKey?.startsWith('gym') && index < 2 && !ex.isHold && load > 0 ? calculateWarmupRamp(load, getSmallestIncrement(equipment, ex.exerciseId)) : [];
      const ladder = ex.isBodyweightLadder ? LADDERS[ex.isBodyweightLadder] : undefined;
      return <article className="card train-exercise" key={ex.exerciseId} aria-label={name}><p className="eyebrow">{index + 1} / {session.planned?.length}</p><h2>{name}</h2><p>{ex.sets} × {ex.repMin}–{ex.repMax}{ex.isHold ? ' seconds' : ' reps'}{ex.isPerSide ? ' per side' : ''}</p>
        {EXERCISE_LIBRARY[ex.exerciseId]?.cues && <ul className="train-cues">{EXERCISE_LIBRARY[ex.exerciseId]!.cues!.map(cue => <li key={cue}>{cue}</li>)}</ul>}
        {ladder && <p>Step {last?.ladderStep ?? ladder.find(step => step.exerciseId === ex.exerciseId)?.rank ?? 1}/{ladder.length}</p>}
        {ex.exerciseId === 'backpack-row' || ex.exerciseId === 'band-row' ? <p>Limited pulling. A sturdy anchor or bar widens your options.</p> : null}
        {!stopped && warmups.map((set, slot) => <SetLine key={`warm-${slot}`} exerciseId={ex.exerciseId} slot={slot - 2} target={set.reps} load={set.load} done={logged.some(row => row.type === 'warmup' && row.slot === slot - 2)} log={log} pain={() => pain(ex.exerciseId)} busy={busy} warmup />)}
        {!stopped && Array.from({ length: ex.sets }, (_, slot) => <SetLine key={slot} exerciseId={ex.exerciseId} slot={slot} target={target} load={load} isHold={ex.isHold} done={working.some(row => row.slot === slot)} log={log} pain={() => pain(ex.exerciseId)} busy={busy} />)}
        {stopped && <p className="train-safety">Exercise stopped. {ex.isBodyweightLadder ? 'Try the easier ladder step next time, or rest today.' : 'Rest today or choose an easier load next time.'} If pain persists, consult a qualified professional.</p>}
        {working.length >= ex.sets && !stopped && <fieldset className="train-effort"><legend>How did it feel?</legend>{(['easy', 'solid', 'near'] as const).map(value => <button type="button" key={value} className={session.effortByExercise?.[ex.exerciseId] === value ? '' : 'secondary'} aria-pressed={session.effortByExercise?.[ex.exerciseId] === value} onClick={() => effort(ex.exerciseId, value)}>{value === 'near' ? 'Near max' : value}</button>)}</fieldset>}
      </article>;
    })}
    {painNames.length > 0 && <p className="train-safety">Stopped: {painNames.join(', ')}. You can finish safely now.</p>}
    <button type="button" disabled={busy} onClick={finish}>Finish session</button>
  </section>;
}
