import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { buildRecap } from '../../core/recap';
import { RecapShare } from './RecapShare';
import { youWeekNumbers } from '../../core/recap';
import { reasonsLine } from '../../core/pauseReasons';
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
import { DOORS } from '../grow/Grow';
import { HelpsWithRow } from './HelpsWith';

export function You() {
  const sources = useLiveQuery(async () => {
    const [tasks, focus, sessions, quests, concepts, logs, facts] = await Promise.all([
      db.tasks.toArray(), db.focus.toArray(), db.sessions.toArray(), db.quests.toArray(), db.learnConcepts.toArray(), db.dailyLog.toArray(), db.ledger.toArray(),
    ]);
    return { tasks, focus, sessions, quests, concepts, logs, facts };
  }, []);
  const recap = sources ? buildRecap(Date.now() + 7 * 86_400_000, { ...sources, ledger: sources.facts }) : null; // eslint-disable-line react-hooks/purity
  // Spec 54: the person's own reasons after "Open anyway" this week, counts only, seen by nobody else.
  const reasons = recap ? reasonsLine(sources?.facts ?? [], recap.from, recap.to) : null;
  const weekNumbers = recap ? youWeekNumbers(recap) : [];
  // Day one shows level, streak and the week; the rest appear once they mean something.
  const show = revealMeters(sources?.facts ?? [], dayKey(Date.now()), { start: '9999-12-31', active: false }, 0); // eslint-disable-line react-hooks/purity
  // Spec 15: season, ladder, shop and quests stay hidden on a soft day (until the person asks for more).
  const today = dayKey(Date.now()); // eslint-disable-line react-hooks/purity
  const softMore = useLiveQuery(() => db.settings.get(`soft.more:${today}`), [today]);
  const softDay = !!softToday(sources?.facts ?? [], today).state && softMore?.value !== true;
  return <section className="screen you-screen"><p className="eyebrow">Your space</p><h1>You</h1><button type="button" className="card you-link you-courtyard-link" onClick={() => go('you/courtyard')}><strong>Courtyard</strong><span>Your six friends and how each corner is growing</span></button>{show.storybooks && <button type="button" className="card you-link you-courtyard-link" onClick={() => go('you/stories')}><strong>Storybooks</strong><span>Each week, told as a short story</span></button>}{!softDay && <YourSeason />}
    {show.quests && !softDay && <DailyQuests />}{show.badges && <button type="button" className="card you-link" onClick={() => go('you/badges')}><strong>Badges</strong><span>See the ideas and habits taking shape</span></button>}
    {/* Spec 571 M6: "Your week" is the week in words and the receipt; the useful-days count stays on the home; Your season links to the record. */}<section className="card you-week" aria-label="Your week"><span className="eyebrow">Your week</span><h2>What your time became</h2>{weekNumbers.length ? <div className="you-week-numbers">{weekNumbers.map(item => <div className="you-week-number" key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}</div> : <p>Your week is just beginning. One small step counts.</p>}{recap && <RecapShare recap={recap} />}{reasons && <p className="you-reasons">{reasons}</p>}</section>
    {/* Spec 571 §0.18 #7: each door keeps its own progress; You has one line per door. */}
    <nav className="card you-doors" aria-label="Your doors"><span className="eyebrow">Your doors</span>{DOORS.map(door => <button type="button" key={door.id} className="text-button you-door-link" data-testid={`door-link-${door.id}`} onClick={() => go(door.route)}>{door.title}</button>)}</nav>
    <HexagonCard now={Date.now()} />{/* eslint-disable-line react-hooks/purity */}
    <BackupNudge />
    {/* Spec 33: private books are imported here. Train moved to Yatra (spec 34). */}
    <PrivateBooks />
    <HelpsWithRow open={() => go('you/helps')} />
    {/* Spec 660 §3 (F1): one link to the read-only history of the removed reward layers. */}
    <button type="button" className="card you-link" data-testid="history-link" onClick={() => go('you/history')}><strong>Your history</strong><span>Shards kept, badges earned and past seasons</span></button>
    <button type="button" className="card you-link deck-area-night settings-link" onClick={() => go('you/settings')}><DeckGlyph type="night" /><strong>Settings</strong><span>Night plan, day and night, notifications, appearance, backup and about</span></button>
  </section>;
}
