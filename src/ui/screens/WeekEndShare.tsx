import { useLiveQuery } from 'dexie-react-hooks';
import { buildRecap, type RecapSources } from '../../core/recap';
import { db } from '../../data/db';
import { RecapShare } from './RecapShare';

export function WeekEndShare({ now }: { now: number }) {
  const date = new Date(now);
  const sundayEvening = date.getDay() === 0 && date.getHours() >= 18;
  const monday = date.getDay() === 1;
  const sources = useLiveQuery(async (): Promise<RecapSources> => {
    const [tasks, focus, sessions, quests, concepts, logs] = await Promise.all([
      db.tasks.toArray(), db.focus.toArray(), db.sessions.toArray(), db.quests.toArray(), db.learnConcepts.toArray(), db.dailyLog.toArray(),
    ]);
    return { tasks, focus, sessions, quests, concepts, logs };
  }, []);
  if ((!sundayEvening && !monday) || !sources) return null;
  return <RecapShare recap={buildRecap(sundayEvening ? now + 7 * 86_400_000 : now, sources)} link />;
}
