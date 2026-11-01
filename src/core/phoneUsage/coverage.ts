/**
 * Spec 46a: when a package-day's minutes can be trusted. Unknown is never zero: a zero is written only when the read
 * had Usage access, the log reaches back before the day, the state at midnight is known, the phone did not die with
 * the app open, the log has no long silence while it was open, the clock and time zone held, and Android's own daily
 * total (where one lines up with the day) does not show more than the events did.
 */
export type UnknownReason =
  | 'no_access' | 'short_history' | 'boundary_unknown' | 'reboot_ambiguous' | 'event_gap'
  | 'clock_change' | 'timezone_change' | 'mismatch';

/** These never get better on a later read: the day's own bounds were moved. */
export const PERMANENT: ReadonlySet<UnknownReason> = new Set(['clock_change', 'timezone_change']);
/** Android keeps about ten days of events; a day that started longer ago than this is not read again. */
export const REACH_MS = 9 * 24 * 60 * 60 * 1000;
/** Android's own total may run ahead of the events by this much before the day is called a mismatch. */
export const MISMATCH_SHARE = 0.1;
export const MISMATCH_MIN_MS = 10 * 60 * 1000;

export interface DayEvidence {
  access: boolean;
  /** The first event the phone's log still holds, or null for an empty log. */
  logStart: number | null;
  fromMs: number;
  boundaryKnown: boolean;
  rebootAmbiguous: boolean;
  gap: boolean;
  clockChanged: boolean;
  zoneChanged: boolean;
  ms: number;
  crossCheckMs: number | null;
}

export function judgeDay(evidence: DayEvidence): { foregroundMs: number | null; reason?: UnknownReason } {
  const unknown = (reason: UnknownReason) => ({ foregroundMs: null, reason });
  if (!evidence.access) return unknown('no_access');
  if (evidence.clockChanged) return unknown('clock_change');
  if (evidence.zoneChanged) return unknown('timezone_change');
  if (evidence.logStart === null || evidence.logStart > evidence.fromMs) return unknown('short_history');
  if (!evidence.boundaryKnown) return unknown('boundary_unknown');
  if (evidence.rebootAmbiguous) return unknown('reboot_ambiguous');
  if (evidence.gap) return unknown('event_gap');
  // Only Android showing MORE than the events is a problem: an undercount could pass for a better week.
  if (evidence.crossCheckMs !== null && evidence.crossCheckMs - evidence.ms > Math.max(MISMATCH_SHARE * evidence.crossCheckMs, MISMATCH_MIN_MS)) return unknown('mismatch');
  return { foregroundMs: evidence.ms };
}

/** A row that is settled: measured, or unknown for good. Other unknowns are read again while the log still reaches them. */
export function settled(row: { foregroundMs: number | null; reason?: UnknownReason; fromMs: number }, now: number): boolean {
  return row.foregroundMs !== null || (!!row.reason && PERMANENT.has(row.reason)) || row.fromMs < now - REACH_MS;
}
