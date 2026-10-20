import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { buildRecap } from '../../core/recap';
import { RecapShare } from './RecapShare';
import { go } from '../shell/router';
import { DeckGlyph } from '../DeckGlyph';
import { YourSeason } from './EconomyScreens';
import { DailyQuests } from './GamifyScreens';

export function You() {
  const sources = useLiveQuery(async () => {
    const [tasks, focus, sessions, quests, concepts, logs] = await Promise.all([
      db.tasks.toArray(), db.focus.toArray(), db.sessions.toArray(), db.quests.toArray(), db.learnConcepts.toArray(), db.dailyLog.toArray(),
    ]);
    return { tasks, focus, sessions, quests, concepts, logs };
  }, []);
  const recap = sources ? buildRecap(Date.now() + 7 * 86_400_000, sources) : null; // eslint-disable-line react-hooks/purity
  const weekNumbers = recap ? [
    { value: recap.tasks, label: 'tasks finished' },
    { value: recap.workouts, label: 'workouts' },
    { value: recap.concepts, label: 'ideas learned' },
    { value: recap.focusHours, label: 'focus hours' },
    { value: recap.nights, label: 'nights back on plan' },
    { value: recap.sideQuests, label: 'side quests completed' },
  ].filter(item => item.value > 0).slice(0, 4) : [];
  return <section className="screen you-screen"><p className="eyebrow">Your space</p><h1>You</h1><YourSeason />
    <DailyQuests /><button type="button" className="card you-link" onClick={() => go('you/badges')}><strong>Badges</strong><span>See the ideas and habits taking shape</span></button>
    <section className="card you-week" aria-label="This week in words"><span className="eyebrow">This week in words</span><h2>What your time became</h2>{weekNumbers.length ? <div className="you-week-numbers">{weekNumbers.map(item => <div className="you-week-number" key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}</div> : <p>Your week is just beginning. One small step counts.</p>}{recap && <RecapShare recap={recap} />}</section>
    <button type="button" className="card you-link deck-area-night settings-link" onClick={() => go('you/settings')}><DeckGlyph type="night" /><strong>Settings</strong><span>Night plan, day and night, notifications, appearance, backup and about</span></button>
  </section>;
}
