import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { BREATH_IN, BREATH_OUT, calmKeys, readBreath, readCalmPrefs, saveCalmDone, saveCalmSettings, type Breath, type CalmPrefs } from '../../data/repos/calm';
import { addUserSound, calmSoundDb, MAX_USER_SOUNDS, removeUserSound, renameUserSound, type CalmSoundRow } from '../../data/calmSounds';
import { CALM_INTERVALS, CALM_MINUTES, DIM_AFTER_MS, FADE_AFTER_MS, SCAN_LINES, doneLine, fadeApplies, intervalBells, isLongSit, nightStars, scanLine, sitMinutes, totalMs, type CalmLength, type CalmWay } from '../../core/calm/session';
import { CALM_SOUNDS, CalmAudio, presetOf, type CalmPreset } from '../../platform/calmSound';
import { keepScreenAwake } from '../../platform/awake';
import { Cast } from '../cast/Cast';
import { TrekScene } from './TrekScene';
import { useYatra } from './Yatra';
import { useModalFocus } from '../shell/useModalFocus';
import './trek.css';
import './yatra.css';

/** Which half of the breath a moment falls in. */
export function breathPhase(elapsedMs: number, breath: Breath): 'in' | 'out' {
  return elapsedMs % ((breath.in + breath.out) * 1000) < breath.in * 1000 ? 'in' : 'out';
}

/** The wall clock, read only from handlers and effects. */
const stamp = () => Date.now();
const clock = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const WAYS: { id: CalmWay; short: string; line: (breath: Breath) => string }[] = [
  { id: 'paced', short: 'Paced', line: breath => `${breath.in} in, ${breath.out} out` },
  { id: 'scan', short: 'Scan', line: () => 'Six slow lines, one at a time' },
  { id: 'quiet', short: 'Quiet', line: () => 'No guide, just quiet' },
];
/** A recorded loop's address inside the app, wherever the app is served from. */
const presetUrl = (preset: CalmPreset) => `${import.meta.env.BASE_URL}calm/${preset.file}`;
const lengthName = (length: CalmLength) => length === 'open' ? 'until I stop' : `${length} ${length === 1 ? 'minute' : 'minutes'}`;

type Run = { startedAt: number; length: CalmLength; way: CalmWay; breath: Breath; interval: number; fade: boolean; sound?: string };

/**
 * Spec 34 + 35 Calm: Kachhua's corner. Three ways to sit (paced breath, a body scan, a quiet sit), any length from a
 * minute to two hours or until you stop, bells, and sounds made in code or your own. The clock is the wall clock. It
 * says what it is, never what it does to you. A sit is one row, one stretch and one star; its minutes pay (spec 36, capped).
 */
export function Calm() {
  const settings = useLiveQuery(() => db.settings.where('key').anyOf(calmKeys.breath, calmKeys.prefs).toArray(), []);
  const breath = readBreath(settings?.find(row => row.key === calmKeys.breath && !row.deleted)?.value);
  const prefs = readCalmPrefs(settings?.find(row => row.key === calmKeys.prefs && !row.deleted)?.value);
  const userSounds = useLiveQuery(() => calmSoundDb.sounds.orderBy('addedAt').toArray(), [], [] as CalmSoundRow[]);
  // A setting that could not be saved says so (a11y audit C1); the screen keeps working.
  const [saveNote, setSaveNote] = useState('');
  const saved = (write: Promise<unknown>) => void write.then(() => setSaveNote(''), () => setSaveNote('Could not save that setting. Try again.'));
  const setPrefs = (change: Partial<CalmPrefs>) => saved(saveCalmSettings(db, { prefs: change }, stamp()));
  const [run, setRun] = useState<Run | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [touchedAt, setTouchedAt] = useState(0);
  const [done, setDone] = useState<number | null>(null);
  const [sheet, setSheet] = useState<'other' | CalmSoundRow | null>(null);
  const [soundNote, setSoundNote] = useState('');
  // A sit whose row could not be saved: the screen leaves the sit and offers to save it again (a11y audit C1).
  const [unsaved, setUnsaved] = useState<{ ran: Run; sat: number } | null>(null);
  const audio = useRef<CalmAudio | null>(null);
  const finishing = useRef(false);
  const rung = useRef({ bells: 0, line: 0 });
  const file = useRef<HTMLInputElement>(null);
  const lengths = useRef<HTMLDivElement>(null);
  const sounds = useRef<HTMLDivElement>(null);
  // The chosen chip stays in view in its sliding row (sideways only, so the page itself never jumps).
  useEffect(() => {
    const keep = () => {
      for (const row of [lengths.current, sounds.current]) {
        const chip = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
        if (row && chip && (chip.offsetLeft < row.scrollLeft || chip.offsetLeft + chip.offsetWidth > row.scrollLeft + row.clientWidth)) row.scrollLeft = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
      }
    };
    keep();
    // Chip widths change once the fonts arrive; keep the chosen chip in view after that too.
    let live = true;
    void document.fonts?.ready.then(() => { if (live) keep(); });
    return () => { live = false; };
  }, [prefs.minutes, prefs.sound, run]);
  const yatra = useYatra();

  useEffect(() => {
    if (!run) return;
    const release = keepScreenAwake();
    const timer = window.setInterval(() => setNow(stamp()), 200);
    // The clock is the start time: coming back from the background reads the time at once.
    const seen = () => setNow(stamp());
    const touch = () => setTouchedAt(stamp());
    document.addEventListener('visibilitychange', seen);
    window.addEventListener('pointerdown', touch, true);
    window.addEventListener('keydown', touch, true);
    return () => {
      window.clearInterval(timer); release();
      document.removeEventListener('visibilitychange', seen);
      window.removeEventListener('pointerdown', touch, true);
      window.removeEventListener('keydown', touch, true);
    };
  }, [run]);
  useEffect(() => () => audio.current?.close(), []);

  const total = run ? totalMs(run.length) : null;
  const elapsed = run ? Math.max(0, total === null ? now - run.startedAt : Math.min(total, now - run.startedAt)) : 0;
  const end = (ran: Run, sat: number) => {
    if (finishing.current) return;
    finishing.current = true;
    const counted = sitMinutes(sat) >= 1;
    if (counted) audio.current?.ring('end');
    audio.current?.finish();
    audio.current = null;
    record(ran, sat);
  };
  const record = (ran: Run, sat: number) => {
    void saveCalmDone(db, { elapsedMs: sat, way: ran.way, breath: ran.breath, startedAt: ran.startedAt }, stamp()).then(() => {
      setRun(null); setUnsaved(null); setDone(sitMinutes(sat) >= 1 ? sitMinutes(sat) : null); finishing.current = false;
    }, () => {
      setRun(null); setDone(null); setUnsaved({ ran, sat }); finishing.current = false;
    });
  };
  // The end, the interval bells and the scan's line ticks all follow the wall clock. A bell that came due while the
  // app was hidden is not rung late; the end bell rings once on return when the end passed meanwhile.
  useEffect(() => {
    if (!run) return;
    if (total !== null && elapsed >= total) { end(run, total); return; }
    const visible = document.visibilityState === 'visible';
    const bells = intervalBells(elapsed, run.interval, run.length);
    if (bells > rung.current.bells) { if (visible) audio.current?.ring('interval'); rung.current.bells = bells; }
    if (run.way === 'scan') {
      const line = scanLine(elapsed, run.length);
      if (line > rung.current.line) { if (visible) audio.current?.ring('tick'); rung.current.line = line; }
    }
  });

  const start = () => {
    const at = stamp();
    const own = prefs.sound.startsWith('user:') ? userSounds.find(row => `user:${row.id}` === prefs.sound) : undefined;
    const ran: Run = { startedAt: at, length: prefs.minutes, way: prefs.way, breath, interval: prefs.interval, fade: prefs.fade, sound: presetOf(prefs.sound)?.name ?? own?.name };
    rung.current = { bells: 0, line: 0 };
    const mixer = CalmAudio.create();
    audio.current = mixer;
    if (mixer) {
      const preset = presetOf(prefs.sound);
      mixer.play({ src: preset ? presetUrl(preset) : undefined, file: own?.blob, soundVolume: prefs.soundVolume, bellVolume: prefs.bellVolume });
      if (prefs.startBell) mixer.ring('start');
    }
    setDone(null); setUnsaved(null); setNow(at); setTouchedAt(at); setRun(ran);
  };
  const stop = () => {
    if (!run) return;
    const sat = Math.max(0, stamp() - run.startedAt);
    end(run, total === null ? sat : Math.min(total, sat));
  };
  const addSound = async (chosen: File | undefined) => {
    if (!chosen) return;
    const result = await addUserSound(chosen, stamp());
    if (result.ok) { setSoundNote(''); setPrefs({ sound: `user:${result.row.id}` }); }
    else setSoundNote(result.reason);
    if (file.current) file.current.value = '';
  };

  const setBreath = (change: Partial<Breath>) => saved(saveCalmSettings(db, { breath: { ...breath, ...change } }, stamp()));
  const shown = run ?? { way: prefs.way, breath, length: prefs.minutes, interval: prefs.interval, fade: prefs.fade };
  const faded = !!run && fadeApplies(run.way, run.length, run.fade) && elapsed >= FADE_AFTER_MS;
  const phase = run ? breathPhase(elapsed, run.breath) : 'out';
  const breathing = !!run && run.way === 'paced' && !faded;
  const stars = run ? nightStars({ way: run.way, elapsedMs: elapsed, length: run.length, breath: run.breath, interval: run.interval, fade: run.fade }) : 0;
  const style = { '--calm-in': `${shown.breath.in}s`, '--calm-out': `${shown.breath.out}s` } as CSSProperties;
  const left = total === null ? elapsed : total - elapsed;
  const dim = !!run && now - Math.max(touchedAt, run.startedAt) >= DIM_AFTER_MS;
  const otherOn = typeof prefs.minutes !== 'number' || !(CALM_MINUTES.chips as readonly number[]).includes(prefs.minutes);
  const pose = run ? (run.way === 'paced' ? 'idle' : 'rest') : done !== null ? 'rest' : 'idle';

  return <section className="screen calm-screen">
    <p className="eyebrow">Calm</p><h1>Breathe with Kachhua</h1>
    {yatra?.night && <TrekScene trek={yatra.trek} night brighten={stars} breath={run && breathing ? { phase, in: run.breath.in, out: run.breath.out } : undefined} onRename={() => undefined} />}
    <div className={`calm-stage${run ? '' : ' calm-stage-setup'}`} data-way={run?.way} data-phase={breathing ? phase : undefined} data-bells={run ? intervalBells(elapsed, run.interval, run.length) : undefined} style={style}>
      {/* At night Kachhua sits at camp in the scene above, so the stage shows the guide only (one Kachhua a screen). */}
      {!yatra?.night && <Cast name="Kachhua" pose={pose} breathe={!!run && run.way === 'quiet'} size={run ? 140 : 88} title="Kachhua" />}
      {run ? <>
        {/* Not live: a breath-by-breath announcement would talk over the whole sit (a11y audit C11). */}
        {run.way === 'paced' && <p className={`calm-phase${faded ? ' faded' : ''}`} aria-hidden={faded || undefined}>{phase === 'in' ? 'Breathe in' : 'Breathe out'}</p>}
        {run.way === 'scan' && <p className="calm-phase calm-line" aria-live="polite">{SCAN_LINES[scanLine(elapsed, run.length)]}</p>}
        {run.way === 'quiet' && <p className="calm-phase">Quiet sit</p>}
        <p className="calm-clock" aria-label={total === null ? 'Time sat' : 'Time left'}>{clock(left)}</p>
        {/* What is playing, so a quiet phone is not taken for a broken sound (item 213). */}
        {run.sound && <p className="calm-sound-name small">{run.sound}</p>}
        {total !== null && <div className="calm-progress" role="progressbar" aria-label="Time" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(elapsed / total * 100)}><span style={{ width: `${elapsed / total * 100}%` }} /></div>}
      </> : unsaved ? <div className="calm-unsaved" role="alert"><p className="calm-phase">Your sit could not be saved.</p><button type="button" onClick={() => { finishing.current = true; record(unsaved.ran, unsaved.sat); }}>Try saving again</button></div>
        : <p className="calm-phase" role="status">{done !== null ? doneLine(done) : WAYS.find(way => way.id === prefs.way)!.line(breath)}</p>}
    </div>
    {run ? <button type="button" className="secondary" onClick={stop}>Stop</button> : <>
      {/* Spec 35 item 210: the setup fits one screen at 360x800: one segmented row, two sliding chip rows and a Start bar. */}
      <fieldset className="calm-ways"><legend className="calm-legend">How to sit</legend>
        {WAYS.map(way => <button type="button" key={way.id} className={prefs.way === way.id ? '' : 'secondary'} aria-pressed={prefs.way === way.id} onClick={() => setPrefs({ way: way.id })}>{way.short}</button>)}
      </fieldset>
      <fieldset className="calm-set"><legend className="calm-legend">How long</legend><div className="calm-row calm-lengths" ref={lengths}>
        {CALM_MINUTES.chips.map(value => <button type="button" key={value} className={prefs.minutes === value ? '' : 'secondary'} aria-pressed={prefs.minutes === value} onClick={() => setPrefs({ minutes: value })}>{value} min</button>)}
        <button type="button" className={`calm-other${otherOn ? '' : ' secondary'}`} aria-pressed={otherOn} onClick={() => setSheet('other')}>{otherOn ? `Other · ${prefs.minutes === 'open' ? 'until I stop' : `${prefs.minutes} min`}` : 'Other'}</button>
      </div></fieldset>
      <fieldset className="calm-set"><legend className="calm-legend">Sound</legend><div className="calm-row calm-sounds" ref={sounds}>
        {[{ id: 'none', name: 'None' }, ...CALM_SOUNDS].map(sound => <button type="button" key={sound.id} className={prefs.sound === sound.id ? '' : 'secondary'} aria-pressed={prefs.sound === sound.id} onClick={() => setPrefs({ sound: sound.id })}>{sound.name}</button>)}
        {userSounds.map(row => <span key={row.id} className="calm-own">
          <button type="button" className={prefs.sound === `user:${row.id}` ? '' : 'secondary'} aria-pressed={prefs.sound === `user:${row.id}`} onClick={() => setPrefs({ sound: `user:${row.id}` })}>{row.name}</button>
          <button type="button" className="secondary calm-own-more" aria-label={`Rename or remove ${row.name}`} onClick={() => setSheet(row)}>⋯</button>
        </span>)}
        {userSounds.length < MAX_USER_SOUNDS && <button type="button" className="secondary calm-add" onClick={() => file.current?.click()}>+ Your sound</button>}
        <input ref={file} type="file" accept="audio/*" hidden aria-label="Add your sound" onChange={event => void addSound(event.target.files?.[0])} />
      </div></fieldset>
      {(soundNote || userSounds.length > 0) && <p className="small calm-note" role={soundNote ? 'alert' : undefined}>{soundNote || 'Your sounds stay on this phone.'}</p>}
      {saveNote && <p className="small calm-note" role="alert">{saveNote}</p>}
      <details className="card calm-settings"><summary>Breath, bells and sound</summary>
        {prefs.way === 'paced' && isLongSit(prefs.minutes) && <label className="toggle-row"><input type="checkbox" checked={prefs.fade} onChange={event => setPrefs({ fade: event.target.checked })} /> Let the guide fade after 3 minutes</label>}
        <div className="calm-breath">
          <label>Breathe in (seconds)<select value={breath.in} onChange={event => setBreath({ in: Number(event.target.value) })}>{Array.from({ length: BREATH_IN[1] - BREATH_IN[0] + 1 }, (_, i) => BREATH_IN[0] + i).map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <label>Breathe out (seconds)<select value={breath.out} onChange={event => setBreath({ out: Number(event.target.value) })}>{Array.from({ length: BREATH_OUT[1] - BREATH_OUT[0] + 1 }, (_, i) => BREATH_OUT[0] + i).map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        </div>
        <label className="toggle-row"><input type="checkbox" checked={prefs.startBell} onChange={event => setPrefs({ startBell: event.target.checked })} /> A bell at the start</label>
        <label>Interval bell<select value={prefs.interval} onChange={event => setPrefs({ interval: Number(event.target.value) as CalmPrefs['interval'] })}>{CALM_INTERVALS.map(value => <option key={value} value={value}>{value ? `Every ${value} min` : 'Off'}</option>)}</select></label>
        <p className="small">The end bell always rings.</p>
        <label>Sound volume<input type="range" min={0} max={100} value={prefs.soundVolume} onChange={event => setPrefs({ soundVolume: Number(event.target.value) })} /></label>
        <label>Bell volume<input type="range" min={0} max={100} value={prefs.bellVolume} onChange={event => setPrefs({ bellVolume: Number(event.target.value) })} /></label>
      </details>
      <div className="calm-start-bar">
        <button type="button" className="calm-start" onClick={start}>{prefs.minutes === 'open' ? 'Start, until I stop' : `Start ${lengthName(prefs.minutes)}`}</button>
        <p className="small calm-under">{isLongSit(prefs.minutes) ? 'Keep NANDI open. The sound and bells play here.' : 'A quiet few minutes with your breath.'}</p>
      </div>
    </>}
    {dim && <button type="button" className="calm-dim" aria-label="Wake the screen" onClick={() => setTouchedAt(stamp())}>
      <span className="calm-dim-dot" aria-hidden="true" /><span className="calm-dim-time">{clock(left)}</span>
    </button>}
    {sheet === 'other' && <OtherSheet current={prefs.minutes} onPick={minutes => { setPrefs({ minutes }); setSheet(null); }} onClose={() => setSheet(null)} />}
    {sheet && sheet !== 'other' && <SoundSheet row={sheet} onDone={removed => { if (removed && prefs.sound === `user:${sheet.id}`) setPrefs({ sound: 'none' }); setSheet(null); }} onClose={() => setSheet(null)} />}
  </section>;
}

/** Other lengths: 1, 15 and 45 minutes, any whole minute from 1 to 120, or until you stop. */
function OtherSheet({ current, onPick, onClose }: { current: CalmLength; onPick: (length: CalmLength) => void; onClose: () => void }) {
  const [custom, setCustom] = useState(typeof current === 'number' ? current : 25);
  const [low, high] = CALM_MINUTES.custom;
  const valid = Number.isInteger(custom) && custom >= low && custom <= high;
  const focusRef = useModalFocus<HTMLElement>(onClose);
  return <div className="sheet-backdrop" onClick={onClose}><section ref={focusRef} tabIndex={-1} className="task-sheet calm-other-sheet" role="dialog" aria-modal="true" aria-label="Other lengths" onClick={event => event.stopPropagation()}>
    <h2>Other lengths</h2>
    <div className="calm-choices">{CALM_MINUTES.other.map(value => <button type="button" key={value} className={current === value ? '' : 'secondary'} onClick={() => onPick(value)}>{value} min</button>)}</div>
    <label>Custom (minutes, {low} to {high})<input type="number" inputMode="numeric" min={low} max={high} step={1} value={Number.isNaN(custom) ? '' : custom} onChange={event => setCustom(event.target.valueAsNumber)} /></label>
    <div className="sheet-actions">
      <button type="button" disabled={!valid} onClick={() => onPick(custom)}>Use {valid ? `${custom} min` : 'this'}</button>
      <button type="button" className="secondary" onClick={() => onPick('open')}>Until I stop</button>
    </div>
  </section></div>;
}

/** Rename or remove one of your sounds. */
function SoundSheet({ row, onDone, onClose }: { row: CalmSoundRow; onDone: (removed: boolean) => void; onClose: () => void }) {
  const [name, setName] = useState(row.name);
  const [note, setNote] = useState('');
  const focusRef = useModalFocus<HTMLElement>(onClose);
  const failed = () => setNote('Could not change your sound. Try again.');
  return <div className="sheet-backdrop" onClick={onClose}><section ref={focusRef} tabIndex={-1} className="task-sheet" role="dialog" aria-modal="true" aria-label={`Your sound ${row.name}`} onClick={event => event.stopPropagation()}>
    <h2>Your sound</h2>
    <label>Name <input value={name} maxLength={24} onChange={event => setName(event.target.value)} /></label>
    <p className="small">{(row.size / 1048576).toFixed(1)} MB · kept on this phone, not in backups</p>
    <div className="sheet-actions">
      <button type="button" onClick={() => void renameUserSound(row.id, name).then(() => onDone(false), failed)}>Save</button>
      <button type="button" className="secondary" onClick={() => void removeUserSound(row.id).then(() => onDone(true), failed)}>Remove</button>
    </div>
    {note && <p className="small" role="alert">{note}</p>}
  </section></div>;
}
