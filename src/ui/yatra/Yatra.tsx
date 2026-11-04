import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { dayKey } from '../../core/time/dayKey';
import { RULES } from '../../core/rules.config';
import { effectiveShutdown } from '../../core/tasks/planner';
import { adaptiveNight, shiftClock } from '../../core/adaptive/day';
import { phaseAt } from '../../core/courtyard/courtyard';
import { deriveTrek, STRETCHES_PER_LEG, trekLine, YATRA_KINDS, type Constellation, type Trek } from '../../core/yatra/trek';
import { moveWords } from '../../core/nextMove';
import { readNextMove } from './nextMoveRows';
import { cleanWeeks, longestRun, usefulDates, usefulDays, usefulRecord } from '../../core/economy/usefulDays';
import { moreOffer, MORE_OFFER_KEY } from '../../core/moreOffer';
import { ALL_PICKS, GOALS, PICK_LIMIT, type Picks } from '../../core/welcome';
import { answerOffer, savePicks } from '../../data/repos/picks';
import { recordError } from '../errorRing';
import { finishedSeasons } from '../../core/economy/seasonResult';
import { deriveEconomy } from '../../core/economy/deriveEconomy';
import { taskFocusMs } from '../../core/tasks/focus';
import { currentTrail } from '../../data/yatra/trails';
import { CONSTELLATION_PREFIX, ensureYatraStart, saveConstellationName, YATRA_START } from '../../data/repos/yatra';
import { go } from '../shell/router';
import { useModalFocus } from '../shell/useModalFocus';
import { campLine, TrekScene } from './TrekScene';
import { WeekEndShare } from '../screens/WeekEndShare';
import './yatra.css';
import './trek.css';

const CARDS_KEY = 'nandi.yatra.cards';
const readCards = (): string[] => { try { const value = JSON.parse(localStorage.getItem(CARDS_KEY) ?? '[]') as unknown; return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []; } catch { return []; } };
const keepCard = (id: string) => { try { localStorage.setItem(CARDS_KEY, JSON.stringify([...new Set([...readCards(), id])])); } catch { /* a convenience only */ } };

/** The trek for today, and whether Yatra shows its night (from the evening switch, the courtyard's own clock). */
/** Yatra's own dusk (item 203): the scene turns to night at 19:00, or at the evening switch if that comes first. */
export const DUSK_HOUR = 19;

export function useYatra(): { trek: Trek; night: boolean; dusk: boolean } | null | undefined {
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
  // The planning day turns at 04:00, so the small hours are still tonight.
  const hour = new Date(now).getHours();
  const sceneNight = phase === 'evening' || phase === 'night' || hour >= DUSK_HOUR || hour < 4;
  return { trek, night: sceneNight, dusk: !sceneNight && hour === DUSK_HOUR - 1 };
}

function narrative(trek: Trek, night: boolean): string {
  const next = trek.trail.places[trek.place + 1]?.name;
  if (trek.complete) return 'The whole trail is walked. The sky above it is yours.';
  if (night) return trek.today.stars.length ? `Tonight holds ${trek.today.stars.length} ${trek.today.stars.length === 1 ? 'star' : 'stars'} from your day.` : 'The friends rested by the fire today. The trail will be here tomorrow.';
  // Item 198: the day is still open, so the line invites, it never closes the day.
  if (trek.today.campDay) return 'The friends are resting by the fire. A session today walks them on.';
  if (trek.stretch === 0) return 'Three stretches, one camp. Tonight, your stars gather overhead.';
  return `${trek.stretch} of ${STRETCHES_PER_LEG} stretches to ${next}. Every session lights one star.`;
}

/** Spec 45b, spec 52: what Home reads for its one next move, through the loader the Pause card shares. */
function useHomeRows() {
  return useLiveQuery(() => readNextMove(Date.now()), []);
}
type HomeRows = NonNullable<ReturnType<typeof useHomeRows>>;

/** Spec 45b decision 7: the economy's days, derived once per data change (as You does), for the useful-days count. */
function useEconomyDays() {
  const source = useLiveQuery(async () => ({ facts: await db.ledger.toArray(), settings: await db.settings.toArray() }), []);
  const today = dayKey(Date.now()); // eslint-disable-line react-hooks/purity
  return useMemo(() => source ? { facts: source.facts, settings: source.settings, today, view: deriveEconomy(source.facts, undefined, source.settings, today) } : undefined, [source, today]);
}

/** One honest progress line: "N useful days this season" ("this week" before Season 1). One tap opens the record. */
function UsefulLine() {
  const economy = useEconomyDays();
  if (!economy) return <div className="home-week" />;
  const { count, span } = usefulDays(economy.view.days, economy.view.season, economy.today, economy.settings);
  // jenil-87: a count of 0 reads as a score, so a new week (or season) says so in words, with no number.
  return <button type="button" className="home-week" onClick={() => go('yatra/days')}>
    {count ? <><span className="home-week-time">{count} useful {count === 1 ? 'day' : 'days'}</span><span className="home-week-label">this {span}</span></>
      : <span className="home-week-time">A fresh {span}</span>}
    <span className="home-week-arrow" aria-hidden="true">›</span>
  </button>;
}

/**
 * Spec 52 C: on the tenth useful day since Welcome, once, under the next move: add one more thing, or "Not now",
 * which is final. Only at sizes 'two' and 'more'; adding stays possible in You.
 */
function MoreOfferCard({ picks }: { picks: Picks }) {
  const economy = useEconomyDays();
  if (!economy || picks.size === 'all') return null;
  const setting = (key: string) => economy.settings.find(row => row.key === key && !row.deleted)?.value;
  const since = setting('profile.adultConfirmedAt');
  const from = typeof since === 'string' && !Number.isNaN(Date.parse(since)) ? dayKey(Date.parse(since)) : null;
  if (!from) return null;
  const offer = moreOffer({ picks, answered: setting(MORE_OFFER_KEY) != null, usefulDays: usefulDates(economy.view.days, economy.settings, from, economy.today).length,
    facts: economy.facts.filter(fact => fact.dayKey >= from) });
  if (!offer) return null;
  const now = () => Date.now();
  const add = async () => {
    const next: Picks = offer.add === 'all' ? ALL_PICKS : { goals: [...picks.goals, offer.add], size: picks.goals.length + 1 > PICK_LIMIT.two ? 'more' : 'two' };
    await savePicks(db, next, now());
    await answerOffer(db, MORE_OFFER_KEY, 'added', now());
  };
  const label = offer.add === 'all' ? 'Everything' : GOALS.find(goal => goal.id === offer.add)!.label;
  return <section className="more-offer" aria-label="Add one more thing">
    <p>Ten useful days. Add one more thing?</p>
    <div className="more-offer-actions">
      <button type="button" className="secondary" onClick={() => void add().catch(error => recordError('promise', error))}>{label}</button>
      <button type="button" className="text-button" onClick={() => void answerOffer(db, MORE_OFFER_KEY, 'not-now', now()).catch(error => recordError('promise', error))}>Not now</button>
    </div>
  </section>;
}

/** Spec 45b: exactly one next move, one action. Its order is nextMove's. */
function NextMoveCard({ rows }: { rows: HomeRows }) {
  const [now, setNow] = useState(() => Date.now());
  const { move, current } = rows;
  const running = move.kind === 'focus' && move.running;
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, [running]);
  const words = moveWords(move);
  let detail: ReactNode = words.detail;
  if (move.kind === 'focus' && current) {
    const seconds = Math.floor(taskFocusMs(rows.focus, current.taskId, Math.max(now, current.startedAt)) / 1000);
    detail = <span className="next-move-clock">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} on the clock</span>;
  }
  return <section className="next-move" aria-labelledby="next-move-eyebrow" data-kind={move.kind}>
    <p className="eyebrow" id="next-move-eyebrow">One next move</p>
    <button type="button" className="next-move-go" onClick={() => go(move.route)}>
      <span className="next-move-text"><strong>{words.title}</strong><span>{detail}</span></span>
      <span className="next-move-arrow" aria-hidden="true">↗</span>
    </button>
  </section>;
}

export function Yatra() {
  const yatra = useYatra();
  const rows = useHomeRows();
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
  const postcards = trek ? trek.legs.filter(row => row.gateOn).length : 0;

  return <section className="screen yatra-screen yatra-home notebook-home">
    {/* Spec 45b: Home is a paper page. The week's recorded time and where the camp is, the camp, then one next move. */}
    <header className="home-notes">
      <UsefulLine />
      <div className="home-title">
        <h1>{trek && yatra ? campLine(trek, yatra.night) : 'Field notes'}</h1>
        {/* From the first postcard on: a 0 stamp on a new phone reads as a score. */}
        {trek && postcards > 0 && <button type="button" className="home-permit" aria-label={`Journal · ${postcards}`} onClick={() => go('yatra/journal')}>
          <span>Journal</span><b>{postcards}</b>
        </button>}
      </div>
    </header>
    {trek && yatra && <TrekScene trek={trek} night={yatra.night} dusk={yatra.dusk} onRename={row => { setName(row.name); setRenaming(row); }} onFriend={spot => go(spot.route)} />}
    {rows && <NextMoveCard rows={rows} />}
    {rows && <MoreOfferCard picks={rows.picks} />}
    {/* Spec 53: Sunday evening to Monday, the week's receipt; nothing on other days. */}
    <WeekEndShare />
    {/* Below the move, a quiet note on the trail: information, never a second action. */}
    {trek && yatra && <div className="trek-journey">
      <div className="trek-journey-top"><strong>{trekLine(trek)}</strong></div>
      {!trek.complete && <div className="trek-rail" aria-hidden="true">{Array.from({ length: STRETCHES_PER_LEG }, (_, i) => <i key={i} className={i < trek.stretch ? 'filled' : undefined} />)}</div>}
      <p className="trek-narrative" role="status">{narrative(trek, yatra.night)}</p>
    </div>}
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

/** Spec 45b decision 7: the record behind the useful-days count: each useful day and what was finished on it. */
export function UsefulDays() {
  const economy = useEconomyDays();
  const titles = useLiveQuery(async () => new Map((await db.tasks.toArray()).filter(row => !row.deleted).map(row => [row.id, row.title])), []);
  if (!economy || !titles) return <section className="screen" role="status">Opening the record…</section>;
  const { view, today, settings } = economy;
  const { count, span, from, dates } = usefulDays(view.days, view.season, today, settings);
  const record = usefulRecord(dates, economy.facts, titles);
  const longest = longestRun(settings, view.streak.days);
  const clean = cleanWeeks(view.days, from, today);
  const show = (key: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${key}T12:00:00Z`));
  const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;
  // Spec 47b: in a season the record says the season's count; before Season 1 it is plainly "Your record".
  return <section className="screen useful-days">
    <p className="eyebrow">Your record</p><h1>{span === 'week' ? 'Your record' : count ? `${count} useful ${count === 1 ? 'day' : 'days'} this season` : 'A fresh season'}</h1>
    <dl className="useful-days-facts">
      {span === 'week' && <div><dt>This week</dt><dd>{count ? `${count} useful ${count === 1 ? 'day' : 'days'}` : 'A fresh week'}</dd></div>}
      <div><dt>Longest run</dt><dd>{days(longest)}</dd></div>
      <div><dt>Clean weeks</dt><dd>{clean}</dd></div>
    </dl>
    <p className="small useful-days-help">Your longest run counts rest days the way they counted then. A Clean week is four Hat-trick days in one week.</p>
    {finishedSeasons(today).length > 0 && <button type="button" className="card you-link you-courtyard-link" onClick={() => go('yatra/days/seasons')}><strong>Past seasons</strong><span>Each season's result, to read again</span></button>}
    <p className="useful-days-note">A day counts when a planned task is done, a workout or rest walk, a puzzle, read or review, or a soft day's gentle thing.</p>
    {record.length > 0 && <ol className="useful-days-list">{record.map(row => <li key={row.dayKey} className="card">
      <h2>{show(row.dayKey)}</h2>
      <ul>{row.items.map((item, i) => <li key={i}>{item}</li>)}</ul>
    </li>)}</ol>}
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
