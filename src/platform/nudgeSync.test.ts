// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../data/db';
import { NUDGE_MORNING_ON, NUDGE_NIGHT_ON } from '../core/nudges';

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
  it('does not schedule without notification permission', async () => {
    mock.checkPermission.mockResolvedValueOnce('denied');
    await reconcileNudges(now);
    expect(mock.schedule).not.toHaveBeenCalled();
  });
});
