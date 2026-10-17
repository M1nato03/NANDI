import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { buildRecap } from '../../core/recap';
import { RecapShare } from './RecapShare';
import { nightsBackOnPlan } from '../../core/nightPlan';
import { go } from '../shell/router';
import { masteryMapState } from '../../core/learn/engine';
import { chosenTopics, selectedTopicKey, topics } from '../learn/flow';
import { DeckGlyph } from '../DeckGlyph';

export function You() {
  const sources = useLiveQuery(async () => {
    const [tasks, focus, sessions, quests, concepts, logs] = await Promise.all([
      db.tasks.toArray(), db.focus.toArray(), db.sessions.toArray(), db.quests.toArray(), db.learnConcepts.toArray(), db.dailyLog.toArray(),
    ]);
    return { tasks, focus, sessions, quests, concepts, logs };
  }, []);
  const recap = sources ? buildRecap(Date.now() + 7 * 86_400_000, sources) : null; // eslint-disable-line react-hooks/purity
  const nights = sources ? nightsBackOnPlan(sources.logs) : 0;
  const settings = useLiveQuery(() => db.settings.toArray(), []) ?? [];
  const selected = chosenTopics(settings.find(row => row.key === selectedTopicKey)?.value);
  const strong = (sources?.concepts ?? []).filter(row => ['Strong', 'Mastered'].includes(masteryMapState(row))).length;
  const weekNumbers = recap ? [
    { value: recap.tasks, label: 'tasks finished' },
    { value: recap.workouts, label: 'workouts' },
    { value: recap.concepts, label: 'ideas learned' },
    { value: recap.focusHours, label: 'focus hours' },
    { value: recap.nights, label: 'nights back on plan' },
    { value: recap.sideQuests, label: 'side quests completed' },
  ].filter(item => item.value > 0).slice(0, 4) : [];
  return <section className="screen you-screen"><p className="eyebrow">Your space</p><h1>You</h1>
    <section className="card you-week" aria-label="What your time became this week"><span className="eyebrow">This week</span><h2>What your time became</h2>{weekNumbers.length ? <div className="you-week-numbers">{weekNumbers.map(item => <div className="you-week-number" key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}</div> : <p>Your week is just beginning. One small step counts.</p>}{recap && <RecapShare recap={recap} />}</section>
    <div className="you-links"><button type="button" className="card you-link deck-area-move" onClick={() => go('you/train')}><DeckGlyph type="move" /><strong>Train</strong><span>Program, session, history and metrics</span></button>
      <button type="button" className="card you-link deck-area-think" onClick={() => go('you/mind')}><DeckGlyph type="think" /><strong>Mind & learning</strong><span>Boards, cases, reviews and tracks</span></button>
      <button type="button" className="card you-link deck-area-learn" aria-label="Open Learn" onClick={() => go('you/learn')}><DeckGlyph type="learn" /><strong>Learn</strong><h2 className="you-tile-eyebrow">Mastery map</h2><span>{selected.length ? `${selected.length} ${selected.length === 1 ? 'topic' : 'topics'} in your drops · ${strong ? `${strong} strong concepts` : 'your first ideas are taking shape'}` : `${topics.length} topics ready to explore`}</span></button>
      <button type="button" className="card you-link deck-area-night settings-link" onClick={() => go('you/settings')}><DeckGlyph type="night" /><strong>Settings</strong><span>Night plan, reminders, appearance and backup</span></button></div>
    {sources && sources.logs.some(row => !row.deleted && row.lightsOutAt) && <section className="card"><h2>Nights back on plan</h2><strong className="night-count">{nights}</strong><p>One night at a time. Back tonight.</p></section>}
  </section>;
}
