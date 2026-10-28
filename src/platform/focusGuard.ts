import { Capacitor, registerPlugin } from '@capacitor/core';
import { distractedWithin, guardedSpans, type GuardEvent } from '../core/focusGuard';
import type { FocusRow } from '../data/types';

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
  focusEvents(options: { from: number; to: number }): Promise<{ available: boolean; events?: GuardEvent[] }>;
};
const native = registerPlugin<FocusGuardPlugin>('NightPause');

/** End-to-end tests describe what the phone's guard would report (never set in the app itself). */
const E2E_GUARD = 'nandi.e2eGuard';
function fake(): Partial<GuardLook> | null {
  try { const raw = sessionStorage.getItem(E2E_GUARD); return raw ? JSON.parse(raw) as Partial<GuardLook> : null; } catch { return null; }
}

/**
 * What the guard has seen for this focus. The paid minutes come from Android's own usage log, read now for the whole
 * focus, so a watcher the phone stopped mid-focus can never make unwatched time pay; the watcher only notifies and
 * pauses. With no usable log (no Usage access, Android 9 or older, a locked phone) the guard is off for this focus.
 */
export async function lookGuard(focus: Pick<FocusRow, 'id' | 'startedAt' | 'pauses' | 'endedAt'>, packages: readonly string[], now: number): Promise<GuardLook> {
  const test = fake();
  if (test) return { available: true, usageAllowed: test.usageAllowed ?? true, distractedMs: test.distractedMs ?? 0, spans: test.spans ?? [], pausedAt: test.pausedAt, pausedApp: test.pausedApp };
  if (!Capacitor.isNativePlatform()) return { available: false, usageAllowed: false, distractedMs: 0, spans: [] };
  try {
    const status = await native.focusStatus({ focusId: focus.id });
    const log = status.usageAllowed ? await native.focusEvents({ from: focus.startedAt, to: focus.endedAt ?? now }) : { available: false };
    const spans = log.available ? guardedSpans(log.events ?? [], focus.startedAt, focus.endedAt ?? now, packages) : [];
    return { available: true, usageAllowed: status.usageAllowed && log.available, distractedMs: distractedWithin(spans, focus, now), spans, pausedAt: status.pausedAt, pausedApp: status.pausedApp };
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
