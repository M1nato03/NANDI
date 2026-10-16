import { describe, expect, it } from 'vitest';
import { mayScheduleReminder } from './notificationBudget';

const at = (hour: number) => new Date(2026, 9, 16, hour).getTime();
const base = { now: at(8), bedtime: '23:30', shutdown: '23:15', optIn: true, scheduledEngagement: [] };
describe('notification budget', () => {
  it('keeps task and rest reminders outside the engagement cap', () => {
    const full = [{ kind: 'planning' as const, at: at(9) }, { kind: 'streak' as const, at: at(20) }];
    expect(mayScheduleReminder({ ...base, kind: 'task', at: at(10), scheduledEngagement: full })).toBe(true);
    expect(mayScheduleReminder({ ...base, kind: 'rest', at: at(10), scheduledEngagement: full })).toBe(true);
    expect(mayScheduleReminder({ ...base, kind: 'planning', at: at(10), scheduledEngagement: full })).toBe(false);
    expect(mayScheduleReminder({ ...base, kind: 'planning', at: at(10), scheduledEngagement: full.slice(0, 1) })).toBe(false);
  });
  it('requires opt-in and excludes wind-down and late streak reminders', () => {
    expect(mayScheduleReminder({ ...base, kind: 'planning', at: at(9), optIn: false })).toBe(false);
    expect(mayScheduleReminder({ ...base, kind: 'planning', at: at(23) + 20 * 60_000 })).toBe(false);
    expect(mayScheduleReminder({ ...base, kind: 'streak', at: at(22) + 30 * 60_000 })).toBe(false);
    expect(mayScheduleReminder({ ...base, kind: 'streak', at: at(21) })).toBe(true);
  });
});
