import { addOpen, OWNER_OPENS_KEY, OWNER_PIN_KEY, readOpens } from '../../core/owner/metrics';
import { dayKey } from '../../core/time';
import { getOrCreateDeviceId } from '../device';
import type { NandiDb } from '../db';

/** Counts one app open for today in a single settings row (kept 60 days; restores with backups). */
export async function recordOwnerOpen(db: NandiDb, now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await db.transaction('rw', db.settings, async () => {
    const row = await db.settings.get(OWNER_OPENS_KEY);
    const rows = row ? [row] : [];
    await db.settings.put({ key: OWNER_OPENS_KEY, value: addOpen(readOpens(rows), dayKey(now)), updatedAt: now, deleted: 0, deviceId });
  });
}

export async function readPinHash(db: NandiDb): Promise<string | null> {
  const row = await db.settings.get(OWNER_PIN_KEY);
  return row && !row.deleted && typeof row.value === 'string' ? row.value : null;
}

export async function savePinHash(db: NandiDb, hash: string, now: number): Promise<void> {
  await db.settings.put({ key: OWNER_PIN_KEY, value: hash, updatedAt: now, deleted: 0, deviceId: await getOrCreateDeviceId(db, now) });
}
