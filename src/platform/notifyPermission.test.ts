import { beforeEach, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({ checkPermission: vi.fn(), requestPermission: vi.fn() }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('./notifier', () => ({ notifier: mock }));

import { NUDGE_PERMISSION_ASKED } from '../core/nudges';
import { db } from '../data/db';
import { askNotificationsOnce } from './notifyPermission';

beforeEach(async () => {
  vi.clearAllMocks();
  await db.settings.clear();
});

it('asks Android once in context, records it, and never asks again (audit F1)', async () => {
  mock.checkPermission.mockResolvedValue('prompt');
  mock.requestPermission.mockResolvedValue('granted');
  const [first, second] = await Promise.all([askNotificationsOnce(), askNotificationsOnce()]);
  expect([first, second]).toEqual(['granted', 'granted']);
  expect(mock.requestPermission).toHaveBeenCalledTimes(1);
  expect((await db.settings.get(NUDGE_PERMISSION_ASKED))?.value).toBe(true);
  expect(await askNotificationsOnce()).toBe('skipped');
  expect(mock.requestPermission).toHaveBeenCalledTimes(1);
});

it('does not ask when notifications are already allowed', async () => {
  mock.checkPermission.mockResolvedValue('granted');
  expect(await askNotificationsOnce()).toBe('granted');
  expect(mock.requestPermission).not.toHaveBeenCalled();
  expect(await db.settings.get(NUDGE_PERMISSION_ASKED)).toBeUndefined();
});
