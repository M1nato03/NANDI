import { Capacitor, registerPlugin } from '@capacitor/core';
import { RULES } from '../core/rules.config';
import type { LockEvent, UsageEvent } from '../core/plan/chhutti';

type Status = { usageAllowed: boolean; overlayAllowed: boolean; pendingPackage: string; pendingReason?: string; pendingMinutes?: number; pauseOffUntil?: number };
type NightPausePlugin = {
  status(): Promise<Status>;
  openUsageSettings(): Promise<void>;
  openAppInfo(): Promise<void>;
  openOverlaySettings(): Promise<void>;
  test(options: { durationMs: number }): Promise<void>;
  configure(options: { enabled: boolean; bedtime: string; packages: string; leadMinutes: number; dayMode: string; dayLimitMinutes: number; pauseCard: boolean; pauseFrom: string; pauseTo: string }): Promise<void>;
  goHome(): Promise<void>;
  launcherApps(): Promise<{ apps: { packageName: string; label: string }[] }>;
  clearPending(): Promise<void>;
  openApp(options: { packageName: string; snoozeMs: number }): Promise<void>;
  windowEvents(options: { from: number; to: number; packages: string }): Promise<{ available: boolean; logStart?: number; events?: UsageEvent[]; lockSafe?: boolean }>;
  lockEvents(options: { since: number }): Promise<{ available: boolean; events?: LockEvent[] }>;
  installedApps(options: { packages: string }): Promise<{ installed: string[] }>;
};

const native = registerPlugin<NightPausePlugin>('NightPause');

/**
 * End-to-end tests describe what the phone's pause would report (spec 39), the same way focusGuard.ts does: a pending
 * app, the permissions, and a log of what NANDI asked the phone to do. Never set in the app itself.
 */
const E2E_PAUSE = 'nandi.e2ePause';
type FakePause = Partial<Status> & { did?: string[] };
function fake(): FakePause | null {
  try { const raw = sessionStorage.getItem(E2E_PAUSE); return raw ? JSON.parse(raw) as FakePause : null; } catch { return null; }
}
function fakeDid(change: Partial<FakePause>, action: string): void {
  const current = fake();
  if (!current) return;
  try { sessionStorage.setItem(E2E_PAUSE, JSON.stringify({ ...current, ...change, did: [...(current.did ?? []), action] })); } catch { /* storage is optional */ }
}

export const nightPauseAvailable = () => Capacitor.isNativePlatform() || fake() !== null;
export async function nightPauseStatus(): Promise<Status> {
  const test = fake();
  if (test) return { usageAllowed: test.usageAllowed ?? true, overlayAllowed: test.overlayAllowed ?? true, pendingPackage: test.pendingPackage ?? '', pendingReason: test.pendingReason, pendingMinutes: test.pendingMinutes, pauseOffUntil: test.pauseOffUntil };
  return Capacitor.isNativePlatform() ? native.status() : { usageAllowed: false, overlayAllowed: false, pendingPackage: '' };
}
export async function openUsageSettings(): Promise<void> { if (Capacitor.isNativePlatform()) await native.openUsageSettings(); }
export async function openNightPauseAppInfo(): Promise<void> { if (Capacitor.isNativePlatform()) await native.openAppInfo(); }
export async function openOverlaySettings(): Promise<void> { if (Capacitor.isNativePlatform()) await native.openOverlaySettings(); }
/** Treats the next few minutes as the bedtime window, so the pause can be tried by day. */
export async function testNightPause(durationMs: number): Promise<void> { if (Capacitor.isNativePlatform()) await native.test({ durationMs }); }
/**
 * The night pause, and (spec 39) the Pause card: by day it pauses only while `pause.on`, inside `from`–`to` or, with no
 * window, all day until the night window starts.
 */
export async function configureNightPause(enabled: boolean, bedtime: string, packages: string[], day: { mode: string; limitMinutes: number }, pause: { on: boolean; from: string; to: string } = { on: false, from: '', to: '' }): Promise<void> {
  if (Capacitor.isNativePlatform()) await native.configure({ enabled, bedtime, packages: packages.join(','), leadMinutes: RULES.night.pauseLeadMin, dayMode: day.mode, dayLimitMinutes: day.limitMinutes, pauseCard: pause.on, pauseFrom: pause.from, pauseTo: pause.to });
}
export async function clearNightPause(): Promise<void> {
  if (fake()) return fakeDid({ pendingPackage: '' }, 'clear');
  if (Capacitor.isNativePlatform()) await native.clearPending();
}
export async function openPausedApp(packageName: string, snoozeMs: number): Promise<void> {
  if (fake()) return fakeDid({ pendingPackage: '' }, `open:${packageName}:${snoozeMs}`);
  if (Capacitor.isNativePlatform()) await native.openApp({ packageName, snoozeMs });
}
/** Spec 39 "Not now": the phone's Home screen, out of NANDI and out of the app. */
export async function goPhoneHome(): Promise<void> {
  if (fake()) return fakeDid({ pendingPackage: '' }, 'home');
  if (Capacitor.isNativePlatform()) await native.goHome();
}
/** Spec 39: every app this phone can open, for "Add another app" (null on the web). */
export async function readLauncherApps(): Promise<{ packageName: string; label: string }[] | null> {
  if (!Capacitor.isNativePlatform()) return null;
  const result = await native.launcherApps();
  return Array.isArray(result.apps) ? result.apps.filter(app => typeof app?.packageName === 'string' && typeof app?.label === 'string') : [];
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
