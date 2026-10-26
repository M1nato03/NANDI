import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { buildRecap } from '../../core/recap';
import { RecapShare } from './RecapShare';
import { go } from '../shell/router';
import { DeckGlyph } from '../DeckGlyph';
import { YourSeason } from './EconomyScreens';
import { DailyQuests } from './GamifyScreens';
import { BackupNudge } from './BackupNudge';
import { HexagonCard } from './HexagonCard';
import { revealMeters } from '../../core/economy/reveal';
import { dayKey } from '../../core/time/dayKey';
import { softToday } from '../../core/soft/soft';
import { PrivateBooks } from './PrivateBooks';

export function You() {
  const sources = useLiveQuery(async () => {
    const [tasks, focus, sessions, quests, concepts, logs, facts] = await Promise.all([
      db.tasks.toArray(), db.focus.toArray(), db.sessions.toArray(), db.quests.toArray(), db.learnConcepts.toArray(), db.dailyLog.toArray(), db.ledger.toArray(),
    ]);
    return { tasks, focus, sessions, quests, concepts, logs, facts };
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
  // Day one shows level, streak and the week; the rest appear once they mean something.
  const show = revealMeters(sources?.facts ?? [], dayKey(Date.now()), { start: '9999-12-31', active: false }, 0); // eslint-disable-line react-hooks/purity
  // Spec 15: season, ladder, shop and quests stay hidden on a soft day (until the person asks for more).
  const today = dayKey(Date.now()); // eslint-disable-line react-hooks/purity
  const softMore = useLiveQuery(() => db.settings.get(`soft.more:${today}`), [today]);
  const softDay = !!softToday(sources?.facts ?? [], today).state && softMore?.value !== true;
  return <section className="screen you-screen"><p className="eyebrow">Your space</p><h1>You</h1><button type="button" className="card you-link you-courtyard-link" onClick={() => go('you/courtyard')}><strong>Courtyard</strong><span>Your six friends and how each corner is growing</span></button>{show.storybooks && <button type="button" className="card you-link you-courtyard-link" onClick={() => go('you/stories')}><strong>Storybooks</strong><span>Each week, told as a short story</span></button>}{!softDay && <YourSeason />}
    {show.quests && !softDay && <DailyQuests />}{show.badges && <button type="button" className="card you-link" onClick={() => go('you/badges')}><strong>Badges</strong><span>See the ideas and habits taking shape</span></button>}
    <section className="card you-week" aria-label="This week in words"><span className="eyebrow">This week in words</span><h2>What your time became</h2>{weekNumbers.length ? <div className="you-week-numbers">{weekNumbers.map(item => <div className="you-week-number" key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}</div> : <p>Your week is just beginning. One small step counts.</p>}{recap && <RecapShare recap={recap} />}</section>
    <HexagonCard now={Date.now()} />{/* eslint-disable-line react-hooks/purity */}
    <BackupNudge />
    {/* Spec 33: Train is parked under You (its data and routes are kept); private books are imported here. */}
    <button type="button" className="card you-link you-train-link" onClick={() => go('train')}><strong>Train (paused)</strong><span>Your sessions, lifts and plan are kept. Open it any time.</span></button>
    <PrivateBooks />
    <button type="button" className="card you-link deck-area-night settings-link" onClick={() => go('you/settings')}><DeckGlyph type="night" /><strong>Settings</strong><span>Night plan, day and night, notifications, appearance, backup and about</span></button>
  </section>;
}
