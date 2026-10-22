import { RULES } from './rules.config';
import { dayKey } from './time/dayKey';
import { effectiveShutdown, nightWindow, shutdownAt } from './tasks/planner';

export type ReminderKind = 'task' | 'rest' | 'shutdown' | 'morning' | 'planning' | 'streak';

export type ReminderPlacement = 'skip' | 'normal' | 'quiet';
type ReminderInput = {
  kind: ReminderKind; at: number; now: number; optIn: boolean;
  scheduledEngagement: { kind: ReminderKind; at: number }[];
  bedtime: string; shutdown: string; windDownAt?: number;
};

/**
 * Where a reminder may ring (Android notifications audit, 22 Oct, F3): a task block inside lights-out is not
 * scheduled at all, and a rest or shutdown reminder in wind-down or lights-out goes to the quiet channel.
 */
export function reminderPlacement(input: ReminderInput): ReminderPlacement {
  if (!mayScheduleReminder(input)) return 'skip';
  if (input.kind !== 'task' && input.kind !== 'rest' && input.kind !== 'shutdown') return 'normal';
  const window = nightWindow(input.at, effectiveShutdown(input.shutdown, input.bedtime), input.bedtime, input.windDownAt);
  if (input.kind === 'task') return window === 'lightsOut' ? 'skip' : 'normal';
  return window === 'day' ? 'normal' : 'quiet';
}

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
    return input.at < Math.min(bedtimeLimit, shutdownLimit);
  }
  return true;
}
