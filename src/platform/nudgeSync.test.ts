// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../data/db';
import { NUDGE_MORNING_ON, NUDGE_NIGHT_ON, NUDGE_STREAK_ON } from '../core/nudges';

const mock = vi.hoisted(() => ({ schedule: vi.fn().mockResolvedValue(undefined), cancel: vi.fn().mockResolvedValue(undefined),
  listPending: vi.fn().mockResolvedValue([]), checkPermission: vi.fn().mockResolvedValue('granted') }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('./notifier', () => ({ notifier: mock, notifId: () => 123 }));
import { reconcileNudges } from './nudgeSync';

const now = new Date(2026, 9, 16, 8).getTime();
const meta = { deleted: 0 as const, updatedAt: now, deviceId: 'test' };

beforeEach(async () => {
  vi.clearAllMocks();
  localStorage.clear();
  await Promise.all([db.settings.clear(), db.tasks.clear(), db.dailyLog.clear(), db.reminders.clear()]);
});

describe('nudge reconciliation', () => {
  it('reschedules changed tasks and times, and cancels both when switched off', async () => {
    await db.tasks.put({ id: 'read', title: 'Read', status: 'planned', dayKey: '2026-10-16', estimateMin: 25, ...meta });
    await reconcileNudges(now);
    expect(mock.schedule).toHaveBeenCalledWith(expect.objectContaining({ id: 'nudge:morning:2026-10-16', body: 'Read · 25 min' }));
    mock.listPending.mockImplementation(async () => (await db.reminders.toArray()).filter(row => row.status === 'scheduled').map(row => row.id));
    await db.tasks.update('read', { title: 'Write' });
    await db.settings.put({ key: 'planner.shutdown', value: '22:45', ...meta });
    await reconcileNudges(now);
    expect(mock.cancel).toHaveBeenCalledWith('nudge:morning:2026-10-16');
    expect(mock.schedule).toHaveBeenCalledWith(expect.objectContaining({ id: 'nudge:morning:2026-10-16', body: 'Write · 25 min' }));
    expect(mock.schedule).toHaveBeenCalledWith(expect.objectContaining({ id: 'nudge:night:2026-10-16', at: new Date(2026, 9, 16, 22, 45).getTime() }));
    await db.settings.bulkPut([{ key: NUDGE_MORNING_ON, value: false, ...meta }, { key: NUDGE_NIGHT_ON, value: false, ...meta }]);
    await reconcileNudges(now);
    expect((await db.reminders.toArray()).filter(row => row.status === 'scheduled' && row.refType === 'nudge')).toEqual([]);
    expect(mock.cancel).toHaveBeenCalledWith('nudge:night:2026-10-16');
  });
  it('spec 47b: a streak reminder still pending from an old opt-in is cancelled, and none is scheduled again', async () => {
    await db.settings.put({ key: NUDGE_STREAK_ON, value: true, ...meta });
    await db.reminders.put({ id: 'nudge:streak:2026-10-16', refType: 'nudge', refId: 'streak:2026-10-16', at: new Date(2026, 9, 16, 21).getTime(), notifId: 123,
      channel: 'planning', title: 'A small step still counts', body: 'A task, movement, or a Mind moment is enough today.', status: 'scheduled', ...meta });
    mock.listPending.mockResolvedValueOnce(['nudge:streak:2026-10-16']);
    await reconcileNudges(now);
    expect(mock.cancel).toHaveBeenCalledWith('nudge:streak:2026-10-16');
    expect((await db.reminders.get('nudge:streak:2026-10-16'))?.status).toBe('cancelled');
    expect(mock.schedule.mock.calls.some(([reminder]) => String(reminder.id).startsWith('nudge:streak:'))).toBe(false);
    // The old opt-in is kept as it was, only as backup history.
    expect((await db.settings.get(NUDGE_STREAK_ON))?.value).toBe(true);
  });
  it('does not schedule without notification permission', async () => {
    mock.checkPermission.mockResolvedValueOnce('denied');
    await reconcileNudges(now);
    expect(mock.schedule).not.toHaveBeenCalled();
  });
});
