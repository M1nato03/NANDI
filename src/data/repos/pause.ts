import type { NandiDb } from '../db';
import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time';
import { getOrCreateDeviceId } from '../device';
import { PAUSE_KEYS, readPauseCard } from '../../core/pauseCard';
import { dayBounds, daysToRead, keptDays, LEAD_MS, opensDay, OPENS_KEY, readOpensLog } from '../../core/pauseOpens';
import type { GuardEvent } from '../../core/focusGuard';
import { readUsageEvents } from '../../platform/nightPause';

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

type ReadUsage = (from: number, to: number) => Promise<GuardEvent[] | null>;
/**
 * Spec 39, the opens log: while the Pause card is on, reads from the phone's usage log every day not yet read in full
 * (the first time, the 7 days before too) and keeps each day's opens and minutes for the picked apps only. With no
 * usage log (the web, no Usage access) it writes nothing. Returns whether anything was read.
 */
export async function recordOpens(db: NandiDb, now: number, read: ReadUsage = readUsageEvents): Promise<boolean> {
  const settings = await db.settings.toArray();
  const today = dayKey(now);
  const card = readPauseCard(settings, today);
  if (!card.on) return false;
  const log = readOpensLog(settings);
  const packages = card.packages;
  const wanted = daysToRead(log, today);
  const attempts = await db.ledger.where('dayKey').anyOf(wanted).toArray();
  const days = { ...log?.days };
  for (const day of wanted) {
    const { fromMs, toMs } = dayBounds(day);
    const end = Math.min(toMs, now);
    if (end <= fromMs) continue;
    const events = await read(fromMs - LEAD_MS, end);
    if (!events) return false;
    days[day] = opensDay(events, day, fromMs - LEAD_MS, end, packages, attempts, now >= toMs);
  }
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key: OPENS_KEY, value: { since: log?.since ?? today, days: keptDays(days, today) }, updatedAt: now, deleted: 0, deviceId }));
  return true;
}
