import { adaptiveNight, shiftClock } from './adaptive/day';
import { RULES } from './rules.config';
import { effectiveShutdown, nightWindow } from './tasks/planner';
import { dayKey } from './time/dayKey';
import type { SettingRow, TaskRow } from '../data/types';

/**
 * Spec 19: shares exist only in the day window. The same clock Mind uses (busy-day bedtime, shutdown and
 * an early wind-down), so a share button and the handler behind it agree with the rest of the app.
 */
export function shareWindow(now: number, settings: readonly SettingRow[], todayTasks: readonly TaskRow[], windDownAt?: number): 'day' | 'windDown' | 'lightsOut' {
  const today = dayKey(now);
  const adaptive = adaptiveNight(settings, todayTasks, today);
  const setting = (key: string) => settings.find(row => row.key === key && !row.deleted)?.value;
  const baseBedtime = String(setting('planner.bedtime') ?? RULES.night.defaultBedtime);
  const shutdown = shiftClock(effectiveShutdown(String(setting('planner.shutdown') ?? RULES.night.defaultShutdown), baseBedtime), adaptive.shift);
  return nightWindow(now, shutdown, adaptive.bedtime, windDownAt);
}
