import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { learningFigures } from '../../core/learn/engine';
import { loadEngineFacts } from '../../data/repos/learn-engine';
import { db } from '../../data/db';

/** How learning is holding (30-day recall, sure-and-right). Spec 33 moved it from Read to You, beside progress. */
export function LearningHolding() {
  const [openedAt] = useState(() => Date.now());
  const facts = useLiveQuery(async () => (await loadEngineFacts(db)).facts, []);
  const figures = learningFigures({ facts: facts ?? [] }, openedAt);
  return <section className="card learn-figures" aria-label="How your learning is holding"><h2>How your learning is holding</h2>
    <p>30-day recall: {figures.recall30 === null ? 'Builds after your first 30 days' : `${figures.recall30}%`}</p>
    {figures.sureAccuracy !== null && <p>When you feel sure, you are right {figures.sureAccuracy}% of the time</p>}</section>;
}
