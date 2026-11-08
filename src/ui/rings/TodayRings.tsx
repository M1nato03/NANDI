import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { dayKey } from '../../core/time/dayKey';
import { inNightWindow } from '../../core/time';
import { adaptiveNight } from '../../core/adaptive/day';
import { readPicks } from '../../core/welcome';
import type { DayRings } from '../../core/economy/daySlots';
import { ringLine, ringRoute, ringsShown, ringState, todayRings, type RingName } from '../../core/economy/todayRings';
import { BODY_MARK, MIND_MARK, RingMark, type RingMarkKind } from './RingMark';
import { go } from '../shell/router';
import './rings.css';

/**
 * Spec 571 §0.20: the top bar's Yatra · Body · Mind rings (they replace the Today dots). The slot always keeps the
 * rings' size, so nothing in the bar moves when they arrive; the rings themselves show only once economy.v10From exists
 * (b2 call 3). A lit ring keeps what lit it as a mark knocked out of its fill; Mind fills in two halves. A tap shows the
 * ring's one line (its aria-label too) with a way to the ring's area; inside the night window every ring shows the moon.
 */
/** Each ring in its friend's area colour (spec 25 tokens): Mor's Plan, Nandi's Train, Chiku's Learn. */
const AREA: Record<RingName, 'plan' | 'train' | 'learn'> = { yatra: 'plan', body: 'train', mind: 'learn' };
const NAME: Record<RingName, string> = { yatra: 'Yatra', body: 'Body', mind: 'Mind' };
const LINE_MS = 5000;

function marksFor(name: RingName, rings: DayRings, night: boolean): RingMarkKind[] {
  if (night) return ['moon'];
  if (name === 'yatra') return rings.yatra ? ['feather'] : [];
  if (name === 'body') return rings.body ? [BODY_MARK[rings.body]] : [];
  return rings.mind.slice(0, 2).map(act => MIND_MARK[act]);
}

export function RingGlyph({ name, rings, night }: { name: RingName; rings: DayRings; night: boolean }) {
  const state = night ? 'none' : ringState(name, rings);
  const marks = marksFor(name, rings, night);
  return <span className={`ring-glyph ring-${AREA[name]}`} data-ring={name} data-state={state} aria-hidden="true">
    <svg viewBox="0 0 24 24" width="24" height="24" focusable="false">
      <circle className="ring-track" cx="12" cy="12" r="10.5" />
      {state === 'done' && <circle className="ring-fill" cx="12" cy="12" r="10.5" />}
      {/* Half: the left half of the ring glows; the right waits for a second, different act. The one mark sits inside in
          the ring's colour (on a filled disc it would be half knocked out). */}
      {state === 'half' && <path className="ring-half" d="M12 1.5A10.5 10.5 0 0 0 12 22.5" />}
    </svg>
    {marks.length > 0 && <span className={`ring-marks${marks.length === 2 ? ' two' : ''}`}>{marks.map(kind => <RingMark key={kind} kind={kind} size={marks.length === 2 ? 9 : 10} />)}</span>}
  </span>;
}

export function TodayRings({ now }: { now: number }) {
  const today = dayKey(now);
  const data = useLiveQuery(async () => {
    const settings = await db.settings.filter(row => !row.deleted).toArray();
    const rows = await db.ledger.where('dayKey').equals(today).toArray();
    const rings = todayRings(rows, settings, today);
    const promise = rings?.yatra ? (await db.tasks.get(rings.yatra))?.title ?? null : null;
    const tasks = await db.tasks.where('dayKey').equals(today).toArray();
    return { rings, promise, picks: readPicks(settings), bedtime: adaptiveNight(settings, tasks, today).bedtime };
  }, [today]);
  const [open, setOpen] = useState<RingName | null>(null);
  const slot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setOpen(null), LINE_MS);
    const away = (event: PointerEvent) => { if (!slot.current?.contains(event.target as Node)) setOpen(null); };
    document.addEventListener('pointerdown', away);
    return () => { window.clearTimeout(timer); document.removeEventListener('pointerdown', away); };
  }, [open]);
  const rings = data?.rings;
  const night = !!data && inNightWindow(now, data.bedtime);
  const shown = data && rings ? ringsShown(data.picks) : [];
  return <div className="today-rings-slot" ref={slot}>
    {rings && shown.length > 0 && <nav className="today-rings" aria-label="Today's rings">
      {shown.map(name => {
        const line = ringLine(name, rings, night, data?.promise);
        return <button key={name} type="button" className="today-ring" aria-label={line} aria-expanded={open === name} onClick={() => setOpen(current => current === name ? null : name)}>
          <RingGlyph name={name} rings={rings} night={night} />
        </button>;
      })}
    </nav>}
    {rings && open && <p className="today-rings-line" role="status">
      <span>{ringLine(open, rings, night, data?.promise)}</span>
      {!night && <button type="button" className="text-button" onClick={() => { setOpen(null); go(ringRoute(open, data!.picks)); }}>Open {open === 'mind' ? ringRoute('mind', data!.picks) === 'grow/read' ? 'Read' : 'Play' : open === 'body' ? 'Train' : NAME.yatra}</button>}
    </p>}
  </div>;
}
