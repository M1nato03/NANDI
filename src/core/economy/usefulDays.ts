import type { LedgerRow, SettingRow } from '../../data/types';
import type { EconomyDay } from './deriveEconomy';
import { addEconomyDays, CLOSE_PREFIX, seasonFor, weekStart } from './deriveEconomy';
import { RULES } from '../rules.config';
import { sessionCounts } from '../train/counts';

/**
 * Spec 47b (moved here from core/yatra for spec 45b decision 7): the one selector for useful days. Home's top line,
 * You's week, the record and the season result all read it. A useful day is a date that met the economy's `mark`
 * (a planned task done, a workout or rest, a mind slot, or a soft day's gentle thing), at most once per date. Opens,
 * timers, XP alone, Calm minutes, chhutti and a rest or away date alone never count.
 *
 * It only counts up: each proved date is kept in settings (`useful.confirmed:<season start>`, or `:preseason` before
 * Season 1), so a late sync, a changed rest pick or a restore cannot take one away. The kept set can never add a
 * date the ledger did not prove first: only `confirmUpdates` writes it, and only from a marked day.
 */
export const SEASON_ONE = '2026-11-02';
export const CONFIRMED_PREFIX = 'useful.confirmed:';
export const LONGEST_KEY = 'useful.longestRun';
export const TARGET_KEY = 'useful.weeklyTarget';
export const TARGETS = [3, 4, 5, 7] as const;
export type WeeklyTarget = typeof TARGETS[number];
export type TargetEntry = { fromWeek: string; target: WeeklyTarget };

type Settings = readonly Pick<SettingRow, 'key' | 'value' | 'deleted'>[];
type Days = readonly Pick<EconomyDay, 'dayKey' | 'mark'>[];
const setting = (settings: Settings, key: string) => settings.find(row => row.key === key && !row.deleted)?.value;

/** The kept set a date belongs to: its season's start, or `preseason` before Season 1. */
export const confirmedScope = (day: string): string => day < SEASON_ONE ? 'preseason' : seasonFor(day).start;
export const confirmedKey = (day: string): string => `${CONFIRMED_PREFIX}${confirmedScope(day)}`;

/** Sorted, unique date keys from a kept set, bounded to its own interval (a stray key outside it is ignored). */
export function readConfirmed(value: unknown, scope: string): string[] {
  if (!Array.isArray(value)) return [];
  const inScope = (key: unknown): key is string => typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key) && confirmedScope(key) === scope;
  return [...new Set(value.filter(inScope))].sort();
}

/** Every useful date from `from` to `through`: the marked days, and the kept dates for that span. */
export function usefulDates(days: Days, settings: Settings, from: string, through: string): string[] {
  const dates = new Set(days.filter(day => day.mark && day.dayKey >= from && day.dayKey <= through).map(day => day.dayKey));
  const scopes = new Set([confirmedScope(from), confirmedScope(through)]);
  for (const scope of scopes) for (const key of readConfirmed(setting(settings, `${CONFIRMED_PREFIX}${scope}`), scope)) if (key >= from && key <= through) dates.add(key);
  return [...dates].sort();
}

/** Home's line: "N useful days this season" ("this week" before Season 1 is active). It only counts up. */
export function usefulDays(days: Days, season: { active: boolean; start: string }, today: string, settings: Settings = []): { count: number; span: 'season' | 'week'; from: string; dates: string[] } {
  const span = season.active ? 'season' : 'week';
  const from = season.active ? season.start : weekStart(today);
  const dates = usefulDates(days, settings, from, today);
  return { count: dates.length, span, from, dates };
}

/**
 * The settings rows to write so every proved date up to today is kept: one row per kept set that gains a date, the
 * union of what it had and what the ledger now proves. A future-dated mark is never kept. Empty when nothing is new.
 */
export function confirmUpdates(days: Days, settings: Settings, today: string): { key: string; value: string[] }[] {
  const proved = new Map<string, string[]>();
  for (const day of days) if (day.mark && day.dayKey <= today) proved.set(confirmedScope(day.dayKey), [...proved.get(confirmedScope(day.dayKey)) ?? [], day.dayKey]);
  const out: { key: string; value: string[] }[] = [];
  for (const [scope, keys] of proved) {
    const key = `${CONFIRMED_PREFIX}${scope}`;
    const kept = readConfirmed(setting(settings, key), scope);
    const union = [...new Set([...kept, ...keys])].sort();
    if (union.length > kept.length) out.push({ key, value: union });
  }
  return out;
}

/** Restore keeps both sides' kept dates (a restore can never lower a count). */
export function mergeConfirmed(scope: string, a: unknown, b: unknown): string[] {
  return [...new Set([...readConfirmed(a, scope), ...readConfirmed(b, scope)])].sort();
}

const isEntry = (row: unknown): row is TargetEntry => !!row && typeof row === 'object'
  && typeof (row as TargetEntry).fromWeek === 'string' && /^\d{4}-\d{2}-\d{2}$/.test((row as TargetEntry).fromWeek)
  && weekStart((row as TargetEntry).fromWeek) === (row as TargetEntry).fromWeek && (TARGETS as readonly number[]).includes((row as TargetEntry).target);
/** The weekly target's history, valid entries only, oldest first (one per week). Missing or broken means 4. */
export function readTargets(value: unknown): TargetEntry[] {
  if (!Array.isArray(value)) return [];
  const byWeek = new Map(value.filter(isEntry).map(row => [row.fromWeek, row.target] as const));
  return [...byWeek].sort(([a], [b]) => a.localeCompare(b)).map(([fromWeek, target]) => ({ fromWeek, target }));
}
/** The target in force for the week holding `day`: the latest entry from that week's Monday or before. */
export function targetFor(entries: readonly TargetEntry[], day: string): WeeklyTarget {
  const monday = weekStart(day);
  return entries.filter(row => row.fromWeek <= monday).at(-1)?.target ?? 4;
}
/** A target set today starts next Monday, so a week under way keeps its target; a newer choice replaces the pending one. */
export function setTarget(entries: readonly TargetEntry[], today: string, target: WeeklyTarget): TargetEntry[] {
  const next = addEconomyDays(weekStart(today), 7);
  const kept = entries.filter(row => row.fromWeek < next);
  return targetFor(kept, next) === target ? kept : [...kept, { fromWeek: next, target }];
}
/** The change waiting for next Monday, if there is one. */
export function pendingTarget(entries: readonly TargetEntry[], today: string): TargetEntry | undefined {
  const next = addEconomyDays(weekStart(today), 7);
  const pending = entries.find(row => row.fromWeek === next);
  return pending && pending.target !== targetFor(entries, today) ? pending : undefined;
}
/** Restore: the backup's entry wins for a week both have; a week only this phone has stays. No week moves. */
export function mergeTargets(phone: unknown, backup: unknown): TargetEntry[] {
  const byWeek = new Map([...readTargets(phone), ...readTargets(backup)].map(row => [row.fromWeek, row.target] as const));
  return readTargets([...byWeek].map(([fromWeek, target]) => ({ fromWeek, target })));
}

/** This week, Monday to Sunday: which days were useful. */
export function weekDots(dates: readonly string[], today: string): { dayKey: string; useful: boolean }[] {
  const monday = weekStart(today);
  const set = new Set(dates);
  return Array.from({ length: 7 }, (_, index) => { const key = addEconomyDays(monday, index); return { dayKey: key, useful: set.has(key) && key <= today }; });
}

/** Clean weeks from `from` on: Monday-to-Sunday weeks with four Hat-trick days (a record, not the weekly target). */
export function cleanWeeks(days: readonly Pick<EconomyDay, 'dayKey' | 'hatTrick'>[], from: string, today: string): number {
  let count = 0;
  for (let monday = weekStart(from); monday <= today; monday = addEconomyDays(monday, 7)) {
    const sunday = addEconomyDays(monday, 6);
    if (days.filter(day => day.hatTrick && day.dayKey >= from && day.dayKey >= monday && day.dayKey <= sunday && day.dayKey <= today).length >= RULES.streak.cleanWeekHatTricks) count++;
  }
  return count;
}

/**
 * The longest run, as the old day chain counted it then (rest days included): the highest of today's chain, every
 * day's close and the floor already kept. The chain itself is no longer shown; only this record of it is.
 */
export function longestRun(settings: Settings, chainToday: number): number {
  let high = Math.max(0, chainToday);
  const floor = Number(setting(settings, LONGEST_KEY));
  if (Number.isFinite(floor)) high = Math.max(high, floor);
  for (const row of settings) if (!row.deleted && row.key.startsWith(CLOSE_PREFIX)) {
    const streak = Number((row.value as { streak?: unknown } | null)?.streak);
    if (Number.isFinite(streak)) high = Math.max(high, streak);
  }
  return Math.floor(high);
}

export type RecordDay = { dayKey: string; items: string[] };

/**
 * The record behind the count: each useful day, newest first, with what was finished on it, read from the ledger.
 * `titles` names done tasks by id; tasks with no title left are counted together ("2 planned tasks"). A kept date whose rows are gone
 * (a deletion, a late import) says "Useful day recorded", never an invented action.
 */
export function usefulRecord(dates: readonly string[], facts: readonly LedgerRow[], titles: ReadonlyMap<string, string> = new Map()): RecordDay[] {
  return [...dates].sort().reverse().map(key => {
    const rows = facts.filter(row => !row.deleted && row.dayKey === key);
    const count = (test: (row: LedgerRow) => boolean) => rows.filter(test).length;
    const items: string[] = [];
    const tasks = rows.filter(row => row.mode === 'tasks' && row.kind === 'done');
    for (const row of tasks) { const title = titles.get(row.refId); if (title) items.push(title); }
    const untitled = tasks.filter(row => !titles.has(row.refId)).length;
    if (untitled) items.push(untitled === 1 ? 'A planned task' : `${untitled} planned tasks`);
    const sessions = count(row => row.mode === 'train' && row.kind === 'session' && sessionCounts(row.inputs ?? {}));
    if (sessions) items.push(sessions === 1 ? 'A workout' : `${sessions} workouts`);
    if (count(row => row.mode === 'train' && row.kind === 'rest')) items.push('A rest-day walk');
    const ideas = count(row => row.mode === 'read' && row.kind === 'idea');
    if (ideas) items.push(ideas === 1 ? 'An idea read' : `${ideas} ideas read`);
    if (count(row => row.mode === 'read' && row.kind === 'chapter-check')) items.push('A Book check');
    const boards = count(row => row.mode === 'mind' && row.kind === 'board');
    if (boards) items.push(boards === 1 ? 'A puzzle board' : `${boards} puzzle boards`);
    if (count(row => row.mode === 'mind' && row.kind === 'mystery' && row.inputs.result === 'solved')) items.push('A case solved');
    if (count(row => row.kind === 'learn-drop')) items.push('The day\'s drop');
    const calm = rows.filter(row => row.mode === 'calm' && row.kind === 'session').reduce((sum, row) => sum + (Number(row.inputs.minutes) > 0 ? Math.floor(Number(row.inputs.minutes)) : 0), 0);
    if (calm) items.push(`Calm, ${calm} min`);
    if (count(row => row.mode === 'soft' && row.kind === 'soft')) items.push('A gentle thing on a soft day');
    return { dayKey: key, items: items.length ? items : ['Useful day recorded'] };
  });
}
