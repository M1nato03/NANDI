import { useEffect, useState } from 'react';
import { bookTitle } from '../../core/learn/books';
import { orderOptions, type Drop } from '../../core/learn/engine';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { bundledTopicPacks } from '../../data/packs/seed';
import { saveDrop } from '../../data/repos/learn-engine';
import { dailyDropId } from './dropIds';
import { LearnDrop } from './LearnDrop';
import './read.css';

const currentTime = () => Date.now();

/** E2E build only: reset the test database's daily drop to one bundled question, using the real question UI. */
export function ItemDemo() {
  const itemId = new URLSearchParams(location.search).get('item');
  const pack = bundledTopicPacks.find(pack => pack.body.modules.some(module => module.concepts.some(concept => concept.items.some(item => item.id === itemId))));
  const module = pack?.body.modules.find(module => module.concepts.some(concept => concept.items.some(item => item.id === itemId)));
  const concept = module?.concepts.find(concept => concept.items.some(item => item.id === itemId));
  const item = concept?.items.find(item => item.id === itemId);
  const [now] = useState(currentTime);
  const [ready, setReady] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!item || !concept) return;
    let active = true;
    const drop: Drop = { id: dailyDropId(now), cursor: 0, ending: { kind: 'stopping-screen' },
      items: [{ itemId: item.id, conceptId: concept.id, mode: 'new', optionOrder: orderOptions(item, 571) }] };
    void getOrCreateDeviceId(db, now).then(deviceId => saveDrop(db, drop, deviceId, now))
      .then(() => { if (active) setReady(item.id); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [item, concept, now]);

  if (!pack || !module || !item) return <section className="screen learn-screen"><h1>Item demo</h1><p role="status">No such bundled item.</p></section>;
  return <section className="screen learn-screen">
    <header className="read-chapter-head"><p className="eyebrow">Book check · {bookTitle(pack)} · Chapter {pack.body.modules.indexOf(module) + 1}</p><h1>{module.title}</h1></header>
    {failed ? <p role="alert">Could not prepare the demo question.</p>
      : ready === item.id ? <LearnDrop key={item.id} practiceTopicId={pack.body.topic.id} />
        : <p role="status">Preparing the demo question…</p>}
  </section>;
}
