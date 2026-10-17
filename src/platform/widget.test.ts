import { expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({ native: false, setState: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => mock.native },
  registerPlugin: () => mock,
}));

import { setWidgetState } from './widget';

it('skips web and sends the complete state to Android', async () => {
  const state = { dayTitle: 'Now · Read', daySubtitle: '0 of 1 done today', nightTitle: 'Night deck ready', nightSubtitle: 'Six calm cards, then phone down.', shutdownMinutes: 1395 };
  await setWidgetState(state);
  expect(mock.setState).not.toHaveBeenCalled();
  mock.native = true;
  await setWidgetState(state);
  expect(mock.setState).toHaveBeenCalledExactlyOnceWith(state);
});
