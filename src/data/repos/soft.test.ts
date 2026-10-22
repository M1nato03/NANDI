// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { doSoftThing, setSoftState } from './soft';
import { careCardDue, softNumbers, softToday } from '../../core/soft/soft';

let serial = 0;
const opened: NandiDb[] = [];
function fresh() { const db = createDb(`soft-test-${++serial}`); opened.push(db); return db; }
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const at = (day: string, time: string) => new Date(`${day}T${time}:00`).getTime();

it('keeps every mood tap: tired, then okay, then tired again', async () => {
  const db = fresh();
  await setSoftState(db, 'tired', at('2026-11-03', '20:00'));
  await setSoftState(db, 'okay', at('2026-11-03', '20:01'));
  expect(softToday(await db.ledger.toArray(), '2026-11-03').state).toBeNull();
  await setSoftState(db, 'tired', at('2026-11-03', '20:05'));
  const facts = await db.ledger.toArray();
  expect(facts.filter(fact => fact.kind === 'soft-start')).toHaveLength(3);
  expect(softToday(facts, '2026-11-03').state).toBe('tired');
  await doSoftThing(db, 'breathe', at('2026-11-03', '20:06'));
  expect((await db.ledger.get('soft:2026-11-03'))?.inputs.state).toBe('tired');
});

it('counts a day that was backed out of in the finish rate and the low-day count', async () => {
  const db = fresh();
  await setSoftState(db, 'low', at('2026-11-03', '20:00'));
  await setSoftState(db, 'okay', at('2026-11-03', '20:01'));
  await setSoftState(db, 'tired', at('2026-11-04', '20:00'));
  await doSoftThing(db, 'breathe', at('2026-11-04', '20:02'));
  const numbers = softNumbers(await db.ledger.toArray(), '2026-11-05');
  expect(numbers).toMatchObject({ started: 2, finished: 1, finishRate: 0.5, medianMinutes: 2 });
  for (const day of ['2026-11-05', '2026-11-06', '2026-11-07']) {
    await setSoftState(db, 'low', at(day, '19:00'));
    await setSoftState(db, 'okay', at(day, '19:01'));
  }
  expect(careCardDue(await db.ledger.toArray(), '2026-11-07', undefined)).toBe(true);
});

it('two taps in the same millisecond keep tap order', async () => {
  const db = fresh();
  const now = at('2026-11-03', '12:00');
  await setSoftState(db, 'low', now);
  await setSoftState(db, 'okay', now);
  expect(softToday(await db.ledger.toArray(), '2026-11-03').state).toBeNull();
  await setSoftState(db, 'tired', now);
  expect(softToday(await db.ledger.toArray(), '2026-11-03').state).toBe('tired');
});

it('credits a breath that runs past 04:00 to the soft day it was opened on', async () => {
  const db = fresh();
  await setSoftState(db, 'tired', at('2026-11-03', '03:55'));
  await doSoftThing(db, 'breathe', at('2026-11-03', '04:02'), {}, '2026-11-02');
  const facts = await db.ledger.toArray();
  expect(softToday(facts, '2026-11-02').done?.inputs.state).toBe('tired');
  expect(softToday(facts, '2026-11-03').done).toBeNull();
});
