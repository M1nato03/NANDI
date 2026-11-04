import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { buildRecap, type RecapSources } from '../../core/recap';
import { dayKey } from '../../core/time/dayKey';
import { db } from '../../data/db';
import { RecapShare } from './RecapShare';

/**
 * Spec 53: the week's receipt is offered on Home from Sunday 18:00 until Monday ends. Sunday's planning day runs to
 * Monday 04:00, so the small hours after Sunday still offer the week that is just closing.
 */
export function weekEndRecapAt(now: number): number | null {
  const planningDay = new Date(`${dayKey(now)}T12:00:00`).getDay();
  const hour = new Date(now).getHours();
  if (planningDay === 0 && (hour >= 18 || hour < 4)) return now + 7 * 86_400_000;
  if (planningDay === 1) return now;
  return null;
}

export function WeekEndShare({ now }: { now?: number }) {
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 60_000); return () => window.clearInterval(timer); }, []);
  const at = weekEndRecapAt(now ?? clock);
  const sources = useLiveQuery(async (): Promise<RecapSources> => {
    const [tasks, focus, sessions, quests, concepts, logs, ledger] = await Promise.all([
      db.tasks.toArray(), db.focus.toArray(), db.sessions.toArray(), db.quests.toArray(), db.learnConcepts.toArray(), db.dailyLog.toArray(),
      // Spec 53: only finished chapters and Calm sittings are read from the ledger.
      db.ledger.where('mode').anyOf('read', 'calm').toArray(),
    ]);
    return { tasks, focus, sessions, quests, concepts, logs, ledger };
  }, []);
  if (at === null || !sources) return null;
  return <RecapShare recap={buildRecap(at, sources)} link />;
}
