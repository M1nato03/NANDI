import { RULES } from '../../core/rules.config';
import { bookConcepts, bookUnitId } from '../../core/learn/books';
import { dayKey } from '../../core/time';
import { badges, badgeTier, chestReady, completedQuests, dailyQuests, goldReviewPassed, monthlyQuestCount, perfectDrop } from '../../core/economy/gamify';
import { masteryMapState } from '../../core/learn/engine';
import { addEconomyDays, CLOSE_PREFIX, closeKey, closesFor, deriveEconomy, economyHorizon, fillHeldBonus, keptCandidates, mergeCloseMaps, PEAK_KEY, readPeak, readSeenUpTo, replayBonus, SEEN_KEY } from '../../core/economy/deriveEconomy';
import { topics } from '../../ui/learn/flow';
import { trackWrite } from '../../core/pendingWrites';
import { dayClock, shareWindow } from '../../core/shareGate';
import { syncRestWeekday } from './economy';
import { shutdownAt } from '../../core/tasks/planner';
import { getOrCreateDeviceId } from '../device';
import { asEconomyWrite, asReconcile, restoreActive } from '../restoreLock';
import type { NandiDb } from '../db';
import type { LedgerRow, SettingRow } from '../types';

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
  await syncRestWeekday(db, now);
  await trackWrite(() => db.transaction('rw', [db.ledger, db.learnDrops, db.learnConcepts, db.dailyLog, db.settings, db.tasks], async () => {
    // Checked again inside the transaction: a restore may have started while this one waited for its lock.
    if (restoreActive()) return;
    // The 22 Oct economy fixes count from the first day this build ran (earlier days keep what they showed).
    if (!await db.settings.get('economy.v2From')) await db.settings.put({ key: 'economy.v2From', value: today, updatedAt: now, deleted: 0, deviceId });
    if (!await db.settings.get('economy.v3From')) await db.settings.put({ key: 'economy.v3From', value: today, updatedAt: now, deleted: 0, deviceId });
    if (!await db.settings.get('economy.v4From')) await db.settings.put({ key: 'economy.v4From', value: today, updatedAt: now, deleted: 0, deviceId });
    // Spec 36 (effort pays) counts from the first day this build ran: earlier days keep what they showed.
    if (!await db.settings.get('economy.v6From')) await db.settings.put({ key: 'economy.v6From', value: today, updatedAt: now, deleted: 0, deviceId });
    // Spec 36 v2 (Train sets, board difficulty, chapter depth), the same way.
    if (!await db.settings.get('economy.v7From')) await db.settings.put({ key: 'economy.v7From', value: today, updatedAt: now, deleted: 0, deviceId });
    if (!await db.settings.get('economy.v8From')) await db.settings.put({ key: 'economy.v8From', value: today, updatedAt: now, deleted: 0, deviceId });
    // Batch 5 (item 51): from the day after this build first runs, Mind after bedtime grows no courtyard corner.
    // Tomorrow, so nothing done earlier today stops counting, and never before the day after the furthest day this
    // phone has shown, so a clock set back on the upgrade day cannot shrink a corner later. Written once (items 53-54).
    if (!await db.settings.get('economy.v5From')) {
      const seenRow = await db.settings.get(SEEN_KEY);
      const seen = seenRow && !seenRow.deleted ? readSeenUpTo([seenRow]) : undefined;
      const from = [addEconomyDays(today, 1), seen ? addEconomyDays(seen, 1) : ''].sort().at(-1)!;
      await db.settings.put({ key: 'economy.v5From', value: from, updatedAt: now, deleted: 0, deviceId });
    }
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
      // Spec 36 v2: a drop that was a chapter's reading pays through the chapter, so it says so.
      await add('learn-drop', today, today, { ...late, ...(drop.drop.chapter ? { chapter: true } : {}) });
      // A perfect drop needs at least 3 scored questions; a lesson with 1 or 2 is not a "perfect" run (second opinion 5).
      const scored = drop.drop.items.filter(item => !item.lesson).length;
      if (scored >= 3 && perfectDrop(facts, drop.id, scored)) await add('perfect-drop', today, today, late);
    }
    // Record each welcome-back gift once shown, today's and every look-ahead day's (a clock set back), so filling
    // an earlier gap day later can never take it away, nor the level its XP reached (cj3 clock fuzz D).
    const settings = await db.settings.toArray();
    const shown = deriveEconomy(facts, undefined, settings, today);
    if (shown.days.at(-1)?.welcome) await add('welcome-back', today, today);
    const horizon = economyHorizon(facts, settings, today);
    if (horizon > today) for (const day of deriveEconomy(facts, undefined, settings, horizon).days) if (day.dayKey > today && day.welcome) await add('welcome-back', day.dayKey, day.dayKey);
    // The highest day this phone has shown: the look-ahead runs at least that far, so a clock set back or a
    // time zone to the west never hides what that day showed, like a season-end award (cj3 clock fuzz A).
    const seen = readSeenUpTo(settings);
    if (!seen || seen < today) await db.settings.put({ key: SEEN_KEY, value: today, updatedAt: now, deleted: 0, deviceId });
    // Raise the never-lower peak of XP and level (item 38): a floor for facts the replay cannot see later.
    const peak = readPeak(settings);
    if (shown.totalXp > peak.totalXp || shown.level > peak.level) await db.settings.put({ key: PEAK_KEY, value: { totalXp: Math.max(shown.totalXp, peak.totalXp), level: Math.max(shown.level, peak.level) }, updatedAt: now, deleted: 0, deviceId });
    for (const quest of completedQuests(facts, today)) await add('daily-quest', `${today}:${quest.id}`, today);
    // The Focus boost opens only in the day window and ends by shutdown: quests settled at shutdown or lights-out
    // (the night quest, a plan made after shutdown) never start a 2x window at night (batch 5, item 51).
    if (dailyQuests(today).every(q => known.has(`daily-quest:${today}:${q.id}`)) && !known.has(`focus-boost:${today}`)) {
      const todayTasks = await db.tasks.where('dayKey').equals(today).toArray();
      if (shareWindow(now, settings, todayTasks, log?.windDownAt) === 'day') await add('focus-boost', today, today, { until: shutdownAt(now, dayClock(now, settings, todayTasks).shutdown) });
    }
    const states = await db.learnConcepts.toArray();
    const mastered = new Set(states.filter(row => masteryMapState(row) === 'Mastered' || known.has(`gold-review:${row.id}`)).map(row => row.id));
    // Spec 33: one chest per book, under the id its unit had before it became chapters, so no chest is paid twice.
    for (const pack of topics) if (chestReady(bookConcepts(pack).map(c => c.id), mastered)) await add('unit-chest', bookUnitId(pack), today);
    // The tier is worked out once per badge (the loop condition used to re-count the whole ledger each pass; cj2 heavy data #4).
    for (const badge of badges) { const reached = badgeTier(badge, facts); for (let tier = 1; tier <= reached; tier++) await add('badge-tier', `${badge.id}:${tier}`, today); }
    const month = today.slice(0, 7);
    if (monthlyQuestCount(facts, month) >= 20) await add('monthly-challenge', month, today);
    // Close the books: every finished day keeps the highest it has shown (a high-water mark, raised on each
    // run, never lowered), so no later sync, import, restore or rule fix can lower it (second opinions 22, 25).
    const rows = await db.settings.toArray();
    // A close dated today or later (a clock that was set ahead, a time zone to the west, a restore) stays stored:
    // the real-today view ignores it, and the look-ahead still needs it (cj3 clock fuzz A, C3).
    const oldest = addEconomyDays(today, -120);
    const raw = new Map(rows.filter(row => !row.deleted && row.key.startsWith(CLOSE_PREFIX)).map(row => [row.key.slice(CLOSE_PREFIX.length), row.value] as const));
    // Days older than 120 that were never closed stay unclosed; their purchases move to the next kept day.
    const bonus = new Map<string, number>();
    const candidates = keptCandidates(closesFor(facts, rows, today, undefined, bonus), raw, oldest);
    // Older closes first say which level bonus they held, so the merge is the same in any order (item 47).
    const stored = fillHeldBonus(raw, bonus);
    for (const [day, merged] of mergeCloseMaps(new Map([...stored].filter(([day]) => day < today)), candidates)) {
      const existing = raw.get(day);
      if (JSON.stringify(merged) !== JSON.stringify(existing)) await db.settings.put({ key: closeKey(day), value: merged, updatedAt: now, deleted: 0, deviceId });
    }
    // An older close dated today or later (a clock once set ahead) is given its bonus now and saved, once, so a later
    // fact that moves a level-up cannot fill it differently next time (Codex review of round 5, item 48).
    const ahead = new Map([...raw].filter(([day, value]) => day >= today && !!value && typeof value === 'object' && (value as { bonus?: unknown }).bonus === undefined));
    if (ahead.size) {
      const last = addEconomyDays([...ahead.keys()].sort().at(-1)!, 1);
      for (const [day, value] of fillHeldBonus(ahead, replayBonus(facts, rows, last))) if (value !== ahead.get(day)) await db.settings.put({ key: closeKey(day), value, updatedAt: now, deleted: 0, deviceId });
    }
  }));
}

/**
 * Saves the day and the XP and level about to be shown, before reconcile has run: a phone shut at once, then a
 * clock set back, still keeps a season award that day showed (Codex review of cj3 round 4, item 47). It reads first
 * and writes only when something rises, so calling it on every screen update costs one read.
 */
export async function recordShown(db: NandiDb, now = Date.now(), view?: { totalXp: number; level: number }): Promise<void> {
  if (restoreActive()) return;
  const today = dayKey(now);
  const rises = (rows: (SettingRow | undefined)[]) => {
    const [seenRow, peakRow] = rows;
    const seen = seenRow && !seenRow.deleted ? readSeenUpTo([seenRow]) : undefined;
    const peak = peakRow && !peakRow.deleted ? readPeak([peakRow]) : { totalXp: 0, level: 1 };
    return { seen: !seen || seen < today, peak: !!view && (view.totalXp > peak.totalXp || view.level > peak.level), old: peak };
  };
  if (!Object.values(rises(await db.settings.bulkGet([SEEN_KEY, PEAK_KEY]))).slice(0, 2).some(Boolean)) return;
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => asEconomyWrite(() => db.transaction('rw', db.settings, async () => {
    if (restoreActive()) return;
    // Compared again inside the lock: reconcile or another tab may have raised them meanwhile.
    const next = rises(await db.settings.bulkGet([SEEN_KEY, PEAK_KEY]));
    if (next.seen) await db.settings.put({ key: SEEN_KEY, value: today, updatedAt: now, deleted: 0, deviceId });
    if (next.peak && view) await db.settings.put({ key: PEAK_KEY, value: { totalXp: Math.max(view.totalXp, next.old.totalXp), level: Math.max(view.level, next.old.level) }, updatedAt: now, deleted: 0, deviceId });
  })));
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
