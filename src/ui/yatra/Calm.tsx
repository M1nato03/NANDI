import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { BREATH_IN, BREATH_OUT, CALM_MINUTES, calmKeys, readBreath, saveCalmDone, saveCalmSettings, type Breath } from '../../data/repos/calm';
import { keepScreenAwake } from '../../platform/awake';
import { Cast } from '../cast/Cast';
import { TrekScene } from './TrekScene';
import { useYatra } from './Yatra';
import './trek.css';
import './yatra.css';

/** The soft bell at the end: three quiet sine notes, our own (spec 34). */
function bell(): void {
  const AudioContextType = window.AudioContext;
  if (!AudioContextType) return;
  try {
    const context = new AudioContextType();
    const start = context.currentTime;
    [523.25, 783.99, 1046.5].forEach((frequency, index) => {
      const at = start + index * 0.11, tone = context.createOscillator(), gain = context.createGain();
      tone.type = 'sine'; tone.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(0.065 / (index + 1), at + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.4);
      tone.connect(gain); gain.connect(context.destination); tone.start(at); tone.stop(at + 1.5);
    });
    window.setTimeout(() => { void context.close(); }, 2000);
  } catch { /* No sound is fine. */ }
}

/** Which half of the breath a moment falls in. */
export function breathPhase(elapsedMs: number, breath: Breath): 'in' | 'out' {
  return elapsedMs % ((breath.in + breath.out) * 1000) < breath.in * 1000 ? 'in' : 'out';
}

const SCAN = ['Notice your feet on the floor.', 'Let your legs feel heavy.', 'Notice your hands, then your shoulders.', 'Let your jaw soften.', 'Notice the breath moving in and out.', 'Rest here as long as you like.'];
const clock = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/**
 * Spec 34 Calm: Kachhua's breathing timer. 1, 3 or 5 minutes; 4 in and 6 out unless changed; a soft bell at the end.
 * It says what it is (a quiet few minutes with your breath), never what it does to you. Stopping early saves nothing
 * and says nothing about it.
 */
export function Calm() {
  const settings = useLiveQuery(() => db.settings.where('key').anyOf(calmKeys.breath, calmKeys.bell).toArray(), []);
  const breath = readBreath(settings?.find(row => row.key === calmKeys.breath && !row.deleted)?.value);
  const bellOn = settings?.find(row => row.key === calmKeys.bell && !row.deleted)?.value !== false;
  const [minutes, setMinutes] = useState<number>(3);
  const [run, setRun] = useState<{ startedAt: number; minutes: number; breath: Breath } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [done, setDone] = useState(false);
  const finishing = useRef(false);
  useEffect(() => {
    if (!run) return;
    const release = keepScreenAwake();
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => { window.clearInterval(timer); release(); };
  }, [run]);
  const elapsed = run ? Math.min(run.minutes * 60_000, now - run.startedAt) : 0;
  useEffect(() => {
    if (!run || elapsed < run.minutes * 60_000 || finishing.current) return;
    finishing.current = true;
    const ended = run;
    void saveCalmDone(db, ended, Date.now()).then(() => { if (bellOn) bell(); setRun(null); setDone(true); finishing.current = false; });
  }, [run, elapsed, bellOn]);
  const start = () => { const at = Date.now(); setDone(false); setNow(at); setRun({ startedAt: at, minutes, breath }); };
  const setBreath = (change: Partial<Breath>) => void saveCalmSettings(db, { breath: { ...breath, ...change } }, Date.now());
  const phase = run ? breathPhase(elapsed, run.breath) : 'out';
  // Spec 34: a Calm session at night happens at camp, and each out-breath brightens one of tonight's stars.
  const yatra = useYatra();
  const cycle = run ? (run.breath.in + run.breath.out) * 1000 : 1;
  const outBreaths = run && elapsed >= run.breath.in * 1000 ? Math.floor((elapsed - run.breath.in * 1000) / cycle) + 1 : 0;
  const style = { '--calm-in': `${(run ?? { breath }).breath.in}s`, '--calm-out': `${(run ?? { breath }).breath.out}s` } as CSSProperties;

  return <section className="screen calm-screen">
    <p className="eyebrow">Calm</p><h1>Breathe with Kachhua</h1>
    <p>A quiet few minutes with your breath.</p>
    {yatra?.night && <TrekScene trek={yatra.trek} night brighten={outBreaths} onRename={() => undefined} />}
    <div className="calm-stage" data-phase={run ? phase : undefined} style={style}>
      {/* At night Kachhua sits at camp in the scene above, so the stage shows the breath only (one Kachhua a screen). */}
      {!yatra?.night && <Cast name="Kachhua" pose={run ? 'idle' : done ? 'rest' : 'idle'} size={140} title="Kachhua" />}
      {run ? <>
        <p className="calm-phase" aria-live="polite">{phase === 'in' ? 'Breathe in' : 'Breathe out'}</p>
        <p className="calm-clock">{clock(run.minutes * 60_000 - elapsed)}</p>
        <div className="calm-progress" role="progressbar" aria-label="Time" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(elapsed / (run.minutes * 600))}><span style={{ width: `${elapsed / (run.minutes * 600)}%` }} /></div>
      </> : <p className="calm-phase" role="status">{done ? 'A quiet few minutes, together.' : `${breath.in} in, ${breath.out} out`}</p>}
    </div>
    {run ? <button type="button" className="secondary" onClick={() => setRun(null)}>Stop</button> : <>
      <fieldset className="calm-choices"><legend>How long</legend>{CALM_MINUTES.map(value => <button type="button" key={value} className={minutes === value ? '' : 'secondary'} aria-pressed={minutes === value} onClick={() => setMinutes(value)}>{value} min</button>)}</fieldset>
      <button type="button" onClick={start}>{done ? 'Begin again' : `Start ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`}</button>
      <details className="card calm-settings"><summary>Breath and bell</summary>
        <div className="calm-breath">
          <label>Breathe in (seconds)<select value={breath.in} onChange={event => setBreath({ in: Number(event.target.value) })}>{Array.from({ length: BREATH_IN[1] - BREATH_IN[0] + 1 }, (_, i) => BREATH_IN[0] + i).map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <label>Breathe out (seconds)<select value={breath.out} onChange={event => setBreath({ out: Number(event.target.value) })}>{Array.from({ length: BREATH_OUT[1] - BREATH_OUT[0] + 1 }, (_, i) => BREATH_OUT[0] + i).map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        </div>
        <label className="toggle-row"><input type="checkbox" checked={bellOn} onChange={event => void saveCalmSettings(db, { bell: event.target.checked }, Date.now())} /> A soft bell at the end</label>
      </details>
      <details className="card calm-scan"><summary>A slow body scan</summary><ol>{SCAN.map(line => <li key={line}>{line}</li>)}</ol></details>
    </>}
  </section>;
}
