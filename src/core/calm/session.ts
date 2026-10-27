/**
 * Spec 35 Calm v1.1: the session's clock, read from the wall clock (start time), never from a count of ticks, so it
 * stays right when the app is hidden or the screen locks. Length never earns more: a counted session is one ledger row,
 * one stretch and one star, whatever its minutes.
 */
export type CalmWay = 'paced' | 'scan' | 'quiet';
/** Minutes 1-120, or 'open' for Until I stop. */
export type CalmLength = number | 'open';

export const CALM_WAYS: readonly CalmWay[] = ['paced', 'scan', 'quiet'];
export const CALM_MINUTES = { chips: [3, 5, 10, 20, 30, 60], other: [1, 15, 45], custom: [1, 120] } as const;
export const CALM_INTERVALS = [0, 5, 10, 15] as const;
/** Sa for the tanpura, in Hz: four comfortable pitches. */
export const TANPURA_PITCHES = [{ name: 'C', hz: 130.81 }, { name: 'C♯', hz: 138.59 }, { name: 'D', hz: 146.83 }, { name: 'E', hz: 164.81 }] as const;
/** The guide fades after this long, in a paced sit of LONG_SIT minutes or more. */
export const FADE_AFTER_MS = 3 * 60_000;
export const LONG_SIT = 10;
/** The screen dims after this long without a touch. */
export const DIM_AFTER_MS = 20_000;
const MINUTE = 60_000;

export const SCAN_LINES = ['Notice your feet on the floor.', 'Let your legs feel heavy.', 'Notice your hands, then your shoulders.', 'Let your jaw soften.', 'Notice the breath moving in and out.', 'Rest here as long as you like.'];

export const totalMs = (length: CalmLength): number | null => length === 'open' ? null : length * MINUTE;
export const isLongSit = (length: CalmLength) => length === 'open' || length >= LONG_SIT;
/** Whole minutes sat; a session counts from 1. */
export const sitMinutes = (elapsedMs: number) => Math.max(0, Math.floor(elapsedMs / MINUTE));
/** Whether "Let the guide fade" applies: a paced sit of 10 minutes or more (or open-ended) with the toggle on. */
export const fadeApplies = (way: CalmWay, length: CalmLength, fade: boolean) => way === 'paced' && fade && isLongSit(length);

/** Which of the 6 body-scan lines is showing: spread evenly over a set length, one a minute when open-ended. */
export function scanLine(elapsedMs: number, length: CalmLength): number {
  const total = totalMs(length);
  const step = total === null ? MINUTE : total / SCAN_LINES.length;
  return Math.min(SCAN_LINES.length - 1, Math.floor(Math.max(0, elapsedMs) / step));
}

/** Interval bells rung so far: one each `interval` minutes, never on the end itself (the end bell rings then). */
export function intervalBells(elapsedMs: number, interval: number, length: CalmLength): number {
  if (!interval) return 0;
  const every = interval * MINUTE, total = totalMs(length);
  const upTo = total === null ? elapsedMs : Math.min(elapsedMs, total - 1);
  return Math.max(0, Math.floor(upTo / every));
}

export type BreathPattern = { in: number; out: number };
/** Out-breaths begun so far. */
export function outBreaths(elapsedMs: number, breath: BreathPattern): number {
  if (elapsedMs < breath.in * 1000) return 0;
  return Math.floor((elapsedMs - breath.in * 1000) / ((breath.in + breath.out) * 1000)) + 1;
}

/**
 * Night Calm (spec 34 + 35): how many of tonight's stars are brightened. Paced breath: one per out-breath. Body scan:
 * one per line change and interval bell. Quiet sit (and a paced sit once its guide has faded): one per interval bell,
 * or one a minute when bells are off.
 */
export function nightStars(s: { way: CalmWay; elapsedMs: number; length: CalmLength; breath: BreathPattern; interval: number; fade: boolean }): number {
  const bells = intervalBells(s.elapsedMs, s.interval, s.length);
  const quiet = (from: number) => s.interval ? intervalBells(s.elapsedMs, s.interval, s.length) - intervalBells(from, s.interval, s.length) : sitMinutes(s.elapsedMs) - sitMinutes(from);
  if (s.way === 'scan') return scanLine(s.elapsedMs, s.length) + bells;
  if (s.way === 'quiet') return quiet(0);
  if (fadeApplies(s.way, s.length, s.fade) && s.elapsedMs >= FADE_AFTER_MS) return outBreaths(FADE_AFTER_MS, s.breath) + quiet(FADE_AFTER_MS);
  return outBreaths(s.elapsedMs, s.breath);
}

/** "3 quiet minutes, together." */
export const doneLine = (minutes: number) => minutes === 1 ? 'A quiet minute, together.' : `${minutes} quiet minutes, together.`;
