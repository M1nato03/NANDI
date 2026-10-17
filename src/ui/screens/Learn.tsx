import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { masteryMapState } from '../../core/learn/engine';
import { trackWrite } from '../../core/pendingWrites';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import type { LearnDropRow } from '../../data/types';
import { LearnDrop } from '../learn/LearnDrop';
import { Mind } from './Mind';
import { chosenTopics, dailyDropId, nightDropId, selectedTopicKey, topics } from '../learn/flow';
import { go } from '../shell/router';

type Practice = { conceptId?: string; topicId?: string; reviewDue?: boolean };
const dropStatus = (row?: LearnDropRow) => !row ? 'Start' : row.drop.cursor >= row.drop.items.length ? 'Done for today' : 'Continue';

export function Learn({ entry }: { entry?: string }) {
  const [practice, setPractice] = useState<Practice>();
  const [expanded, setExpanded] = useState<string>();
  const [openedAt] = useState(() => Date.now());
  const [message, setMessage] = useState('');
  const data = useLiveQuery(async () => ({
    setting: await db.settings.get(selectedTopicKey),
    states: await db.learnConcepts.toArray(),
    daily: await db.learnDrops.get(dailyDropId(openedAt)),
    night: await db.learnDrops.get(nightDropId(openedAt)),
  }), [openedAt]);
  const selected = chosenTopics(data?.setting?.value);
  const stateById = new Map((data?.states ?? []).map(row => [row.id, row]));
  const isDue = (id: string) => {
    const state = stateById.get(id);
    return !!state && ((!!state.memory && state.memory.dueAt <= openedAt) || ([7, 30] as const).some(day =>
      !!state.firstLearnedAt && openedAt >= state.firstLearnedAt + day * 86_400_000 && !state.retentionChecks?.[day]));
  };
  const dueCount = topics.filter(pack => selected.includes(pack.body.topic.id))
    .flatMap(pack => pack.body.modules.flatMap(module => module.concepts)).filter(concept => isDue(concept.id)).length;
  const toggle = async (id: string) => {
    const next = selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id];
    if (!next.length) return;
    try {
      const now = openedAt;
      const deviceId = await getOrCreateDeviceId(db, now);
      await trackWrite(() => db.settings.put({ key: selectedTopicKey, value: next, updatedAt: now, deleted: 0, deviceId }));
      setMessage('Topics updated.');
    } catch { setMessage('Could not update topics. Try again.'); }
  };
  if (entry === 'drop') return <section className="screen learn-screen"><p className="eyebrow">Today</p><h1>Today's drop</h1><LearnDrop daily itemCount={5} onDone={() => go('learn')} /></section>;
  if (practice) return <section className="screen learn-screen"><LearnDrop daily={false} itemCount={3} preferredConceptId={practice.conceptId} practiceTopicId={practice.topicId} reviewDue={practice.reviewDue} onDone={() => setPractice(undefined)} /></section>;
  return <section className="screen learn-screen"><p className="eyebrow">Your curiosity, in motion</p><h1>Learn</h1>
    <section className="card learn-today" aria-label="Today"><h2>Today</h2>
      <div className="learn-today-status"><div><strong>Today's drop</strong><span>{dropStatus(data?.daily)}</span></div><button type="button" onClick={() => go('learn/drop')}>{dropStatus(data?.daily) === 'Done for today' ? 'View' : dropStatus(data?.daily)}</button></div>
      <div className="learn-today-status"><div><strong>Night drop</strong><span>{dropStatus(data?.night)}</span></div><span className="learn-today-note">In your night cards</span></div>
      {dueCount > 0 && <><button type="button" className="secondary learn-review-action" onClick={() => setPractice({ reviewDue: true })}>Idea checks · {Math.min(dueCount, 3)} for today</button>{dueCount > 3 && <p className="deck-meta">{dueCount} ideas waiting</p>}</>}
    </section>
    <div className="learn-map-heading"><h2>Topics</h2><p>Open a topic to explore its ideas. Practice is always optional.</p></div>
    {[...topics].sort((a, b) => Number(selected.includes(b.body.topic.id)) - Number(selected.includes(a.body.topic.id))).map(pack => {
      const topicId = pack.body.topic.id;
      const concepts = pack.body.modules.flatMap(module => module.concepts);
      const strong = concepts.filter(concept => ['Strong', 'Mastered'].includes(masteryMapState(stateById.get(concept.id)))).length;
      const groups = [
        { label: 'Strong', rows: concepts.filter(concept => ['Strong', 'Mastered'].includes(masteryMapState(stateById.get(concept.id)))) },
        { label: 'Learning', rows: concepts.filter(concept => masteryMapState(stateById.get(concept.id)) === 'Learning') },
        { label: 'New', rows: concepts.filter(concept => masteryMapState(stateById.get(concept.id)) === 'Not started') },
      ];
      const open = expanded === topicId;
      return <section className="card learn-map-topic" key={pack.id}>
        <button type="button" className="learn-topic-expand" aria-expanded={open} aria-controls={`learn-ideas-${topicId}`} onClick={() => setExpanded(open ? undefined : topicId)}>
          <span className="learn-topic-title"><strong>{pack.title}</strong><span aria-hidden="true">{open ? '−' : '+'}</span></span>
          <span className="learn-topic-hook">{pack.description}</span>
          <span className="learn-topic-progress-label">{strong} of {concepts.length} ideas strong</span>
          <span className="learn-topic-progress" role="progressbar" aria-label={`${pack.title} strong ideas`} aria-valuenow={strong} aria-valuemin={0} aria-valuemax={concepts.length}><span style={{ width: `${strong / concepts.length * 100}%` }} /></span>
        </button>
        <button type="button" className="secondary learn-topic-toggle" aria-pressed={selected.includes(topicId)} onClick={() => void toggle(topicId)}>{selected.includes(topicId) ? 'In my drops ✓' : 'Add to my drops'}</button>
        {open && <div id={`learn-ideas-${topicId}`} className="learn-ideas" aria-label={`${pack.title} mastery map`}>{groups.filter(group => group.rows.length).map(group => <section key={group.label} className="learn-idea-group"><h3>{group.label} <small>{group.rows.length}</small></h3>{group.rows.map(concept => <div className="learn-idea-row" data-state={group.label.toLowerCase()} key={concept.id}><div><strong>{concept.title}</strong><p>{concept.rule}</p>{masteryMapState(stateById.get(concept.id)) === 'Mastered' && <small>Mastered</small>}</div><button type="button" className="secondary" aria-label={`Practice this idea: ${concept.title}`} onClick={() => setPractice({ conceptId: concept.id, topicId })}>Practice</button></div>)}</section>)}</div>}
      </section>;
    })}
    {message && <p role="status">{message}</p>}
    <Mind entry="courses" />
  </section>;
}
