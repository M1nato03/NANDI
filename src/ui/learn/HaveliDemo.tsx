import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { lastVisits, type HaveliIdea } from '../../core/moti/haveli';
import { dayKey } from '../../core/time';
import { db } from '../../data/db';
import { saveHaveliRebuilt } from '../../data/repos/moti';
import { Haveli } from './Haveli';

// E2E build only (route learn/haveli-demo): the haveli with fixture ideas until editors sign off the recall pieces.
const recall = (pieces: string[], decoys: [string, string]) => ({ pieces, decoys: decoys.map((text, i) => ({ text, slot: i, misconceptionId: `m${i + 1}`, fix: `Fix line ${i + 1}.` })), claimIds: ['c1'] });
const IDEAS: HaveliIdea[] = [
  { id: 'habits', title: 'Habits', topicId: 'psychology', topicTitle: 'Psychology', steps: [], recall: recall(['Give it weeks, and', 'do not worry about', 'one missed day.'], ['Give it exactly 21 days, and', 'expect progress to vanish after']) },
  { id: 'anchoring', title: 'Anchoring', topicId: 'psychology', topicTitle: 'Psychology', steps: [], recall: recall(['Even a made-up number can', 'tug your guess', 'toward it.'], ['Only a fair number can', 'A random number never can']) },
];
export function HaveliDemo() {
  const ledger = useLiveQuery(() => db.ledger.toArray(), []) ?? [];
  const [day] = useState(() => dayKey(Date.now()));
  const visits = lastVisits(ledger);
  return <Haveli ideas={IDEAS} lit={IDEAS.filter(idea => visits.get(idea.id) === day).map(idea => idea.id)} everLit={[...visits.keys()]} cap={Number(new URLSearchParams(location.search).get('cap') ?? 5)} day={day} onRebuilt={idea => saveHaveliRebuilt(db, idea.id, Date.now())} onLeave={() => history.back()} />;
}
