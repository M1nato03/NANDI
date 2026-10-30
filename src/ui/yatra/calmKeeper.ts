import { db } from '../../data/db';
import { saveCalmDone } from '../../data/repos/calm';
import { playedMs, sitOver } from '../../core/calm/spans';
import { totalMs } from '../../core/calm/session';
import { calmPlaybackAvailable, calmPlaybackStatus, clearCalmPlayback } from '../../platform/calmPlayback';
import type { Run } from './Calm';

/**
 * Spec 38: a sit the phone's player ran can end while NANDI is closed (its length passed, or Stop on the lock screen).
 * The sit's settings are kept on this phone while it runs; on the app's return its playing minutes are saved once (the
 * row's id is the sit's start, so a second save is a no-op) and the player forgets it.
 */
const KEY = 'nandi.calmRun';
export function rememberCalmRun(run: Run): void { try { localStorage.setItem(KEY, JSON.stringify(run)); } catch { /* optional */ } }
export function forgetCalmRun(): void { try { localStorage.removeItem(KEY); } catch { /* optional */ } }
export function readCalmRun(): Run | null {
  try { const raw = localStorage.getItem(KEY); const run = raw ? JSON.parse(raw) as Run : null; return run && typeof run.startedAt === 'number' ? run : null; } catch { return null; }
}

export async function settleCalm(now: number): Promise<boolean> {
  if (!calmPlaybackAvailable()) return false;
  const status = await calmPlaybackStatus();
  const run = readCalmRun();
  if (!status || !run || status.sitId !== String(run.startedAt) || !sitOver(status.journal)) return false;
  await saveCalmDone(db, { elapsedMs: playedMs(status.journal, now, totalMs(run.length)), way: run.way, breath: run.breath, startedAt: run.startedAt }, now);
  forgetCalmRun();
  await clearCalmPlayback(status.sitId);
  return true;
}
