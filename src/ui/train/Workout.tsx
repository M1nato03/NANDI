import { useEffect, useRef, useState } from 'react';
import type { ExStateRow, SessionRow, SetRow } from '../../data/types';
import { EXERCISE_LIBRARY, LADDERS, calculateWarmupRamp, getSmallestIncrement, remainingRestMs, heatAdvice, type EquipmentSetting } from '../../core/train';
import { keepScreenAwake } from '../../platform/awake';
import { tapHaptic } from '../../platform/haptics';

type Log = (exerciseId: string, slot: number, reps: number, loadKg: number, type?: 'warmup' | 'working', confirmedJump?: boolean) => Promise<boolean>;
type Pending = { slot: number; type: 'warmup' | 'working'; target: number; load: number };

function Stepper({ label, value, change, step = 1, min = 1, busy }: { label: string; value: number; change: (value: number) => void; step?: number; min?: number; busy: boolean }) {
  return <div className="train-stepper"><span>{label}</span><div className="train-stepper-controls">
    <button type="button" className="secondary" aria-label={`Decrease ${label}`} disabled={busy || value <= min} onClick={() => change(Math.max(min, Math.round((value - step) * 100) / 100))}>−</button>
    <input type="number" aria-label={label} min={min} step={step} value={value} disabled={busy} onChange={event => change(Number(event.target.value))} />
    <button type="button" className="secondary" aria-label={`Increase ${label}`} disabled={busy} onClick={() => change(Math.round((value + step) * 100) / 100)}>+</button>
  </div></div>;
}

function ActiveSet({ exerciseId, pending, total, isHold, showLoad, loadStep, busy, log, pain }: { exerciseId: string; pending: Pending; total: number; isHold?: boolean; showLoad: boolean; loadStep: number; busy: boolean; log: Log; pain: () => void }) {
  const [reps, setReps] = useState(pending.target);
  const [kg, setKg] = useState(pending.load);
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const needsConfirm = showLoad && kg > pending.load * 1.5 && pending.load > 0;
  return <div className="train-active-set"><h3>{pending.type === 'warmup' ? `Warm-up ${pending.slot + 3}` : `Set ${pending.slot + 1}`} of {total}</h3>
    <div className="train-stepper-grid"><Stepper label={isHold ? 'Seconds' : 'Reps'} value={reps} change={setReps} busy={busy || saving} />
      {showLoad && <Stepper label="Kg" value={kg} change={setKg} step={loadStep} min={0} busy={busy || saving} />}</div>
    {needsConfirm && <label className="train-confirm"><input type="checkbox" checked={confirm} onChange={event => setConfirm(event.target.checked)} /> Confirm load</label>}
    <button type="button" className="train-log" disabled={busy || saving || reps <= 0 || !Number.isFinite(reps) || (showLoad && (!Number.isFinite(kg) || kg < 0))} onClick={async () => { setSaving(true); try { await log(exerciseId, pending.slot, reps, showLoad ? kg : 0, pending.type, confirm); } finally { setSaving(false); } }}>Log set</button>
    <button type="button" className="text-button train-pain" disabled={busy || saving} onClick={pain}>Pain or discomfort?</button>
  </div>;
}

export function Workout({ session, sets, state, equipment, busy, message, log, pain, effort, adjustRest, finish }: { session: SessionRow; sets: SetRow[]; state: ExStateRow[]; equipment: EquipmentSetting; busy: boolean; message: string; log: Log; pain: (exerciseId: string) => void; effort: (exerciseId: string, value: 'easy' | 'solid' | 'near') => void; adjustRest: (endAt: number) => void; finish: () => void }) {
  const planned = session.planned ?? [];
  const storageKey = `nandi.train.focus.${session.id}`;
  const fullKey = `nandi.train.full.${session.id}`;
  const [index, setIndex] = useState(() => {
    const savedText = localStorage.getItem(storageKey);
    const saved = savedText === null ? NaN : Number(savedText);
    const firstOpen = planned.findIndex(ex => !session.painExerciseIds?.includes(ex.exerciseId) && sets.filter(set => set.exerciseId === ex.exerciseId && set.type === 'working').length < ex.sets);
    return Number.isInteger(saved) && saved >= 0 && saved < planned.length ? saved : Math.max(0, firstOpen);
  });
  const [now, setNow] = useState(() => Date.now());
  const [stopAdvice, setStopAdvice] = useState(false);
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [fullSession, setFullSession] = useState(() => localStorage.getItem(fullKey) === '1');
  const [showAll, setShowAll] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const advanceTimer = useRef<number | undefined>(undefined);
  const minimumMode = session.readiness === 'minimum:10-minutes' && !fullSession;
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('pageshow', update);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', update); window.removeEventListener('pageshow', update); };
  }, []);
  useEffect(() => keepScreenAwake(), []);
  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);
  const goTo = (next: number) => { window.clearTimeout(advanceTimer.current); const bounded = Math.max(0, Math.min(planned.length - 1, next)); localStorage.setItem(storageKey, String(bounded)); setIndex(bounded); setCelebrate(false); };
  const ex = planned[index];
  if (!ex) return <section className="train-workout"><button type="button" onClick={finish}>Finish session</button></section>;
  const name = EXERCISE_LIBRARY[ex.exerciseId]?.name ?? ex.exerciseId;
  const logged = sets.filter(set => set.exerciseId === ex.exerciseId);
  const working = logged.filter(set => set.type === 'working');
  const stopped = session.painExerciseIds?.includes(ex.exerciseId);
  const last = state.find(row => row.id === ex.exerciseId);
  const load = last?.loadKg ?? last?.lastLoadKg ?? 0;
  const target = last?.lastReps ?? ex.repMin;
  const showLoad = !!session.templateKey?.startsWith('gym') && !ex.isHold;
  const warmups = showLoad && index < 2 && load > 0 ? calculateWarmupRamp(load, getSmallestIncrement(equipment, ex.exerciseId)) : [];
  const slots: Pending[] = [
    ...warmups.map((set, slot) => ({ slot: slot - 2, type: 'warmup' as const, target: set.reps, load: set.load })),
    ...Array.from({ length: minimumMode ? 1 : ex.sets }, (_, slot) => ({ slot, type: 'working' as const, target, load })),
  ];
  const done = (item: Pending) => logged.find(set => set.type === item.type && set.slot === item.slot);
  const pending = slots.find(item => !done(item));
  const rest = session.restEndsAt ? remainingRestMs(session.restEndsAt, now) : 0;
  const painNames = (session.painExerciseIds ?? []).map(id => EXERCISE_LIBRARY[id]?.name ?? id);
  const ladder = ex.isBodyweightLadder ? LADDERS[ex.isBodyweightLadder] : undefined;
  const logAndAdvance: Log = async (...args) => {
    const saved = await log(...args);
    if (saved && pending && slots.every(item => item === pending || !!done(item)) && index < planned.length - 1) {
      setCelebrate(true);
      void tapHaptic(true).catch(() => undefined);
      localStorage.setItem(storageKey, String(index + 1));
      advanceTimer.current = window.setTimeout(() => goTo(index + 1), 420);
    }
    return saved;
  };
  return <section className="train-workout" onTouchStart={event => { const touch = event.touches[0]; if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY }; }} onTouchEnd={event => { const touch = event.changedTouches[0]; const start = touchStart.current; touchStart.current = null; if (!touch || !start || (event.target as HTMLElement).closest('button, input, label')) return; const dx = touch.clientX - start.x; if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(touch.clientY - start.y) * 1.5) goTo(index + (dx < 0 ? 1 : -1)); }}>
    <div className="train-progress"><div><p className="eyebrow">Exercise {index + 1} of {planned.length}</p><div className="train-dots" aria-hidden="true">{planned.map((item, step) => <span key={item.exerciseId} className={step === index ? 'current' : step < index ? 'complete' : ''} />)}</div></div><button type="button" className="text-button" disabled={busy} onClick={finish}>Finish session</button></div>
    {minimumMode && <div className="card" aria-label="Minimum session"><h2>Just the minimum</h2><p>One set of each movement. Ten minutes is enough to show up.</p><p role="timer">{Math.max(0, Math.ceil((600_000 - (now - (session.startedAt ?? now))) / 60_000))} min left</p><button type="button" className="secondary" onClick={() => { localStorage.setItem(fullKey, '1'); setFullSession(true); }}>Continue full session</button></div>}
    {message && <p role="status">{message} {message.includes('New best') && <span className="train-pr-badge">PR</span>}</p>}
    <article className={`card train-exercise${celebrate ? ' train-complete' : ''}`} aria-label={name}>
      <p className="eyebrow">Current exercise</p><h1>{name}</h1><p className="train-target">{ex.sets} × {ex.repMin}–{ex.repMax} {ex.isHold ? 'seconds' : 'reps'}{ex.isPerSide ? ' per side' : ''}</p>
      {showLoad && <p className="train-detail">Pick a load you can lift for 12 clean reps. Start light and use your smallest available step.</p>}
      {EXERCISE_LIBRARY[ex.exerciseId]?.cues && <ul className="train-cues">{EXERCISE_LIBRARY[ex.exerciseId]!.cues!.slice(0, 2).map(cue => <li key={cue}>{cue}</li>)}</ul>}
      {ladder && <p className="train-detail">Step {last?.ladderStep ?? ladder.find(step => step.exerciseId === ex.exerciseId)?.rank ?? 1}/{ladder.length}</p>}
      {(ex.exerciseId === 'backpack-row' || ex.exerciseId === 'band-row') && <p className="train-detail">Limited pulling. A sturdy anchor or bar widens your options.</p>}
      {logged.length > 0 && <ol className="train-done-list" aria-label="Logged sets">{slots.filter(item => !!done(item)).map(item => { const row = done(item)!; return <li key={`${item.type}-${item.slot}`}>{item.type === 'warmup' ? `Warm-up ${item.slot + 3}` : `Set ${item.slot + 1}`} · {row.durationS ?? row.reps} {ex.isHold ? 'seconds' : 'reps'}{showLoad ? ` · ${row.loadKg} kg` : ''} <span aria-label="done">✓</span></li>; })}</ol>}
      {!stopped && pending && <ActiveSet key={`${ex.exerciseId}-${pending.type}-${pending.slot}`} exerciseId={ex.exerciseId} pending={pending} total={pending.type === 'warmup' ? warmups.length : minimumMode ? 1 : ex.sets} isHold={ex.isHold} showLoad={showLoad} loadStep={getSmallestIncrement(equipment, ex.exerciseId)} busy={busy} log={logAndAdvance} pain={() => pain(ex.exerciseId)} />}
      {rest > 0 && <div className="train-rest" role="timer" aria-label={`Rest ${Math.ceil(rest / 1000)} seconds`}><strong>Rest · {Math.floor(rest / 60000)}:{String(Math.ceil(rest / 1000) % 60).padStart(2, '0')}</strong><div><button type="button" className="secondary" disabled={busy} onClick={() => adjustRest(now)}>Skip rest</button><button type="button" className="secondary" disabled={busy} onClick={() => adjustRest((session.restEndsAt ?? now) + 30_000)}>+30 s</button></div></div>}
      {stopped && <p className="train-safety">Exercise stopped. {ex.isBodyweightLadder ? 'Try the easier ladder step next time, or rest today.' : 'Rest today or choose an easier load next time.'} If pain persists, consult a qualified professional.</p>}
      {working.length >= ex.sets && !stopped && <fieldset className="train-effort"><legend>How did it feel?</legend>{(['easy', 'solid', 'near'] as const).map(value => <button type="button" key={value} className={session.effortByExercise?.[ex.exerciseId] === value ? '' : 'secondary'} aria-pressed={session.effortByExercise?.[ex.exerciseId] === value} onClick={() => effort(ex.exerciseId, value)}>{value === 'near' ? 'Near max' : value}</button>)}</fieldset>}
      {celebrate && <span className="train-check" aria-hidden="true">✓</span>}
    </article>
    <div className="train-nav"><button type="button" className="secondary" disabled={index === 0} onClick={() => goTo(index - 1)}>Previous</button><button type="button" className="secondary" disabled={index === planned.length - 1} onClick={() => goTo(index + 1)}>Next exercise</button></div>
    <button type="button" className="text-button train-all-toggle" aria-expanded={showAll} onClick={() => setShowAll(value => !value)}>All exercises {showAll ? '−' : '+'}</button>
    {showAll && <ol className="train-all-list">{planned.map((item, step) => { const count = sets.filter(set => set.exerciseId === item.exerciseId && set.type === 'working').length; return <li key={item.exerciseId}><button type="button" className={step === index ? '' : 'secondary'} aria-current={step === index ? 'step' : undefined} onClick={() => goTo(step)}><span>{EXERCISE_LIBRARY[item.exerciseId]?.name ?? item.exerciseId}</span><small>{count}/{minimumMode ? 1 : item.sets}</small></button></li>; })}</ol>}
    {session.heatMode === 'on' && <div className="card"><h2>Hot-day mode</h2>{heatAdvice({ hotMode: true, celsius: Number(temperature), humid: Number(humidity) > 75 }).map(line => <p key={line}>{line}</p>)}<label>Temperature °C <input type="number" value={temperature} onChange={event => setTemperature(event.target.value)} /></label><label>Humidity % <input type="number" value={humidity} onChange={event => setHumidity(event.target.value)} /></label><button type="button" className="secondary" onClick={() => setStopAdvice(true)}>Dizzy or confused?</button>{stopAdvice && <p className="train-safety" role="alert">{heatAdvice({ hotMode: true, dizzy: true }).join(' ')}</p>}</div>}
    {painNames.length > 0 && <p className="train-safety">Stopped: {painNames.join(', ')}. You can finish safely now.</p>}
  </section>;
}
