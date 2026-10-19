import type { NandiDb } from '../db';
import { getOrCreateDeviceId } from '../device';
import { trackWrite } from '../../core/pendingWrites';
import { techniqueCard, techniqueId } from '../../core/puzzles/techniques';

/** Returns true only when this move creates a new card. */
export async function unlockTechnique(db: NandiDb, type: string, name: string, at = Date.now()): Promise<boolean> {
  if (!techniqueCard(type, name)) return false;
  const id = techniqueId(type, name);
  const deviceId = await getOrCreateDeviceId(db, at);
  return trackWrite(() => db.transaction('rw', db.unlocks, async () => {
    if (await db.unlocks.get(id)) return false;
    await db.unlocks.add({ id, kind: 'technique', refId: `${type}:${name}`, at, updatedAt: at, deleted: 0, deviceId });
    return true;
  }));
}
