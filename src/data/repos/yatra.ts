import type { NandiDb } from '../db';
import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time';
import { getOrCreateDeviceId } from '../device';

/** Spec 34: the only Yatra settings. The trek itself is derived from the ledger every time. */
export const YATRA_START = 'yatra.startDay';
export const CONSTELLATION_PREFIX = 'yatra.constellation.';

/** The trek starts at the first place on the first day Yatra is opened (item 191 c); nothing earlier is backfilled. */
export async function ensureYatraStart(db: NandiDb, now: number): Promise<string> {
  const existing = await db.settings.get(YATRA_START);
  if (existing && !existing.deleted && typeof existing.value === 'string') return existing.value;
  const day = dayKey(now), deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.settings, async () => {
    const again = await db.settings.get(YATRA_START);
    if (!again || again.deleted) await db.settings.put({ key: YATRA_START, value: day, updatedAt: now, deleted: 0, deviceId });
  }));
  return ((await db.settings.get(YATRA_START))?.value as string | undefined) ?? day;
}

/** A constellation's own name; an empty name goes back to the suggested one. */
export async function saveConstellationName(db: NandiDb, id: string, name: string, now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  const value = name.trim().slice(0, 40);
  await trackWrite(() => db.settings.put({ key: `${CONSTELLATION_PREFIX}${id}`, value, updatedAt: now, deleted: value ? 0 : 1, deviceId }));
}
