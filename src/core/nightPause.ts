import { RULES } from './rules.config';

export const DEFAULT_PAUSE_APPS = [
  { label: 'Instagram', packageName: 'com.instagram.android' },
  { label: 'YouTube', packageName: 'com.google.android.youtube' },
  { label: 'Snapchat', packageName: 'com.snapchat.android' },
] as const;

function nightMinute(clock: string): number {
  const [hour, minute] = clock.split(':').map(Number);
  const total = (hour ?? 0) * 60 + (minute ?? 0);
  return total < 12 * 60 ? total + 24 * 60 : total;
}

export function pauseWindowActive(now: Date, bedtime: string): boolean {
  const current = nightMinute(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  const start = nightMinute(bedtime) - RULES.night.pauseLeadMin;
  return current >= start && current < 28 * 60;
}

/** The pause window as clock times, for the settings screen. */
export function pauseWindowTimes(bedtime: string): { start: string; end: string } {
  const start = ((nightMinute(bedtime) - RULES.night.pauseLeadMin) % (24 * 60) + 24 * 60) % (24 * 60);
  return { start: `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`, end: '04:00' };
}

export function shouldShowNightPause(input: {
  enabled: boolean; usageAllowed: boolean; screenOn: boolean; now: Date; bedtime: string;
  foregroundPackage: string | null; selectedPackages: string[]; lastPromptPackage?: string;
}): boolean {
  return input.enabled && input.usageAllowed && input.screenOn && pauseWindowActive(input.now, input.bedtime) &&
    !!input.foregroundPackage && input.selectedPackages.includes(input.foregroundPackage) &&
    input.foregroundPackage !== input.lastPromptPackage;
}
