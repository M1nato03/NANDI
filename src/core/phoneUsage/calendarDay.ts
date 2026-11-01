/**
 * Spec 46: phone use is counted by the local calendar day, midnight to midnight, as Android's Digital Wellbeing labels
 * its days. This is not NANDI's 04:00 planning day (core/time dayKey), and one is never relabelled as the other.
 */
const pad = (n: number) => String(n).padStart(2, '0');
const parse = (day: string) => { const [y, m, d] = day.split('-').map(Number) as [number, number, number]; return { y, m, d }; };

/** The local calendar date of an instant, YYYY-MM-DD. */
export function calendarDayKey(ms: number): string {
  const date = new Date(ms);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `day` moved by `n` calendar days. */
export function addCalendarDays(day: string, n: number): string {
  const { y, m, d } = parse(day);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Minutes east of UTC at an instant (India: 330). */
export const offsetAt = (ms: number) => 0 - new Date(ms).getTimezoneOffset();

/** Local midnight to the next local midnight; a clock-change day is 23 or 25 hours long, never cut to 24. */
export function calendarBounds(day: string): { fromMs: number; toMs: number; offsetStartMin: number; offsetEndMin: number } {
  const { y, m, d } = parse(day);
  const fromMs = new Date(y, m - 1, d).getTime();
  const toMs = new Date(y, m - 1, d + 1).getTime();
  return { fromMs, toMs, offsetStartMin: offsetAt(fromMs), offsetEndMin: offsetAt(toMs - 1) };
}

/** 0 Sunday … 6 Saturday. */
export function calendarWeekday(day: string): number {
  const { y, m, d } = parse(day);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
