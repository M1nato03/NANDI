import type { NandiDb } from '../db';
import { trackWrite } from '../../core/pendingWrites';
import { dayKey, isAfterBedtime } from '../../core/time';
import { effectiveBedtime } from './night';
import { NO_REPEAT_NIGHTS, build, layoutHash, selectClockKolam, type ClockKolam } from '../../core/kolam/clock';
import { isFullMoonNight } from '../../core/kolam/moon';
import { getOrCreateDeviceId } from '../device';

const TONIGHT = 'night.kolamTonight';
const RECENT = 'night.kolamRecent';
type Stored = { nightDate: string; seed: number; family: ClockKolam['family']; size: ClockKolam['size']; lineColor: ClockKolam['lineColor']; grew?: boolean };

/**
 * Spec 26 B2: tonight's kolam. The first open of a night picks it (size by the clock then, never changed later that
 * night) and adds its layout to the phone's last 30, so a 3 by 3 layout does not come back within 30 nights.
 */
export async function tonightKolam(db: NandiDb, now: number): Promise<ClockKolam> {
  const [tonight, recent] = await Promise.all([db.settings.get(TONIGHT), db.settings.get(RECENT)]);
  const stored = tonight && !tonight.deleted ? tonight.value as Stored : undefined;
  const existing = stored ? { ...stored, grew: !!stored.grew, kolam: build(stored.size, stored.seed, stored.family) } : undefined;
  const hashes = Array.isArray(recent?.value) ? (recent!.value as string[]).filter(value => typeof value === 'string') : [];
  const chosen = selectClockKolam(new Date(now), { fullMoon: isFullMoonNight, recent: hashes }, existing);
  if (chosen === existing) return chosen;
  const deviceId = await getOrCreateDeviceId(db, now);
  const { kolam, ...row } = chosen;
  await trackWrite(() => db.transaction('rw', db.settings, async () => {
    await db.settings.put({ key: TONIGHT, value: row, updatedAt: now, deleted: 0, deviceId });
    await db.settings.put({ key: RECENT, value: [...hashes, layoutHash(kolam)].slice(-NO_REPEAT_NIGHTS), updatedAt: now, deleted: 0, deviceId });
  }));
  return chosen;
}

/**
 * The finished line: one completion row a night (for Kachhua's corner of the courtyard). It pays no XP. Whether it
 * came after bedtime is decided here, at completion, from tonight's effective bedtime (busy-day shift included). The
 * first finish of a night is the stored row; the return value is THIS completion's answer, for its end screen.
 */
export async function saveKolamDone(db: NandiDb, kolam: ClockKolam, now: number): Promise<boolean> {
  const id = `kolam:${kolam.nightDate}`;
  const afterBedtime = isAfterBedtime(now, await effectiveBedtime(db, now));
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.ledger, async () => {
    if (await db.ledger.get(id)) return;
    await db.ledger.add({ id, dayKey: dayKey(now), mode: 'night', kind: 'kolam', refId: kolam.nightDate, inputs: { size: kolam.size, family: kolam.family, lineColor: kolam.lineColor, afterBedtime }, updatedAt: now, deleted: 0, deviceId });
  }));
  return afterBedtime;
}
