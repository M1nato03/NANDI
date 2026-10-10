// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { createQuestRepo } from './quests';
import { calculateQuestXp } from '../../core/economy/awards';

let db: NandiDb;
afterEach(async () => { if (db) await db.delete(); });

it('seeds, swaps once, keeps taps idempotent, archives progress, and pays once', async () => {
  db = createDb(`quests-test-${crypto.randomUUID()}`);
  const repo = createQuestRepo(db);
  const sunday = new Date(2026, 9, 11, 12).getTime();
  const monday = new Date(2026, 9, 12, 12).getTime();
  await repo.ensureWeek(sunday);
  const first = await db.quests.toArray();
  expect(first).toHaveLength(3);
  await repo.swap(sunday);
  await expect(repo.swap(sunday)).rejects.toThrow('One swap');
  const active = (await db.quests.toArray()).filter(q => q.status === 'active');
  expect(active).toHaveLength(3);
  const total = active.find(q => q.kind === 'total');
  if (total) {
    await repo.tap(total.id, 'same-tap', total.step, sunday);
    await repo.tap(total.id, 'same-tap', total.step, sunday);
    expect((await db.quests.get(total.id))?.progress).toBe(total.step);
  }
  await repo.done(active[0]!.id, sunday);
  await repo.done(active[0]!.id, sunday);
  const facts = await db.ledger.toArray();
  expect(facts).toHaveLength(1);
  expect(calculateQuestXp(facts)).toBe(20);
  expect(calculateQuestXp([...facts, ...facts])).toBe(20);
  await repo.ensureWeek(monday);
  expect((await db.quests.get(active[1]!.id))?.status).toBe('archived');
  expect((await db.quests.get(active[1]!.id))?.progress).toBe(total?.id === active[1]!.id ? total.step : 0);
  expect((await db.quests.toArray()).filter(q => q.week === '2026-W42' && q.status === 'active')).toHaveLength(3);
});
