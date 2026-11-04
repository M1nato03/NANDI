import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { buildRecap, receiptContent, type RecapSources } from '../../core/recap';
import { db } from '../../data/db';
import { RecapShare } from './RecapShare';

export function WeeklyRecap({ now }: { now?: number }) {
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 60_000); return () => window.clearInterval(timer); }, []);
  const sources = useLiveQuery(async (): Promise<RecapSources> => {
    const [tasks, focus, sessions, quests, concepts, logs, ledger] = await Promise.all([
      db.tasks.toArray(), db.focus.toArray(), db.sessions.toArray(), db.quests.toArray(), db.learnConcepts.toArray(), db.dailyLog.toArray(),
      // Spec 53: only finished chapters and Calm sittings are read from the ledger.
      db.ledger.where('mode').anyOf('read', 'calm').toArray(),
    ]);
    return { tasks, focus, sessions, quests, concepts, logs, ledger };
  }, []);
  const recap = sources ? buildRecap(now ?? clock, sources) : null;
  const card = recap ? receiptContent(recap) : null;
  return <div className="weekly-recap" role="region" aria-label="What your time became recap">
    <span className="pill">Last week, in real life</span><h2>What your time became</h2>
    {card && recap ? <><p>{card.dates}</p><ul>{card.lines.map(line => <li key={line.label}>{line.label} · {line.value}</li>)}{card.total && <li>Real things · {card.total}</li>}</ul><RecapShare recap={recap} /></> : <p>Getting your week together…</p>}
  </div>;
}
