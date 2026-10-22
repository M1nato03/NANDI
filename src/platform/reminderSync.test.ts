import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  schedule: vi.fn().mockResolvedValue(undefined), cancel: vi.fn().mockResolvedValue(undefined),
  listPending: vi.fn().mockResolvedValue([]), checkPermission: vi.fn().mockResolvedValue('granted'),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('./notifier', () => ({ notifier: mock, CapacitorNotifier: class {}, notifId: () => 123 }));

import { db } from '../data/db';
import { reconcileReminders, wantedReminders } from './reminderSync';

beforeEach(async () => {
  vi.clearAllMocks();
  await Promise.all([db.tasks.clear(), db.sessions.clear(), db.reminders.clear()]);
});

describe('reminder reconciliation', () => {
  it('schedules a task block and rest backstop, then cancels both when they end', async () => {
    const now = new Date(2026, 9, 16, 12).getTime();
    const meta = { deleted: 0 as const, updatedAt: now, deviceId: 'test' };
    await db.tasks.put({ id: 'task-1', title: 'Start drafting', status: 'planned', dayKey: '2026-10-16', scheduledStart: now + 60_000, ...meta });
    await db.sessions.put({ id: 'session-1', dayKey: '2026-10-16', status: 'active', restEndsAt: now + 90_000, ...meta });
    await reconcileReminders(now);
    const scheduled = await db.reminders.toArray();
    expect(scheduled.map(row => `${row.refType}:${row.refId}`).sort()).toEqual(['session:session-1', 'task:task-1']);
    expect(mock.schedule.mock.calls.map(call => call[0].id).sort()).toEqual(scheduled.map(row => row.id).sort());
    await db.tasks.update('task-1', { status: 'done' });
    await db.sessions.update('session-1', { status: 'completed', restEndsAt: undefined });
    await reconcileReminders(now + 1000);
    expect(mock.cancel.mock.calls.map(call => call[0]).sort()).toEqual(scheduled.map(row => row.id).sort());
  });
  it('reads the user\'s own bedtime: a task inside lights-out is not scheduled (audit F2, F3)', () => {
    const now = new Date(2026, 10, 5, 20).getTime();
    const meta = { deleted: 0 as const, updatedAt: now, deviceId: 'test' };
    const task = { id: 't1', title: 'Late task', status: 'planned' as const, dayKey: '2026-11-05', scheduledStart: new Date(2026, 10, 6, 0, 30).getTime(), ...meta };
    const setting = (key: string, value: string) => ({ key, value, ...meta });
    expect(wantedReminders([task], [], now, [setting('planner.bedtime', '23:30'), setting('planner.shutdown', '22:45')])).toEqual([]);
    // With the default 01:30 bedtime the same block is still daytime-like and rings normally.
    expect(wantedReminders([task], [], now).map(row => row.channel)).toEqual(['tasks']);
    const rest = { id: 's1', dayKey: '2026-11-05', status: 'active' as const, restEndsAt: new Date(2026, 10, 5, 23).getTime(), ...meta };
    expect(wantedReminders([], [rest], now, [setting('planner.bedtime', '23:30'), setting('planner.shutdown', '22:45')]).map(row => row.channel)).toEqual(['quiet']);
  });

  it('marks a past reminder as fired instead of cancelling it (audit F10)', async () => {
    const now = new Date(2026, 9, 16, 12).getTime();
    const meta = { deleted: 0 as const, updatedAt: now, deviceId: 'test' };
    await db.reminders.put({ id: 'r1', refType: 'task', refId: 'gone', at: now - 60_000, channel: 'tasks', status: 'scheduled', ...meta });
    await reconcileReminders(now);
    expect((await db.reminders.get('r1'))?.status).toBe('fired');
    expect(mock.cancel).not.toHaveBeenCalled();
  });
});
