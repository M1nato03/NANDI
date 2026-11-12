import type { NandiDb } from '../db';
import { TRAIL_SWITCH_PREFIX } from '../../core/yatra/journey';
import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time';
import { getOrCreateDeviceId } from '../device';
import { FOCUS_RATE_FROM_KEY, JAR_FROM_KEY } from '../../core/yatra/jar';

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
export const ensureJarFrom = (db: NandiDb, now: number): Promise<string> => ensureDayOnce(db, JAR_FROM_KEY, now);

/** Spec 571 E1: the first planning day with focus at 1 jar min per 3, written once the same way (forward only). */
export const ensureFocusRateFrom = (db: NandiDb, now: number): Promise<string> => ensureDayOnce(db, FOCUS_RATE_FROM_KEY, now);

async function ensureDayOnce(db: NandiDb, key: string, now: number): Promise<string> {
  const existing = await db.settings.get(key);
  if (existing && !existing.deleted && typeof existing.value === 'string') return existing.value;
  const day = dayKey(now), deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.settings, async () => {
    const again = await db.settings.get(key);
    if (!again || again.deleted || typeof again.value !== 'string') await db.settings.put({ key, value: day, updatedAt: now, deleted: 0, deviceId });
  }));
  return ((await db.settings.get(key))?.value as string | undefined) ?? day;
}

/** A constellation's own name; an empty name goes back to the suggested one. */
export async function saveConstellationName(db: NandiDb, id: string, name: string, now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  const value = name.trim().slice(0, 40);
  await trackWrite(() => db.settings.put({ key: `${CONSTELLATION_PREFIX}${id}`, value, updatedAt: now, deleted: value ? 0 : 1, deviceId }));
}

/** Spec 575 (must 12): the trail switch line was shown for this trail; a settings row, so a restore keeps it. */
export async function markTrailSwitchSeen(db: NandiDb, trailId: string, now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key: `${TRAIL_SWITCH_PREFIX}${trailId}`, value: true, updatedAt: now, deleted: 0, deviceId }));
}

/** Spec 54: one open plan in v1, a line the person writes for a camp ahead; editing or deleting it never loses anything. */
export const JAR_PLAN_KEY = 'yatra.plan';
export const PLAN_MAX = 60;
/** Spec 575: `trailId` names the trail the camp is on; a plan saved before trails followed one another is on the first. */
export interface JarPlan { line: string; camp: number; setAt: number; needMinutes: number; trailId: string }
export const FIRST_TRAIL = 'hampta-pass';

export function readJarPlan(value: unknown): JarPlan | null {
  if (!value || typeof value !== 'object') return null;
  const plan = value as Partial<JarPlan>;
  return typeof plan.line === 'string' && plan.line.trim() && typeof plan.camp === 'number' && typeof plan.setAt === 'number' && typeof plan.needMinutes === 'number'
    ? { line: plan.line, camp: plan.camp, setAt: plan.setAt, needMinutes: plan.needMinutes, trailId: typeof plan.trailId === 'string' ? plan.trailId : FIRST_TRAIL } : null;
}

/**
 * Spec 575: a plan is reached once the walk stands at or past its camp: on a later trail, or on its own trail at or
 * beyond the camp. A plan on a trail's last camp is reached at the switch, when the group stands at the next start.
 */
export function planReached(plan: JarPlan, journey: { trails: readonly { id: string }[]; index: number }, place: number): boolean {
  const own = journey.trails.findIndex(trail => trail.id === plan.trailId);
  if (own < 0) return false;
  return journey.index > own || (journey.index === own && place >= plan.camp);
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
