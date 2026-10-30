import { addEconomyDays } from './economy/deriveEconomy';
import { guardedSpans, type GuardEvent } from './focusGuard';
import type { LedgerRow, SettingRow } from '../data/types';

/**
 * Spec 39, the opens log (for the 2-week kill test and P2 "Hours back"): for each day, how often each app picked for
 * the Pause card was opened and how long it stayed in front, read afterwards from Android's own usage log, plus the
 * minutes in the app after each "Open anyway". Only the picked apps' package names, counts and minutes are kept, in
 * one setting that follows the backup rules of every other setting; no other app is named or counted. The log starts
 * the day the card is first on and reads the 7 days before it at once, so the week before is the baseline. Every
 * figure uses NANDI's day, 04:00 to 04:00: today, the last 7 days, the week before and the "log reaches back" check.
 */
export const OPENS_KEY = 'pause.opens';
/** Days read back when the log starts: the baseline week. */
export const OPENS_BACK_DAYS = 7;
/** Days kept: the baseline, the 2-week test and a little more. */
export const OPENS_KEEP_DAYS = 35;
/** Two stretches in one app this close together are one open (a share sheet, a permission prompt, a quick look away). */
export const SAME_OPEN_GAP_MS = 30_000;
/** Read from this long before 04:00, so an app already in front is known and a log that starts too late is seen. */
export const LEAD_MS = 12 * 60 * 60 * 1000;
/** An "Open anyway" belongs to the open that starts within this long of it. */
const ANYWAY_MS = 60_000;

export type AppDay = { opens: number; ms: number };
export interface OpensDay {
  apps: Record<string, AppDay>;
  /** "Open anyway" taps that day, and the time in the app after them. */
  anyway: { count: number; ms: number };
  /** The day is over and was read in full. */
  whole: boolean;
  /** The phone's log reached back before the day began; a day it did not cover never counts. */
  covered: boolean;
}
export interface OpensLog { since: string; days: Record<string, OpensDay> }

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const count = (raw: unknown) => typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : 0;

/** NANDI's day runs from 04:00 to 04:00. */
export function dayBounds(day: string): { fromMs: number; toMs: number } {
  return { fromMs: new Date(`${day}T04:00:00`).getTime(), toMs: new Date(`${addEconomyDays(day, 1)}T04:00:00`).getTime() };
}

export function readOpensLog(settings: readonly SettingRow[]): OpensLog | null {
  const raw = settings.find(row => row.key === OPENS_KEY && !row.deleted)?.value as { since?: unknown; days?: unknown } | undefined;
  if (!raw || typeof raw.since !== 'string' || !DAY.test(raw.since)) return null;
  const days: Record<string, OpensDay> = {};
  for (const [day, value] of Object.entries(raw.days && typeof raw.days === 'object' ? raw.days as Record<string, unknown> : {})) {
    if (!DAY.test(day) || !value || typeof value !== 'object') continue;
    const item = value as { apps?: unknown; anyway?: { count?: unknown; ms?: unknown }; whole?: unknown; covered?: unknown };
    const apps: Record<string, AppDay> = {};
    for (const [pkg, app] of Object.entries(item.apps && typeof item.apps === 'object' ? item.apps as Record<string, { opens?: unknown; ms?: unknown }> : {})) apps[pkg] = { opens: count(app?.opens), ms: count(app?.ms) };
    days[day] = { apps, anyway: { count: count(item.anyway?.count), ms: count(item.anyway?.ms) }, whole: item.whole === true, covered: item.covered === true };
  }
  return { since: raw.since, days };
}

/** Each app's opens in [fromMs, toMs], as [start, end] spans with near ones joined; an open that began earlier is cut at fromMs. */
export function openSpans(events: readonly GuardEvent[], readFrom: number, fromMs: number, toMs: number, packageName: string): [number, number][] {
  const joined: [number, number][] = [];
  for (const [start, end] of guardedSpans(events, readFrom, toMs, [packageName])) {
    const last = joined.at(-1);
    if (last && start - last[1] < SAME_OPEN_GAP_MS) last[1] = end;
    else joined.push([start, end]);
  }
  return joined.filter(([, end]) => end > fromMs).map(([start, end]) => [Math.max(start, fromMs), end]);
}

/**
 * One day from the usage log read from `readFrom` (LEAD_MS before the day) to `toMs`. An open counts on the day it
 * began; its minutes count on the day they fell. `attempts` are that day's Pause card answers.
 */
export function opensDay(events: readonly GuardEvent[], day: string, readFrom: number, toMs: number, packages: readonly string[], attempts: readonly LedgerRow[], whole: boolean): OpensDay {
  const { fromMs } = dayBounds(day);
  const apps: Record<string, AppDay> = {};
  const spans = new Map<string, [number, number][]>();
  for (const pkg of new Set(packages)) {
    const list = openSpans(events, readFrom, fromMs, toMs, pkg);
    spans.set(pkg, list);
    const opens = list.filter(([start]) => start > fromMs).length;
    const ms = list.reduce((sum, [start, end]) => sum + end - start, 0);
    if (opens || ms) apps[pkg] = { opens, ms };
  }
  const anyway = { count: 0, ms: 0 };
  for (const row of attempts) {
    if (row.deleted || row.mode !== 'pause' || row.kind !== 'attempt' || row.dayKey !== day || row.inputs.outcome !== 'opened_anyway') continue;
    const at = Number(row.refId);
    anyway.count += 1;
    const open = spans.get(String(row.inputs.packageName))?.find(([start, end]) => start <= at + ANYWAY_MS && end >= at);
    if (open) anyway.ms += open[1] - Math.max(open[0], at);
  }
  const covered = events.some(event => Number.isFinite(event.at) && event.at < fromMs);
  return { apps, anyway, whole, covered };
}

/** The days to read now: the 7 before the log began, then every day up to today that is not yet read in full. */
export function daysToRead(log: OpensLog | null, today: string): string[] {
  const since = log?.since ?? today;
  const first = addEconomyDays(since, -OPENS_BACK_DAYS);
  const days: string[] = [];
  for (let day = first; day <= today; day = addEconomyDays(day, 1)) {
    if (day < addEconomyDays(today, -OPENS_KEEP_DAYS + 1)) continue;
    if (!log?.days[day]?.whole) days.push(day);
  }
  return days;
}

export function keptDays(days: Record<string, OpensDay>, today: string): Record<string, OpensDay> {
  const oldest = addEconomyDays(today, -OPENS_KEEP_DAYS + 1);
  return Object.fromEntries(Object.entries(days).filter(([day]) => day >= oldest && day <= today));
}

export interface OpensSummary {
  today: AppDay;
  /** The whole, covered days before the log began (up to 7): a day's average, or null with fewer than 3 such days. */
  before: (AppDay & { days: number }) | null;
  /** The last 7 whole, covered days since the log began: a day's average, or null before the first whole day. */
  lately: (AppDay & { days: number }) | null;
  /** Average minutes in the app after an "Open anyway", over the same 7 days and today. */
  afterAnyway: { count: number; ms: number };
}

const sum = (day: OpensDay | undefined, packages: readonly string[]): AppDay => packages.reduce((total, pkg) => ({ opens: total.opens + (day?.apps[pkg]?.opens ?? 0), ms: total.ms + (day?.apps[pkg]?.ms ?? 0) }), { opens: 0, ms: 0 });
function average(days: OpensDay[], packages: readonly string[]): AppDay & { days: number } {
  const total = days.reduce((all, day) => { const one = sum(day, packages); return { opens: all.opens + one.opens, ms: all.ms + one.ms }; }, { opens: 0, ms: 0 });
  return { opens: Math.round(total.opens / days.length), ms: Math.round(total.ms / days.length), days: days.length };
}

/** The numbers Plan → Pause card shows, for the apps picked now. */
export function summarizeOpens(log: OpensLog, packages: readonly string[], today: string): OpensSummary {
  const counted = (day: string) => !!log.days[day]?.whole && !!log.days[day]?.covered;
  const before: OpensDay[] = [];
  for (let back = 1; back <= OPENS_BACK_DAYS; back += 1) { const day = addEconomyDays(log.since, -back); if (counted(day)) before.push(log.days[day]!); }
  const lately: OpensDay[] = [];
  const recent: OpensDay[] = [];
  for (let back = 1; back <= 7; back += 1) {
    const day = addEconomyDays(today, -back);
    if (day < log.since || !log.days[day]) continue;
    recent.push(log.days[day]!);
    if (counted(day)) lately.push(log.days[day]!);
  }
  if (log.days[today]) recent.push(log.days[today]!);
  const afterAnyway = recent.reduce((all, day) => ({ count: all.count + day.anyway.count, ms: all.ms + day.anyway.ms }), { count: 0, ms: 0 });
  return {
    today: sum(log.days[today], packages),
    before: before.length >= 3 ? average(before, packages) : null,
    lately: lately.length ? average(lately, packages) : null,
    afterAnyway,
  };
}
