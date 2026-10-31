import { Fragment, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { dayKey } from '../../core/time';
import { deriveEconomy, weekStart } from '../../core/economy/deriveEconomy';
import { pendingTarget, readTargets, setTarget, TARGET_KEY, TARGETS, targetFor, usefulDates, weekDots, type WeeklyTarget } from '../../core/economy/usefulDays';
import { useModalFocus } from '../shell/useModalFocus';
import { currentArcTitle } from '../../core/mysteries';
import { boardSeats, rivalName, seatThreshold } from '../../core/economy/ladder';
import { catalogue, purchaseDecision } from '../../core/economy/shop';
import { purchaseShopItem } from '../../data/repos/economy';
import { recordShown } from '../../data/repos/gamify';
import { RULES } from '../../core/rules.config';
import { AWAY_KEY, awayRanges, planAway } from '../../core/economy/away';
import { getOrCreateDeviceId } from '../../data/device';
import type { SettingRow } from '../../data/types';
import { go } from '../shell/router';
import './economy.css';
import { revealMeters } from '../../core/economy/reveal';

function useEconomy() {
  const source = useLiveQuery(async () => ({ facts: await db.ledger.toArray(), settings: await db.settings.toArray() }), []);
  const today = dayKey(Date.now()); // eslint-disable-line react-hooks/purity
  // Derived once per data change, not on every render (cj2 heavy data #7).
  const economy = useMemo(() => source ? { ...source, today, view: deriveEconomy(source.facts, undefined, source.settings, today) } : undefined, [source, today]);
  // The XP and level on screen are kept even if the app is shut before reconcile runs (item 47). It writes only on a rise.
  useEffect(() => { if (economy) void recordShown(db, Date.now(), economy.view).catch(() => undefined); }, [economy]);
  return economy;
}
const activeSetting = (rows: { key: string; value: unknown; deleted: number }[], key: string) => rows.find(row => row.key === key && !row.deleted)?.value;

function AwayPlanner({ settings, today, bank }: { settings: SettingRow[]; today: string; bank: number }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const ranges = awayRanges(settings);
  const save = async (next: typeof ranges) => {
    setBusy(true);
    try {
      const now = Date.now();
      await db.settings.put({ key: AWAY_KEY, value: next, updatedAt: now, deleted: 0, deviceId: await getOrCreateDeviceId(db, now) });
      setOpen(false); setMessage('Days away saved. Rest well.');
    } catch { setMessage('Could not save your dates. Try again.'); }
    finally { setBusy(false); }
  };
  const plan = () => {
    const result = planAway(settings, start, end, today, bank);
    if (result.error) { setMessage(result.error); return; }
    if (result.ranges) void save(result.ranges);
  };
  return <div className="away-planner"><button type="button" className="secondary" onClick={() => { setMessage(''); setOpen(!open); }}>Plan days away</button>
    {open && <div className="away-form"><label>Start date <input type="date" value={start} min={today} onChange={event => setStart(event.target.value)} /></label><label>End date <input type="date" value={end} min={start} onChange={event => setEnd(event.target.value)} /></label><p className="small">Up to {RULES.streak.awayMaxDays} days, within your rest bank.</p><button type="button" disabled={busy} onClick={plan}>Save trip</button></div>}
    {ranges.filter(row => row.end >= today).length > 0 && <div><p className="small">Upcoming trips</p>{ranges.filter(row => row.end >= today).map(row => <div key={`${row.start}:${row.end}`}><span>{row.start} to {row.end}</span> <button type="button" className="text-button" disabled={busy} onClick={() => void save(ranges.filter(item => item !== row))}>Cancel</button></div>)}</div>}
    {message && <p role="status">{message}</p>}
  </div>;
}

const weekday = (key: string, style: 'short' | 'long') => new Intl.DateTimeFormat('en-GB', { weekday: style, timeZone: 'UTC' }).format(new Date(`${key}T12:00:00Z`));
const onDate = (key: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${key}T12:00:00Z`));
const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;
async function saveSetting(key: string, value: unknown) {
  const now = Date.now();
  await db.settings.put({ key, value, updatedAt: now, deleted: 0, deviceId: await getOrCreateDeviceId(db, now) });
}

/** Spec 47b: the weekly target, 3, 4, 5 or 7 days. A change starts next Monday, so a week under way keeps its own. */
function TargetPicker({ settings, today }: { settings: SettingRow[]; today: string }) {
  const entries = readTargets(activeSetting(settings, TARGET_KEY));
  const now = targetFor(entries, today);
  const pending = pendingTarget(entries, today);
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<WeeklyTarget>(pending?.target ?? now);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const set = async () => {
    setBusy(true); setMessage('');
    try { await saveSetting(TARGET_KEY, setTarget(entries, today, choice)); setOpen(false); }
    catch { setMessage('Could not set your target. It is still the same.'); }
    finally { setBusy(false); }
  };
  return <div className="useful-target">
    <p><span>Your weekly target: {days(now)}</span><span aria-hidden="true"> · </span><button type="button" className="text-button" aria-expanded={open} aria-label={`Change your weekly target, now ${days(now)}`} onClick={() => { setChoice(pending?.target ?? now); setMessage(''); setOpen(!open); }}>Change</button></p>
    {pending && <p className="small">{now} this week · {pending.target} from {onDate(pending.fromWeek)}</p>}
    {open && <fieldset className="useful-target-form"><legend>Days a week</legend>
      <div className="useful-target-options">{TARGETS.map(target => <label key={target}><input type="radio" name="useful-target" checked={choice === target} onChange={() => setChoice(target)} />{target}</label>)}</div>
      <p className="small">A new target starts next Monday.</p>
      <div className="sheet-actions"><button type="button" disabled={busy} onClick={() => void set()}>Set target</button><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancel</button></div>
    </fieldset>}
    {message && <p role="status">{message}</p>}
  </div>;
}

/** Spec 47b: this week as seven days, the useful ones filled. An empty day is only empty: never a miss. */
function ThisWeek({ settings, today, dates, bank }: { settings: SettingRow[]; today: string; dates: string[]; bank: number }) {
  const target = targetFor(readTargets(activeSetting(settings, TARGET_KEY)), today);
  const dots = weekDots(dates, today);
  const count = dots.filter(dot => dot.useful).length;
  return <section className="card useful-week" aria-label="This week">
    <span className="eyebrow">This week</span><h2>{count} of your {target}</h2>
    <ol className="useful-dots">{dots.map(dot => <li key={dot.dayKey} className={dot.useful ? 'useful' : ''} aria-label={`${weekday(dot.dayKey, 'long')}, ${dot.useful ? 'useful day' : dot.dayKey > today ? 'still to come' : 'no useful action recorded'}`}><span className="useful-dot" aria-hidden="true" /><span aria-hidden="true">{weekday(dot.dayKey, 'short').slice(0, 2)}</span></li>)}</ol>
    <TargetPicker settings={settings} today={today} />
    <p className="small">{bank} {bank === 1 ? 'rest day' : 'rest days'} banked · {bank >= RULES.streak.restBankMax ? 'your bank is full' : `up to ${Math.min(RULES.streak.restBankMonthly, RULES.streak.restBankMax - bank)} more arrive on the 1st`}</p>
    <AwayPlanner settings={settings} today={today} bank={bank} />
  </section>;
}

/** Spec 47 L3: how the ladder works, every number read from the rules the economy pays by. */
function LadderHow({ target, onClose }: { target: number; onClose: () => void }) {
  const dialog = useModalFocus<HTMLElement>(onClose);
  const tiers = [...RULES.season.tiers].reverse();
  return <div className="sheet-backdrop" onClick={onClose}><section ref={dialog} tabIndex={-1} className="ui-sheet ladder-how" role="dialog" aria-modal="true" aria-labelledby="ladder-how-title" onClick={event => event.stopPropagation()}>
    <div className="ui-sheet-handle" aria-hidden="true" />
    <h2 id="ladder-how-title">How the ladder works</h2>
    <ul>
      <li>Your XP each day becomes Season Points (SP), up to {RULES.season.spDailyCap} SP a day.</li>
      <li>Your rank never goes down within a season. There is no relegation.</li>
      <li>The other 499 are pace-setters: fixed targets, not people. Nobody else can see your rank.</li>
      <li>{RULES.season.seedPct}% of a season's SP carries into the next, capped at {RULES.season.seedPct}% of its target. It never changes a finished season.</li>
    </ul>
    <table className="ladder-tiers"><caption>Each tier this season</caption><thead><tr><th scope="col">Tier</th><th scope="col">From</th><th scope="col">Season end</th></tr></thead>
      <tbody>{tiers.map(([name, , high]) => <tr key={name}><th scope="row">{name}</th><td>{seatThreshold(high, target).toLocaleString()} SP</td><td>{RULES.shards.seasonEnd[name as keyof typeof RULES.shards.seasonEnd]} Shards</td></tr>)}</tbody></table>
    <div className="actions"><button type="button" onClick={onClose}>Close</button></div>
  </section></div>;
}
const RANK_SHOWN_KEY = 'season.rankShown';
const rankShown = (settings: SettingRow[]) => activeSetting(settings, RANK_SHOWN_KEY) !== false;

export function YourSeason() {
  const economy = useEconomy();
  const [how, setHow] = useState(false);
  if (!economy) return <section className="card" aria-label="Your season">Opening your season…</section>;
  const { view, settings } = economy;
  const banner = String(activeSetting(settings, 'economy.banner') ?? '');
  const cardBack = String(activeSetting(settings, 'economy.cardBack') ?? '');
  const arc = currentArcTitle(dayKey(Date.now())); // eslint-disable-line react-hooks/purity
  const showDate = (key: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${key}T12:00:00Z`));
  const seasonDates = `${showDate(view.season.start)}–${showDate(view.season.end)} ${view.season.end.slice(0, 4)}`;
  const target = view.season.target;
  const nextRival = view.season.rank > 1 ? rivalName(view.season.index, view.season.rank - 1) : undefined;
  const gap = view.season.rank > 1 ? Math.max(0, seatThreshold(view.season.rank - 1, target) - view.season.sp) : 0;
  const base = RULES.level.stepBase * view.level * (view.level - 1) / 2;
  const show = revealMeters(economy.facts, economy.today, view.season, view.shards);
  // Spec 47b: one selector for useful days; the week card and the season card read the same dates.
  const weekDates = usefulDates(view.days, settings, weekStart(economy.today), economy.today);
  const weekTarget = targetFor(readTargets(activeSetting(settings, TARGET_KEY)), economy.today);
  // Spec 47 L2: "Keep rank tucked away" hides the rank, places and rival lines here; the ladder itself stays whole.
  const climb = rankShown(settings);
  return <section className="your-season" aria-label="Your season">
    <div className="card economy-level"><span className="economy-jersey" aria-label={`Level ${view.level}`}>{view.level}</span><div><span className="eyebrow">Your progress</span><h2>Level {view.level}</h2><p>{view.totalXp.toLocaleString()} XP in all</p><progress max={view.nextLevelXp - base} value={view.totalXp - base} aria-label="XP to next level" /><span className="small">{Math.max(0, view.nextLevelXp - view.totalXp)} XP to level {view.level + 1}</span></div></div>
    {show.season && <div className={`card economy-season-card ${banner.replace(':', '-')} ${cardBack.replace(':', '-')}`}>
      <span className="eyebrow">Season {view.season.index + 1} · {seasonDates}</span>
      {view.season.active ? <><h2>Season {view.season.index + 1}</h2>
        {climb ? <p><strong>#{view.season.rank} of 500</strong> · {view.season.tier}</p> : <p>{view.season.tier}</p>}
        {/* L3: the places line only when the climb moved this week, so it never reads "+0". */}
        {climb && view.season.placesThisWeek > 0 && <p>+{view.season.placesThisWeek} places this week</p>}
        <p>Useful days: {weekDates.length} of your {weekTarget}</p>
        {climb && nextRival && <p className="economy-rival">{nextRival}<span className="economy-sr">,</span> <span className="pace-tag">pace-setter</span><span className="economy-sr">,</span><span aria-hidden="true"> ·</span> {gap} SP to pass</p>}
        <div className="economy-season-actions"><button type="button" className="secondary" onClick={() => go('you/season')}>View the ladder</button><button type="button" className="text-button" onClick={() => setHow(true)}>How the ladder works</button></div></>
        : <><h2>Season 1 starts Monday 2 Nov</h2><p>Your XP already counts toward your level.</p></>}
      {arc && <p className="small">Story: {arc}</p>}
    </div>}
    <ThisWeek settings={settings} today={economy.today} dates={weekDates} bank={view.streak.restDays} />
    <button type="button" className="card you-link useful-record-link" onClick={() => go('yatra/days')}><strong>Your record</strong><span>Every useful day, your longest run and Clean weeks</span></button>
    {show.shards && <div className="card economy-shards"><div><span className="eyebrow">Shards</span><h2>{view.shards.toLocaleString()}</h2></div><button type="button" onClick={() => go('you/shop')}>Shop</button></div>}
    {how && <LadderHow target={target} onClose={() => setHow(false)} />}
  </section>;
}

export function SeasonLadder() {
  const economy = useEconomy();
  const [how, setHow] = useState(false);
  const [message, setMessage] = useState('');
  // The picked choice shows at once; the saved setting takes over when it arrives (and a failed save puts it back).
  const [picked, setPicked] = useState<boolean>();
  if (!economy) return <section className="screen">Opening the ladder…</section>;
  const { view, settings } = economy;
  const target = view.season.target;
  const climb = picked ?? rankShown(settings);
  const choose = (value: boolean) => { setMessage(''); setPicked(value); void saveSetting(RANK_SHOWN_KEY, value).catch(() => { setPicked(undefined); setMessage('Could not save this choice. Try again.'); }); };
  return <section className="screen ladder-screen"><p className="eyebrow">Your season</p><h1>500 seats</h1><p className="ladder-pace">Season {view.season.index + 1} · you vs 499 pace-setters. They're fixed targets, not people. Nobody else can see your rank.</p><p>#{view.season.rank} of 500 · {view.season.tier} · {view.season.sp} SP</p>
    <button type="button" className="text-button ladder-how-link" onClick={() => setHow(true)}>How the ladder works</button>
    <div className="ladder-list">{boardSeats(view.season.rank).map((seat, index, seats) => <Fragment key={seat}>{index > 0 && seat - seats[index - 1]! > 1 && <div className="ladder-gap" aria-hidden="true">…</div>}<div className={`ladder-seat${seat === view.season.rank ? ' you' : ''}`} key={seat}><strong>#{seat}</strong><span>{seat === view.season.rank ? 'You' : rivalName(view.season.index, seat)}</span><small>{seat === view.season.rank ? `${view.season.sp} SP` : `${seatThreshold(seat, target)} SP`}</small></div></Fragment>)}</div>
    {/* Spec 47 L2: the person chooses whether You shows the climb. This page always shows it: opening it is a choice. */}
    <fieldset className="card ladder-choice"><legend>On your You page</legend>
      <label><input type="radio" name="rank-shown" checked={climb} onChange={() => choose(true)} />Show my climb</label>
      <label><input type="radio" name="rank-shown" checked={!climb} onChange={() => choose(false)} />Keep rank tucked away</label>
      {message && <p role="status">{message}</p>}
    </fieldset>
    {how && <LadderHow target={target} onClose={() => setHow(false)} />}
  </section>;
}

export function SeasonShop() {
  const economy = useEconomy();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const theme = economy ? activeSetting(economy.settings, 'economy.theme') : undefined;
  useEffect(() => { document.documentElement.dataset.economyTheme = typeof theme === 'string' ? theme.replace('theme:', '') : ''; }, [theme]);
  if (!economy) return <section className="screen">Opening the shop…</section>;
  const buy = async (id: string) => {
    setBusy(true);
    try {
      const result = await purchaseShopItem(db, id);
      setMessage(result.ok ? 'Yours. Ready to use.' : result.reason ?? 'Could not save this purchase.');
    } catch { setMessage('Could not save this purchase. Try again.'); }
    finally { setBusy(false); }
  };
  return <section className="screen economy-shop"><p className="eyebrow">Your season</p><h1>Shop</h1><p>{economy.view.shards} Shards ready</p><div className="shop-list">{catalogue(economy.today).map(item => {
    const decision = purchaseDecision(item.id, economy.facts, economy.settings, economy.today, undefined, economy.view);
    const owned = economy.view.owned.includes(item.id);
    return <section className="card shop-item" key={item.id}><div><span className="eyebrow">{item.kind === 'freeze' ? 'Rest day' : item.kind.replace(/([A-Z])/g, ' $1')}</span><h2>{item.name}</h2><p>{item.description}</p></div><button type="button" disabled={busy || !decision.ok} onClick={() => void buy(item.id)}>{owned ? 'Owned' : `${item.price} Shards`}</button>{!decision.ok && !owned && <p className="small">{decision.reason}</p>}</section>;
  })}</div>{message && <p role="status">{message}</p>}</section>;
}
