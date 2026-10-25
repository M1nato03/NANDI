import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { ClockKolam } from '../../core/kolam/clock';
import { advanceTrace, pointAt, startTrace, traceDone, tracePath, type Trace } from '../../core/kolam/trace';
import { toPathData } from '../../core/kolam/kolam';
import { isAfterBedtime } from '../../core/time';
import { RULES } from '../../core/rules.config';
import { db } from '../../data/db';
import { saveKolamDone, tonightKolam } from '../../data/repos/kolam';
import { recordError } from '../errorRing';
import { Kachhua } from '../cast/Cast';
import { go } from '../shell/router';
import './kolam.css';

const UNIT = 28, PAD = 14;
// "Draw it for me" takes the same calm 12 seconds at every size (a 5 by 5 line is about 4,000 px).
const AUTO_MS = 12_000, AUTO_TICK_MS = 40;

/**
 * Spec 26 B, Kachhua's kolam by the clock: one kolam a night, traced with one finger in one unbroken line. Slow
 * tracing grows the line; a fast move only makes Kachhua tuck in until you slow down. "Draw it for me" draws it while
 * you watch. No countdown, score, error or reset. Kolam is a living everyday art from Tamil Nadu and South India.
 */
export function KolamScreen() {
  const [kolam, setKolam] = useState<ClockKolam | null>(null);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [auto, setAuto] = useState(false);
  const drawing = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const tick = window.setInterval(() => setNow(Date.now()), 60_000); return () => window.clearInterval(tick); }, []);
  const bedtimeRow = useLiveQuery(() => db.settings.get('planner.bedtime'), []);
  useEffect(() => {
    let live = true;
    void tonightKolam(db, Date.now()).then(result => { if (live) setKolam(result); }).catch(error => recordError('window', error));
    return () => { live = false; };
  }, []);
  const path = useMemo(() => kolam ? tracePath(kolam.kolam.points, UNIT, PAD) : [], [kolam]);
  const current = trace ?? (path.length ? startTrace(path) : null);
  const done = !!current && traceDone(current);
  const bedtime = typeof bedtimeRow?.value === 'string' ? bedtimeRow.value : RULES.night.defaultBedtime;
  const afterBedtime = isAfterBedtime(now, bedtime);
  // "Draw it for me": the line draws itself slowly while you watch.
  useEffect(() => {
    if (!auto || !current || done) return;
    const timer = window.setInterval(() => setTrace(state => { const base = state ?? startTrace(path); return { ...base, progress: Math.min(base.total, base.progress + base.total * AUTO_TICK_MS / AUTO_MS), tooFast: false }; }), AUTO_TICK_MS);
    return () => window.clearInterval(timer);
  }, [auto, current, done, path]);
  const saved = useRef(false);
  useEffect(() => {
    if (!done || !kolam || saved.current) return;
    saved.current = true;
    void saveKolamDone(db, kolam, afterBedtime, Date.now()).catch(error => recordError('window', error));
  }, [done, kolam, afterBedtime]);
  if (!kolam || !current) return <section className="screen kolam-screen" role="status">Drawing tonight's dots…</section>;
  const size = PAD * 2 + kolam.size * 2 * UNIT;
  const head = pointAt(path, current.progress);
  const local = (event: PointerEvent<SVGSVGElement>) => { const box = event.currentTarget.getBoundingClientRect(); const scale = size / box.width; return { x: (event.clientX - box.left) * scale, y: (event.clientY - box.top) * scale, t: event.timeStamp }; };
  const move = (event: PointerEvent<SVGSVGElement>) => { if (!drawing.current || done || auto) return; const sample = local(event); setTrace(state => advanceTrace(path, state ?? startTrace(path), sample)); };
  const moment = done ? 'rest' : current.tooFast ? 'tuck' : current.progress > 0 ? 'walk' : 'blink';
  const dots = Array.from({ length: kolam.size * kolam.size }, (_, i) => ({ x: PAD + (2 * (i % kolam.size) + 1) * UNIT, y: PAD + (2 * Math.floor(i / kolam.size) + 1) * UNIT }));
  // The drawn part: the line up to the progress point, as a dash over the full path.
  const fullLength = current.total;
  return <section className={`screen kolam-screen${kolam.lineColor === 'silver' ? ' kolam-full-moon' : ''}`} aria-label="Tonight's kolam" data-done={done ? 'yes' : 'no'} data-size={kolam.size} data-family={kolam.family}>
    {!done && <><p className="eyebrow">Kachhua · Tonight's kolam</p><h1>One line around every dot</h1></>}
    {!done && <p className="small">Kolam is a living everyday art from Tamil Nadu and South India. Trace the line slowly with one finger.{kolam.grew ? ' Margazhi: one size bigger tonight.' : ''}</p>}
    <div className="kolam-stage">
      {kolam.lineColor === 'silver' && <span className="kolam-moon" aria-hidden="true" />}
      <svg className="kolam-board" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`A ${kolam.size} by ${kolam.size} kolam, ${Math.round(current.progress / fullLength * 100)}% traced`}
        onPointerDown={event => { drawing.current = true; event.currentTarget.setPointerCapture(event.pointerId); move(event); }} onPointerMove={move} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }}>
        {dots.map((dot, i) => <circle key={i} cx={dot.x} cy={dot.y} r={3.2} className="kolam-dot" />)}
        <path d={toPathData(kolam.kolam.points, UNIT, PAD)} className="kolam-guide" />
        <path d={toPathData(kolam.kolam.points, UNIT, PAD)} className={`kolam-line${done ? ' kolam-glow' : ''}`} pathLength={fullLength} strokeDasharray={`${current.progress} ${fullLength}`} />
      </svg>
      {!done && <span className={`kolam-kachhua kachhua-${moment}`} data-moment={moment} style={{ left: `${head.x / size * 100}%`, top: `${head.y / size * 100}%` }} aria-hidden="true"><Kachhua pose={current.tooFast ? 'rest' : 'idle'} size={34} /></span>}
    </div>
    {done ? <div className="kolam-end" role="status"><span className="kolam-friend kachhua-rest" data-moment="rest"><Kachhua pose="rest" size={64} title="Kachhua" /></span>
      {/* Spec 26 B3: after bedtime the end screen is exactly these two lines. */}<p>The line is complete.</p>{afterBedtime ? <p>That's enough for tonight. Put the phone down.</p> : <p>Kachhua curls up beside it. A new one comes tomorrow night.</p>}
      <button type="button" className="secondary" onClick={() => go('plan')}>Close</button></div>
      : <>{current.tooFast && <p className="small" role="status">Kachhua tucked in. Slow down and the line waits for you.</p>}
        <button type="button" className="secondary" disabled={auto} onClick={() => setAuto(true)}>Draw it for me</button></>}
  </section>;
}
