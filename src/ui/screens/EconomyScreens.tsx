import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { dayKey } from '../../core/time';
import { deriveEconomy, weekStart } from '../../core/economy/deriveEconomy';
import { pendingTarget, readTargets, setTarget, TARGET_KEY, TARGETS, targetFor, usefulDates, weekDots, type WeeklyTarget } from '../../core/economy/usefulDays';
import { currentArcTitle } from '../../core/mysteries';
import { SHOP_ITEMS } from '../../core/economy/shop';
import { badges } from '../../core/economy/gamify';
import { PastWeeks, usePastWeeks } from '../tasks/weekReview';
import { finishedSeasons, seasonLine, seasonResult } from '../../core/economy/seasonResult';
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
    {open && <div className="away-form"><label>Start date <input type="date" value={start} min={today} onChange={event => setStart(event.target.value)} /></label><label>End date <input type="date" value={end} min={start} onChange={event => setEnd(event.target.value)} /></label><p className="small">Up to {RULES.streak.awayMaxDays}&nbsp;days, within your rest bank.</p><button type="button" disabled={busy} onClick={plan}>Save trip</button></div>}
    {ranges.filter(row => row.end >= today).length > 0 && <div><p className="small">Upcoming trips</p>{ranges.filter(row => row.end >= today).map(row => <div key={`${row.start}:${row.end}`}><span>{row.start} to {row.end}</span> <button type="button" className="text-button" disabled={busy} onClick={() => void save(ranges.filter(item => item !== row))}>Cancel</button></div>)}</div>}
    {message && <p role="status">{message}</p>}
  </div>;
}

const weekday = (key: string, style: 'narrow' | 'long') => new Intl.DateTimeFormat('en-GB', { weekday: style, timeZone: 'UTC' }).format(new Date(`${key}T12:00:00Z`));
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
    <ol className="useful-dots">{dots.map(dot => <li key={dot.dayKey} className={dot.useful ? 'useful' : dot.dayKey > today ? 'future' : ''} aria-label={`${weekday(dot.dayKey, 'long')}, ${dot.useful ? 'useful day' : dot.dayKey > today ? 'still to come' : 'no useful action recorded'}`}><span className="useful-dot" aria-hidden="true" /><span aria-hidden="true">{weekday(dot.dayKey, 'narrow')}</span></li>)}</ol>
    <TargetPicker settings={settings} today={today} />
    <p className="small">{bank} {bank === 1 ? 'rest day' : 'rest days'} banked · {bank >= RULES.streak.restBankMax ? 'your bank is full' : `up to ${Math.min(RULES.streak.restBankMonthly, RULES.streak.restBankMax - bank)} more arrive on the 1st`}</p>
    <AwayPlanner settings={settings} today={today} bank={bank} />
  </section>;
}

export function YourSeason() {
  const economy = useEconomy();
  if (!economy) return <section className="card" aria-label="Your season">Opening your season…</section>;
  const { view, settings } = economy;
  const banner = String(activeSetting(settings, 'economy.banner') ?? '');
  const cardBack = String(activeSetting(settings, 'economy.cardBack') ?? '');
  const arc = currentArcTitle(dayKey(Date.now())); // eslint-disable-line react-hooks/purity
  const showDate = (key: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${key}T12:00:00Z`));
  const seasonDates = `${showDate(view.season.start)}–${showDate(view.season.end)} ${view.season.end.slice(0, 4)}`;
  const base = RULES.level.stepBase * view.level * (view.level - 1) / 2;
  const show = revealMeters(economy.facts, economy.today, view.season, view.shards);
  // Spec 47b: one selector for useful days; the week card and the season card read the same dates.
  const weekDates = usefulDates(view.days, settings, weekStart(economy.today), economy.today);
  const weekTarget = targetFor(readTargets(activeSetting(settings, TARGET_KEY)), economy.today);
  return <section className="your-season" aria-label="Your season">
    <div className="card economy-level"><span className="economy-jersey" aria-label={`Level ${view.level}`}>{view.level}</span><div><span className="eyebrow">Your progress</span><h2>Level {view.level}</h2><p>{view.totalXp.toLocaleString()}&nbsp;XP in all</p><progress max={view.nextLevelXp - base} value={view.totalXp - base} aria-label="XP to next level" /><span className="small">{Math.max(0, view.nextLevelXp - view.totalXp)}&nbsp;XP to level {view.level + 1}</span></div></div>
    {show.season && <div className={`card economy-season-card ${banner.replace(':', '-')} ${cardBack.replace(':', '-')}`}>
      <span className="eyebrow">Season {view.season.index + 1} · {seasonDates}</span>
      {/* Spec 660 §3.2: the ladder went (no rank, tier, places or pace-setters); the season stays as a month's frame. */}
      {view.season.active ? <><h2>Season {view.season.index + 1}</h2>
        <p>Useful days: {weekDates.length} of your {weekTarget}</p></>
        : <><h2>Season 1 starts Monday 2 Nov</h2><p>Your XP already counts toward your level.</p></>}
      {arc && <p className="small">Story: {arc}</p>}
    </div>}
    <ThisWeek settings={settings} today={economy.today} dates={weekDates} bank={view.streak.restDays} />
    <button type="button" className="card you-link you-courtyard-link useful-record-link" data-testid="useful-days-link" onClick={() => go('you/days')}><strong>Your record</strong><span>Every useful day, your longest run and Clean weeks</span></button>
  </section>;
}

/**
 * Spec 660 §3 (jenil-0b F1, 12 Nov): You › history, one read-only page for what the removed reward layers left behind.
 * Nothing on it can be bought, raised or changed; each removal adds its own section.
 */
/** What You › history holds: Shards and owned items, finished seasons, finished weeks and earned badges. */
function useHistory() {
  const economy = useEconomy();
  const weeks = usePastWeeks();
  return useMemo(() => {
    if (!economy || !weeks) return undefined;
    const { view } = economy;
    const names = new Map(SHOP_ITEMS.map(item => [item.id, item.name]));
    const owned = view.owned.map(id => names.get(id) ?? id);
    // §3.1b: the highest tier of each badge earned (badge-tier facts; none are written from v12From).
    const tiers = new Map<string, number>();
    for (const row of economy.facts) {
      const match = !row.deleted && row.kind === 'badge-tier' ? /^(.+):([1-3])$/.exec(row.refId) : null;
      if (match && Number(match[2]) > (tiers.get(match[1]!) ?? 0)) tiers.set(match[1]!, Number(match[2]));
    }
    // §3.2: each finished season, read-only: its dates and its useful days (no rank, tier or Shards).
    const seasons = finishedSeasons(economy.today).map(season => seasonResult(economy.facts, economy.settings, season)).reverse();
    const earned = badges.filter(badge => tiers.has(badge.id)).map(badge => ({ title: badge.title, tier: ['Bronze', 'Silver', 'Gold'][tiers.get(badge.id)! - 1] ?? 'Gold' }));
    // b2 12 Nov: a person who never held a Shard or bought anything never sees the closed shop.
    const shardsCard = view.shards > 0 || owned.length > 0;
    return { view, owned, seasons, earned, weeks, shardsCard, empty: !shardsCard && !seasons.length && !weeks.length && !earned.length };
  }, [economy, weeks]);
}

/** You's one link to the history, hidden while every section of it would be empty (a new user sees none of it). */
export function HistoryLink() {
  const history = useHistory();
  if (!history || history.empty) return null;
  return <button type="button" className="card you-link history-link" data-testid="history-link" onClick={() => go('you/history')}><strong>Your history</strong><span>What you kept: past seasons, weeks and badges</span></button>;
}

export function YouHistory() {
  const history = useHistory();
  if (!history) return <section className="screen you-history" aria-busy="true" />;
  const { view, owned, seasons, earned, weeks, shardsCard } = history;
  return <section className="screen you-history" data-testid="you-history"><p className="eyebrow">You</p><h1>Your history</h1>
    {shardsCard && <section className="card" aria-labelledby="history-shards"><h2 id="history-shards">Shards kept: {view.shards.toLocaleString()}</h2>
      <p>The shop has closed. What you own stays yours{owned.length ? ':' : '.'}</p>
      {owned.length > 0 && <ul className="history-list">{owned.map(name => <li key={name}>{name}</li>)}</ul>}
      <p className="small">Rest days held: {view.streak.restDays}. More arrive on the 1st.</p>
    </section>}
    <section className="card" aria-labelledby="history-seasons"><h2 id="history-seasons">Past seasons</h2>
      {seasons.length ? <ul className="history-list">{seasons.map(season => <li key={season.start}>{seasonLine(season)} · {season.usefulDays === 1 ? '1 useful day' : `${season.usefulDays} useful days`}</li>)}</ul> : <p>No season has finished yet.</p>}
    </section>
    <PastWeeks weeks={weeks} />
    <section className="card" aria-labelledby="history-badges"><h2 id="history-badges">Badges you earned</h2>
      {earned.length ? <ul className="history-list">{earned.map(badge => <li key={badge.title}>{badge.title} · {badge.tier}</li>)}</ul> : <p>None were earned before badges ended.</p>}
    </section>
    <button type="button" className="secondary" onClick={() => go('you')}>Back to You</button>
  </section>;
}

