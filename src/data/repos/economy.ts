import { dayKey } from '../../core/time';
import { trackWrite } from '../../core/pendingWrites';
import { purchaseDecision } from '../../core/economy/shop';
import { getOrCreateDeviceId } from '../device';
import type { NandiDb } from '../db';

/** A purchase is one immutable fact. The balance and owned items are projections. */
export async function purchaseShopItem(db: NandiDb, itemId: string, now = Date.now()): Promise<{ ok: boolean; reason?: string }> {
  const deviceId = await getOrCreateDeviceId(db, now), day = dayKey(now);
  return trackWrite(() => db.transaction('rw', [db.ledger, db.settings], async () => {
    const facts = await db.ledger.toArray(), settings = await db.settings.toArray();
    const result = purchaseDecision(itemId, facts, settings, day);
    if (!result.ok || !result.item) return { ok: false, reason: result.reason };
    const refId = `${itemId}:${now}`, id = `purchase:${refId}`;
    await db.ledger.add({ id, mode: 'economy', kind: 'purchase', refId, dayKey: day,
      inputs: { itemId, price: result.item.price }, updatedAt: now, deleted: 0, deviceId });
    if (result.item.kind === 'theme' || result.item.kind === 'banner' || result.item.kind === 'cardBack' || result.item.kind === 'soundPack') {
      const key = `economy.${result.item.kind}`;
      await db.settings.put({ key, value: itemId, updatedAt: now, deleted: 0, deviceId });
    }
    return { ok: true };
  }));
}

export async function recordMorningBackfill(db: NandiDb, previousDay: string, time: string, now = Date.now()): Promise<void> {
  if (!/^\d{2}:(00|15|30|45)$/.test(time)) throw new Error('Choose a 15-minute time.');
  const [hour, minute] = time.split(':').map(Number);
  if (hour == null || minute == null || hour > 23) throw new Error('Choose a time.');
  const date = new Date(`${previousDay}T00:00:00`);
  date.setHours(hour, minute, 0, 0);
  if (hour < 4) date.setDate(date.getDate() + 1);
  const at = date.getTime(), deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', [db.dailyLog, db.ledger], async () => {
    const prior = await db.dailyLog.get(previousDay);
    if (prior?.lightsOutAt != null) return;
    await db.dailyLog.put({ ...prior, dayKey: previousDay, lightsOutAt: at, updatedAt: now, deleted: 0, deviceId });
    const id = `lightsout:${previousDay}`;
    if (!(await db.ledger.get(id))) await db.ledger.add({ id, dayKey: previousDay, mode: 'bonuses', kind: 'lightsout', refId: previousDay,
      inputs: { lightsOutAt: at, backfill: true, metTarget: false }, updatedAt: now, deleted: 0, deviceId });
  }));
}
