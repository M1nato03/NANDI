import { expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({ native: false, openAppInfo: vi.fn().mockResolvedValue(undefined), openUsageSettings: vi.fn().mockResolvedValue(undefined), status: vi.fn().mockResolvedValue({ usageAllowed: true, pendingPackage: '' }) }));
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => mock.native },
  registerPlugin: () => mock,
}));

import { nightPauseStatus, openNightPauseAppInfo, openUsageSettings } from './nightPause';

it('opens NANDI App info through the native plugin and keeps the web path inert', async () => {
  await openNightPauseAppInfo();
  expect(mock.openAppInfo).not.toHaveBeenCalled();
  expect(await nightPauseStatus()).toEqual({ usageAllowed: false, pendingPackage: '' });
  mock.native = true;
  await openNightPauseAppInfo();
  await openUsageSettings();
  expect(mock.openAppInfo).toHaveBeenCalledOnce();
  expect(mock.openUsageSettings).toHaveBeenCalledOnce();
  expect(await nightPauseStatus()).toEqual({ usageAllowed: true, pendingPackage: '' });
});
