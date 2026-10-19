import { expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({ native: false, openAppInfo: vi.fn().mockResolvedValue(undefined), openUsageSettings: vi.fn().mockResolvedValue(undefined), status: vi.fn().mockResolvedValue({ usageAllowed: true, overlayAllowed: true, pendingPackage: '' }), openOverlaySettings: vi.fn().mockResolvedValue(undefined), test: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => mock.native },
  registerPlugin: () => mock,
}));

import { nightPauseStatus, openNightPauseAppInfo, openOverlaySettings, openUsageSettings, testNightPause } from './nightPause';

it('opens NANDI App info through the native plugin and keeps the web path inert', async () => {
  await openNightPauseAppInfo();
  await openOverlaySettings();
  await testNightPause(120_000);
  expect(mock.openAppInfo).not.toHaveBeenCalled();
  expect(mock.openOverlaySettings).not.toHaveBeenCalled();
  expect(mock.test).not.toHaveBeenCalled();
  expect(await nightPauseStatus()).toEqual({ usageAllowed: false, overlayAllowed: false, pendingPackage: '' });
  mock.native = true;
  await openNightPauseAppInfo();
  await openUsageSettings();
  await openOverlaySettings();
  await testNightPause(120_000);
  expect(mock.openAppInfo).toHaveBeenCalledOnce();
  expect(mock.openUsageSettings).toHaveBeenCalledOnce();
  expect(mock.openOverlaySettings).toHaveBeenCalledOnce();
  expect(mock.test).toHaveBeenCalledWith({ durationMs: 120_000 });
  expect(await nightPauseStatus()).toEqual({ usageAllowed: true, overlayAllowed: true, pendingPackage: '' });
});
