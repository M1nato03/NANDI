import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  native: true,
  getInstalledVersion: vi.fn(),
  checkForUpdate: vi.fn(),
  downloadAndInstall: vi.fn(),
  addListener: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => mock.native ? 'android' : 'web' },
  registerPlugin: () => mock,
}));

import { UPDATE_MANIFEST_URL, checkForUpdate, downloadAndInstall, getInstalledVersion } from './updater';

const version = { versionCode: 12, versionName: '0.1.0', sha256: 'a'.repeat(64),
  url: 'https://nandi-updates.nandi11.workers.dev/nandi-12.apk', builtAt: '', commit: '', notes: '' };

describe('Updater bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks(); mock.native = true;
    mock.getInstalledVersion.mockResolvedValue({ versionCode: 11, versionName: '0.1.0' });
    mock.checkForUpdate.mockResolvedValue(version);
    mock.downloadAndInstall.mockResolvedValue(undefined);
    mock.addListener.mockResolvedValue({ remove: mock.remove });
  });
  it('does not call the plugin on web', async () => {
    mock.native = false;
    expect(await getInstalledVersion()).toBeNull();
    expect(await checkForUpdate()).toBeNull();
    await downloadAndInstall(version, () => undefined);
    expect(mock.getInstalledVersion).not.toHaveBeenCalled();
    expect(mock.checkForUpdate).not.toHaveBeenCalled();
    expect(mock.downloadAndInstall).not.toHaveBeenCalled();
  });
  it('reads installed version and requests fresh update details', async () => {
    expect(await getInstalledVersion()).toEqual({ versionCode: 11, versionName: '0.1.0' });
    expect(await checkForUpdate()).toEqual(version);
    expect(mock.checkForUpdate).toHaveBeenCalledWith({ url: expect.stringMatching(new RegExp(`^${UPDATE_MANIFEST_URL.replaceAll('.', '\\.')}\\?t=\\d+$`)) });
  });
  it('rejects an untrusted APK address', async () => {
    mock.checkForUpdate.mockResolvedValue({ ...version, url: 'https://elsewhere.example/nandi-12.apk' });
    await expect(checkForUpdate()).rejects.toThrow('invalid');
  });
  it('forwards progress and removes its listener after install', async () => {
    mock.addListener.mockImplementation(async (_name, listener) => { listener({ percent: 42 }); return { remove: mock.remove }; });
    const progress = vi.fn();
    await downloadAndInstall(version, progress);
    expect(progress).toHaveBeenCalledWith(42);
    expect(mock.downloadAndInstall).toHaveBeenCalledWith({ url: version.url, sha256: version.sha256 });
    expect(mock.remove).toHaveBeenCalled();
  });
});
