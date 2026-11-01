import type { NandiDb } from '../db';
import type { PhoneUsageRow, SettingRow } from '../types';
import { trackWrite } from '../../core/pendingWrites';
import { getOrCreateDeviceId } from '../device';
import { dayKey } from '../../core/time';
import { readPauseCard } from '../../core/pauseCard';
import { PHONE_USAGE_CATALOG } from '../../core/rules.config';
import { addCalendarDays, calendarBounds, calendarDayKey } from '../../core/phoneUsage/calendarDay';
import { judgeDay, settled } from '../../core/phoneUsage/coverage';
import { LEAD_MS, measureDay } from '../../core/phoneUsage/measure';
import { BACKFILL_DAYS, baselineToFreeze, KEEP_DAYS, PHONE_USAGE_KEYS, PHONE_USAGE_PREFIX, pickedApps, readAppSet, readBaselines, readSince, setIdFor, trackedPackages, type AppSet } from '../../core/phoneUsage/baseline';
import { readForegroundLog, type ForegroundRead } from '../../platform/phoneUsage';

type Read = (from: number, to: number, packages: readonly string[], days: readonly { fromMs: number; toMs: number }[]) => Promise<ForegroundRead | null>;
type Clock = { bootCount: number; bootWallMs: number; at: number; timeZone: string };
/** A clock moved by more than this since the last read (same boot) is a clock change. */
const CLOCK_SLACK_MS = 60_000;

const value = (settings: readonly SettingRow[], key: string) => settings.find(row => row.key === key && !row.deleted)?.value;
const zone = () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
export type CaptureResult = 'off' | 'not-picked' | 'unavailable' | 'no-access' | 'read' | 'nothing-due';

/**
 * Spec 46a: the daily minutes record, written silently. On each open (and return to NANDI) it reads every finished
 * calendar day not yet settled, once the person has picked apps and Usage access is on, and writes one row per tracked
 * package per day: the measured milliseconds, or null with the reason. A settled row is never rewritten; an unknown one
 * is read again while Android's log still reaches it, and only evidence replaces it. The first read also reads the days
 * the log still holds (at most BACKFILL_DAYS); nothing older is ever written. Then the first complete week for this set
 * of apps is frozen, and rows older than KEEP_DAYS go (a frozen week's never do). Nothing here is shown anywhere.
 */
export async function capturePhoneUsage(db: NandiDb, now: number, read: Read = readForegroundLog): Promise<CaptureResult> {
  const settings = await db.settings.toArray();
  if (value(settings, PHONE_USAGE_KEYS.off) === true) return 'off';
  const picked = pickedApps(settings);
  if (!picked) return 'not-picked';
  const tracked = trackedPackages(picked);
  const setId = setIdFor(picked);
  const today = calendarDayKey(now);
  const yesterday = addCalendarDays(today, -1);
  const since = readSince(settings);
  // The days before the record began only as far back as the log reaches; a day older than KEEP_DAYS would go at once.
  const back = addCalendarDays(since?.day ?? today, -BACKFILL_DAYS);
  const first = back > addCalendarDays(today, -KEEP_DAYS) ? back : addCalendarDays(today, -KEEP_DAYS);
  const rows = await db.phoneUsageMinutes.where('dayKey').between(first, yesterday, true, true).toArray();
  const existing = new Map(rows.map(row => [row.id, row]));
  const due: { day: string; packages: string[] }[] = [];
  for (let day = first; day <= yesterday; day = addCalendarDays(day, 1)) {
    const packages = tracked.map(item => item.packageName).filter(pkg => { const row = existing.get(`${day}|${pkg}`); return !row || !settled(row, now); });
    if (packages.length) due.push({ day, packages });
  }
  if (!due.length) return 'nothing-due';
  const bounds = due.map(item => calendarBounds(item.day));
  const result = await read(bounds[0]!.fromMs - LEAD_MS, bounds.at(-1)!.toMs, tracked.map(item => item.packageName), bounds);
  if (!result) return 'unavailable';
  // The record begins with the first read that has Usage access; until then nothing is written, not even an unknown.
  if (!result.access && !since) return 'no-access';
  const deviceId = await getOrCreateDeviceId(db, now);
  const stored = value(settings, PHONE_USAGE_KEYS.clock) as Clock | undefined;
  const clockChanged = !!stored && result.access && stored.bootCount === result.bootCount && result.bootCount >= 0 && Math.abs(stored.bootWallMs - result.bootWallMs) > CLOCK_SLACK_MS;
  const zoneChanged = !!stored && stored.timeZone !== zone();
  const writes: PhoneUsageRow[] = [];
  const group = new Map(tracked.map(item => [item.packageName, item.group]));
  due.forEach((item, index) => {
    const { fromMs, toMs, offsetStartMin, offsetEndMin } = bounds[index]!;
    // A clock or zone change since the last read touches the days from that read on.
    const moved = !!stored && toMs > stored.at;
    const measure = result.access ? measureDay(result.events, fromMs - LEAD_MS, fromMs, toMs, tracked.map(entry => entry.packageName)) : null;
    for (const pkg of item.packages) {
      const cross = result.access ? result.cross.filter(entry => entry.pkg === pkg && entry.from >= fromMs && entry.from < toMs).reduce<number | null>((sum, entry) => (sum ?? 0) + entry.ms, null) : null;
      const verdict = judgeDay({
        access: result.access, logStart: result.access ? result.logStart : null, fromMs,
        boundaryKnown: !!measure?.boundaryKnown, rebootAmbiguous: !!measure?.rebootAmbiguous.includes(pkg), gap: !!measure?.gaps.includes(pkg),
        clockChanged: moved && clockChanged, zoneChanged: moved && zoneChanged, ms: measure?.ms[pkg] ?? 0, crossCheckMs: cross,
      });
      const old = existing.get(`${item.day}|${pkg}`);
      // Only evidence replaces an unknown; an unknown never replaces anything but another unknown.
      if (old && old.foregroundMs !== null) continue;
      writes.push({
        id: `${item.day}|${pkg}`, dayKey: item.day, packageName: pkg, group: group.get(pkg)!, foregroundMs: verdict.foregroundMs,
        ...(verdict.reason ? { reason: verdict.reason } : {}), source: 'usage-events', fromMs, toMs, offsetStartMin, offsetEndMin,
        catalogId: PHONE_USAGE_CATALOG.id, setId, installed: result.access ? result.installed.includes(pkg) : null,
        crossCheckMs: cross, measuredAt: now, updatedAt: now, deleted: 0, deviceId,
      });
    }
  });
  const settingWrites: SettingRow[] = [];
  const nextSince = since ?? { at: now, day: today, pauseWasOn: readPauseCard(settings, dayKey(now)).on };
  if (!since) settingWrites.push({ key: PHONE_USAGE_KEYS.since, value: nextSince, updatedAt: now, deleted: 0, deviceId });
  // The first set covers the days read back; a later change counts from the day it is seen, so no day before it is
  // ever taken as measured under the new set (the change may have come any time since the last read).
  const storedSet = readAppSet(settings);
  const set: AppSet = !storedSet ? { setId, day: first } : storedSet.setId !== setId ? { setId, day: today } : storedSet;
  if (set !== storedSet) settingWrites.push({ key: PHONE_USAGE_KEYS.set, value: set, updatedAt: now, deleted: 0, deviceId });
  if (result.access) settingWrites.push({ key: PHONE_USAGE_KEYS.clock, value: { bootCount: result.bootCount, bootWallMs: result.bootWallMs, at: now, timeZone: zone() } satisfies Clock, updatedAt: now, deleted: 0, deviceId });
  await trackWrite(() => db.transaction('rw', db.phoneUsageMinutes, db.settings, async () => {
    if (writes.length) await db.phoneUsageMinutes.bulkPut(writes);
    const baselines = readBaselines(await db.settings.toArray());
    const all = await db.phoneUsageMinutes.toArray();
    const frozen = baselineToFreeze(all, picked, set, nextSince, baselines, deviceId, now);
    if (frozen) settingWrites.push({ key: PHONE_USAGE_KEYS.baselines, value: [...baselines, frozen], updatedAt: now, deleted: 0, deviceId });
    if (settingWrites.length) await db.settings.bulkPut(settingWrites);
    const keep = new Set([...baselines, ...(frozen ? [frozen] : [])].flatMap(baseline => baseline.days));
    const oldest = addCalendarDays(today, -KEEP_DAYS);
    const stale = all.filter(row => row.dayKey < oldest && !keep.has(row.dayKey)).map(row => row.id);
    if (stale.length) await db.phoneUsageMinutes.bulkDelete(stale);
  }));
  return 'read';
}

/** "Stop and delete the record": the rows, the frozen weeks and the record's start all go, and nothing more is kept. */
export async function stopPhoneUsage(db: NandiDb, now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.phoneUsageMinutes, db.settings, async () => {
    await db.phoneUsageMinutes.clear();
    await db.settings.bulkDelete((await db.settings.toArray()).map(row => row.key).filter(key => key.startsWith(PHONE_USAGE_PREFIX)));
    await db.settings.put({ key: PHONE_USAGE_KEYS.off, value: true, updatedAt: now, deleted: 0, deviceId });
  }));
}

/** "Keep a record again": a fresh record starts with the next read. */
export async function resumePhoneUsage(db: NandiDb): Promise<void> {
  await trackWrite(() => db.settings.delete(PHONE_USAGE_KEYS.off));
}

let running: Promise<CaptureResult> | null = null;
let lastAttempt = 0;
/** One capture at a time, and at most one every 10 minutes from the app's open and return-to-front checks. */
export function capturePhoneUsageOnce(db: NandiDb, now: number): Promise<CaptureResult> | null {
  if (running || now - lastAttempt < 600_000) return null;
  lastAttempt = now;
  running = capturePhoneUsage(db, now).finally(() => { running = null; });
  return running;
}
