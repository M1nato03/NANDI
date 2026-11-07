import { adaptiveNight } from '../../core/adaptive/day';
import { shareWindow } from '../../core/shareGate';
import { dayKey, inNightWindow } from '../../core/time';
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

/**
 * Spec 571 §0.20 rule 3 (b2's call (a)): a slot fact written inside the night window, bedtime → 05:00, carries
 * `night: true`, so no day's rings or Hat-trick count it (from economy.v10From). It records the bedtime in force when the
 * act happened, so moving bedtime later never re-lights an old night act. Outside the window nothing is added.
 */
export async function nightStamp(db: NandiDb, at: number): Promise<{ night?: true }> {
  return inNightWindow(at, await effectiveBedtime(db, at)) ? { night: true } : {};
}

/** Spec 19: checked again inside every share handler, so a screen left open past bedtime cannot send. */
export async function canShareNow(db: NandiDb, at = Date.now()): Promise<boolean> {
  const day = dayKey(at);
  const [settings, tasks, log] = await Promise.all([db.settings.toArray(), db.tasks.where('dayKey').equals(day).toArray(), db.dailyLog.get(day)]);
  return shareWindow(at, settings, tasks, log?.windDownAt) === 'day';
}
