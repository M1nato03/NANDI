import { adaptiveNight } from '../../core/adaptive/day';
import { shareWindow } from '../../core/shareGate';
import { dayKey } from '../../core/time';
import type { NandiDb } from '../db';

/**
 * Tonight's bedtime after a busy-day shift the person has not undone. The night route already moves
 * with it, so Mind XP, Learn answers and lights-out use the same clock (Night audit, 22 Oct).
 */
export async function effectiveBedtime(db: NandiDb, at: number): Promise<string> {
  const day = dayKey(at);
  const [settings, tasks] = await Promise.all([db.settings.toArray(), db.tasks.where('dayKey').equals(day).toArray()]);
  return adaptiveNight(settings, tasks, day).bedtime;
}

/** Spec 19: checked again inside every share handler, so a screen left open past bedtime cannot send. */
export async function canShareNow(db: NandiDb, at = Date.now()): Promise<boolean> {
  const day = dayKey(at);
  const [settings, tasks, log] = await Promise.all([db.settings.toArray(), db.tasks.where('dayKey').equals(day).toArray(), db.dailyLog.get(day)]);
  return shareWindow(at, settings, tasks, log?.windDownAt) === 'day';
}
