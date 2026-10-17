import { RULES } from './rules.config';
import { dayKey } from './time/dayKey';
import { effectiveShutdown, nightWindow, shutdownAt } from './tasks/planner';

export type ReminderKind = 'task' | 'rest' | 'shutdown' | 'morning' | 'planning' | 'streak';

/** Self-scheduled reminders do not consume the two optional engagement slots. */
export function mayScheduleReminder(input: {
  kind: ReminderKind; at: number; now: number; optIn: boolean;
  scheduledEngagement: { kind: ReminderKind; at: number }[];
  bedtime: string; shutdown: string; windDownAt?: number;
}): boolean {
  if (input.at <= input.now) return false;
  if (input.kind === 'task' || input.kind === 'rest' || input.kind === 'shutdown') return true;
  if (!input.optIn || nightWindow(input.at, effectiveShutdown(input.shutdown, input.bedtime), input.bedtime, input.windDownAt) !== 'day') return false;
  const used = input.scheduledEngagement.filter(row =>
    (row.kind === 'morning' || row.kind === 'planning' || row.kind === 'streak') && dayKey(row.at) === dayKey(input.at)).length;
  if (used >= RULES.notifications.engagementPerDayMax) return false;
  if (input.scheduledEngagement.some(row => row.kind === input.kind && dayKey(row.at) === dayKey(input.at))) return false;
  if (input.kind === 'streak') {
    const bedtimeLimit = shutdownAt(input.at, input.bedtime) - RULES.night.streakReminderMinBeforeBedtime * 60_000;
    const shutdownLimit = shutdownAt(input.at, effectiveShutdown(input.shutdown, input.bedtime));
    return input.at <= Math.min(bedtimeLimit, shutdownLimit);
  }
  return true;
}
