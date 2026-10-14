import { ulid } from 'ulidx';
import { meditationElapsedMs, parseMeditation, type MeditationSession } from '../../core/mind/meditation';
import { trackWrite } from '../../core/pendingWrites';
import { RULES } from '../../core/rules.config';
import { dayKey } from '../../core/time/dayKey';
import { createTimer, pauseTimer, resumeTimer } from '../../core/time/timer';
import { db, type NandiDb } from '../db';
import { getOrCreateDeviceId } from '../device';

export const MEDITATION_KEY = 'mind.meditation.active';
export const MEDITATION_HISTORY = 'mind.meditation.session:';

export async function isMeditationActive(): Promise<boolean> {
  const row = await db.settings.get(MEDITATION_KEY);
  const session = row && !row.deleted ? parseMeditation(row.value) : null;
  return !!session && session.endedAt === undefined;
}

/** A single local timer; completion and clearing the active timer commit together. */
export async function changeMeditation(store: NandiDb, action: 'start' | 'pause' | 'resume' | 'finish' | 'complete', now: number, durationMin: number = RULES.meditation.defaultDurationMin): Promise<MeditationSession | null> {
  const deviceId = await getOrCreateDeviceId(store, now);
  return trackWrite(() => store.transaction('rw', store.settings, async () => {
    const row = await store.settings.get(MEDITATION_KEY);
    let session = row && !row.deleted ? parseMeditation(row.value) : null;
    if (session?.endedAt !== undefined) session = null;
    if (action === 'start') {
      if (session) return session;
      if (!(RULES.meditation.durationPresetsMin as readonly number[]).includes(durationMin)) throw new RangeError('Choose a meditation duration');
      session = { ...createTimer(now, durationMin * 60_000), id: ulid(now), dayKey: dayKey(now) };
    } else if (!session) return null;
    else if (action === 'finish' || action === 'complete') {
      // A rendered timer may predate a just-saved pause. Only the persisted deadline can finish automatically.
      if (action === 'complete' && meditationElapsedMs(session, now) < session.durationMs) return session;
      const finished = { ...session, endedAt: now };
      await store.settings.put({ key: `${MEDITATION_HISTORY}${session.id}`, value: finished, updatedAt: now, deleted: 0, deviceId });
      await store.settings.put({ key: MEDITATION_KEY, value: null, updatedAt: now, deleted: 0, deviceId });
      return finished;
    } else {
      const paused = session.pauses.at(-1)?.resumeAt === undefined && session.pauses.length > 0;
      if (action === 'pause' && !paused) session = { ...session, ...pauseTimer(session, now) };
      if (action === 'resume' && paused) session = { ...session, ...resumeTimer(session, now) };
    }
    await store.settings.put({ key: MEDITATION_KEY, value: session, updatedAt: now, deleted: 0, deviceId });
    return session;
  }));
}
