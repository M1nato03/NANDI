import { RULES } from '../../core/rules.config';
import { dayKey } from '../../core/time';
import { badges, badgeTier, chestReady, completedQuests, dailyQuests, goldReviewPassed, monthlyQuestCount, perfectDrop } from '../../core/economy/gamify';
import { masteryMapState } from '../../core/learn/engine';
import { topics } from '../../ui/learn/flow';
import { trackWrite } from '../../core/pendingWrites';
import { getOrCreateDeviceId } from '../device';
import type { NandiDb } from '../db';
import type { LedgerRow } from '../types';

/** Reconcile derived achievements into immutable, idempotent award facts. */
export async function reconcileGamify(db: NandiDb, now = Date.now()): Promise<void> {
  const today = dayKey(now);
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', [db.ledger, db.learnDrops, db.learnConcepts, db.dailyLog], async () => {
    const facts = (await db.ledger.toArray()).filter(f => !f.deleted);
    const known = new Set(facts.map(f => f.id));
    const add = async (kind: string, refId: string, day: string, inputs: Record<string, unknown> = {}, at = now) => {
      const id = `${kind}:${refId}`;
      if (known.has(id)) return;
      const fact: LedgerRow = { id, kind, refId, dayKey: day, mode: 'gamify', inputs, updatedAt: at, deleted: 0, deviceId };
      await db.ledger.add(fact); facts.push(fact); known.add(id);
    };
    const log = await db.dailyLog.get(today);
    if (log?.planDone && log.shutdownDone) await add('tomorrow-plan', today, today);
    const drop = await db.learnDrops.get(`drop:daily:${today}`);
    if (drop && drop.drop.items.length > 0 && drop.drop.cursor >= drop.drop.items.length) {
      await add('learn-drop', today, today);
      if (perfectDrop(facts, drop.id, drop.drop.items.filter(item => !item.lesson).length)) await add('perfect-drop', today, today);
    }
    for (const quest of completedQuests(facts, today)) await add('daily-quest', `${today}:${quest.id}`, today);
    if (dailyQuests(today).every(q => known.has(`daily-quest:${today}:${q.id}`))) await add('focus-boost', today, today);
    const states = await db.learnConcepts.toArray();
    const mastered = new Set(states.filter(row => masteryMapState(row) === 'Mastered' || known.has(`gold-review:${row.id}`)).map(row => row.id));
    for (const pack of topics) for (const module of pack.body.modules) if (chestReady(module.concepts.map(c => c.id), mastered)) await add('unit-chest', module.id, today);
    for (const badge of badges) for (let tier = 1; tier <= badgeTier(badge, facts); tier++) await add('badge-tier', `${badge.id}:${tier}`, today);
    const month = today.slice(0, 7);
    if (monthlyQuestCount(facts, month) >= 20) await add('monthly-challenge', month, today);
  }));
}

export async function saveGoldReview(db: NandiDb, conceptId: string, correct: number, total: number, now = Date.now()): Promise<boolean> {
  const passed = goldReviewPassed(correct, total);
  const day = dayKey(now), id = passed ? `gold-review:${conceptId}` : `gold-attempt:${conceptId}:${day}`;
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.ledger, async () => {
    if (await db.ledger.get(id)) return;
    await db.ledger.add({ id, mode: 'gamify', kind: passed ? 'gold-review' : 'gold-attempt', refId: passed ? conceptId : `${conceptId}:${day}`, dayKey: day, inputs: { correct, total }, updatedAt: now, deleted: 0, deviceId });
  }));
  return passed;
}
export const gamifyRewards = RULES.gamify;
