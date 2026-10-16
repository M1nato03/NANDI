import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import type { UpdateVersion } from '../core/updates';

export const UPDATE_MANIFEST_URL = 'https://nandi-updates.nandi11.workers.dev/version.json';

export type InstalledVersion = { versionCode: number; versionName: string };
type NativeUpdater = {
  getInstalledVersion(): Promise<InstalledVersion>;
  checkForUpdate(options: { url: string }): Promise<UpdateVersion>;
  downloadAndInstall(options: { url: string; sha256: string }): Promise<void>;
  addListener(eventName: 'updateProgress', listener: (event: { percent: number }) => void): Promise<PluginListenerHandle>;
};
const native = registerPlugin<NativeUpdater>('Updater');

export const updaterAvailable = () => Capacitor.getPlatform() === 'android';
export async function getInstalledVersion(): Promise<InstalledVersion | null> {
  return updaterAvailable() ? native.getInstalledVersion() : null;
}
export async function checkForUpdate(): Promise<UpdateVersion | null> {
  if (!updaterAvailable()) return null;
  const result = await native.checkForUpdate({ url: `${UPDATE_MANIFEST_URL}?t=${Date.now()}` });
  if (!Number.isSafeInteger(result.versionCode) || result.versionCode < 1
    || !/^[a-f0-9]{64}$/i.test(result.sha256)
    || result.url !== `https://nandi-updates.nandi11.workers.dev/nandi-${result.versionCode}.apk`
    || typeof result.versionName !== 'string') throw new Error('Update details were invalid. Please try again.');
  return result;
}
export async function downloadAndInstall(update: UpdateVersion, onProgress: (percent: number) => void): Promise<void> {
  if (!updaterAvailable()) return;
  const handle = await native.addListener('updateProgress', ({ percent }) => onProgress(percent));
  try { await native.downloadAndInstall({ url: update.url, sha256: update.sha256 }); }
  finally { await handle.remove(); }
}
