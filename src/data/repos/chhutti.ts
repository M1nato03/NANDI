import { ulid } from 'ulidx';
import { trackWrite } from '../../core/pendingWrites';
import { addEconomyDays } from '../../core/economy/deriveEconomy';
import { appliesOn, boundWindow, CHHUTTI_KEY, chhuttiFactId, isKept, rampedWindow, readChhutti, windowBounds, windowUsage, withBounds, type ChhuttiWindow, type UsageEvent } from '../../core/plan/chhutti';
import { dayClock } from '../../core/shareGate';
import { DEFAULT_PAUSE_APPS } from '../../core/nightPause';
import { RULES } from '../../core/rules.config';
import { dayKey, isAfterBedtime } from '../../core/time';
import { readWindowEvents } from '../../platform/nightPause';
import { getOrCreateDeviceId } from '../device';
import { restoreActive } from '../restoreLock';
import type { NandiDb } from '../db';
import type { LedgerRow, SettingRow } from '../types';

type ReadEvents = (from: number, to: number, packages: string[]) => Promise<{ logStart?: number; events: UsageEvent[] } | null>;
const live = (rows: readonly SettingRow[], key: string) => rows.find(row => row.key === key && !row.deleted)?.value;
/** Tonight's effective shutdown and bedtime (busy-day shift included), the clock the rest of Plan uses (item 55). */
async function clockOf(db: NandiDb, rows: readonly SettingRow[], now: number) {
  return dayClock(now, rows, await db.tasks.where('dayKey').equals(dayKey(now)).toArray());
}
const skipKey = (day: string, id: string) => `${CHHUTTI_KEY}.skip:${day}:${id}`;

async function putWindows(db: NandiDb, windows: ChhuttiWindow[], now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key: CHHUTTI_KEY, value: { windows }, updatedAt: now, deleted: 0, deviceId }));
}

/** Adds or changes a window: a label and a start time; its length starts at `startMin` and only the ramp grows it. */
export async function saveChhuttiWindow(db: NandiDb, input: { id?: string; label: string; from: string; weekdays?: number[] }, now = Date.now()): Promise<ChhuttiWindow> {
  const rows = await db.settings.toArray();
  const windows = readChhutti(rows);
  const old = input.id ? windows.find(window => window.id === input.id) : undefined;
  const length = old ? Number(old.to.slice(0, 2)) * 60 + Number(old.to.slice(3)) - (Number(old.from.slice(0, 2)) * 60 + Number(old.from.slice(3))) : RULES.plan.chhutti.startMin;
  const bounded = boundWindow(input.from, length, (await clockOf(db, rows, now)).shutdown);
  const today = dayKey(now);
  const label = input.label.trim().slice(0, 40) || 'My chhutti';
  const weekdays = input.weekdays?.length ? { weekdays: input.weekdays } : {};
  // A new window counts from today only if it was planned before it starts; otherwise from tomorrow. A changed one
  // keeps every started day's bounds (withBounds), so no day already under way is rewritten (item 55).
  const window: ChhuttiWindow = old
    ? { ...withBounds({ ...old, label }, bounded, now, today), ...weekdays }
    : { id: ulid(now), label, ...bounded, since: now < new Date(`${today}T${bounded.from}:00`).getTime() ? today : addEconomyDays(today, 1), ...weekdays };
  await putWindows(db, [...windows.filter(item => item.id !== window.id), window], now);
  return window;
}

export async function removeChhuttiWindow(db: NandiDb, id: string, now = Date.now()): Promise<void> {
  await putWindows(db, readChhutti(await db.settings.toArray()).filter(window => window.id !== id), now);
}

/** "Not today": moves today's window out of the way. No budget, no copy about it. */
export async function skipChhuttiToday(db: NandiDb, id: string, now = Date.now()): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key: skipKey(dayKey(now), id), value: true, updatedAt: now, deleted: 0, deviceId }));
}

export type ChhuttiPending = { day: string; window: ChhuttiWindow };
/** How many days back an unrecorded window is still read (Android keeps "a few days" of events). */
export const CHHUTTI_LOOKBACK_DAYS = 7;
/**
 * At an open: every planned window of the last 7 days (from `since`) that has ended and has no fact yet is read
 * from the phone's usage events and gets one fact. Where the log cannot answer (web, access revoked, history gone,
 * a restart inside the window, the phone locked), nothing is written and the window is offered for a one-tap answer
 * instead (items 51-55). After bedtime nothing is read or shown; the next morning reads it for the same day.
 */
export async function checkChhutti(db: NandiDb, now = Date.now(), read: ReadEvents = readWindowEvents): Promise<ChhuttiPending[]> {
  if (restoreActive()) return [];
  const rows = await db.settings.toArray();
  const windows = readChhutti(rows);
  if (!windows.length) return [];
  if (isAfterBedtime(now, (await clockOf(db, rows, now)).bedtime)) return [];
  const saved = live(rows, 'night.pause.apps');
  const packages = Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string') : DEFAULT_PAUSE_APPS.map(app => app.packageName);
  const today = dayKey(now), pending: ChhuttiPending[] = [];
  for (let back = CHHUTTI_LOOKBACK_DAYS; back >= 0; back--) {
    const day = addEconomyDays(today, -back);
    for (const window of windows) {
      if (!appliesOn(window, day) || live(rows, skipKey(day, window.id)) === true) continue;
      const { fromMs, toMs } = windowBounds(window, day);
      if (toMs > now || await db.ledger.get(chhuttiFactId(day, window.id))) continue;
      const log = await read(fromMs, toMs, packages).catch(() => null);
      const usage = log ? windowUsage(log.events, fromMs, toMs, packages, log.logStart) : null;
      // Unknown: only today and yesterday are asked about, so a week away never comes back as a list of questions.
      if (!usage) { if (back <= 1) pending.push({ day, window }); continue; }
      await writeFact(db, day, window, { chosenAppMs: usage.chosenAppMs, darkMs: usage.darkMs, source: 'usage', kept: isKept(usage, day) }, now);
    }
  }
  return pending;
}

/** The one-tap answer where the phone has no usage log for the window: "Yes" keeps it; "Partly" and "Not today" do not. */
export async function answerChhutti(db: NandiDb, day: string, window: ChhuttiWindow, answer: 'yes' | 'partly' | 'no', now = Date.now()): Promise<void> {
  await writeFact(db, day, window, { chosenAppMs: null, darkMs: null, source: 'self', kept: answer === 'yes', answer }, now);
}

async function writeFact(db: NandiDb, day: string, window: ChhuttiWindow, result: Record<string, unknown> & { kept: boolean }, now: number): Promise<void> {
  if (restoreActive()) return;
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', [db.ledger, db.settings, db.tasks], async () => {
    const id = chhuttiFactId(day, window.id);
    if (await db.ledger.get(id)) return;
    // The fact keeps the bounds that day really had, even if the window changed later.
    const { fromMs, toMs } = windowBounds(window, day);
    const clock = (ms: number) => { const at = new Date(ms); return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`; };
    const fact: LedgerRow = { id, mode: 'tasks', kind: 'chhutti', refId: `${day}:${window.id}`, dayKey: day,
      inputs: { windowId: window.id, label: window.label, from: clock(fromMs), to: clock(toMs), plannedMin: (toMs - fromMs) / 60_000, ...result, visibility: 'local' }, updatedAt: now, deleted: 0, deviceId };
    await db.ledger.add(fact);
    // The ramp: after every third check, 2 kept of those 3 make the window 15 minutes longer (never past shutdown).
    const rows = await db.settings.toArray();
    const windows = readChhutti(rows);
    const current = windows.find(item => item.id === window.id);
    if (!current) return;
    const facts = await db.ledger.where('kind').equals('chhutti').toArray();
    const grown = rampedWindow(current, facts, (await clockOf(db, rows, now)).shutdown);
    if (grown === current) return;
    // A longer window starts with the next day that has not begun; started days keep their bounds.
    const next = withBounds(current, { from: grown.from, to: grown.to }, now, dayKey(now));
    await db.settings.put({ key: CHHUTTI_KEY, value: { windows: windows.map(item => item.id === next.id ? next : item) }, updatedAt: now, deleted: 0, deviceId });
  }));
}
