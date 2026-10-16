import { Capacitor, registerPlugin } from '@capacitor/core';
import { RULES } from '../core/rules.config';

type Status = { usageAllowed: boolean; pendingPackage: string };
type NightPausePlugin = {
  status(): Promise<Status>;
  openUsageSettings(): Promise<void>;
  configure(options: { enabled: boolean; bedtime: string; packages: string; leadMinutes: number }): Promise<void>;
  clearPending(): Promise<void>;
  openApp(options: { packageName: string; snoozeMs: number }): Promise<void>;
};

const native = registerPlugin<NightPausePlugin>('NightPause');
export const nightPauseAvailable = () => Capacitor.isNativePlatform();
export async function nightPauseStatus(): Promise<Status> {
  return Capacitor.isNativePlatform() ? native.status() : { usageAllowed: false, pendingPackage: '' };
}
export async function openUsageSettings(): Promise<void> { if (Capacitor.isNativePlatform()) await native.openUsageSettings(); }
export async function configureNightPause(enabled: boolean, bedtime: string, packages: string[]): Promise<void> {
  if (Capacitor.isNativePlatform()) await native.configure({ enabled, bedtime, packages: packages.join(','), leadMinutes: RULES.night.pauseLeadMin });
}
export async function clearNightPause(): Promise<void> { if (Capacitor.isNativePlatform()) await native.clearPending(); }
export async function openPausedApp(packageName: string, snoozeMs: number): Promise<void> {
  if (Capacitor.isNativePlatform()) await native.openApp({ packageName, snoozeMs });
}
