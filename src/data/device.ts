import { ulid } from 'ulidx';
import type { NandiDb } from './db';

/** Creates the local identity once, using the same id as this setting's deviceId. */
export function getOrCreateDeviceId(db: NandiDb, now: number): Promise<string> {
  return db.transaction('rw', db.settings, async () => {
    const existing = await db.settings.get('deviceId');
    if (typeof existing?.value === 'string') return existing.value;
    const deviceId = ulid(now);
    await db.settings.put({ key: 'deviceId', value: deviceId, updatedAt: now, deleted: 0, deviceId });
    return deviceId;
  });
}
