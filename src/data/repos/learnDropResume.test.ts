import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { loadDrop, saveDrop, saveEngineAnswer } from './learn-engine';
import { catalogFor, makeDrop } from '../../ui/learn/flow';
import type { LearnConceptRow } from '../types';

// Codex A item 74: a STORED daily drop resumes after a reload with the option order it was shown in, and an answer is
// graded by option id, never by the position it was shown at.
let serial = 0;
const opened: NandiDb[] = [];
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const open = (name: string) => { const db = createDb(name); opened.push(db); return db; };

it('resumes a stored drop after a reload and grades one answer by option id', async () => {
  const now = new Date('2026-10-23T12:00:00').getTime();
  const concepts = catalogFor(['psychology']);
  const first = concepts.find(concept => concept.id === 'habits')!.steps![0]!.id;
  const drop = makeDrop({ ids: ['psychology'], concepts: [] as LearnConceptRow[], items: [], now, daily: true, answeredToday: 0, newToday: 0,
    spentMinutes: 0, facts: [], taughtSteps: [first], taughtOn: { [first]: '2026-10-22' } });
  const items = concepts.flatMap(concept => concept.items);
  const index = drop.items.findIndex(entry => !entry.lesson && items.find(item => item.id === entry.itemId)?.options.filter(option => option.correct).length === 1
    && !['order', 'match', 'estimate'].includes(items.find(item => item.id === entry.itemId)!.type));
  expect(index).toBeGreaterThanOrEqual(0);
  const name = `resume-${++serial}`;
  await saveDrop(open(name), { ...drop, cursor: index }, 'd1', now);

  // A reload: a new connection to the same database reads the stored drop back unchanged.
  const db = open(name);
  const stored = await loadDrop(db, drop.id);
  expect(stored).toEqual({ ...drop, cursor: index });
  const entry = stored!.items[index]!;
  const item = items.find(row => row.id === entry.itemId)!;
  const right = item.options.find(option => option.correct)!.id;
  // The stored order is what the screen shows; the right option sits wherever that order put it.
  expect([...entry.optionOrder].sort()).toEqual(item.options.map(option => option.id).sort());
  const shownAt = entry.optionOrder.indexOf(right);
  expect(shownAt).toBeGreaterThanOrEqual(0);

  await saveEngineAnswer(db, { answerId: 'a1', dropId: drop.id, item, answer: entry.optionOrder[shownAt]!, confidence: 'certain', deviceId: 'd1', now: now + 1000 });
  const fact = await db.ledger.get('learn-answer:a1');
  expect(fact?.inputs.correct).toBe(true);
  expect((await loadDrop(db, drop.id))!.cursor).toBe(index + 1);
});
