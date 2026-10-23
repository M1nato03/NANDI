import { RULES, rulesFor } from '../rules.config';
import type { LedgerRow, SettingRow } from '../../data/types';

/**
 * Spec 24 #1, Phone ki chhutti (cj5-focus §5 #1): a planned day off for the phone. Nothing is blocked and nothing
 * runs during the window; at the next open NANDI reads the phone's own usage events for it and writes one fact.
 */
export const CHHUTTI_KEY = 'plan.chhutti';
/** `since`: the first planning day the window counts on (a window is planned before it starts, never after). */
export type ChhuttiWindow = { id: string; label: string; from: string; to: string; since?: string; weekdays?: number[] };
/** The rough labels offered for a window, taken from an ordinary day. */
export const CHHUTTI_LABELS = [
  { label: 'After class', from: '17:00' },
  { label: 'After dinner', from: '21:00' },
  { label: 'Sunday morning', from: '09:00', weekdays: [0] },
] as const;

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const minutesOf = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));
export const clockOf = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export function readChhutti(settings: readonly SettingRow[]): ChhuttiWindow[] {
  const value = settings.find(row => row.key === CHHUTTI_KEY && !row.deleted)?.value;
  const windows = value && typeof value === 'object' && Array.isArray((value as { windows?: unknown }).windows) ? (value as { windows: unknown[] }).windows : [];
  return windows.flatMap(raw => {
    const w = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
    if (typeof w.id !== 'string' || typeof w.label !== 'string' || typeof w.from !== 'string' || typeof w.to !== 'string' || !CLOCK.test(w.from) || !CLOCK.test(w.to) || minutesOf(w.to) <= minutesOf(w.from)) return [];
    const weekdays = Array.isArray(w.weekdays) ? w.weekdays.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6) : undefined;
    const since = typeof w.since === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w.since) ? w.since : undefined;
    return [{ id: w.id, label: w.label, from: w.from, to: w.to, ...(since ? { since } : {}), ...(weekdays?.length ? { weekdays } : {}) }];
  });
}

/**
 * A window kept inside the day: from 04:00 (the planning day's start) to shutdown, so it never meets the night
 * routine. Its length starts at `startMin`.
 */
export function boundWindow(from: string, lengthMin: number, shutdown: string): { from: string; to: string } {
  const latest = minutesOf(CLOCK.test(shutdown) ? shutdown : RULES.night.defaultShutdown);
  const start = Math.min(Math.max(minutesOf(CLOCK.test(from) ? from : '21:00'), 4 * 60), latest - 10);
  return { from: clockOf(start), to: clockOf(Math.min(start + Math.max(10, lengthMin), latest)) };
}

export const appliesOn = (window: ChhuttiWindow, day: string) => (!window.since || day >= window.since) && (!window.weekdays || window.weekdays.includes(new Date(`${day}T12:00:00`).getDay()));
/** The window's clock bounds on a planning day, in local time (both after 04:00, so on the same date). */
export function windowBounds(window: ChhuttiWindow, day: string): { fromMs: number; toMs: number } {
  const at = (clock: string) => new Date(`${day}T${clock}:00`).getTime();
  return { fromMs: at(window.from), toMs: at(window.to) };
}

/** One event from the phone's usage log, reduced to what the count needs. */
export type UsageEvent = { type: 'fg' | 'bg' | 'on' | 'off'; at: number; pkg?: string };
export type WindowUsage = { chosenAppMs: number; darkMs: number | null };

/**
 * Minutes in the chosen apps (and with the screen dark) inside [fromMs, toMs], from usage events. It answers only
 * when the log reaches back to the window's start; otherwise the window is unknown (null), never "kept" (item 51
 * review note: missing history, revoked access or a quiet log must not read as a kept window).
 */
export function windowUsage(events: readonly UsageEvent[], fromMs: number, toMs: number, logStart?: number | null): WindowUsage | null {
  if (!(toMs > fromMs)) return null;
  const sorted = [...events].filter(event => Number.isFinite(event.at) && event.at <= toMs).sort((a, b) => a.at - b.at);
  // The phone's log must reach back to the window's start: the first event of any kind it returned (logStart), or
  // one of these events, at or before the start.
  const reaches = typeof logStart === 'number' ? logStart <= fromMs : sorted.some(event => event.at <= fromMs);
  if (!reaches) return null;
  const overlap = (start: number, end: number) => Math.max(0, Math.min(end, toMs) - Math.max(start, fromMs));
  // An app whose first event is a pause was already open before the log starts; the same for a screen that turns on.
  const open = new Map<string, number>();
  for (const pkg of new Set(sorted.filter(event => event.pkg).map(event => event.pkg!))) {
    if (sorted.find(event => event.pkg === pkg && (event.type === 'fg' || event.type === 'bg'))?.type === 'bg') open.set(pkg, -Infinity);
  }
  const screen = sorted.filter(event => event.type === 'on' || event.type === 'off');
  let darkSince: number | null = screen[0]?.type === 'on' ? -Infinity : null;
  let chosen = 0, dark = 0;
  for (const event of sorted) {
    if (event.type === 'fg' && event.pkg && !open.has(event.pkg)) open.set(event.pkg, event.at);
    else if (event.type === 'bg' && event.pkg && open.has(event.pkg)) { chosen += overlap(open.get(event.pkg)!, event.at); open.delete(event.pkg); }
    else if (event.type === 'off') {
      // A dark screen is not app time, even if the app sends its pause a moment later.
      for (const [pkg, since] of open) { chosen += overlap(since, event.at); open.delete(pkg); }
      if (darkSince === null) darkSince = event.at;
    } else if (event.type === 'on' && darkSince !== null) { dark += overlap(darkSince, event.at); darkSince = null; }
  }
  for (const since of open.values()) chosen += overlap(since, toMs);
  if (darkSince !== null) dark += overlap(darkSince, toMs);
  return { chosenAppMs: chosen, darkMs: screen.length ? dark : null };
}

export const chhuttiFactId = (day: string, windowId: string) => `chhutti:${day}:${windowId}`;
export function isKept(usage: WindowUsage, day: string): boolean {
  const rules = (rulesFor(day)?.rules ?? RULES).plan.chhutti;
  return usage.chosenAppMs <= rules.graceMin * 60_000;
}

/**
 * The ramp, not stakes: after every third checked window, 2 kept of those 3 make the window longer by `rampStepMin`,
 * up to `maxMin` and never past shutdown. A window that was not kept changes nothing.
 */
export function rampedWindow(window: ChhuttiWindow, facts: readonly LedgerRow[], shutdown: string): ChhuttiWindow {
  const rules = RULES.plan.chhutti;
  const own = facts.filter(fact => !fact.deleted && fact.kind === 'chhutti' && fact.inputs.windowId === window.id).sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  if (!own.length || own.length % 3 !== 0) return window;
  if (own.slice(-3).filter(fact => fact.inputs.kept === true).length < rules.rampNeedsKeptOfLast3) return window;
  const length = minutesOf(window.to) - minutesOf(window.from);
  const next = Math.min(rules.maxMin, length + rules.rampStepMin);
  if (next <= length) return window;
  const bounded = boundWindow(window.from, next, shutdown);
  return bounded.to === window.to ? window : { ...window, to: bounded.to };
}

/** The one calm line shown at the next open. Never red and never a word of blame. */
export function chhuttiLine(fact: LedgerRow, label: string): string {
  const minutes = (ms: unknown) => Math.round(Number(ms) / 60_000);
  if (fact.inputs.source === 'self') return fact.inputs.kept === true ? `${label}: the phone got its chhutti.` : `${label}: same window tomorrow, or a shorter one?`;
  const apps = `${minutes(fact.inputs.chosenAppMs)} min in your chosen apps`;
  const darkMs = fact.inputs.darkMs;
  const dark = typeof darkMs === 'number' ? `, phone dark ${minutes(darkMs)} min` : '';
  return fact.inputs.kept === true ? `${label}: ${apps}${dark}. The phone got its chhutti.` : `${label}: ${apps}. Same window tomorrow, or a shorter one?`;
}

/** The window running now, if any, for the App pause card's lead line. */
export function activeChhutti(settings: readonly SettingRow[], now: number, day: string): ChhuttiWindow | undefined {
  return readChhutti(settings).find(window => {
    if (!appliesOn(window, day) || settings.some(row => row.key === `${CHHUTTI_KEY}.skip:${day}:${window.id}` && row.value === true && !row.deleted)) return false;
    const { fromMs, toMs } = windowBounds(window, day);
    return now >= fromMs && now < toMs;
  });
}
