import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { badges, badgeTier, dailyQuests, focusBoost, monthlyQuestCount, questProgress } from '../../core/economy/gamify';
import { RULES } from '../../core/rules.config';
import { dayKey } from '../../core/time';
import { db } from '../../data/db';
import { go } from '../shell/router';
import './gamify.css';

export function DailyQuests() {
  const facts = useLiveQuery(() => db.ledger.toArray(), []);
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const today = dayKey(now), boost = focusBoost(facts ?? [], today, now);
  return <section className="card gamify-quests" aria-label="Daily quests"><h2>Daily quests</h2><p className="small">Three small invitations · {RULES.gamify.dailyQuestShards} Shards each</p>
    {dailyQuests(today).map(quest => { const progress = questProgress(quest, facts ?? [], today); return <div className="gamify-quest" key={quest.id}><span>{quest.title}</span><strong aria-label={`${progress} of ${quest.target}`}>{progress} / {quest.target}</strong></div>; })}
    {boost && <span className="pill" role="timer">Focus boost · 2× XP · {Math.ceil(boost.remainingMs / 60_000)} min left</span>}
    {!boost && dailyQuests(today).every(q => (facts ?? []).some(f => f.kind === 'daily-quest' && f.refId === `${today}:${q.id}`)) && <p>All three settled. The Focus boost is complete.</p>}
  </section>;
}

export function Badges() {
  const facts = useLiveQuery(() => db.ledger.toArray(), []) ?? [];
  const month = dayKey(Date.now()).slice(0, 7); // eslint-disable-line react-hooks/purity
  const monthlyBadge = facts.some(fact => !fact.deleted && fact.kind === 'monthly-challenge' && fact.refId === month);
  const thresholds = RULES.gamify.badgeThresholds;
  return <section className="screen gamify-badges-screen"><p className="eyebrow">You</p><h1>Badges</h1><button type="button" className="secondary" onClick={() => go('you')}>Back to You</button>
    <section className="card"><h2>Monthly challenge</h2><p>Complete 20 daily quests this month</p><progress aria-label="Monthly challenge progress" max={20} value={Math.min(20, monthlyQuestCount(facts, month))} /><p>{Math.min(20, monthlyQuestCount(facts, month))} / 20{monthlyBadge ? ' · Badge earned' : ''}</p></section>
    <div className="gamify-badges">{badges.map(badge => { const value = badge.count(facts), tier = badgeTier(badge, facts), next = thresholds[tier]; return <section className="card" key={badge.id}><h2>{badge.title}</h2><p>{tier ? ['Bronze', 'Silver', 'Gold'][tier - 1] : 'Ready to begin'} · {value}{next ? ` / ${next} to next tier` : ' · all tiers earned'}</p>{next && <progress aria-label={`${badge.title} progress`} max={next} value={Math.min(value, next)} />}</section>; })}</div>
  </section>;
}
