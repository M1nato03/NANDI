import { Capacitor, registerPlugin } from '@capacitor/core';
import type { GuardEvent } from '../core/focusGuard';

/**
 * Spec 46a: one read of Android's usage log for the daily minutes record. The phone sends only what the record needs:
 * the tracked packages' screens resumed and paused, screen and lock changes, start-ups and shutdowns, plus the first
 * event its log still holds (to tell "nothing happened" from "no history"), which tracked packages are installed,
 * Android's own daily totals for buckets that sit inside a day, and the clock's boot time (to see a clock change).
 * The minutes are worked out here, in core/phoneUsage, where they are unit tested.
 */
export interface ForegroundLog {
  logStart: number | null;
  events: GuardEvent[];
  installed: string[];
  /** Android's daily total for a package, for a bucket that starts and ends inside the day starting at `from`. */
  cross: { from: number; pkg: string; ms: number }[];
  bootCount: number;
  bootWallMs: number;
}
export type ForegroundRead = { access: false } | ({ access: true } & ForegroundLog);

type Plugin = {
  dailyForegroundLog(options: { from: number; to: number; packages: string; bounds: string }): Promise<{ available: boolean; reason?: string } & Partial<ForegroundLog>>;
};
const native = registerPlugin<Plugin>('NightPause');

/** The e2e stand-in rides on the Pause card's (platform/nightPause): `phoneLog` is what the phone would send. */
const E2E_PAUSE = 'nandi.e2ePause';
function fake(): { usageAllowed?: boolean; phoneLog?: Partial<ForegroundLog> } | null {
  try { const raw = sessionStorage.getItem(E2E_PAUSE); return raw ? JSON.parse(raw) as { usageAllowed?: boolean; phoneLog?: Partial<ForegroundLog> } : null; } catch { return null; }
}

const list = <T,>(raw: unknown): T[] => Array.isArray(raw) ? raw as T[] : [];
function shape(raw: Partial<ForegroundLog>, from: number, to: number): ForegroundLog {
  return {
    logStart: typeof raw.logStart === 'number' && raw.logStart >= 0 ? raw.logStart : null,
    events: list<GuardEvent>(raw.events).filter(event => event.at > from && event.at <= to),
    installed: list<string>(raw.installed), cross: list<{ from: number; pkg: string; ms: number }>(raw.cross),
    bootCount: Number(raw.bootCount ?? -1), bootWallMs: Number(raw.bootWallMs ?? 0),
  };
}

/** The log from `from` to `to` for these packages, with each day's [from, to] for the cross-check; null where there is no usage log at all (the web). */
export async function readForegroundLog(from: number, to: number, packages: readonly string[], days: readonly { fromMs: number; toMs: number }[]): Promise<ForegroundRead | null> {
  const test = fake();
  if (test) return test.usageAllowed === false ? { access: false } : test.phoneLog ? { access: true, ...shape(test.phoneLog, from, to) } : null;
  if (!Capacitor.isNativePlatform()) return null;
  const result = await native.dailyForegroundLog({ from, to, packages: packages.join(','), bounds: days.map(day => `${day.fromMs}:${day.toMs}`).join(',') });
  if (!result.available) return result.reason === 'no_access' ? { access: false } : null;
  return { access: true, ...shape(result, from, to) };
}
