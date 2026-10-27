import type { NandiDb } from '../db';
import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time';
import { getOrCreateDeviceId } from '../device';

/** Spec 34 Calm: the breath pattern (seconds in, seconds out) and whether the bell rings at the end. */
export type Breath = { in: number; out: number };
export const DEFAULT_BREATH: Breath = { in: 4, out: 6 };
export const BREATH_IN = [3, 6] as const;
export const BREATH_OUT = [4, 8] as const;
export const CALM_MINUTES = [1, 3, 5] as const;
const BREATH_KEY = 'calm.breath';
const BELL_KEY = 'calm.bell';

const clamp = (value: unknown, [low, high]: readonly [number, number], fallback: number) => typeof value === 'number' && Number.isInteger(value) ? Math.min(high, Math.max(low, value)) : fallback;
/** A stored pattern, kept inside its bounds; anything unreadable falls back to 4 in, 6 out. */
export function readBreath(value: unknown): Breath {
  const row = value && typeof value === 'object' ? value as Partial<Breath> : {};
  return { in: clamp(row.in, BREATH_IN, DEFAULT_BREATH.in), out: clamp(row.out, BREATH_OUT, DEFAULT_BREATH.out) };
}

export async function saveCalmSettings(db: NandiDb, change: { breath?: Breath; bell?: boolean }, now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.settings, async () => {
    if (change.breath) await db.settings.put({ key: BREATH_KEY, value: readBreath(change.breath), updatedAt: now, deleted: 0, deviceId });
    if (change.bell !== undefined) await db.settings.put({ key: BELL_KEY, value: change.bell, updatedAt: now, deleted: 0, deviceId });
  }));
}

/**
 * A finished Calm session: one ledger row (mode 'calm'). It pays no XP and counts toward no quest, mark or courtyard
 * area, so the economy is unchanged; Yatra reads it as a stretch and a pale gold star.
 */
export async function saveCalmDone(db: NandiDb, session: { minutes: number; breath: Breath; startedAt: number }, now: number): Promise<string> {
  const id = `calm:${session.startedAt}`;
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.ledger, async () => {
    if (await db.ledger.get(id)) return;
    await db.ledger.add({ id, dayKey: dayKey(now), mode: 'calm', kind: 'session', refId: String(session.startedAt), inputs: { minutes: session.minutes, in: session.breath.in, out: session.breath.out }, updatedAt: now, deleted: 0, deviceId });
  }));
  return id;
}

export const calmKeys = { breath: BREATH_KEY, bell: BELL_KEY };
