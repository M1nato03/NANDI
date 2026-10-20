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

export type DayMode = 'off' | 'open' | 'limit';
export type PauseReason = 'night' | DayMode;
export const DAY_MODES: { value: DayMode; label: string }[] = [
  { value: 'limit', label: 'After a daily time limit' },
  { value: 'open', label: 'Every time I open one' },
  { value: 'off', label: 'Off (night only)' },
];
export const DAY_LIMIT_CHOICES = [15, 30, 45, 60, 90] as const;

export function readDayMode(value: unknown): DayMode {
  return value === 'off' || value === 'open' || value === 'limit' ? value : 'limit';
}

export function readDayLimit(value: unknown): number {
  return typeof value === 'number' && (DAY_LIMIT_CHOICES as readonly number[]).includes(value) ? value : RULES.night.pauseDayLimitMin;
}

/** What the pause card says, by why it opened. */
export function pauseCardCopy(input: { reason: string; minutes: number; label: string; planText: string | null }): { lead: string; primary: string; route: 'night' | 'plan' } {
  if (input.reason === 'open') return { lead: `You opened ${input.label}. Take a breath and choose on purpose.`, primary: 'Back to my day', route: 'plan' };
  if (input.reason === 'limit') {
    const minutes = Math.max(1, Math.round(input.minutes));
    return { lead: `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} in your chosen apps today. Is the next scroll worth it?`, primary: 'Back to my day', route: 'plan' };
  }
  return { lead: input.planText ?? 'If I reach for Reels at night, then I open my night deck.', primary: 'Open my night deck', route: 'night' };
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
