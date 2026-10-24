import { ulid } from 'ulidx';
import { trackWrite } from '../../core/pendingWrites';
import { addEconomyDays } from '../../core/economy/deriveEconomy';
import { appliesOn, boundWindow, CHHUTTI_KEY, chhuttiFactId, endWindow, isKept, isLive, lockChecks, lockTrustFrom, NEW_LOCK_TEST, nextLockTest, rampedWindow, rolledBack, readChhutti, windowBounds, windowUsage, withBounds, type ChhuttiWindow, type LockEvent, type LockTest, type UsageEvent } from '../../core/plan/chhutti';
import { dayClock, shareWindow } from '../../core/shareGate';
import { DEFAULT_PAUSE_APPS } from '../../core/nightPause';
import { RULES } from '../../core/rules.config';
import { dayKey } from '../../core/time';
import { readLockEvents, readWindowEvents } from '../../platform/nightPause';
import { getOrCreateDeviceId } from '../device';
import { restoreActive } from '../restoreLock';
import type { NandiDb } from '../db';
import type { LedgerRow, SettingRow } from '../types';

type ReadEvents = (from: number, to: number, packages: string[]) => Promise<{ logStart?: number; events: UsageEvent[]; lockSafe?: boolean } | null>;
type ReadLock = (since: number) => Promise<LockEvent[] | null>;
const live = (rows: readonly SettingRow[], key: string) => rows.find(row => row.key === key && !row.deleted)?.value;
/** Tonight's effective shutdown and bedtime (busy-day shift included), the clock the rest of Plan uses (item 55). */
async function clockOf(db: NandiDb, rows: readonly SettingRow[], now: number) {
  return dayClock(now, rows, await db.tasks.where('dayKey').equals(dayKey(now)).toArray());
}
const skipKey = (day: string, id: string) => `${CHHUTTI_KEY}.skip:${day}:${id}`;
/** Each day's effective shutdown, written once at an open BEFORE that day's window starts (item 56). */
export const CHHUTTI_SHUTDOWNS_KEY = `${CHHUTTI_KEY}.shutdowns`;
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
function readShutdowns(rows: readonly SettingRow[]): Record<string, string> {
  const value = live(rows, CHHUTTI_SHUTDOWNS_KEY);
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter((entry): entry is [string, string] => /^\d{4}-\d{2}-\d{2}$/.test(entry[0]) && typeof entry[1] === 'string' && CLOCK.test(entry[1])));
}
/** That day's effective shutdown under the settings as they are now (busy-day shift from that day's tasks). */
async function shutdownOn(db: NandiDb, rows: readonly SettingRow[], day: string): Promise<string> {
  return dayClock(new Date(`${day}T12:00:00`).getTime(), rows, await db.tasks.where('dayKey').equals(day).toArray()).shutdown;
}
/**
 * A day's bounds, cut back to that day's shutdown: the one recorded before its window started, or, with no record,
 * the shutdown the settings give that day now (items 56-57). A window cut to nothing did not happen that day.
 */
async function dayBounds(db: NandiDb, rows: readonly SettingRow[], window: ChhuttiWindow, day: string, shutdowns: Record<string, string>): Promise<{ fromMs: number; toMs: number } | null> {
  const { fromMs, toMs } = windowBounds(window, day);
  const shutdown = shutdowns[day] ?? await shutdownOn(db, rows, day);
  const end = Math.min(toMs, new Date(`${day}T${shutdown}:00`).getTime());
  return end > fromMs ? { fromMs, toMs: end } : null;
}

async function putWindows(db: NandiDb, windows: ChhuttiWindow[], now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  // A removed window is kept only while its days can still be read.
  const oldest = addEconomyDays(dayKey(now), -(CHHUTTI_LOOKBACK_DAYS + 1));
  // Bounds of days older than the read-back are dropped too (item 57 note).
  const kept = windows.filter(window => !window.until || window.until >= oldest).map(window => {
    if (!window.past?.some(item => item.through < oldest)) return window;
    const past = window.past.filter(item => item.through >= oldest);
    const trimmed: ChhuttiWindow = { ...window, past };
    if (!past.length) delete trimmed.past;
    return trimmed;
  });
  await trackWrite(() => db.settings.put({ key: CHHUTTI_KEY, value: { windows: kept }, updatedAt: now, deleted: 0, deviceId }));
}

/** Adds or changes a window: a label and a start time; its length starts at `startMin` and only the ramp grows it. */
export async function saveChhuttiWindow(db: NandiDb, input: { id?: string; label: string; from: string; weekdays?: number[] }, now = Date.now()): Promise<ChhuttiWindow> {
  const rows = await db.settings.toArray();
  const windows = readChhutti(rows);
  const old = input.id ? windows.find(window => window.id === input.id && isLive(window)) : undefined;
  const length = old ? Number(old.to.slice(0, 2)) * 60 + Number(old.to.slice(3)) - (Number(old.from.slice(0, 2)) * 60 + Number(old.from.slice(3))) : RULES.plan.chhutti.startMin;
  const bounded = boundWindow(input.from, length, (await clockOf(db, rows, now)).shutdown);
  const today = dayKey(now);
  const label = input.label.trim().slice(0, 40) || 'My chhutti';
  const weekdays = input.weekdays?.length ? [...input.weekdays] : undefined;
  // A new window counts from today only if it was planned before it starts; otherwise from tomorrow. A changed one
  // keeps every started day's bounds and weekdays (withBounds), so no day already under way is rewritten (55, 56).
  // A saved App pause list the log has not seen is noted when a window is planned (Codex A items 68, 69).
  await noteApps(db, now);
  const window: ChhuttiWindow = old
    ? withBounds({ ...old, label }, { ...bounded, weekdays }, now, today)
    : { id: ulid(now), label, ...bounded, since: now < new Date(`${today}T${bounded.from}:00`).getTime() ? today : addEconomyDays(today, 1), ...(weekdays ? { weekdays } : {}) };
  await putWindows(db, [...windows.filter(item => item.id !== window.id), window], now);
  return window;
}

/** "Turn off": the window ends with the last day that has started, so those days are still read (item 56). */
export async function removeChhuttiWindow(db: NandiDb, id: string, now = Date.now()): Promise<void> {
  const today = dayKey(now);
  await putWindows(db, readChhutti(await db.settings.toArray()).map(window => window.id === id && isLive(window) ? endWindow(window, now, today) : window), now);
}

/** "Not today": moves today's window out of the way. No budget, no copy about it. */
export async function skipChhuttiToday(db: NandiDb, id: string, now = Date.now()): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key: skipKey(dayKey(now), id), value: true, updatedAt: now, deleted: 0, deviceId }));
}

export type ChhuttiPending = { day: string; window: ChhuttiWindow };
/** Lights-out (after bedtime, and until 06:00, as for shares): the card shows no result and asks nothing. */
export async function chhuttiInLightsOut(db: NandiDb, now = Date.now()): Promise<boolean> {
  const today = dayKey(now);
  const [rows, tasks, log] = await Promise.all([db.settings.toArray(), db.tasks.where('dayKey').equals(today).toArray(), db.dailyLog.get(today)]);
  return shareWindow(now, rows, tasks, log?.windDownAt) === 'lightsOut';
}
/** How many days back an unrecorded window is still read (Android keeps "a few days" of events). */
export const CHHUTTI_LOOKBACK_DAYS = 7;
/**
 * At an open: every planned window of the last 7 days (from `since`, to `until` for a removed one) that has ended
 * and has no fact yet is read from the phone's usage events and gets one fact. Where the log cannot answer (web,
 * Android 9 or older, access revoked, history gone, a restart inside the window, the phone locked), nothing is
 * written and the window is offered for a one-tap answer instead, for today and yesterday only (items 51-56).
 * In lights-out (after bedtime, and until 06:00) nothing is read or shown; the next open by day reads the same day.
 */
/** A native read that never answers counts as no log after `ms` (Codex A item 65), so checks never pile up. */
function withTimeout<T>(read: Promise<T>, ms: number): Promise<T | null> {
  return new Promise(resolve => {
    const timer = globalThis.setTimeout(() => resolve(null), ms);
    read.then(value => { globalThis.clearTimeout(timer); resolve(value); }, () => { globalThis.clearTimeout(timer); resolve(null); });
  });
}
/**
 * Checks and App pause list changes run one after another per database (Codex A items 63, 65, 68): the lock self-test,
 * the window reads and the fact writes of one check all finish before the next check or list change starts.
 */
const runs = new WeakMap<NandiDb, Promise<unknown>>();
function serial<T>(db: NandiDb, task: () => Promise<T>): Promise<T> {
  const before = runs.get(db) ?? Promise.resolve();
  const run = before.catch(() => undefined).then(task);
  runs.set(db, run);
  void run.finally(() => { if (runs.get(db) === run) runs.delete(db); }).catch(() => undefined);
  return run;
}
export function checkChhutti(db: NandiDb, now = Date.now(), read: ReadEvents = readWindowEvents, readLock: ReadLock = readLockEvents, timeoutMs = 10_000): Promise<ChhuttiPending[]> {
  return serial(db, () => checkOnce(db, now, read, readLock, timeoutMs));
}
async function checkOnce(db: NandiDb, now: number, read: ReadEvents, readLock: ReadLock, timeoutMs: number): Promise<ChhuttiPending[]> {
  if (restoreActive()) return [];
  const rows = await db.settings.toArray();
  const windows = readChhutti(rows);
  if (!windows.length) return [];
  if (await chhuttiInLightsOut(db, now)) return [];
  const today = dayKey(now);
  const trustLocksFrom = lockTrustFrom(await runLockTest(db, now, since => withTimeout(readLock(since), timeoutMs)));
  const shutdowns = await snapshotShutdown(db, rows, windows, now, (await clockOf(db, rows, now)).shutdown);
  const appLog = await noteApps(db, now);
  const pending: ChhuttiPending[] = [];
  for (let back = CHHUTTI_LOOKBACK_DAYS; back >= 0; back--) {
    const day = addEconomyDays(today, -back);
    for (const window of windows) {
      if (!appliesOn(window, day) || live(rows, skipKey(day, window.id)) === true) continue;
      if (await db.ledger.get(chhuttiFactId(day, window.id))) continue;
      const bounds = await dayBounds(db, rows, window, day, shutdowns);
      if (!bounds || bounds.toMs > now) continue;
      // The list in force that day decides whether the day can count at all; every app chosen on it or since is
      // checked for use (Codex A items 67, 68). No list noted on this phone by then, or an empty one: asked, never kept.
      const { eligible, packages } = appsAt(appLog, bounds.fromMs, now);
      const ask = () => { if (back <= 1 && isLive(window)) pending.push({ day, window }); };
      if (!eligible?.length || !packages.length) { ask(); continue; }
      const usageLog = await withTimeout(read(bounds.fromMs, bounds.toMs, packages), timeoutMs);
      // A start-up baseline needs no trust; only when the lock is the baseline does the fact depend on the self-test.
      const plain = usageLog ? windowUsage(usageLog.events, bounds.fromMs, bounds.toMs, packages, usageLog.logStart) : null;
      const lockFrom = usageLog?.lockSafe === true ? trustLocksFrom : null;
      const usage = plain ?? (usageLog && lockFrom !== null ? windowUsage(usageLog.events, bounds.fromMs, bounds.toMs, packages, usageLog.logStart, lockFrom) : null);
      // Unknown: only today and yesterday are asked about, so a week away never comes back as a list of questions.
      if (!usage) { ask(); continue; }
      const written = await writeFact(db, day, window, bounds, { chosenAppMs: usage.chosenAppMs, darkMs: usage.darkMs, source: 'usage', kept: isKept(usage, day) }, now, plain ? null : lockFrom, packages);
      if (written === 'untrusted' || written === 'changed') ask();
    }
  }
  return pending;
}

/**
 * This phone's lock self-test (Jenil's choice A, item 59). It is kept on this phone only: a restore never brings
 * another phone's result (backup deviceLocalKeys).
 */
export const CHHUTTI_LOCK_TEST_KEY = `${CHHUTTI_KEY}.lockTest`;
export function readLockTest(rows: readonly SettingRow[]): LockTest | null {
  const value = live(rows, CHHUTTI_LOCK_TEST_KEY) as Partial<LockTest> | undefined;
  if (!value || typeof value !== 'object' || !Number.isInteger(value.passes) || !Number.isFinite(value.upTo)) return null;
  const time = (item: unknown) => typeof item === 'number' && Number.isFinite(item) ? item : null;
  return { passes: Math.max(0, value.passes!), upTo: value.upTo!, streakStart: time(value.streakStart), lastFailAt: time(value.lastFailAt) };
}
/**
 * Reads the locks since the last one looked at and updates the count. No usage log (web, Android 9 or older, no
 * access) stores nothing new, so the card never says NANDI is learning a phone it cannot read; a stored count from a
 * clock now set back is still reset. The count is read again and written in one transaction, so a check that saw
 * fewer locks can never undo a fail another one recorded.
 */
async function runLockTest(db: NandiDb, now: number, readLock: ReadLock): Promise<LockTest | null> {
  const since = readLockTest(await db.settings.toArray())?.upTo ?? 0;
  const events = await readLock(since).catch(() => null);
  const deviceId = await getOrCreateDeviceId(db, now);
  return trackWrite(() => db.transaction('rw', db.settings, async () => {
    const stored = readLockTest(await db.settings.toArray());
    if (!events && !stored) return null;
    const test = stored ?? NEW_LOCK_TEST;
    const slack = RULES.plan.chhutti.lockSlackMs;
    const reset = rolledBack(test, events ?? [], now);
    const next = reset ?? (!events ? test : nextLockTest(test, lockChecks(events, test.upTo, now),
      // Every lock old enough to judge has now been looked at, whether NANDI was in front or not.
      events.filter(event => event.type === 'lock' && event.at > test.upTo && event.at + slack <= now).reduce((max, event) => Math.max(max, event.at), test.upTo)));
    if (stored && JSON.stringify(next) === JSON.stringify(stored)) return stored;
    await db.settings.put({ key: CHHUTTI_LOCK_TEST_KEY, value: next, updatedAt: now, deleted: 0, deviceId });
    return next;
  }));
}

/** The apps chosen for App pause now: the saved list, or the defaults until one is saved. */
export function chosenApps(rows: readonly SettingRow[]): string[] {
  const saved = live(rows, 'night.pause.apps');
  return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string') : DEFAULT_PAUSE_APPS.map(app => app.packageName);
}
/**
 * The App pause list's change log (Codex A items 67-69): one entry each time the saved list changes, stamped with this
 * phone's id. The raw defaults are never noted, only a list that was saved. For a window, the list in force at its
 * start decides whether it can count at all (none, or an empty one: asked, never kept), and every list in force from
 * its start until now is checked for use, so unticking an app afterwards never removes it from a day it was chosen on.
 * After a restore onto another phone the old phone's log is not used, so its days are asked about.
 */
export const CHHUTTI_APPS_KEY = `${CHHUTTI_KEY}.apps`;
type AppChange = { at: number; apps: string[] };
function readAppLog(rows: readonly SettingRow[], deviceId: string): AppChange[] {
  const value = live(rows, CHHUTTI_APPS_KEY) as { deviceId?: unknown; changes?: unknown } | undefined;
  if (!value || typeof value !== 'object' || value.deviceId !== deviceId || !Array.isArray(value.changes)) return [];
  return value.changes.filter((change): change is AppChange => !!change && typeof change === 'object' && Number.isFinite((change as AppChange).at)
    && Array.isArray((change as AppChange).apps) && (change as AppChange).apps.every(item => typeof item === 'string')).sort((x, y) => x.at - y.at);
}
const sameApps = (x: readonly string[], y: readonly string[]) => [...x].sort().join(',') === [...y].sort().join(',');
/**
 * Brings the log up to date with the saved list (or with `next`, about to be saved): a saved list the log has not seen
 * is added (the first one at the time it was saved on this phone), and entries older than the read-back are dropped
 * except the newest of them, which is still in force when the read-back begins.
 */
async function noteApps(db: NandiDb, now: number, next?: readonly string[]): Promise<AppChange[]> {
  const deviceId = await getOrCreateDeviceId(db, now);
  return trackWrite(() => db.transaction('rw', db.settings, async () => {
    const rows = await db.settings.toArray();
    const log = readAppLog(rows, deviceId);
    const savedRow = rows.find(row => row.key === 'night.pause.apps' && !row.deleted);
    const saved = Array.isArray(savedRow?.value) ? (savedRow.value as unknown[]).filter((item): item is string => typeof item === 'string') : null;
    if (!log.length && saved) log.push({ at: savedRow!.deviceId === deviceId ? Math.min(savedRow!.updatedAt, now) : now, apps: saved });
    const latest = next ? [...next] : saved;
    if (latest && (!log.length || !sameApps(log.at(-1)!.apps, latest))) log.push({ at: now, apps: latest });
    const edge = now - (CHHUTTI_LOOKBACK_DAYS + 1) * 86_400_000;
    const carried = log.filter(change => change.at < edge).at(-1);
    const changes = log.filter(change => change.at >= edge || change === carried);
    const value = { deviceId, changes };
    if (JSON.stringify(live(rows, CHHUTTI_APPS_KEY)) !== JSON.stringify(value)) await db.settings.put({ key: CHHUTTI_APPS_KEY, value, updatedAt: now, deleted: 0, deviceId });
    return changes;
  }));
}
/** For a window starting at `fromMs`: the list in force then (null if none was noted), and every app in force since. */
function appsAt(log: readonly AppChange[], fromMs: number, nowMs: number): { eligible: string[] | null; packages: string[] } {
  const inForce = log.filter(change => change.at <= fromMs).at(-1);
  const later = log.filter(change => change.at > fromMs && change.at <= nowMs);
  return { eligible: inForce ? inForce.apps : null, packages: [...new Set([...(inForce?.apps ?? []), ...later.flatMap(change => change.apps)])].sort() };
}
/** Saves the App pause list and notes the change for the chhutti check, in the same queue as checks (items 67-69). */
export function saveChosenApps(db: NandiDb, next: readonly string[], now = Date.now()): Promise<void> {
  return serial(db, async () => {
    await noteApps(db, now, next);
    const deviceId = await getOrCreateDeviceId(db, now);
    await trackWrite(() => db.settings.put({ key: 'night.pause.apps', value: [...next], updatedAt: now, deleted: 0, deviceId }));
  });
}
/**
 * Until a list is saved, the defaults include apps that may not be on this phone, and an app that cannot be looked up
 * blocks the lock baseline. The first time the phone can say what is installed, the defaults on it are saved, even
 * when that is none at all (Codex A items 67-69). This runs once, at set-up.
 */
export async function initChosenApps(db: NandiDb, installed: readonly string[] | null, now = Date.now()): Promise<void> {
  if (!installed || live(await db.settings.toArray(), 'night.pause.apps') !== undefined) return;
  await saveChosenApps(db, DEFAULT_PAUSE_APPS.map(app => app.packageName).filter(pkg => installed.includes(pkg)), now);
}

/** Records today's effective shutdown once, while a window of today has not started yet; keeps the last 9 days. */
async function snapshotShutdown(db: NandiDb, rows: readonly SettingRow[], windows: readonly ChhuttiWindow[], now: number, shutdown: string): Promise<Record<string, string>> {
  const today = dayKey(now);
  const shutdowns = readShutdowns(rows);
  if (shutdowns[today]) return shutdowns;
  const before = windows.some(window => appliesOn(window, today) && now < windowBounds(window, today).fromMs);
  if (!before) return shutdowns;
  const oldest = addEconomyDays(today, -(CHHUTTI_LOOKBACK_DAYS + 1));
  const next = Object.fromEntries([...Object.entries(shutdowns).filter(([day]) => day >= oldest), [today, shutdown]]);
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key: CHHUTTI_SHUTDOWNS_KEY, value: next, updatedAt: now, deleted: 0, deviceId }));
  return next;
}

/** The one-tap answer where the phone has no usage log for the window: "Yes" keeps it; "Partly" and "Not today" do not. */
export async function answerChhutti(db: NandiDb, day: string, window: ChhuttiWindow, answer: 'yes' | 'partly' | 'no', now = Date.now()): Promise<void> {
  const rows = await db.settings.toArray();
  const bounds = await dayBounds(db, rows, window, day, readShutdowns(rows)) ?? windowBounds(window, day);
  await writeFact(db, day, window, bounds, { chosenAppMs: null, darkMs: null, source: 'self', kept: answer === 'yes', answer }, now);
}

/**
 * Writes the one fact for a day's window. `trustedFrom` is set when the measurement used a lock as its baseline: the
 * self-test is read again inside the same transaction, and if the phone is no longer trusted from that point (a fail
 * came in meanwhile), nothing is written and the window is asked about instead (Codex A item 65).
 */
async function writeFact(db: NandiDb, day: string, window: ChhuttiWindow, bounds: { fromMs: number; toMs: number }, result: Record<string, unknown> & { kept: boolean }, now: number, trustedFrom: number | null = null, checkedApps: readonly string[] | null = null): Promise<'written' | 'exists' | 'untrusted' | 'changed' | 'skipped'> {
  if (restoreActive()) return 'skipped';
  const deviceId = await getOrCreateDeviceId(db, now);
  return trackWrite(() => db.transaction('rw', [db.ledger, db.settings, db.tasks], async (): Promise<'written' | 'exists' | 'untrusted' | 'changed'> => {
    const id = chhuttiFactId(day, window.id);
    if (await db.ledger.get(id)) return 'exists';
    if (trustedFrom !== null) {
      const fresh = lockTrustFrom(readLockTest(await db.settings.toArray()));
      if (fresh === null || fresh > trustedFrom) return 'untrusted';
    }
    // A measured fact stands only for the apps it was measured against: if the list changed meanwhile, ask (item 68).
    if (checkedApps) {
      const rows = await db.settings.toArray();
      const inForce = appsAt(readAppLog(rows, deviceId), bounds.fromMs, now);
      if (!inForce.eligible?.length || inForce.packages.join(',') !== [...checkedApps].sort().join(',')) return 'changed';
    }
    // The fact keeps the bounds that day really had, even if the window changed later.
    const clock = (ms: number) => { const at = new Date(ms); return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`; };
    const fact: LedgerRow = { id, mode: 'tasks', kind: 'chhutti', refId: `${day}:${window.id}`, dayKey: day,
      inputs: { windowId: window.id, label: window.label, from: clock(bounds.fromMs), to: clock(bounds.toMs), plannedMin: (bounds.toMs - bounds.fromMs) / 60_000, ...result, visibility: 'local' }, updatedAt: now, deleted: 0, deviceId };
    await db.ledger.add(fact);
    // The ramp: after every third check, 2 kept of those 3 make the window 15 minutes longer (never past shutdown).
    const rows = await db.settings.toArray();
    const windows = readChhutti(rows);
    const current = windows.find(item => item.id === window.id);
    if (!current || !isLive(current)) return 'written';
    const facts = await db.ledger.where('kind').equals('chhutti').toArray();
    const grown = rampedWindow(current, facts, (await clockOf(db, rows, now)).shutdown);
    if (grown === current) return 'written';
    // A longer window starts with the next day that has not begun; started days keep their bounds.
    const next = withBounds(current, { from: grown.from, to: grown.to }, now, dayKey(now));
    await db.settings.put({ key: CHHUTTI_KEY, value: { windows: windows.map(item => item.id === next.id ? next : item) }, updatedAt: now, deleted: 0, deviceId });
    return 'written';
  }));
}
