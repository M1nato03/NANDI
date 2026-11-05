import type { NandiDb } from '../db';
import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time';
import { getOrCreateDeviceId } from '../device';
import { JAR_FROM_KEY } from '../../core/yatra/jar';

/** Spec 34: the only Yatra settings. The trek itself is derived from the ledger every time. */
export const YATRA_START = 'yatra.startDay';
export const CONSTELLATION_PREFIX = 'yatra.constellation.';

/** The trek starts at the first place on the first day Yatra is opened (item 191 c); nothing earlier is backfilled. */
export async function ensureYatraStart(db: NandiDb, now: number): Promise<string> {
  const existing = await db.settings.get(YATRA_START);
  if (existing && !existing.deleted && typeof existing.value === 'string') return existing.value;
  const day = dayKey(now), deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.settings, async () => {
    const again = await db.settings.get(YATRA_START);
    if (!again || again.deleted) await db.settings.put({ key: YATRA_START, value: day, updatedAt: now, deleted: 0, deviceId });
  }));
  return ((await db.settings.get(YATRA_START))?.value as string | undefined) ?? day;
}

/**
 * Spec 54: the first planning day walked in jar minutes, written once on the first run with the jar. It is backed up
 * like every Yatra setting, so a restore keeps the same walk; a backup from before the jar has none, and the first run
 * after its restore writes that day, so nothing leaps. A later run never moves it.
 */
export async function ensureJarFrom(db: NandiDb, now: number): Promise<string> {
  const existing = await db.settings.get(JAR_FROM_KEY);
  if (existing && !existing.deleted && typeof existing.value === 'string') return existing.value;
  const day = dayKey(now), deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.settings, async () => {
    const again = await db.settings.get(JAR_FROM_KEY);
    if (!again || again.deleted || typeof again.value !== 'string') await db.settings.put({ key: JAR_FROM_KEY, value: day, updatedAt: now, deleted: 0, deviceId });
  }));
  return ((await db.settings.get(JAR_FROM_KEY))?.value as string | undefined) ?? day;
}

/** A constellation's own name; an empty name goes back to the suggested one. */
export async function saveConstellationName(db: NandiDb, id: string, name: string, now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  const value = name.trim().slice(0, 40);
  await trackWrite(() => db.settings.put({ key: `${CONSTELLATION_PREFIX}${id}`, value, updatedAt: now, deleted: value ? 0 : 1, deviceId }));
}

/** Spec 54: one open plan in v1, a line the person writes for a camp ahead; editing or deleting it never loses anything. */
export const JAR_PLAN_KEY = 'yatra.plan';
export const PLAN_MAX = 60;
export interface JarPlan { line: string; camp: number; setAt: number; needMinutes: number }

export function readJarPlan(value: unknown): JarPlan | null {
  if (!value || typeof value !== 'object') return null;
  const plan = value as Partial<JarPlan>;
  return typeof plan.line === 'string' && plan.line.trim() && typeof plan.camp === 'number' && typeof plan.setAt === 'number' && typeof plan.needMinutes === 'number'
    ? { line: plan.line, camp: plan.camp, setAt: plan.setAt, needMinutes: plan.needMinutes } : null;
}

export async function saveJarPlan(db: NandiDb, plan: JarPlan, now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  const value: JarPlan = { ...plan, line: plan.line.trim().slice(0, PLAN_MAX) };
  await trackWrite(() => db.settings.put({ key: JAR_PLAN_KEY, value, updatedAt: now, deleted: 0, deviceId }));
}

export async function clearJarPlan(db: NandiDb, now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key: JAR_PLAN_KEY, value: null, updatedAt: now, deleted: 1, deviceId }));
}
