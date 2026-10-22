import { RULES } from '../../core/rules.config';
import { dayKey } from '../../core/time';
import { badges, badgeTier, chestReady, completedQuests, dailyQuests, goldReviewPassed, monthlyQuestCount, perfectDrop } from '../../core/economy/gamify';
import { masteryMapState } from '../../core/learn/engine';
import { addEconomyDays, CLOSE_PREFIX, closeKey, dayCloseOf, deriveEconomy } from '../../core/economy/deriveEconomy';
import { topics } from '../../ui/learn/flow';
import { trackWrite } from '../../core/pendingWrites';
import { getOrCreateDeviceId } from '../device';
import { restoreActive } from '../restoreLock';
import type { NandiDb } from '../db';
import type { LedgerRow } from '../types';

/** Reconcile derived achievements into immutable, idempotent award facts. */
export async function reconcileGamify(db: NandiDb, now = Date.now()): Promise<void> {
  // A restore clears and refills the tables; the app runs this again once it has finished.
  if (restoreActive()) return;
  const today = dayKey(now);
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', [db.ledger, db.learnDrops, db.learnConcepts, db.dailyLog, db.settings], async () => {
    // The 22 Oct economy fixes count from the first day this build ran (earlier days keep what they showed).
    if (!await db.settings.get('economy.v2From')) await db.settings.put({ key: 'economy.v2From', value: today, updatedAt: now, deleted: 0, deviceId });
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
      // A perfect drop needs at least 3 scored questions; a lesson with 1 or 2 is not a "perfect" run (second opinion 5).
      const scored = drop.drop.items.filter(item => !item.lesson).length;
      if (scored >= 3 && perfectDrop(facts, drop.id, scored)) await add('perfect-drop', today, today);
    }
    // Record today's welcome-back gift once shown, so a later sync can never take it away.
    const settings = await db.settings.toArray();
    if (deriveEconomy(facts, undefined, settings, today).days.at(-1)?.welcome) await add('welcome-back', today, today);
    for (const quest of completedQuests(facts, today)) await add('daily-quest', `${today}:${quest.id}`, today);
    if (dailyQuests(today).every(q => known.has(`daily-quest:${today}:${q.id}`))) await add('focus-boost', today, today);
    const states = await db.learnConcepts.toArray();
    const mastered = new Set(states.filter(row => masteryMapState(row) === 'Mastered' || known.has(`gold-review:${row.id}`)).map(row => row.id));
    for (const pack of topics) for (const module of pack.body.modules) if (chestReady(module.concepts.map(c => c.id), mastered)) await add('unit-chest', module.id, today);
    for (const badge of badges) for (let tier = 1; tier <= badgeTier(badge, facts); tier++) await add('badge-tier', `${badge.id}:${tier}`, today);
    const month = today.slice(0, 7);
    if (monthlyQuestCount(facts, month) >= 20) await add('monthly-challenge', month, today);
    // Close the books: each day that is over keeps what it showed, once, so no later replay can lower it
    // (economy second opinion 22). The first run closes up to 120 past days with activity behind them.
    const rows = await db.settings.toArray();
    // A close dated today or later came from a clock that was set ahead: that day has not ended, so drop it.
    for (const row of rows.filter(item => item.key.startsWith(CLOSE_PREFIX) && item.key.slice(CLOSE_PREFIX.length) >= today)) await db.settings.delete(row.key);
    const closed = rows.filter(row => !row.deleted && row.key.startsWith(CLOSE_PREFIX) && row.key.slice(CLOSE_PREFIX.length) < today).map(row => row.key.slice(CLOSE_PREFIX.length)).sort();
    const first = facts.map(fact => fact.dayKey).filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key)).sort()[0];
    let day = closed.at(-1) ? addEconomyDays(closed.at(-1)!, 1) : first;
    if (day && day < addEconomyDays(today, -120)) day = addEconomyDays(today, -120);
    for (; day && day < today; day = addEconomyDays(day, 1)) {
      const row = { key: closeKey(day), value: dayCloseOf(facts, rows, day), updatedAt: now, deleted: 0 as const, deviceId };
      await db.settings.put(row); rows.push(row);
    }
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
