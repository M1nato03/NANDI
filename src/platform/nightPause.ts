import { Capacitor, registerPlugin } from '@capacitor/core';
import { RULES } from '../core/rules.config';
import type { LockEvent, UsageEvent } from '../core/plan/chhutti';

type Status = { usageAllowed: boolean; overlayAllowed: boolean; pendingPackage: string; pendingReason?: string; pendingMinutes?: number };
type NightPausePlugin = {
  status(): Promise<Status>;
  openUsageSettings(): Promise<void>;
  openAppInfo(): Promise<void>;
  openOverlaySettings(): Promise<void>;
  test(options: { durationMs: number }): Promise<void>;
  configure(options: { enabled: boolean; bedtime: string; packages: string; leadMinutes: number; dayMode: string; dayLimitMinutes: number }): Promise<void>;
  clearPending(): Promise<void>;
  openApp(options: { packageName: string; snoozeMs: number }): Promise<void>;
  windowEvents(options: { from: number; to: number; packages: string }): Promise<{ available: boolean; logStart?: number; events?: UsageEvent[]; lockSafe?: boolean }>;
  lockEvents(options: { since: number }): Promise<{ available: boolean; events?: LockEvent[] }>;
  installedApps(options: { packages: string }): Promise<{ installed: string[] }>;
};

const native = registerPlugin<NightPausePlugin>('NightPause');
export const nightPauseAvailable = () => Capacitor.isNativePlatform();
export async function nightPauseStatus(): Promise<Status> {
  return Capacitor.isNativePlatform() ? native.status() : { usageAllowed: false, overlayAllowed: false, pendingPackage: '' };
}
export async function openUsageSettings(): Promise<void> { if (Capacitor.isNativePlatform()) await native.openUsageSettings(); }
export async function openNightPauseAppInfo(): Promise<void> { if (Capacitor.isNativePlatform()) await native.openAppInfo(); }
export async function openOverlaySettings(): Promise<void> { if (Capacitor.isNativePlatform()) await native.openOverlaySettings(); }
/** Treats the next few minutes as the bedtime window, so the pause can be tried by day. */
export async function testNightPause(durationMs: number): Promise<void> { if (Capacitor.isNativePlatform()) await native.test({ durationMs }); }
export async function configureNightPause(enabled: boolean, bedtime: string, packages: string[], day: { mode: string; limitMinutes: number }): Promise<void> {
  if (Capacitor.isNativePlatform()) await native.configure({ enabled, bedtime, packages: packages.join(','), leadMinutes: RULES.night.pauseLeadMin, dayMode: day.mode, dayLimitMinutes: day.limitMinutes });
}
export async function clearNightPause(): Promise<void> { if (Capacitor.isNativePlatform()) await native.clearPending(); }
export async function openPausedApp(packageName: string, snoozeMs: number): Promise<void> {
  if (Capacitor.isNativePlatform()) await native.openApp({ packageName, snoozeMs });
}

/** Spec 24 #1: the phone's usage events (every app, screen, start-up) for one past window; null where there is no usage log (web, no access). */
export async function readWindowEvents(from: number, to: number, packages: string[]): Promise<{ logStart?: number; events: UsageEvent[]; lockSafe?: boolean } | null> {
  if (!Capacitor.isNativePlatform()) return null;
  const result = await native.windowEvents({ from, to, packages: packages.join(',') });
  return result.available ? { logStart: result.logStart, events: Array.isArray(result.events) ? result.events : [], lockSafe: result.lockSafe === true } : null;
}

/** The lock self-test's events since `since`: NANDI's own activities resumed and paused, and the lock screen shown. */
export async function readLockEvents(since: number): Promise<LockEvent[] | null> {
  if (!Capacitor.isNativePlatform()) return null;
  const result = await native.lockEvents({ since });
  return result.available ? (Array.isArray(result.events) ? result.events : []) : null;
}

/** Which of these packages this phone can see installed now (the default apps are in the manifest's <queries>). */
export async function readInstalledApps(packages: string[]): Promise<string[] | null> {
  if (!Capacitor.isNativePlatform()) return null;
  const result = await native.installedApps({ packages: packages.join(',') });
  return Array.isArray(result.installed) ? result.installed : [];
}
