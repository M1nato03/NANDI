import type { NandiDb } from '../db';
import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time';
import { getOrCreateDeviceId } from '../device';
import { PAUSE_KEYS } from '../../core/pauseCard';

export type PauseOutcome = 'act_done' | 'backed_out' | 'opened_anyway';

/**
 * Spec 39: one ledger row per time the Pause card was answered (an attempt): the app's package, the time and the
 * outcome. Nothing else is kept, and it stays on the phone. A finished act (act_done) pays 2 XP, 10 a day, from
 * economy.v8From; the other outcomes pay nothing.
 */
export async function recordPauseAttempt(db: NandiDb, packageName: string, outcome: PauseOutcome, now: number): Promise<string> {
  const id = `pause-attempt:${now}`;
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.ledger, async () => {
    if (await db.ledger.get(id)) return;
    await db.ledger.add({ id, dayKey: dayKey(now), mode: 'pause', kind: 'attempt', refId: String(now), inputs: { packageName, outcome }, updatedAt: now, deleted: 0, deviceId });
  }));
  return id;
}

/** Saves the Pause card's settings in one go; `undefined` leaves a key as it is. */
export async function savePauseSettings(db: NandiDb, change: Partial<Record<keyof typeof PAUSE_KEYS | 'apps' | 'mode' | 'limitMin', unknown>>, now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  const keys: Record<string, string> = { ...PAUSE_KEYS, apps: 'night.pause.apps', mode: 'night.pause.dayMode', limitMin: 'night.pause.dayLimitMin' };
  await trackWrite(() => db.transaction('rw', db.settings, async () => {
    for (const [name, value] of Object.entries(change)) {
      if (value === undefined) continue;
      await db.settings.put({ key: keys[name]!, value, updatedAt: now, deleted: 0, deviceId });
    }
  }));
}
