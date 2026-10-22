import { describe, expect, it } from 'vitest';
import { mayScheduleReminder, reminderPlacement } from './notificationBudget';

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
    expect(mayScheduleReminder({ ...base, kind: 'streak', at: at(22) })).toBe(false);
    expect(mayScheduleReminder({ ...base, kind: 'streak', at: at(22) - 60_000 })).toBe(true);
    expect(mayScheduleReminder({ ...base, kind: 'streak', at: at(23), bedtime: '01:30' })).toBe(true);
    expect(mayScheduleReminder({ ...base, kind: 'streak', at: at(23) + 15 * 60_000, bedtime: '01:30' })).toBe(false);
  });
  it('keeps task blocks out of lights-out and quiets rest reminders after shutdown (audit F3)', () => {
    const late = { ...base, bedtime: '23:30', shutdown: '22:45' };
    // A task at 00:30 with a 23:30 bedtime would ring on the loud channel inside lights-out: not scheduled.
    expect(reminderPlacement({ ...late, kind: 'task', at: at(24) + 30 * 60_000 })).toBe('skip');
    expect(reminderPlacement({ ...late, kind: 'task', at: at(23) })).toBe('normal');
    expect(reminderPlacement({ ...late, kind: 'task', at: at(10) })).toBe('normal');
    expect(reminderPlacement({ ...late, kind: 'rest', at: at(10) })).toBe('normal');
    expect(reminderPlacement({ ...late, kind: 'rest', at: at(23) })).toBe('quiet');
    expect(reminderPlacement({ ...late, kind: 'shutdown', at: at(24) })).toBe('quiet');
    expect(reminderPlacement({ ...late, kind: 'planning', at: at(9) })).toBe('normal');
    expect(reminderPlacement({ ...late, kind: 'task', at: at(7) })).toBe('skip');
  });
});
