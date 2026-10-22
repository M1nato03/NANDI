import { adaptiveNight } from '../../core/adaptive/day';
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
