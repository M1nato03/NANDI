import { RULES, rulesFor } from '../rules.config';
import type { LedgerRow, SettingRow } from '../../data/types';

/**
 * Spec 24 #1, Phone ki chhutti (cj5-focus §5 #1): a planned day off for the phone. Nothing is blocked and nothing
 * runs during the window; at the next open NANDI reads the phone's own usage events for it and writes one fact.
 */
export const CHHUTTI_KEY = 'plan.chhutti';
/**
 * `since`: the first planning day the window counts on (a window is planned before it starts, never after).
 * `past`: the bounds earlier days had, so a change never rewrites a day that already started (item 55).
 */
export type ChhuttiBounds = { from: string; to: string; through: string; weekdays?: number[] };
/** `until`: the last planning day of a removed window, kept so its ended days are still read (item 56). */
export type ChhuttiWindow = { id: string; label: string; from: string; to: string; since?: string; until?: string; weekdays?: number[]; past?: ChhuttiBounds[] };
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
    const until = typeof w.until === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w.until) ? w.until : undefined;
    const days = (raw: unknown) => Array.isArray(raw) ? raw.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6) : undefined;
    const past = Array.isArray(w.past) ? w.past.flatMap(raw => {
      const b = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
      const segmentDays = days(b.weekdays);
      return typeof b.from === 'string' && typeof b.to === 'string' && typeof b.through === 'string' && CLOCK.test(b.from) && CLOCK.test(b.to) && /^\d{4}-\d{2}-\d{2}$/.test(b.through) ? [{ from: b.from, to: b.to, through: b.through, ...(segmentDays?.length ? { weekdays: segmentDays } : {}) }] : [];
    }).sort((a, b) => a.through.localeCompare(b.through)) : [];
    return [{ id: w.id, label: w.label, from: w.from, to: w.to, ...(since ? { since } : {}), ...(until ? { until } : {}), ...(weekdays?.length ? { weekdays } : {}), ...(past.length ? { past } : {}) }];
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

/** Whether a planning day had this window: inside since..until, on the weekdays that day had (a past segment's own). */
export function appliesOn(window: ChhuttiWindow, day: string): boolean {
  if ((window.since && day < window.since) || (window.until && day > window.until)) return false;
  const segment = window.past?.find(item => day <= item.through);
  const weekdays = segment ? segment.weekdays : window.weekdays;
  return !weekdays || weekdays.includes(new Date(`${day}T12:00:00`).getDay());
}
/** The window still planned (not removed); the card and the App pause line show only these. */
export const isLive = (window: ChhuttiWindow) => !window.until;
/** The bounds a planning day had: an earlier segment if the window was changed after that day, else the current ones. */
export function boundsOn(window: ChhuttiWindow, day: string): { from: string; to: string } {
  const segment = window.past?.find(item => day <= item.through);
  return segment ? { from: segment.from, to: segment.to } : { from: window.from, to: window.to };
}
/** The window's clock bounds on a planning day, in local time (both after 04:00, so on the same date). */
export function windowBounds(window: ChhuttiWindow, day: string): { fromMs: number; toMs: number } {
  const at = (clock: string) => new Date(`${day}T${clock}:00`).getTime();
  const bounds = boundsOn(window, day);
  return { fromMs: at(bounds.from), toMs: at(bounds.to) };
}
/**
 * New bounds count from the first day whose window has not started under either the old or the new bounds; every
 * day before keeps the bounds it had (a past segment). So an edit or a ramp never rewrites a started day.
 */
const shiftDay = (day: string, count: number) => new Date(Date.parse(`${day}T12:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10);
const sameDays = (a?: readonly number[], b?: readonly number[]) => (a ?? []).join(',') === (b ?? []).join(',');
export function withBounds(window: ChhuttiWindow, next: { from: string; to: string; weekdays?: number[] }, now: number, today: string): ChhuttiWindow {
  const weekdays = 'weekdays' in next ? next.weekdays : window.weekdays;
  if (next.from === window.from && next.to === window.to && sameDays(weekdays, window.weekdays)) return window;
  const startOf = (clock: string) => new Date(`${today}T${clock}:00`).getTime();
  const firstNew = now < Math.min(startOf(window.from), startOf(next.from)) ? today : shiftDay(today, 1);
  const lastOld = shiftDay(firstNew, -1);
  const past = [...(window.past ?? [])];
  if ((!window.since || lastOld >= window.since) && !past.some(item => item.through >= lastOld)) past.push({ from: window.from, to: window.to, through: lastOld, ...(window.weekdays?.length ? { weekdays: [...window.weekdays] } : {}) });
  const updated: ChhuttiWindow = { ...window, from: next.from, to: next.to, ...(past.length ? { past } : {}) };
  if (weekdays?.length) updated.weekdays = weekdays; else delete updated.weekdays;
  return updated;
}
/** Removing a window ends it with the last day that has started; those days are still read afterwards. */
export function endWindow(window: ChhuttiWindow, now: number, today: string): ChhuttiWindow {
  const started = now >= new Date(`${today}T${window.from}:00`).getTime();
  return { ...window, until: started ? today : shiftDay(today, -1) };
}

/**
 * One event from the phone's usage log, reduced to what the count needs: an app coming to the front ('fg') or
 * leaving it ('bg'), for every app (the package is used in memory only, never stored), the screen on or off, and
 * the phone starting up or shutting down ('boot', 'down'; Android 10+).
 */
export type UsageEvent = { type: 'fg' | 'bg' | 'on' | 'off' | 'boot' | 'down'; at: number; pkg?: string };
export type WindowUsage = { chosenAppMs: number; darkMs: number | null };

/**
 * Minutes with a chosen app open on a lit screen (and with the screen dark) inside [fromMs, toMs], from usage
 * events (Codex A items 55-56). It tracks the SET of resumed apps: 'fg' adds an app, 'bg' removes it, and a start-up
 * or shutdown empties it; split screen and picture-in-picture are simply two apps in the set. A dark screen pauses
 * the count but keeps the set, so a screen that comes back on to the same app counts again with no new 'fg'.
 * Chosen time is the union of the moments when the screen is not dark and any chosen app is in the set.
 * The log is read from the last start-up before the window, or from its first event (Android sends a day). An app
 * whose first event is a 'bg' was already open when the log began. It answers only when it can know: the log
 * reaches back before the window (`logStart`), at least one event comes before the window to build the set from,
 * and the phone did not start up or shut down inside the window. Anything else is unknown (null): the person is
 * asked instead, and an unknown window is never "kept".
 */
export function windowUsage(events: readonly UsageEvent[], fromMs: number, toMs: number, chosen: readonly string[], logStart?: number | null): WindowUsage | null {
  if (!(toMs > fromMs)) return null;
  if (typeof logStart === 'number' && logStart > fromMs) return null;
  let sorted = [...events].filter(event => Number.isFinite(event.at) && event.at <= toMs).sort((a, b) => a.at - b.at);
  if (sorted.some(event => (event.type === 'boot' || event.type === 'down') && event.at > fromMs)) return null;
  const lastBoot = sorted.map(event => event.type === 'boot').lastIndexOf(true);
  const fromBoot = lastBoot >= 0;
  if (fromBoot) sorted = sorted.slice(lastBoot);
  if (!sorted.some(event => event.at <= fromMs)) return null;
  const isChosen = new Set(chosen);
  // Apps open before the log began show up first as a 'bg'; after a start-up nothing was open.
  const open = new Set<string>();
  if (!fromBoot) {
    const seen = new Set<string>();
    for (const event of sorted) {
      if ((event.type !== 'fg' && event.type !== 'bg') || !event.pkg || seen.has(event.pkg)) continue;
      seen.add(event.pkg);
      if (event.type === 'bg') open.add(event.pkg);
    }
  }
  let dark: boolean | null = null;
  const step = (event: UsageEvent) => {
    if (event.type === 'fg' && event.pkg) open.add(event.pkg);
    else if (event.type === 'bg' && event.pkg) open.delete(event.pkg);
    else if (event.type === 'boot' || event.type === 'down') { open.clear(); dark = event.type === 'down'; }
    else if (event.type === 'off') dark = true;
    else if (event.type === 'on') dark = false;
  };
  for (const event of sorted) if (event.at <= fromMs) step(event);
  // A screen whose state is unknown at the start but turns on inside the window was dark until then.
  const screenInside = sorted.filter(event => event.at > fromMs && (event.type === 'on' || event.type === 'off'));
  if (dark === null && screenInside.length) dark = screenInside[0]!.type === 'on';
  const sawScreen = dark !== null;
  let chosenMs = 0, darkMs = 0, at = fromMs;
  const add = (until: number) => {
    const span = Math.max(0, until - at);
    if (dark) darkMs += span;
    else if ([...open].some(pkg => isChosen.has(pkg))) chosenMs += span;
    at = until;
  };
  for (const event of sorted) {
    if (event.at <= fromMs) continue;
    add(event.at);
    step(event);
  }
  add(toMs);
  return { chosenAppMs: chosenMs, darkMs: sawScreen ? darkMs : null };
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
  // The ramp grows the current bounds; the caller keeps earlier days' bounds with withBounds.
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
    if (!isLive(window) || !appliesOn(window, day) || settings.some(row => row.key === `${CHHUTTI_KEY}.skip:${day}:${window.id}` && row.value === true && !row.deleted)) return false;
    const { fromMs, toMs } = windowBounds(window, day);
    return now >= fromMs && now < toMs;
  });
}
