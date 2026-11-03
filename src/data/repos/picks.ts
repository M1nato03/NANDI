import type { NandiDb } from '../db';
import { getOrCreateDeviceId } from '../device';
import { trackWrite } from '../../core/pendingWrites';
import { PICKS_KEY, type Picks } from '../../core/welcome';

/** Spec 52: the person's picks, both keys in one write. Changes apply at once; nothing else is touched. */
export async function savePicks(db: NandiDb, picks: Picks, now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.settings, async () => {
    await db.settings.put({ key: PICKS_KEY.goals, value: picks.goals, updatedAt: now, deleted: 0, deviceId });
    await db.settings.put({ key: PICKS_KEY.size, value: picks.size, updatedAt: now, deleted: 0, deviceId });
  }));
}

/** A once-only offer's answer (the 10-day "add one more thing" and the pause card offer); it is never asked again. */
export async function answerOffer(db: NandiDb, key: string, value: string, now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key, value, updatedAt: now, deleted: 0, deviceId }));
}
