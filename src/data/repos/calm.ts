import type { NandiDb } from '../db';
import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time';
import { getOrCreateDeviceId } from '../device';
import { CALM_MINUTES, CALM_INTERVALS, CALM_WAYS, TANPURA_PITCHES, sitMinutes, type CalmLength, type CalmWay } from '../../core/calm/session';

export { CALM_MINUTES };

/** Spec 34 Calm: the breath pattern (seconds in, seconds out). */
export type Breath = { in: number; out: number };
export const DEFAULT_BREATH: Breath = { in: 4, out: 6 };
export const BREATH_IN = [3, 6] as const;
export const BREATH_OUT = [4, 8] as const;
const BREATH_KEY = 'calm.breath';
const PREFS_KEY = 'calm.prefs';

const clamp = (value: unknown, [low, high]: readonly [number, number], fallback: number) => typeof value === 'number' && Number.isInteger(value) ? Math.min(high, Math.max(low, value)) : fallback;
/** A stored pattern, kept inside its bounds; anything unreadable falls back to 4 in, 6 out. */
export function readBreath(value: unknown): Breath {
  const row = value && typeof value === 'object' ? value as Partial<Breath> : {};
  return { in: clamp(row.in, BREATH_IN, DEFAULT_BREATH.in), out: clamp(row.out, BREATH_OUT, DEFAULT_BREATH.out) };
}

/**
 * Spec 35: everything else Calm remembers. `sound` is 'none', a preset id or 'user:<id>' (a sound kept on this phone);
 * a user sound that is not on this phone plays as silence.
 */
export type CalmPrefs = {
  minutes: CalmLength; way: CalmWay; startBell: boolean; interval: (typeof CALM_INTERVALS)[number];
  sound: string; soundVolume: number; bellVolume: number; pitch: number; fade: boolean;
};
export const DEFAULT_CALM_PREFS: CalmPrefs = { minutes: 3, way: 'paced', startBell: true, interval: 0, sound: 'none', soundVolume: 60, bellVolume: 70, pitch: 1, fade: true };

/** Stored prefs, each kept inside its bounds; anything unreadable falls back to its default. */
export function readCalmPrefs(value: unknown): CalmPrefs {
  const row = value && typeof value === 'object' ? value as Partial<Record<keyof CalmPrefs, unknown>> : {};
  const d = DEFAULT_CALM_PREFS;
  const minutes = row.minutes === 'open' ? 'open' : clamp(row.minutes, CALM_MINUTES.custom, 3);
  return {
    minutes,
    way: CALM_WAYS.includes(row.way as CalmWay) ? row.way as CalmWay : d.way,
    startBell: typeof row.startBell === 'boolean' ? row.startBell : d.startBell,
    interval: CALM_INTERVALS.includes(row.interval as CalmPrefs['interval']) ? row.interval as CalmPrefs['interval'] : d.interval,
    sound: typeof row.sound === 'string' && row.sound.length <= 80 ? row.sound : d.sound,
    soundVolume: clamp(row.soundVolume, [0, 100], d.soundVolume),
    bellVolume: clamp(row.bellVolume, [0, 100], d.bellVolume),
    pitch: clamp(row.pitch, [0, TANPURA_PITCHES.length - 1], d.pitch),
    fade: typeof row.fade === 'boolean' ? row.fade : d.fade,
  };
}

export async function saveCalmSettings(db: NandiDb, change: { breath?: Breath; prefs?: Partial<CalmPrefs> }, now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.settings, async () => {
    if (change.breath) await db.settings.put({ key: BREATH_KEY, value: readBreath(change.breath), updatedAt: now, deleted: 0, deviceId });
    if (change.prefs) {
      const current = await db.settings.get(PREFS_KEY);
      const value = readCalmPrefs({ ...readCalmPrefs(current && !current.deleted ? current.value : undefined), ...change.prefs });
      await db.settings.put({ key: PREFS_KEY, value, updatedAt: now, deleted: 0, deviceId });
    }
  }));
}

/**
 * A Calm session that lasted at least a minute, finished or stopped: one ledger row (mode 'calm') with the whole
 * minutes sat and the way. It pays no XP and counts toward no quest, mark or courtyard area, so the economy is
 * unchanged; Yatra reads it as one stretch and one pale gold star whatever its length (spec 35: length never earns
 * more). Under a minute nothing is saved.
 */
export async function saveCalmDone(db: NandiDb, session: { elapsedMs: number; way: CalmWay; breath: Breath; startedAt: number }, now: number): Promise<string | null> {
  const minutes = sitMinutes(session.elapsedMs);
  if (minutes < 1) return null;
  const id = `calm:${session.startedAt}`;
  const deviceId = await getOrCreateDeviceId(db, now);
  const inputs = session.way === 'paced' ? { minutes, way: session.way, in: session.breath.in, out: session.breath.out } : { minutes, way: session.way };
  await trackWrite(() => db.transaction('rw', db.ledger, async () => {
    if (await db.ledger.get(id)) return;
    await db.ledger.add({ id, dayKey: dayKey(now), mode: 'calm', kind: 'session', refId: String(session.startedAt), inputs, updatedAt: now, deleted: 0, deviceId });
  }));
  return id;
}

export const calmKeys = { breath: BREATH_KEY, prefs: PREFS_KEY };
