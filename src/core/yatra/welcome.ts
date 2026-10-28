/** Spec 37: Yatra is the first screen, and it opens with a greeting and one quiet line. */

export type DayBand = 'morning' | 'afternoon' | 'evening' | 'night';

/** The prototype's bands: 5-12 morning, 12-17 afternoon, 17-21 evening, else night. */
export function dayBand(hour: number): DayBand {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function greeting(hour: number, name?: string): string {
  const who = name?.trim();
  return `Good ${dayBand(hour)}${who ? `, ${who}` : ''}.`;
}

export const QUIET_LINES = [
  'Take a breath. Then pick one small thing.',
  'Nothing is due this minute.',
  'There is room to begin gently.',
  'Stay a little. The day is yours.',
  'The trail can wait until you are ready.',
] as const;
export const NIGHT_LINE = 'The friends are by the fire tonight.';

/** One line a day, the same all day and a different one the next (it steps by the day number); at night, the fire. */
export function quietLine(dayKey: string, hour: number): string {
  if (dayBand(hour) === 'night') return NIGHT_LINE;
  const [year, month, day] = dayKey.split('-').map(Number);
  const days = Math.floor(Date.UTC(year!, month! - 1, day!) / 86_400_000);
  return QUIET_LINES[((days % QUIET_LINES.length) + QUIET_LINES.length) % QUIET_LINES.length]!;
}
