import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { learningFigures, masteryMapState } from '../../core/learn/engine';
import { loadEngineFacts } from '../../data/repos/learn-engine';
import { trackWrite } from '../../core/pendingWrites';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import type { LearnDropRow } from '../../data/types';
import { LearnDrop } from '../learn/LearnDrop';
import { Mind } from './Mind';
import { chosenTopics, dailyDropId, nightDropId, selectedTopicKey, topics } from '../learn/flow';
import { go } from '../shell/router';
import { chestReady } from '../../core/economy/gamify';
import { RULES } from '../../core/rules.config';
import { completedModuleKey, UnitScene } from '../cast/UnitScene';
import { Moti } from '../cast/Cast';
import { playCastSound } from '../cast/sound';

type Practice = { conceptId?: string; topicId?: string; reviewDue?: boolean; goldReview?: boolean };
const dropStatus = (row?: LearnDropRow) => !row ? 'Not started' : row.drop.cursor >= row.drop.items.length ? 'Done for today' : `${row.drop.cursor} of ${row.drop.items.length} done`;
const dropAction = (row?: LearnDropRow) => !row ? 'Start' : row.drop.cursor >= row.drop.items.length ? 'View' : 'Continue';

export function Learn({ entry }: { entry?: string }) {
  const [practice, setPractice] = useState<Practice>();
  const [expanded, setExpanded] = useState<string>();
  const [openedAt] = useState(() => Date.now());
  const [message, setMessage] = useState('');
  const data = useLiveQuery(async () => ({
    setting: await db.settings.get(selectedTopicKey),
    sound: await db.settings.get('economy.soundOn'),
    states: await db.learnConcepts.toArray(),
    daily: await db.learnDrops.get(dailyDropId(openedAt)),
    night: await db.learnDrops.get(nightDropId(openedAt)),
    facts: (await loadEngineFacts(db)).facts,
    ledger: await db.ledger.toArray(),
  }), [openedAt]);
  const selected = chosenTopics(data?.setting?.value);
  const figures = learningFigures({ facts: data?.facts ?? [] }, openedAt);
  const stateById = new Map((data?.states ?? []).map(row => [row.id, row]));
  const [unitScene, setUnitScene] = useState<string>();
  const learned = new Set((data?.states ?? []).filter(row => !!row.firstLearnedAt).map(row => row.id));
  const completedUnit = data && completedModuleKey(topics.flatMap(pack => pack.body.modules), learned, id => localStorage.getItem(`cast.unit:${id}`) === 'seen');
  useEffect(() => {
    if (!completedUnit || matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce') return;
    try { localStorage.setItem(`cast.unit:${completedUnit}`, 'seen'); } catch { /* Scene remains optional when storage is blocked. */ }
    playCastSound('chest', data?.sound?.value === true && !data.sound.deleted);
    queueMicrotask(() => setUnitScene(completedUnit));
  }, [completedUnit, data?.sound]);
  const scene = unitScene && <UnitScene moduleId={unitScene} close={() => setUnitScene(undefined)} />;
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
  if (entry === 'drop') return <section className="screen learn-screen"><p className="eyebrow">Today</p><h1>Today's drop</h1><LearnDrop daily itemCount={5} onDone={() => go('learn')} />{scene}</section>;
  if (practice) return <section className="screen learn-screen"><LearnDrop daily={false} itemCount={practice.goldReview ? 5 : 3} preferredConceptId={practice.conceptId} practiceTopicId={practice.topicId} reviewDue={practice.reviewDue} goldReview={practice.goldReview} onDone={() => setPractice(undefined)} />{scene}</section>;
  return <section className="screen learn-screen"><p className="eyebrow">Your curiosity, in motion</p><h1>Learn</h1>
    <section className="card learn-today" aria-label="Today"><h2>Today</h2>
      <div className="learn-today-status"><div><strong>Today's drop</strong><span>{dropStatus(data?.daily)}</span></div><button type="button" onClick={() => go('learn/drop')}>{dropAction(data?.daily)}</button></div>
      <div className="learn-today-status"><div><strong>Night drop</strong><span>{dropStatus(data?.night)}</span></div><span className="learn-today-note">In your night cards</span></div>
      {dueCount > 0 && <><div className="cast-inline"><Moti pose="think" size={40} /><button type="button" className="secondary learn-review-action" onClick={() => setPractice({ reviewDue: true })}>Idea checks · {Math.min(dueCount, 3)} for today</button></div>{dueCount > 3 && <p className="deck-meta">{dueCount} ideas waiting</p>}</>}
    </section>
    <div className="learn-map-heading"><h2>Topics</h2><p>Open a topic to explore its ideas. Practice is always optional.</p></div>
    {[...topics].sort((a, b) => Number(selected.includes(b.body.topic.id)) - Number(selected.includes(a.body.topic.id))).map(pack => {
      const topicId = pack.body.topic.id;
      const concepts = pack.body.modules.flatMap(module => module.concepts);
      const strong = concepts.filter(concept => ['Strong', 'Mastered'].includes(masteryMapState(stateById.get(concept.id)))).length;
      const gold = new Set((data?.ledger ?? []).filter(fact => fact.kind === 'gold-review').map(fact => fact.refId));
      const mastered = new Set(concepts.filter(concept => masteryMapState(stateById.get(concept.id)) === 'Mastered' || gold.has(concept.id)).map(concept => concept.id));
      const open = expanded === topicId;
      return <section className="card learn-map-topic" key={pack.id}>
        <button type="button" className="learn-topic-expand" aria-expanded={open} aria-controls={`learn-ideas-${topicId}`} onClick={() => setExpanded(open ? undefined : topicId)}>
          <span className="learn-topic-title"><strong>{pack.title}</strong><span aria-hidden="true">{open ? '−' : '+'}</span></span>
          <span className="learn-topic-hook">{pack.description}</span>
          <span className="learn-topic-progress-label">{strong} of {concepts.length} ideas strong</span>
          <span className="learn-topic-progress" role="progressbar" aria-label={`${pack.title} strong ideas`} aria-valuenow={strong} aria-valuemin={0} aria-valuemax={concepts.length}><span style={{ width: `${strong / concepts.length * 100}%` }} /></span>
        </button>
        <button type="button" className="secondary learn-topic-toggle" aria-pressed={selected.includes(topicId)} onClick={() => void toggle(topicId)}>{selected.includes(topicId) ? 'In my drops ✓' : 'Add to my drops'}</button>
        {open && <div id={`learn-ideas-${topicId}`} className="learn-trail" aria-label={`${pack.title} mastery map`}><div className="learn-trail-legend">{(['New', 'Learning', 'Strong'] as const).filter(label => concepts.some(concept => (masteryMapState(stateById.get(concept.id)) === 'Not started' ? 'New' : masteryMapState(stateById.get(concept.id))) === label)).map(label => <h3 key={label}>{label}</h3>)}</div>{pack.body.modules.map(module => <section key={module.id} className="learn-trail-module"><h3>{module.title}</h3>{module.concepts.map((concept, index) => { const state = gold.has(concept.id) ? 'Gold' : masteryMapState(stateById.get(concept.id)); const triedToday = (data?.ledger ?? []).some(fact => fact.kind === 'gold-attempt' && fact.refId === `${concept.id}:${new Date(openedAt).toISOString().slice(0, 10)}`); return <div key={concept.id}><div className={`learn-trail-node learn-idea-row offset-${index % 3}`} data-state={state === 'Not started' ? 'new' : state.toLowerCase()}><span className="learn-trail-dot" aria-hidden="true">{index + 1}</span><div><strong>{concept.title}</strong><small>{state}</small></div><button type="button" className="secondary" aria-label={`Practice this idea: ${concept.title}`} onClick={() => setPractice({ conceptId: concept.id, topicId })}>Practice</button>{state === 'Mastered' && <button type="button" className="secondary" disabled={triedToday} onClick={() => setPractice({ conceptId: concept.id, topicId, goldReview: true })}>Gold review</button>}</div>{(index + 1) % 4 === 0 && index < module.concepts.length - 1 && <div className="learn-trail-checkpoint">Checkpoint · {index + 1} ideas</div>}</div>; })}<div className="learn-trail-chest">Unit chest · {chestReady(module.concepts.map(concept => concept.id), mastered) ? 'Opened' : 'Keep exploring'} · {RULES.gamify.unitChestShards} Shards</div></section>)}</div>}
      </section>;
    })}
    <section className="card learn-figures" aria-label="How your learning is holding"><h2>How your learning is holding</h2><p>30-day recall: {figures.recall30 === null ? 'Builds after your first 30 days' : `${figures.recall30}%`}</p>{figures.sureAccuracy !== null && <p>When you feel sure, you are right {figures.sureAccuracy}% of the time</p>}</section>
    {message && <p role="status">{message}</p>}
    <Mind entry="courses" />{scene}
  </section>;
}
