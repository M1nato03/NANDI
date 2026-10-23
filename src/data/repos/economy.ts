import { dayKey } from '../../core/time';
import { trackWrite } from '../../core/pendingWrites';
import { purchaseDecision } from '../../core/economy/shop';
import { addEconomyDays, chargeClose, CLOSE_PREFIX, readSeenUpTo, weekStart } from '../../core/economy/deriveEconomy';
import { getOrCreateDeviceId } from '../device';
import { asEconomyWrite, restoreActive } from '../restoreLock';
import type { NandiDb } from '../db';
import type { SettingRow } from '../types';

/** A purchase is one immutable fact. The balance and owned items are projections. */
export async function purchaseShopItem(db: NandiDb, itemId: string, now = Date.now()): Promise<{ ok: boolean; reason?: string }> {
  const deviceId = await getOrCreateDeviceId(db, now), day = dayKey(now);
  if (restoreActive()) return { ok: false, reason: 'A restore is running. Try again in a moment.' };
  return asEconomyWrite(() => trackWrite(() => db.transaction('rw', [db.ledger, db.settings], async () => {
    const facts = await db.ledger.toArray(), settings = await db.settings.toArray();
    const result = purchaseDecision(itemId, facts, settings, day);
    if (!result.ok || !result.item) return { ok: false, reason: result.reason };
    const refId = `${itemId}:${now}`, id = `purchase:${refId}`;
    await db.ledger.add({ id, mode: 'economy', kind: 'purchase', refId, dayKey: day,
      inputs: { itemId, price: result.item.price, accepted: true }, updatedAt: now, deleted: 0, deviceId });
    // Closes already stored for this day or later (a clock set back) were written before this purchase: charge it to them.
    const purchase = { id, itemId, price: result.item.price, dayKey: day };
    for (const row of settings) {
      if (row.deleted || !row.key.startsWith(CLOSE_PREFIX) || row.key.slice(CLOSE_PREFIX.length) < day) continue;
      const charged = chargeClose(row.value, purchase);
      if (charged) await db.settings.put({ ...row, value: charged, updatedAt: now, deviceId });
    }
    if (result.item.kind === 'theme' || result.item.kind === 'banner' || result.item.kind === 'cardBack' || result.item.kind === 'soundPack') {
      const key = `economy.${result.item.kind}`;
      await db.settings.put({ key, value: itemId, updatedAt: now, deleted: 0, deviceId });
    }
    return { ok: true };
  })));
}

export async function recordMorningBackfill(db: NandiDb, previousDay: string, time: string | undefined, bucket: string, now = Date.now()): Promise<void> {
  if (!['none', 'under-15', '15-60', 'over-60'].includes(bucket)) throw new Error('Choose a Reels time range.');
  if (time !== undefined && !/^\d{2}:(00|15|30|45)$/.test(time)) throw new Error('Choose a 15-minute time.');
  const [hour, minute] = time?.split(':').map(Number) ?? [];
  if (time !== undefined && (hour == null || minute == null || hour > 23 || hour >= 4 && hour < 21)) throw new Error('Choose a night time.');
  const date = new Date(`${previousDay}T00:00:00`);
  if (hour != null && minute != null) { date.setHours(hour, minute, 0, 0); if (hour < 4) date.setDate(date.getDate() + 1); }
  const at = time === undefined ? undefined : date.getTime(), deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', [db.dailyLog, db.ledger], async () => {
    const prior = await db.dailyLog.get(previousDay);
    if (prior?.lightsOutAt == null && at == null) throw new Error('Choose a phone-down time.');
    await db.dailyLog.put({ ...prior, dayKey: previousDay, lightsOutAt: prior?.lightsOutAt ?? at, reelsBucket: prior?.reelsBucket || bucket, updatedAt: now, deleted: 0, deviceId });
    if (prior?.lightsOutAt == null && at != null) {
      const id = `lightsout:${previousDay}`;
      if (!(await db.ledger.get(id))) await db.ledger.add({ id, dayKey: previousDay, mode: 'bonuses', kind: 'lightsout', refId: previousDay,
        inputs: { lightsOutAt: at, backfill: true, metTarget: false }, updatedAt: now, deleted: 0, deviceId });
    }
  }));
}

const REST_KEY = 'economy.restWeekday';
const restWeekKey = (week: string) => `${REST_KEY}:${week}`;
type RestPick = { weekday: number; from?: string };
function readPick(value: unknown): RestPick | undefined {
  if (typeof value === 'number') return { weekday: value };
  const pick = value && typeof value === 'object' ? value as { weekday?: unknown; from?: unknown } : undefined;
  return pick && typeof pick.weekday === 'number' ? { weekday: pick.weekday, from: typeof pick.from === 'string' ? pick.from : undefined } : undefined;
}
/** The latest weekly rest-day pick and the week it starts from (it may be next week). */
export function readRestPick(settings: readonly SettingRow[]): RestPick | undefined {
  return readPick(settings.find(row => row.key === REST_KEY && !row.deleted)?.value);
}
/** The weekly rest day the streak uses for `week`: the same reading as the replay (its own row, else the pick from its week on). */
export function readRestWeekday(settings: readonly SettingRow[], week: string): number | undefined {
  const own = settings.find(row => row.key === restWeekKey(week) && !row.deleted)?.value;
  if (typeof own === 'number') return own;
  const pick = readRestPick(settings);
  return pick && (pick.from === undefined || week >= pick.from) ? pick.weekday : undefined;
}
/**
 * One weekly rest day for the streak and for Train (spec 03 §1.3; batch 5, item 51). A new pick counts from NEXT
 * week: every week up to this one (or the furthest week this phone has shown, after a clock set ahead) first keeps
 * the rest day it had in a row of its own, so a change never moves a past week or today (Codex review, item 53).
 */
export async function setRestWeekday(db: NandiDb, weekday: number, now = Date.now()): Promise<void> {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) throw new Error('Choose a day of the week.');
  const deviceId = await getOrCreateDeviceId(db, now), thisWeek = weekStart(dayKey(now));
  await trackWrite(() => db.transaction('rw', [db.settings, db.programs, db.ledger], async () => {
    const put = (key: string, value: unknown) => db.settings.put({ key, value, updatedAt: now, deleted: 0, deviceId });
    const settings = (await db.settings.toArray()).filter(row => !row.deleted);
    const seen = readSeenUpTo(settings);
    const lastShown = seen && weekStart(seen) > thisWeek ? weekStart(seen) : thisWeek;
    const old = readRestPick(settings);
    if (old) {
      // An old pick with no start covered every week: freeze it back to the first day with any activity.
      const first = old.from ?? (await db.ledger.orderBy('dayKey').first())?.dayKey;
      if (typeof first === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(first)) for (let week = weekStart(first); week <= lastShown; week = addEconomyDays(week, 7)) {
        const had = readRestWeekday(settings, week);
        if (typeof settings.find(row => row.key === restWeekKey(week))?.value !== 'number' && had !== undefined) await put(restWeekKey(week), had);
      }
    }
    await put(REST_KEY, { weekday, from: addEconomyDays(lastShown, 7) });
    const program = await db.programs.get('train-program');
    if (program && !program.deleted && program.restDay !== weekday) await db.programs.put({ ...program, restDay: weekday, updatedAt: now, deviceId });
  }));
}
/**
 * Brings the two older rest-day picks together once (batch 5, item 51): a streak pick wins and Train shows it;
 * a Train-only pick starts covering the streak from next week, never this one or a past one.
 */
export async function syncRestWeekday(db: NandiDb, now = Date.now()): Promise<void> {
  if (restoreActive()) return;
  const [standing, program] = await Promise.all([db.settings.get(REST_KEY), db.programs.get('train-program')]);
  if (!program || program.deleted) return;
  if (!standing || standing.deleted) { if (typeof program.restDay === 'number') await setRestWeekday(db, program.restDay, now); return; }
  const weekday = readPick(standing.value)?.weekday;
  if (typeof weekday === 'number' && program.restDay !== weekday) {
    const deviceId = await getOrCreateDeviceId(db, now);
    await trackWrite(() => db.transaction('rw', db.programs, async () => {
      const row = await db.programs.get('train-program');
      if (row && !row.deleted && row.restDay !== weekday) await db.programs.put({ ...row, restDay: weekday, updatedAt: now, deviceId });
    }));
  }
}
