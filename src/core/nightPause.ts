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
export const DAY_LIMIT_CHOICES = RULES.night.pauseDayLimitChoices;

export function readDayMode(value: unknown): DayMode {
  return value === 'off' || value === 'open' || value === 'limit' ? value : 'limit';
}

export function readDayLimit(value: unknown): number {
  return typeof value === 'number' && (DAY_LIMIT_CHOICES as readonly number[]).includes(value) ? value : RULES.night.pauseDayLimitMin;
}

export type PauseSwap = { label: string; route: string };
/** What the pause card says, by why it opened, and the one-tap swaps offered after the breath. */
export function pauseCardCopy(input: { reason: string; minutes: number; label: string; planText: string | null; suggestion?: string | null }): { lead: string; swaps: PauseSwap[] } {
  const review = { label: 'One review card', route: 'mind/reviews' };
  if (input.reason === 'night') {
    const middle = input.suggestion ? { label: input.suggestion, route: 'close' } : review;
    return { lead: input.planText ?? 'If I reach for Reels at night, then I open my night deck.', swaps: [{ label: 'Open my night deck', route: 'night' }, middle, { label: 'Put the phone down', route: 'close' }] };
  }
  const minutes = Math.max(1, Math.round(input.minutes));
  const lead = input.reason === 'limit'
    ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} in your chosen apps today. Is the next scroll worth it?`
    : `You opened ${input.label}. Take a breath and choose on purpose.`;
  const second = input.suggestion ? { label: input.suggestion, route: 'close' } : review;
  return { lead, swaps: [{ label: 'A 2-minute puzzle', route: 'mind/board/daily' }, second, { label: 'Back to my day', route: 'plan' }] };
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
