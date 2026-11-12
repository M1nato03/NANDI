import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dailyQuests, focusBoost, questProgress } from '../../core/economy/gamify';
import { dayKey } from '../../core/time';
import { db } from '../../data/db';
import './gamify.css';

export function DailyQuests() {
  const facts = useLiveQuery(() => db.ledger.toArray(), []);
  const [now, setNow] = useState(Date.now);
  // The boost countdown shows whole minutes, so a 30 s tick is enough (it ticked every second over the whole ledger).
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  const today = dayKey(now), boost = focusBoost(facts ?? [], today, now);
  const progressOf = useMemo(() => new Map(dailyQuests(today).map(quest => [quest.id, questProgress(quest, facts ?? [], today)])), [facts, today]);
  return <section className="card gamify-quests" aria-label="Small steps today"><h2>Small steps today</h2><p className="small">Three small invitations</p>
    {dailyQuests(today).map(quest => { const progress = progressOf.get(quest.id) ?? 0; return <div className="gamify-quest" key={quest.id}><span>{quest.title}</span><strong aria-label={`${progress} of ${quest.target}`}>{progress} / {quest.target}</strong></div>; })}
    {boost && <span className="pill" role="timer">Focus boost · 2× XP · {Math.ceil(boost.remainingMs / 60_000)}&nbsp;min left</span>}
    {!boost && dailyQuests(today).every(q => (facts ?? []).some(f => f.kind === 'daily-quest' && f.refId === `${today}:${q.id}`)) && <p>All three settled.{(facts ?? []).some(f => !f.deleted && f.kind === 'focus-boost' && f.refId === today) ? ' The Focus boost is complete.' : ''}</p>}
  </section>;
}
