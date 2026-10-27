import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { dayKey } from '../../core/time/dayKey';
import { RULES } from '../../core/rules.config';
import { effectiveShutdown } from '../../core/tasks/planner';
import { adaptiveNight, shiftClock } from '../../core/adaptive/day';
import { phaseAt } from '../../core/courtyard/courtyard';
import { deriveTrek, STRETCHES_PER_LEG, trekLine, YATRA_KINDS, type Constellation, type Trek } from '../../core/yatra/trek';
import { currentTrail } from '../../data/yatra/trails';
import { CONSTELLATION_PREFIX, ensureYatraStart, saveConstellationName, YATRA_START } from '../../data/repos/yatra';
import { Cast, type CastName } from '../cast/Cast';
import { go } from '../shell/router';
import { useModalFocus } from '../shell/useModalFocus';
import { TrekScene } from './TrekScene';
import './yatra.css';
import './trek.css';

/** Spec 34: Yatra's three corners. Each friend keeps its own corner. */
const CORNERS: { id: 'train' | 'mind' | 'calm'; friend: CastName; title: string; caption: string; area: string }[] = [
  { id: 'train', friend: 'Nandi', title: 'Train', caption: 'With Nandi', area: 'train' },
  { id: 'mind', friend: 'Kapi', title: 'Mind', caption: 'Puzzles and cases', area: 'mind' },
  { id: 'calm', friend: 'Kachhua', title: 'Calm', caption: 'Breathe with Kachhua', area: 'night' },
];
const CARDS_KEY = 'nandi.yatra.cards';
const readCards = (): string[] => { try { const value = JSON.parse(localStorage.getItem(CARDS_KEY) ?? '[]') as unknown; return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []; } catch { return []; } };
const keepCard = (id: string) => { try { localStorage.setItem(CARDS_KEY, JSON.stringify([...new Set([...readCards(), id])])); } catch { /* a convenience only */ } };

/** The trek for today, and whether Yatra shows its night (from the evening switch, the courtyard's own clock). */
export function useYatra(): { trek: Trek; night: boolean } | null | undefined {
  const trail = currentTrail();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60_000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (trail) void ensureYatraStart(db, Date.now()); }, [trail]);
  const source = useLiveQuery(async () => trail ? {
    facts: await db.ledger.where('kind').anyOf(YATRA_KINDS).toArray(),
    settings: await db.settings.filter(row => row.deleted === 0).toArray(),
    tasks: await db.tasks.filter(row => row.deleted === 0).toArray(),
  } : null, [trail?.id]);
  if (!trail) return null;
  if (!source) return undefined;
  const today = dayKey(now);
  const read = (key: string, fallback: string) => { const value = source.settings.find(row => row.key === key)?.value; return typeof value === 'string' ? value : fallback; };
  const night = adaptiveNight(source.settings, source.tasks, today);
  const shutdown = shiftClock(effectiveShutdown(read('planner.shutdown', RULES.night.defaultShutdown), read('planner.bedtime', RULES.night.defaultBedtime)), night.shift);
  const names = Object.fromEntries(source.settings.filter(row => row.key.startsWith(CONSTELLATION_PREFIX) && typeof row.value === 'string').map(row => [row.key.slice(CONSTELLATION_PREFIX.length), row.value as string]));
  const trek = deriveTrek(source.facts, trail, read(YATRA_START, today), today, names);
  const phase = phaseAt(now, shutdown, night.bedtime);
  return { trek, night: phase === 'evening' || phase === 'night' };
}

function narrative(trek: Trek, night: boolean): string {
  const next = trek.trail.places[trek.place + 1]?.name;
  if (trek.complete) return 'The whole trail is walked. The sky above it is yours.';
  if (night) return trek.today.stars.length ? `Tonight holds ${trek.today.stars.length} ${trek.today.stars.length === 1 ? 'star' : 'stars'} from your day.` : 'The fire is warm. The sky can be quiet, too.';
  if (trek.today.campDay) return 'The friends stay close to the fire today. The trail will be here tomorrow.';
  if (trek.stretch === 0) return 'Three stretches, one camp. Tonight, your stars gather overhead.';
  return `${trek.stretch} of ${STRETCHES_PER_LEG} stretches to ${next}. Every session lights one star.`;
}

export function Yatra() {
  const yatra = useYatra();
  const [postcard, setPostcard] = useState<number | null>(null);
  const [renaming, setRenaming] = useState<Constellation | null>(null);
  const [name, setName] = useState('');
  const closePostcard = () => { if (postcard !== null && yatra) keepCard(yatra.trek.trail.legs[postcard]!.landmark.id); setPostcard(null); };
  const postcardDialog = useModalFocus<HTMLElement>(closePostcard);
  const renameDialog = useModalFocus<HTMLElement>(() => setRenaming(null));
  // A newly opened gate shows its postcard once (Kapi swings it open by day), then it lives in the Journal.
  useEffect(() => {
    if (!yatra || yatra.night || postcard !== null) return;
    const kept = readCards();
    const fresh = yatra.trek.legs.find(leg => leg.gateOn && !kept.includes(yatra.trek.trail.legs[leg.index]!.landmark.id));
    if (!fresh) return;
    const timer = window.setTimeout(() => setPostcard(fresh.index), 900);
    return () => window.clearTimeout(timer);
  }, [yatra, postcard]);
  const trek = yatra?.trek;
  const leg = trek && postcard !== null ? trek.trail.legs[postcard] : undefined;

  return <section className="screen yatra-screen">
    <p className="eyebrow">Move, think, breathe</p><h1>Yatra</h1>
    {!trek && <p className="yatra-line">Pick a corner. A few good minutes with a friend.</p>}
    <ul className={`yatra-corners${trek ? ' compact' : ''}`} aria-label="Corners">{CORNERS.map(corner => <li key={corner.id}>
      <button type="button" className="card yatra-corner" data-area={corner.area} aria-label={`${corner.title}: ${corner.caption}`} onClick={() => go(`yatra/${corner.id}`)}>
        <Cast name={corner.friend} pose="idle" size={72} />
        <span className="yatra-corner-text"><strong>{corner.title}</strong><span>{corner.caption}</span></span>
      </button>
    </li>)}</ul>
    {trek && yatra && <>
      <p className="eyebrow trek-head">{trek.trail.name}</p>
      <TrekScene trek={trek} night={yatra.night} onRename={row => { setName(row.name); setRenaming(row); }} />
      <div className="trek-journey">
        <div className="trek-journey-top"><strong>{trekLine(trek)}</strong>{!trek.complete && <span>{trek.stretch} of {STRETCHES_PER_LEG}</span>}</div>
        {!trek.complete && <div className="trek-rail" aria-hidden="true">{Array.from({ length: STRETCHES_PER_LEG }, (_, i) => <i key={i} className={i < trek.stretch ? 'filled' : undefined} />)}</div>}
        <p className="trek-narrative" role="status">{narrative(trek, yatra.night)}</p>
      </div>
      <div className="trek-actions">
        {yatra.night && <button type="button" onClick={() => go('yatra/calm')}>Breathe at camp</button>}
        <button type="button" className="secondary" onClick={() => go('yatra/journal')}>Journal · {trek.legs.filter(row => row.gateOn).length}</button>
      </div>
    </>}
    {leg && <div className="sheet-backdrop" onClick={closePostcard}><section ref={postcardDialog} tabIndex={-1} className="task-sheet trek-postcard" role="dialog" aria-modal="true" aria-label={`${leg.landmark.name} postcard`} onClick={event => event.stopPropagation()}>
      <p className="eyebrow">A gate on the trail · {leg.landmark.kind}</p><h2>{leg.postcard.title ?? leg.landmark.name}</h2>
      {leg.postcard.lines.map(line => <p key={line}>{line}</p>)}
      <button type="button" onClick={closePostcard}>Keep in the journal</button>
    </section></div>}
    {renaming && <div className="sheet-backdrop"><section ref={renameDialog} tabIndex={-1} className="task-sheet" role="dialog" aria-modal="true" aria-label="Name this constellation">
      <h2>Name this constellation</h2>
      <label>Name <input value={name} maxLength={40} onChange={event => setName(event.target.value)} /></label>
      <p className="small">Leave it empty to keep the suggested name.</p>
      <div className="sheet-actions"><button type="button" onClick={() => void saveConstellationName(db, renaming.id, name, Date.now()).then(() => setRenaming(null))}>Save</button><button type="button" className="secondary" onClick={() => setRenaming(null)}>Cancel</button></div>
    </section></div>}
  </section>;
}

/** The journal: every landmark postcard the trek has opened, with where its facts come from. */
export function Journal() {
  const yatra = useYatra();
  if (yatra === undefined) return <section className="screen" role="status">Opening the journal…</section>;
  const cards = yatra ? yatra.trek.legs.filter(row => row.gateOn).map(row => yatra.trek.trail.legs[row.index]!) : [];
  return <section className="screen yatra-journal">
    <p className="eyebrow">Yatra</p><h1>Journal</h1>
    {cards.length ? cards.map(leg => <article key={leg.landmark.id} className="card trek-postcard" aria-label={leg.landmark.name}>
      <p className="eyebrow">{leg.landmark.kind}</p><h2>{leg.postcard.title ?? leg.landmark.name}</h2>
      {leg.postcard.lines.map(line => <p key={line}>{line}</p>)}
      <ul className="trek-sources" aria-label="Sources">{leg.sources.map(source => <li key={source}>Source: {new URL(source).hostname}</li>)}</ul>
    </article>) : <p>A Mind session on the trail opens a landmark gate, and its postcard comes here.</p>}
  </section>;
}
