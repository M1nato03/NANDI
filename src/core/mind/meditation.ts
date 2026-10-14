import { RULES } from '../rules.config';
import { timerElapsedMs, type TimerState } from '../time/timer';

export interface MeditationSession extends TimerState {
  readonly id: string;
  readonly dayKey: string;
  readonly endedAt?: number;
}

/** Settings and restored backups are untrusted; reject invalid timer histories. */
export function parseMeditation(value: unknown): MeditationSession | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || !row.id || typeof row.dayKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.dayKey)) return null;
  const date = new Date(`${row.dayKey}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== row.dayKey) return null;
  if (typeof row.startedAt !== 'number' || !Number.isFinite(row.startedAt) || row.startedAt < 0 ||
    typeof row.durationMs !== 'number' || !Number.isFinite(row.durationMs) || row.durationMs <= 0 || row.durationMs > RULES.meditation.maxDurationMin * 60_000 || !Array.isArray(row.pauses)) return null;
  let cursor = row.startedAt;
  let paused = false;
  for (const value of row.pauses) {
    if (!value || typeof value !== 'object' || paused) return null;
    const pause = value as Record<string, unknown>;
    if (typeof pause.at !== 'number' || !Number.isFinite(pause.at) || pause.at < cursor) return null;
    cursor = pause.at;
    if (pause.resumeAt === undefined) paused = true;
    else {
      if (typeof pause.resumeAt !== 'number' || !Number.isFinite(pause.resumeAt) || pause.resumeAt < cursor) return null;
      cursor = pause.resumeAt;
    }
  }
  if (row.endedAt !== undefined && (typeof row.endedAt !== 'number' || !Number.isFinite(row.endedAt) || row.endedAt < cursor)) return null;
  return value as MeditationSession;
}

export function meditationElapsedMs(session: MeditationSession, now: number): number {
  return Math.min(session.durationMs, timerElapsedMs(session, session.endedAt ?? now));
}
