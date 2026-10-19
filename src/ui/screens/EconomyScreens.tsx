import { Fragment, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { dayKey } from '../../core/time';
import { deriveEconomy } from '../../core/economy/deriveEconomy';
import { currentArcTitle } from '../../core/mysteries';
import { boardSeats, rivalName, seatThreshold } from '../../core/economy/ladder';
import { catalogue, purchaseDecision } from '../../core/economy/shop';
import { purchaseShopItem } from '../../data/repos/economy';
import { RULES } from '../../core/rules.config';
import { go } from '../shell/router';
import './economy.css';

function useEconomy() {
  const source = useLiveQuery(async () => ({ facts: await db.ledger.toArray(), settings: await db.settings.toArray() }), []);
  const today = dayKey(Date.now()); // eslint-disable-line react-hooks/purity
  return source ? { ...source, today, view: deriveEconomy(source.facts, undefined, source.settings, today) } : undefined;
}
const activeSetting = (rows: { key: string; value: unknown; deleted: number }[], key: string) => rows.find(row => row.key === key && !row.deleted)?.value;

export function YourSeason() {
  const economy = useEconomy();
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
  return <section className="your-season" aria-label="Your season">
    <div className="card economy-level"><span className="economy-jersey" aria-label={`Level ${view.level}`}>{view.level}</span><div><span className="eyebrow">Level {view.level}</span><h2>Your season</h2><p>{view.totalXp.toLocaleString()} XP in all</p><progress max={view.nextLevelXp - base} value={view.totalXp - base} aria-label="XP to next level" /><span className="small">{Math.max(0, view.nextLevelXp - view.totalXp)} XP to level {view.level + 1}</span></div></div>
    <div className={`card economy-season-card ${banner.replace(':', '-')} ${cardBack.replace(':', '-')}`}>
      <span className="eyebrow">Season {view.season.index + 1} · {seasonDates}</span>
      {view.season.active ? <><h2>Season {view.season.index + 1}</h2><p><strong>#{view.season.rank} of 500</strong> · {view.season.tier}</p><p>+{view.season.placesThisWeek} places this week</p>{nextRival && <p>{nextRival} sits just above · {gap} SP away</p>}<button type="button" className="secondary" onClick={() => go('you/season')}>View the ladder</button></> : <><h2>Season 1 starts Monday 2 Nov</h2><p>Your XP already counts toward your level.</p></>}
      {arc && <p className="small">Story: {arc}</p>}
    </div>
    <div className="economy-pair"><div className="card economy-streak"><span className="eyebrow">Stamina</span><h2>{view.streak.days} day streak</h2><div className="stamina-pips" aria-label={`${view.streak.freezes} freezes ready`}>{Array.from({ length: 2 }, (_, i) => <span key={i} className={i < view.streak.freezes ? 'filled' : ''} />)}</div><p>{view.streak.paused ? 'Streak paused. Life happens. Two Hat-trick days in 48 h restores it.' : `${view.streak.freezes} freezes ready${view.streak.gold ? ' · Gold stripe' : ''}`}</p></div>
      <div className="card economy-clean"><span className="eyebrow">Clean Week</span><h2>{view.cleanWeek.count} of 4 Hat-tricks</h2><div className="clean-dots" aria-label="Hat-trick days this week">{view.cleanWeek.days.map((done, i) => <span key={i} className={done ? 'filled' : ''} />)}</div><p>{view.cleanWeek.complete ? 'A Clean Week is yours.' : 'Four days make a Clean Week.'}</p></div></div>
    <div className="card economy-shards"><div><span className="eyebrow">Shards</span><h2>{view.shards.toLocaleString()}</h2></div><button type="button" onClick={() => go('you/shop')}>Shop</button></div>
  </section>;
}

export function SeasonLadder() {
  const economy = useEconomy();
  if (!economy) return <section className="screen">Opening the ladder…</section>;
  const { view } = economy;
  const target = view.season.target;
  return <section className="screen ladder-screen"><p className="eyebrow">Your season</p><h1>500 seats</h1><p>#{view.season.rank} of 500 · {view.season.tier} · {view.season.sp} SP</p><div className="ladder-list">{boardSeats(view.season.rank).map((seat, index, seats) => <Fragment key={seat}>{index > 0 && seat - seats[index - 1]! > 1 && <div className="ladder-gap" aria-hidden="true">…</div>}<div className={`ladder-seat${seat === view.season.rank ? ' you' : ''}`} key={seat}><strong>#{seat}</strong><span>{seat === view.season.rank ? 'You' : rivalName(view.season.index, seat)}</span><small>{seat === view.season.rank ? `${view.season.sp} SP` : `${seatThreshold(seat, target)} SP`}</small></div></Fragment>)}</div></section>;
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
    const decision = purchaseDecision(item.id, economy.facts, economy.settings, economy.today);
    const owned = economy.view.owned.includes(item.id);
    return <section className="card shop-item" key={item.id}><div><span className="eyebrow">{item.kind.replace(/([A-Z])/g, ' $1')}</span><h2>{item.name}</h2><p>{item.description}</p></div><button type="button" disabled={busy || !decision.ok} onClick={() => void buy(item.id)}>{owned ? 'Owned' : `${item.price} Shards`}</button>{!decision.ok && !owned && <p className="small">{decision.reason}</p>}</section>;
  })}</div>{message && <p role="status">{message}</p>}</section>;
}
