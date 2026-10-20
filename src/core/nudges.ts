import { RULES } from './rules.config';
import { mayScheduleReminder, type ReminderKind } from './notificationBudget';
import { readNightPlan, nightPlanText } from './nightPlan';
import { effectiveShutdown, shutdownAt } from './tasks/planner';
import { dayKey } from './time/dayKey';
import type { DailyLogRow, SettingRow, TaskRow } from '../data/types';
import type { LedgerRow } from '../data/types';
import { addEconomyDays, deriveEconomy } from './economy/deriveEconomy';
import { isAway } from './economy/away';
import type { Reminder } from '../platform/notifier';

export const NUDGE_NIGHT_ON = 'nudge.night.enabled';
export const NUDGE_MORNING_ON = 'nudge.morning.enabled';
export const NUDGE_STREAK_ON = 'nudge.streak.enabled';
export const NUDGE_MORNING_TIME = 'nudge.morning.time';
export const NUDGE_PERMISSION_ASKED = 'nudge.permissionAsked';
export const MORNING_DEFAULT = '08:30';

const setting = (rows: SettingRow[], key: string) => rows.find(row => row.key === key && !row.deleted)?.value;
const clock = (value: unknown, fallback: string) => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : fallback;
const on = (rows: SettingRow[], key: string) => setting(rows, key) !== false;

/** One pending notification per kind and planning day, for the next seven days. */
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
  const markedDays = input.facts ? new Set(deriveEconomy(input.facts, undefined, settings, addEconomyDays(dayKey(now), 6)).days.filter(day => day.mark).map(day => day.dayKey)) : new Set<string>();
  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(`${dayKey(now)}T12:00:00`);
    date.setDate(date.getDate() + offset);
    const key = dayKey(date.getTime());
    if (isAway(settings, key)) continue;
    const nightAt = shutdownAt(date.getTime(), shutdown);
    const log = logs.find(row => row.dayKey === key && !row.deleted);
    if (on(settings, NUDGE_NIGHT_ON) && !log?.lightsOutAt &&
      !(input.lastOpenedAt != null && input.lastOpenedAt <= nightAt && nightAt - input.lastOpenedAt <= 15 * 60_000) &&
      mayScheduleReminder({ kind: 'shutdown', at: nightAt, now, optIn: true, scheduledEngagement: [], bedtime, shutdown })) {
      result.push({ id: `nudge:night:${key}`, at: nightAt, title: 'Your night deck is ready',
        body: plan ? nightPlanText(plan) : 'Six calm cards, then phone down.', channel: 'planning' });
    }
    const [hour, minute] = morning.split(':').map(Number);
    const morningDate = new Date(`${key}T00:00:00`);
    morningDate.setHours(hour!, minute!, 0, 0);
    const morningAt = morningDate.getTime();
    if (on(settings, NUDGE_MORNING_ON) && mayScheduleReminder({ kind: 'morning', at: morningAt, now, optIn: true,
      scheduledEngagement: input.scheduledEngagement ?? [], bedtime, shutdown })) {
      const first = tasks.filter(row => !row.deleted && row.status === 'planned' && row.dayKey === key)
        .sort((a, b) => (a.scheduledStart ?? 0) - (b.scheduledStart ?? 0))[0];
      result.push({ id: `nudge:morning:${key}`, at: morningAt, title: "Today's first step",
        body: first ? `${first.title} · ${first.estimateMin ?? 25} min` : 'Pick one small step for today.', channel: 'planning' });
    }
    const streakAt = Math.min(shutdownAt(date.getTime(), bedtime) - RULES.night.streakReminderMinBeforeBedtime * 60_000,
      shutdownAt(date.getTime(), shutdown)) - 60_000;
    const scheduled = [...input.scheduledEngagement ?? [], ...result.filter(row => row.id === `nudge:morning:${key}`).map(row => ({ kind: 'morning' as const, at: row.at }))];
    if (setting(settings, NUDGE_STREAK_ON) === true && !markedDays.has(key) && mayScheduleReminder({ kind: 'streak', at: streakAt, now, optIn: true,
      scheduledEngagement: scheduled, bedtime, shutdown, windDownAt: log?.windDownAt })) {
      result.push({ id: `nudge:streak:${key}`, at: streakAt, title: 'A small step still counts',
        body: 'A task, movement, or a Mind moment is enough today.', channel: 'planning' });
    }
  }
  return result;
}
