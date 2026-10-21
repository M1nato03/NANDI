import { trackWrite } from '../../core/pendingWrites';
import { timerRunning, validAgencyScore } from '../../core/guard';
import { dayKey } from '../../core/time';
import { getOrCreateDeviceId } from '../device';
import type { NandiDb } from '../db';

/** Adds whole foreground minutes to a day's log (HANDOVER guard metric: workout and focus timers excluded by the caller). */
export async function addAppMinutes(db: NandiDb, day: string, minutes: number, now: number): Promise<void> {
  if (!Number.isInteger(minutes) || minutes <= 0) return;
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.dailyLog, async () => {
    const prior = await db.dailyLog.get(day);
    await db.dailyLog.put({ ...prior, dayKey: day, appMinutes: (prior?.appMinutes ?? 0) + minutes, updatedAt: now, deleted: 0, deviceId });
  }));
}

export async function anyTimerRunning(db: NandiDb, now: number): Promise<boolean> {
  const [focus, sessions] = await Promise.all([db.focus.filter(row => row.endedAt == null).toArray(), db.sessions.where('status').equals('active').toArray()]);
  return timerRunning(focus, sessions, now);
}

/** The weekly agency check (HANDOVER §4): "well spent?" 1–5 and "opened it instead of something else?" yes/no, on today's log. */
export async function recordAgency(db: NandiDb, now: number, answer: { score?: number; openedInstead?: boolean }): Promise<void> {
  if (answer.score !== undefined && !validAgencyScore(answer.score)) throw new Error('Agency score must be 1 to 5');
  const deviceId = await getOrCreateDeviceId(db, now);
  const day = dayKey(now);
  await trackWrite(() => db.transaction('rw', db.dailyLog, async () => {
    const prior = await db.dailyLog.get(day);
    await db.dailyLog.put({
      ...prior, dayKey: day,
      ...(answer.score !== undefined ? { agency1to5: answer.score } : {}),
      ...(answer.openedInstead !== undefined ? { agencyOpenedInstead: answer.openedInstead } : {}),
      updatedAt: now, deleted: 0, deviceId,
    });
  }));
}
