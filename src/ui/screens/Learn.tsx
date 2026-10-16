import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { masteryMapState } from '../../core/learn/engine';
import { trackWrite } from '../../core/pendingWrites';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { LearnDrop } from '../learn/LearnDrop';
import { chosenTopics, selectedTopicKey, topics } from '../learn/flow';
import { go, goToCard } from '../shell/router';

export function Learn() {
  const [practice, setPractice] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const [message, setMessage] = useState('');
  const setting = useLiveQuery(() => db.settings.get(selectedTopicKey), []);
  const states = useLiveQuery(() => db.learnConcepts.toArray(), []) ?? [];
  const selected = chosenTopics(setting?.value);
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
  if (practice) return <section className="screen learn-screen"><LearnDrop daily={false} onDone={() => setPractice(false)} /></section>;
  return <section className="screen learn-screen"><p className="eyebrow">Your curiosity, in motion</p><h1>Learn</h1>
    <p>Five small questions. A clearer idea to carry into the day.</p>
    <div className="learn-map-actions"><button type="button" onClick={() => setPractice(true)} disabled={!selected.length}>Practice more</button><button type="button" className="secondary" onClick={() => { go('now'); goToCard(new Date(openedAt).getDay() === 1 ? 5 : 4); }}>Today's drop</button></div>
    <h2>Topics</h2><p>Tap a topic to add or remove it from your drops.</p>
    {topics.map(pack => {
      const concepts = pack.body.modules.flatMap(module => module.concepts);
      const due = concepts.filter(concept => { const state = states.find(row => row.id === concept.id); return state?.memory && state.memory.dueAt <= openedAt; }).length;
      const retentionDue = concepts.flatMap(concept => { const state = states.find(row => row.id === concept.id); if (!state?.firstLearnedAt) return []; return ([7, 30] as const).filter(day => openedAt >= state.firstLearnedAt! + day * 86_400_000 && !state.retentionChecks?.[day]); }).length;
      return <section className="card learn-map-topic" key={pack.id}><span className="pill">{selected.includes(pack.body.topic.id) ? 'In your drops' : 'Explore anytime'}</span><h2>{pack.title}</h2><p>{pack.description}</p><button type="button" className="secondary" aria-pressed={selected.includes(pack.body.topic.id)} onClick={() => void toggle(pack.body.topic.id)}>{selected.includes(pack.body.topic.id) ? 'Selected ✓' : 'Add topic'}</button>
        <p>{due ? `${due} review ${due === 1 ? 'check' : 'checks'} due` : 'No spaced reviews due'} · {retentionDue ? `${retentionDue} retention ${retentionDue === 1 ? 'check' : 'checks'} due` : 'No retention checks due'}</p>
        <div className="learn-chips" aria-label={`${pack.title} mastery map`}>{concepts.map(concept => { const label = masteryMapState(states.find(row => row.id === concept.id)); return <span className="learn-chip" data-state={label.toLowerCase().replace(' ', '-')} key={concept.id}><strong>{concept.title}</strong><small>{label === 'Not started' ? 'New' : label}</small></span>; })}</div>
      </section>;
    })}
    {message && <p role="status">{message}</p>}
  </section>;
}
