import { ulid } from 'ulidx';
import { trackWrite } from '../../core/pendingWrites';
import { addEconomyDays } from '../../core/economy/deriveEconomy';
import { appliesOn, boundWindow, CHHUTTI_KEY, chhuttiFactId, isKept, rampedWindow, readChhutti, windowBounds, windowUsage, type ChhuttiWindow, type UsageEvent } from '../../core/plan/chhutti';
import { DEFAULT_PAUSE_APPS } from '../../core/nightPause';
import { RULES } from '../../core/rules.config';
import { dayKey } from '../../core/time';
import { readWindowEvents } from '../../platform/nightPause';
import { getOrCreateDeviceId } from '../device';
import { restoreActive } from '../restoreLock';
import type { NandiDb } from '../db';
import type { LedgerRow, SettingRow } from '../types';

type ReadEvents = (from: number, to: number, packages: string[]) => Promise<{ logStart?: number; events: UsageEvent[] } | null>;
const live = (rows: readonly SettingRow[], key: string) => rows.find(row => row.key === key && !row.deleted)?.value;
const shutdownOf = (rows: readonly SettingRow[]) => { const value = live(rows, 'planner.shutdown'); return typeof value === 'string' ? value : RULES.night.defaultShutdown; };
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
  const bounded = boundWindow(input.from, length, shutdownOf(rows));
  // A window counts from today only if it was planned before it starts; otherwise from tomorrow.
  const today = dayKey(now);
  const since = now < new Date(`${today}T${bounded.from}:00`).getTime() ? today : addEconomyDays(today, 1);
  const window: ChhuttiWindow = { id: old?.id ?? ulid(now), label: input.label.trim().slice(0, 40) || 'My chhutti', ...bounded, since, ...(input.weekdays?.length ? { weekdays: input.weekdays } : {}) };
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
/**
 * At an open: every window of today and yesterday that has ended and has no fact yet is read from the phone's
 * usage events and gets one fact. Where there is no log to read (web, access revoked, history gone, phone locked),
 * nothing is written and the window is offered for a one-tap answer instead (review note, item 51/52).
 */
export async function checkChhutti(db: NandiDb, now = Date.now(), read: ReadEvents = readWindowEvents): Promise<ChhuttiPending[]> {
  if (restoreActive()) return [];
  const rows = await db.settings.toArray();
  const windows = readChhutti(rows);
  if (!windows.length) return [];
  const saved = live(rows, 'night.pause.apps');
  const packages = Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string') : DEFAULT_PAUSE_APPS.map(app => app.packageName);
  const today = dayKey(now), pending: ChhuttiPending[] = [];
  for (const day of [addEconomyDays(today, -1), today]) for (const window of windows) {
    if (!appliesOn(window, day) || live(rows, skipKey(day, window.id)) === true) continue;
    const { fromMs, toMs } = windowBounds(window, day);
    if (toMs > now || await db.ledger.get(chhuttiFactId(day, window.id))) continue;
    const log = await read(fromMs, toMs, packages).catch(() => null);
    const usage = log ? windowUsage(log.events, fromMs, toMs, log.logStart) : null;
    if (!usage) { pending.push({ day, window }); continue; }
    await writeFact(db, day, window, { chosenAppMs: usage.chosenAppMs, darkMs: usage.darkMs, source: 'usage', kept: isKept(usage, day) }, now);
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
  await trackWrite(() => db.transaction('rw', [db.ledger, db.settings], async () => {
    const id = chhuttiFactId(day, window.id);
    if (await db.ledger.get(id)) return;
    const plannedMin = (windowBounds(window, day).toMs - windowBounds(window, day).fromMs) / 60_000;
    const fact: LedgerRow = { id, mode: 'tasks', kind: 'chhutti', refId: `${day}:${window.id}`, dayKey: day,
      inputs: { windowId: window.id, label: window.label, from: window.from, to: window.to, plannedMin, ...result, visibility: 'local' }, updatedAt: now, deleted: 0, deviceId };
    await db.ledger.add(fact);
    // The ramp: after every third check, 2 kept of those 3 make the window 15 minutes longer (never past shutdown).
    const rows = await db.settings.toArray();
    const windows = readChhutti(rows);
    const current = windows.find(item => item.id === window.id);
    if (!current) return;
    const facts = await db.ledger.where('kind').equals('chhutti').toArray();
    const next = rampedWindow(current, facts, shutdownOf(rows));
    if (next !== current) await db.settings.put({ key: CHHUTTI_KEY, value: { windows: windows.map(item => item.id === next.id ? next : item) }, updatedAt: now, deleted: 0, deviceId });
  }));
}
