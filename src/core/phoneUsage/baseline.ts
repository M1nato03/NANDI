import type { PhoneUsageRow, SettingRow } from '../../data/types';
import { PHONE_USAGE_CATALOG } from '../rules.config';
import { addCalendarDays } from './calendarDay';

/**
 * Spec 46a: the record's own settings. All of them describe this phone, so none is in a backup (data/backup's
 * device-local rule takes every key with this prefix) and a restore keeps this phone's values.
 */
export const PHONE_USAGE_PREFIX = 'phoneUsage.';
export const PHONE_USAGE_KEYS = {
  /** When the record began on this phone, and whether the Pause card was on then. */
  since: 'phoneUsage.since',
  /** true once the person tapped "Stop and delete the record". */
  off: 'phoneUsage.off',
  /** Frozen starting weeks, oldest first. Appended to, never rewritten. */
  baselines: 'phoneUsage.baselines',
  /** The phone's clock and time zone at the last read, to see a clock or zone change since. */
  clock: 'phoneUsage.clock',
  /** The set of apps in force now and the first day it covers (a change is dated the day it was seen). */
  set: 'phoneUsage.set',
} as const;
/** Days read back when the record begins (Android keeps about ten); never further. */
export const BACKFILL_DAYS = 9;
/** Rows kept: a starting week, 30 days to compare and room to look at gaps. A frozen week's rows are always kept. */
export const KEEP_DAYS = 60;
export const BASELINE_DAYS = 7;

export type Since = { at: number; day: string; pauseWasOn: boolean };
export interface Baseline {
  days: string[];
  setId: string;
  catalogId: string;
  picked: string[];
  deviceId: string;
  frozenAt: number;
  /** 'starting': the Pause card was off when the record began and every day is from then on; else 'first-measured'. */
  label: 'starting' | 'first-measured';
}

const value = (settings: readonly SettingRow[], key: string) => settings.find(row => row.key === key && !row.deleted)?.value;

/** The apps the person picked for the Pause card (never the defaults it shows before a pick), or null. */
export function pickedApps(settings: readonly SettingRow[]): string[] | null {
  const apps = value(settings, 'night.pause.apps');
  const list = Array.isArray(apps) ? [...new Set(apps.filter((item): item is string => typeof item === 'string' && item.length > 0))] : [];
  return list.length ? list : null;
}

/** Every package the record keeps: the picked ones, then the catalog's others (a picked app is never also a substitute). */
export function trackedPackages(picked: readonly string[]): { packageName: string; group: 'picked' | 'substitute' }[] {
  const mine = new Set(picked);
  return [...[...mine].map(packageName => ({ packageName, group: 'picked' as const })),
    ...PHONE_USAGE_CATALOG.packages.filter(pkg => !mine.has(pkg)).map(packageName => ({ packageName, group: 'substitute' as const }))];
}

export const setIdFor = (picked: readonly string[]) => `${PHONE_USAGE_CATALOG.id}|${[...new Set(picked)].sort().join(',')}`;

export function readSince(settings: readonly SettingRow[]): Since | null {
  const raw = value(settings, PHONE_USAGE_KEYS.since) as Partial<Since> | undefined;
  return raw && typeof raw.at === 'number' && typeof raw.day === 'string' ? { at: raw.at, day: raw.day, pauseWasOn: raw.pauseWasOn !== false } : null;
}

export type AppSet = { setId: string; day: string };
export function readAppSet(settings: readonly SettingRow[]): AppSet | null {
  const raw = value(settings, PHONE_USAGE_KEYS.set) as Partial<AppSet> | undefined;
  return raw && typeof raw.setId === 'string' && typeof raw.day === 'string' ? { setId: raw.setId, day: raw.day } : null;
}

export function readBaselines(settings: readonly SettingRow[]): Baseline[] {
  const raw = value(settings, PHONE_USAGE_KEYS.baselines);
  return Array.isArray(raw) ? raw.filter((item): item is Baseline => !!item && Array.isArray(item.days) && typeof item.setId === 'string') : [];
}

/**
 * The starting week for this set of apps, if it can be frozen now: the first seven calendar days in a row, all on or
 * after the day this set began (`set.day`), on which every tracked package was measured (no unknown). A row read late
 * is not enough on its own: the day must have been under this set. Missing days only delay it; a heavy week is never
 * picked over an earlier one. Null while the last frozen week already belongs to this set, or none qualifies.
 */
export function baselineToFreeze(rows: readonly PhoneUsageRow[], picked: readonly string[], set: AppSet, since: Since, baselines: readonly Baseline[], deviceId: string, now: number): Baseline | null {
  const setId = setIdFor(picked);
  if (baselines.at(-1)?.setId === setId || set.setId !== setId) return null;
  const packages = trackedPackages(picked).map(item => item.packageName);
  const byDay = new Map<string, Map<string, PhoneUsageRow>>();
  for (const row of rows) {
    if (row.deleted) continue;
    if (!byDay.has(row.dayKey)) byDay.set(row.dayKey, new Map());
    byDay.get(row.dayKey)!.set(row.packageName, row);
  }
  const complete = (day: string) => { const found = byDay.get(day); return day >= set.day && !!found && packages.every(pkg => { const row = found.get(pkg); return !!row && row.foregroundMs !== null; }); };
  const days = [...byDay.keys()].filter(complete).sort();
  for (const first of days) {
    const week = Array.from({ length: BASELINE_DAYS }, (_, i) => addCalendarDays(first, i));
    if (!week.every(complete)) continue;
    return { days: week, setId, catalogId: PHONE_USAGE_CATALOG.id, picked: [...new Set(picked)].sort(), deviceId, frozenAt: now,
      label: !since.pauseWasOn && week[0]! >= since.day ? 'starting' : 'first-measured' };
  }
  return null;
}
