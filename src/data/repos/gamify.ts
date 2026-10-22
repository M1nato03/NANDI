import { RULES } from '../../core/rules.config';
import { dayKey } from '../../core/time';
import { badges, badgeTier, chestReady, completedQuests, dailyQuests, goldReviewPassed, monthlyQuestCount, perfectDrop } from '../../core/economy/gamify';
import { masteryMapState } from '../../core/learn/engine';
import { addEconomyDays, CLOSE_PREFIX, closeKey, closesFor, deriveEconomy, keptCandidates, mergeCloseMaps } from '../../core/economy/deriveEconomy';
import { topics } from '../../ui/learn/flow';
import { trackWrite } from '../../core/pendingWrites';
import { getOrCreateDeviceId } from '../device';
import { asReconcile, restoreActive } from '../restoreLock';
import type { NandiDb } from '../db';
import type { LedgerRow } from '../types';

/** Reconcile derived achievements into immutable, idempotent award facts. */
let running: Promise<void> | null = null;
let queued: { db: NandiDb; now: number } | null = null;
let queuedRun: Promise<void> | null = null;
export function reconcileGamify(db: NandiDb, now = Date.now()): Promise<void> {
  // A restore clears and refills the tables; the app runs this again once it has finished. A restore that
  // starts while this runs waits for it (the whole run counts, from its first await).
  if (restoreActive()) return Promise.resolve();
  // A burst of writes runs one reconcile now and at most one more after it, with the latest clock (review 32).
  if (running) {
    queued = { db, now };
    return queuedRun ??= running.catch(() => undefined).then(() => {
      const next = queued!; queued = null; queuedRun = null;
      return reconcileGamify(next.db, next.now);
    });
  }
  const run = asReconcile(() => reconcileOnce(db, now)).finally(() => { if (running === run) running = null; });
  running = run;
  return run;
}

async function reconcileOnce(db: NandiDb, now: number): Promise<void> {
  const today = dayKey(now);
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', [db.ledger, db.learnDrops, db.learnConcepts, db.dailyLog, db.settings], async () => {
    // Checked again inside the transaction: a restore may have started while this one waited for its lock.
    if (restoreActive()) return;
    // The 22 Oct economy fixes count from the first day this build ran (earlier days keep what they showed).
    if (!await db.settings.get('economy.v2From')) await db.settings.put({ key: 'economy.v2From', value: today, updatedAt: now, deleted: 0, deviceId });
    if (!await db.settings.get('economy.v3From')) await db.settings.put({ key: 'economy.v3From', value: today, updatedAt: now, deleted: 0, deviceId });
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
      // The drop counts as finished after bedtime when the fact that completed it (its last answer, retention
      // check or lesson) came after bedtime, even if it was started before (econ-32 re-review, item 37).
      const own = facts.filter(fact => (fact.kind === 'learn-answer' || fact.kind === 'learn-retention' || fact.kind === 'learn-lesson') && fact.inputs.dropId === drop.id);
      const completing = own.reduce<typeof own[number] | undefined>((latest, fact) => !latest || fact.updatedAt >= latest.updatedAt ? fact : latest, undefined);
      const late = completing?.inputs.afterBedtime === true ? { afterBedtime: true } : {};
      await add('learn-drop', today, today, late);
      // A perfect drop needs at least 3 scored questions; a lesson with 1 or 2 is not a "perfect" run (second opinion 5).
      const scored = drop.drop.items.filter(item => !item.lesson).length;
      if (scored >= 3 && perfectDrop(facts, drop.id, scored)) await add('perfect-drop', today, today, late);
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
    // Close the books: every finished day keeps the highest it has shown (a high-water mark, raised on each
    // run, never lowered), so no later sync, import, restore or rule fix can lower it (second opinions 22, 25).
    const rows = await db.settings.toArray();
    // A close dated today or later came from a clock that was set ahead: that day has not ended, so drop it.
    for (const row of rows.filter(item => item.key.startsWith(CLOSE_PREFIX) && item.key.slice(CLOSE_PREFIX.length) >= today)) await db.settings.delete(row.key);
    const oldest = addEconomyDays(today, -120);
    const stored = new Map(rows.filter(row => !row.deleted && row.key.startsWith(CLOSE_PREFIX)).map(row => [row.key.slice(CLOSE_PREFIX.length), row.value] as const));
    // Days older than 120 that were never closed stay unclosed; their purchases move to the next kept day.
    const candidates = keptCandidates(closesFor(facts, rows, today), stored, oldest);
    for (const [day, merged] of mergeCloseMaps(new Map([...stored].filter(([day]) => day < today)), candidates)) {
      const existing = stored.get(day);
      if (JSON.stringify(merged) !== JSON.stringify(existing)) await db.settings.put({ key: closeKey(day), value: merged, updatedAt: now, deleted: 0, deviceId });
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
