import { RULES } from './rules.config';
import { mayScheduleReminder, type ReminderKind } from './notificationBudget';
import { readNightPlan, nightPlanText } from './nightPlan';
import { effectiveShutdown, shutdownAt } from './tasks/planner';
import { dayKey } from './time/dayKey';
import type { DailyLogRow, SettingRow, TaskRow } from '../data/types';
import type { LedgerRow } from '../data/types';
import { isAway } from './economy/away';
import type { Reminder } from '../platform/notifier';
import { picks, readPicks } from './welcome';

export const NUDGE_NIGHT_ON = 'nudge.night.enabled';
export const NUDGE_MORNING_ON = 'nudge.morning.enabled';
// Spec 47b: the streak reminder is gone. An old opt-in stays only as backup history; it schedules nothing, and
// reconcileNudges cancels any `nudge:streak:*` still pending, since it is no longer wanted.
export const NUDGE_STREAK_ON = 'nudge.streak.enabled';
export const NUDGE_MORNING_TIME = 'nudge.morning.time';
export const NUDGE_PERMISSION_ASKED = 'nudge.permissionAsked';
export const MORNING_DEFAULT = '08:30';

const setting = (rows: SettingRow[], key: string) => rows.find(row => row.key === key && !row.deleted)?.value;
const clock = (value: unknown, fallback: string) => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : fallback;
const on = (rows: SettingRow[], key: string) => setting(rows, key) !== false;

/**
 * One pending notification per kind and planning day, for the next seven days. `facts` is no longer read.
 * Spec 52: these two are NANDI's own nudges, so they follow the person's picks (the night deck is Sleep's, the morning
 * step is Plan's). Reminders the person set themselves (task blocks, the rest timer, the Pause card) are not here and
 * always fire, whatever was picked.
 */
export function wantedNudges(input: {
  now: number; settings: SettingRow[]; tasks: TaskRow[]; logs: DailyLogRow[]; facts?: LedgerRow[];
  lastOpenedAt?: number; scheduledEngagement?: { kind: ReminderKind; at: number }[];
}): Reminder[] {
  const { now, settings, tasks, logs } = input;
  const bedtime = clock(setting(settings, 'planner.bedtime'), RULES.night.defaultBedtime);
  const shutdown = effectiveShutdown(clock(setting(settings, 'planner.shutdown'), RULES.night.defaultShutdown), bedtime);
  const morning = clock(setting(settings, NUDGE_MORNING_TIME), MORNING_DEFAULT);
  const result: Reminder[] = [];
  const plan = readNightPlan(settings);
  const picked = readPicks(settings);
  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(`${dayKey(now)}T12:00:00`);
    date.setDate(date.getDate() + offset);
    const key = dayKey(date.getTime());
    if (isAway(settings, key)) continue;
    const nightAt = shutdownAt(date.getTime(), shutdown);
    const log = logs.find(row => row.dayKey === key && !row.deleted);
    if (picks(picked, 'sleep') && on(settings, NUDGE_NIGHT_ON) && !log?.lightsOutAt &&
      !(input.lastOpenedAt != null && input.lastOpenedAt <= nightAt && nightAt - input.lastOpenedAt <= 15 * 60_000) &&
      mayScheduleReminder({ kind: 'shutdown', at: nightAt, now, optIn: true, scheduledEngagement: [], bedtime, shutdown })) {
      result.push({ id: `nudge:night:${key}`, at: nightAt, title: 'Your night deck is ready',
        body: plan ? nightPlanText(plan) : 'Six calm cards, then phone down.', channel: 'planning' });
    }
    const [hour, minute] = morning.split(':').map(Number);
    const morningDate = new Date(`${key}T00:00:00`);
    morningDate.setHours(hour!, minute!, 0, 0);
    const morningAt = morningDate.getTime();
    if (picks(picked, 'plan') && on(settings, NUDGE_MORNING_ON) && mayScheduleReminder({ kind: 'morning', at: morningAt, now, optIn: true,
      scheduledEngagement: input.scheduledEngagement ?? [], bedtime, shutdown })) {
      const first = tasks.filter(row => !row.deleted && row.status === 'planned' && row.dayKey === key)
        .sort((a, b) => (a.scheduledStart ?? 0) - (b.scheduledStart ?? 0))[0];
      result.push({ id: `nudge:morning:${key}`, at: morningAt, title: "Today's first step",
        body: first ? `${first.title} · ${first.estimateMin ?? 25}\u00a0min` : 'Pick one small step for today.', channel: 'planning' });
    }
  }
  return result;
}
