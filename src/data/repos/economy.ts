import { dayKey } from '../../core/time';
import { trackWrite } from '../../core/pendingWrites';
import { purchaseDecision } from '../../core/economy/shop';
import { addEconomyDays, chargeClose, CLOSE_PREFIX, weekStart } from '../../core/economy/deriveEconomy';
import { getOrCreateDeviceId } from '../device';
import { asEconomyWrite, restoreActive } from '../restoreLock';
import type { NandiDb } from '../db';
import type { ProgramRow, SettingRow } from '../types';

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
/** The standing weekly rest day: the economy's pick, else (an older Train-only pick) the Train program's. */
export function readRestWeekday(settings: readonly SettingRow[], week: string, program?: ProgramRow): number | undefined {
  const value = (key: string) => settings.find(row => row.key === key && !row.deleted)?.value;
  const own = value(restWeekKey(week));
  if (typeof own === 'number') return own;
  const standing = value(REST_KEY);
  if (typeof standing === 'number') return standing;
  if (standing && typeof standing === 'object' && typeof (standing as { weekday?: unknown }).weekday === 'number') return (standing as { weekday: number }).weekday;
  return program && !program.deleted && typeof program.restDay === 'number' ? program.restDay : undefined;
}
/**
 * One weekly rest day for the streak and for Train (spec 03 §1.3; batch 5, item 51). It counts from this week on.
 * Every past week the old pick covered first gets its own row, so a new pick never moves a past week's rest day.
 */
export async function setRestWeekday(db: NandiDb, weekday: number, now = Date.now()): Promise<void> {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) throw new Error('Choose a day of the week.');
  const deviceId = await getOrCreateDeviceId(db, now), thisWeek = weekStart(dayKey(now));
  await trackWrite(() => db.transaction('rw', [db.settings, db.programs, db.ledger], async () => {
    const put = (key: string, value: unknown) => db.settings.put({ key, value, updatedAt: now, deleted: 0, deviceId });
    const live = async (key: string) => { const row = await db.settings.get(key); return row && !row.deleted ? row.value : undefined; };
    const standing = await live(REST_KEY);
    const old = typeof standing === 'number' ? { weekday: standing, from: undefined as string | undefined }
      : standing && typeof standing === 'object' && typeof (standing as { weekday?: unknown }).weekday === 'number' ? standing as { weekday: number; from?: string } : undefined;
    if (old) {
      // An old number covered every week: freeze it back to the first day with any activity.
      const first = old.from ?? (await db.ledger.orderBy('dayKey').first())?.dayKey;
      if (typeof first === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(first)) for (let week = weekStart(first); week < thisWeek; week = addEconomyDays(week, 7)) {
        if (typeof await live(restWeekKey(week)) !== 'number') await put(restWeekKey(week), old.weekday);
      }
    }
    await put(restWeekKey(thisWeek), weekday);
    await put(REST_KEY, { weekday, from: thisWeek });
    const program = await db.programs.get('train-program');
    if (program && !program.deleted && program.restDay !== weekday) await db.programs.put({ ...program, restDay: weekday, updatedAt: now, deviceId });
  }));
}
/**
 * Brings the two older rest-day picks together once (batch 5, item 51): a streak pick wins and Train shows it;
 * a Train-only pick starts covering the streak from this week, never a past one.
 */
export async function syncRestWeekday(db: NandiDb, now = Date.now()): Promise<void> {
  if (restoreActive()) return;
  const [standing, program] = await Promise.all([db.settings.get(REST_KEY), db.programs.get('train-program')]);
  if (!program || program.deleted) return;
  if (!standing || standing.deleted) { if (typeof program.restDay === 'number') await setRestWeekday(db, program.restDay, now); return; }
  const weekday = readRestWeekday(await db.settings.toArray(), weekStart(dayKey(now)));
  if (typeof weekday === 'number' && program.restDay !== weekday) {
    const deviceId = await getOrCreateDeviceId(db, now);
    await trackWrite(() => db.transaction('rw', db.programs, async () => {
      const row = await db.programs.get('train-program');
      if (row && !row.deleted && row.restDay !== weekday) await db.programs.put({ ...row, restDay: weekday, updatedAt: now, deviceId });
    }));
  }
}
