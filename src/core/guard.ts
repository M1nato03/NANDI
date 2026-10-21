import { addEconomyDays } from './economy/deriveEconomy';
import type { DailyLogRow, FocusRow, SessionRow } from '../data/types';

/**
 * HANDOVER §4 guard metric: time in NANDI, excluding workout and focus timers, plus the weekly
 * agency check. Both land in dailyLog so the weekly summary can report them.
 */
export const FOREGROUND_TICK_MS = 15_000;
/** One tick never counts more than this, so a sleeping phone or a frozen tab adds nothing. */
export const FOREGROUND_SLICE_MAX_MS = 2 * FOREGROUND_TICK_MS;
/** A timer left running longer than this is treated as forgotten and stops excluding time. */
export const TIMER_STALE_MS = 6 * 60 * 60_000;
export const AGENCY_SCORES = [1, 2, 3, 4, 5] as const;

export function foregroundSlice(lastAt: number, now: number): number {
  return Math.min(Math.max(now - lastAt, 0), FOREGROUND_SLICE_MAX_MS);
}

/** A workout or focus timer is running, so this time belongs to the timer, not to the app. */
export function timerRunning(focus: readonly FocusRow[], sessions: readonly SessionRow[], now: number): boolean {
  const fresh = (startedAt: number | undefined) => startedAt != null && startedAt <= now && now - startedAt < TIMER_STALE_MS;
  return focus.some(row => !row.deleted && row.endedAt == null && fresh(row.startedAt))
    || sessions.some(row => !row.deleted && row.status === 'active' && fresh(row.startedAt ?? row.updatedAt));
}

export function validAgencyScore(score: unknown): score is number {
  return typeof score === 'number' && Number.isInteger(score) && score >= 1 && score <= 5;
}

/** The check is weekly: answered on any of the last seven days (today included) means done. */
export function agencyAnsweredRecently(logs: readonly DailyLogRow[], today: string): boolean {
  const from = addEconomyDays(today, -6);
  return logs.some(row => !row.deleted && row.dayKey >= from && row.dayKey <= today && row.agency1to5 !== undefined);
}

/** A log row that only carries counted app minutes says nothing about what the person did. */
export function logHasActivity(row: DailyLogRow): boolean {
  const meta = new Set(['dayKey', 'appMinutes', 'updatedAt', 'deleted', 'deviceId']);
  return Object.entries(row).some(([key, value]) => !meta.has(key) && value !== undefined);
}
