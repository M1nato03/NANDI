import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Spec 36 focus guard, on the phone: NightPauseService watches in a "focus" mode while a focus runs. It notifies as a
 * guarded app comes to the front, and pauses the focus (recorded here, applied when NANDI next looks) after 60 seconds.
 * Usage events stay on the phone.
 */
export type GuardLook = {
  /** False on the web: the guard can only watch on the phone. */
  available: boolean;
  usageAllowed: boolean;
  /** Time a guarded app was in front during this focus, and when (each span breaks a clean block). */
  distractedMs: number;
  spans: [number, number][];
  /** Set when the guard paused the focus: when the app came to the front, and which app. */
  pausedAt?: number;
  pausedApp?: string;
};
type FocusGuardPlugin = {
  focusGuard(options: { active: boolean; focusId?: string; task?: string; runningSince?: number; beforeMs?: number; stillAt?: number; packages?: string; graceSec?: number }): Promise<void>;
  focusStatus(options: { focusId: string }): Promise<{ usageAllowed: boolean; distractedMs?: number; spans?: [number, number][]; pausedAt?: number; pausedApp?: string }>;
  clearFocusPause(): Promise<void>;
};
const native = registerPlugin<FocusGuardPlugin>('NightPause');

/** End-to-end tests describe what the phone's guard would report (never set in the app itself). */
const E2E_GUARD = 'nandi.e2eGuard';
function fake(): Partial<GuardLook> | null {
  try { const raw = sessionStorage.getItem(E2E_GUARD); return raw ? JSON.parse(raw) as Partial<GuardLook> : null; } catch { return null; }
}

/** What the guard has seen for this focus. */
export async function lookGuard(focusId: string): Promise<GuardLook> {
  const test = fake();
  if (test) return { available: true, usageAllowed: test.usageAllowed ?? true, distractedMs: test.distractedMs ?? 0, spans: test.spans ?? [], pausedAt: test.pausedAt, pausedApp: test.pausedApp };
  if (!Capacitor.isNativePlatform()) return { available: false, usageAllowed: false, distractedMs: 0, spans: [] };
  try {
    const seen = await native.focusStatus({ focusId });
    return { available: true, usageAllowed: seen.usageAllowed, distractedMs: seen.distractedMs ?? 0, spans: seen.spans ?? [], pausedAt: seen.pausedAt, pausedApp: seen.pausedApp };
  } catch { return { available: true, usageAllowed: false, distractedMs: 0, spans: [] }; }
}

/**
 * Starts or moves the watch: the focus, its task, when its running stretch began (and the task's time before it, for
 * "Your N minutes before that are saved"), and when "Still working?" asks.
 */
export async function watchFocus(watch: { focusId: string; task: string; runningSince: number; beforeMs: number; stillAt: number; packages: string[]; graceSec: number } | null): Promise<void> {
  if (fake() || !Capacitor.isNativePlatform()) return;
  try {
    await native.focusGuard(watch ? { active: true, focusId: watch.focusId, task: watch.task, runningSince: watch.runningSince, beforeMs: watch.beforeMs, stillAt: watch.stillAt, packages: watch.packages.join(','), graceSec: watch.graceSec } : { active: false });
  } catch { /* The focus still runs; without the watch it simply earns no focus XP. */ }
}

/** The guard's pause has been applied to the focus. */
export async function clearGuardPause(): Promise<void> {
  const test = fake();
  if (test) { sessionStorage.setItem(E2E_GUARD, JSON.stringify({ ...test, pausedAt: undefined, pausedApp: undefined })); return; }
  if (Capacitor.isNativePlatform()) await native.clearFocusPause().catch(() => undefined);
}
