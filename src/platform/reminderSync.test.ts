import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  schedule: vi.fn().mockResolvedValue(undefined), cancel: vi.fn().mockResolvedValue(undefined),
  listPending: vi.fn().mockResolvedValue([]), requestPermission: vi.fn().mockResolvedValue('granted'),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('./notifier', () => ({ notifier: mock, CapacitorNotifier: class {}, notifId: () => 123 }));

import { db } from '../data/db';
import { reconcileReminders } from './reminderSync';

beforeEach(async () => {
  vi.clearAllMocks();
  await Promise.all([db.tasks.clear(), db.sessions.clear(), db.reminders.clear()]);
});

describe('reminder reconciliation', () => {
  it('schedules a task block and rest backstop, then cancels both when they end', async () => {
    const now = Date.now();
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
});
