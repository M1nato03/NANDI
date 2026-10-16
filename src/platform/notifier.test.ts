import { describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  schedule: vi.fn().mockResolvedValue({ notifications: [] }),
  cancel: vi.fn().mockResolvedValue(undefined),
  getPending: vi.fn().mockResolvedValue({ notifications: [] }),
  createChannel: vi.fn().mockResolvedValue(undefined),
  requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: mock }));

import { CapacitorNotifier, notifId } from './notifier';

describe('Capacitor notifier', () => {
  it('keeps a stable Android integer ID and schedules exact idle-safe alarms', async () => {
    const notifier = new CapacitorNotifier();
    await notifier.createChannels();
    expect(mock.createChannel.mock.calls.map(call => call[0].name)).toEqual(['Task blocks', 'Rest timer', 'Planning']);
    expect(await notifier.requestPermission()).toBe('granted');
    const at = Date.now() + 90_000;
    await notifier.schedule({ id: 'rest:session-1', at, title: 'Rest is over', body: 'Next set', channel: 'rest' });
    expect(mock.schedule).toHaveBeenCalledWith({ notifications: [expect.objectContaining({
      id: notifId('rest:session-1'), channelId: 'rest', extra: { reminderId: 'rest:session-1' },
      schedule: { at: new Date(at), allowWhileIdle: true },
    })] });
    mock.getPending.mockResolvedValueOnce({ notifications: [{ id: notifId('rest:session-1'), extra: { reminderId: 'rest:session-1' } }] });
    expect(await notifier.listPending()).toEqual(['rest:session-1']);
    await notifier.cancel('rest:session-1');
    expect(mock.cancel).toHaveBeenCalledWith({ notifications: [{ id: notifId('rest:session-1') }] });
  });
});
