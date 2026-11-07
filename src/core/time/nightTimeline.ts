import { dayKey } from './dayKey';
import { RULES } from '../rules.config';
/** Places a 24-hour local clock time on the noon-to-noon night timeline. */
export function minutesAfterNoon(time: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) {
    throw new RangeError('Expected a 24-hour HH:mm time');
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    throw new RangeError('Invalid clock time');
  }

  return ((hour + 12) % 24) * 60 + minute;
}

/** Negative means left is earlier on the night timeline. */
export function compareNightTimes(left: string, right: string): number {
  return minutesAfterNoon(left) - minutesAfterNoon(right);
}
/** Bedtime on the current 04:00-to-04:00 planning day. */
export function isAfterBedtime(now: number, bedtime: string): boolean {
  const [hour = 0, minute = 0] = bedtime.split(':').map(Number);
  const target = new Date(`${dayKey(now)}T00:00:00`);
  target.setHours(hour, minute, 0, 0);
  if (hour < RULES.dayBoundaryHour) target.setDate(target.getDate() + 1);
  return now >= target.getTime();
}

/**
 * Spec 571 §0.20 rule 3 (b2, 8 Nov): a bedtime from 20:00 to 04:59 runs the night window to 05:00; a bedtime from 05:00
 * to 19:59 (daytime, shift work) gets bedtime + 7 h.
 */
export const NIGHT_WINDOW_END = '05:00';
export const NIGHT_BEDTIME_FROM = '20:00';
export const SHIFT_NIGHT_HOURS = 7;

/**
 * Spec 571 §0.20 rule 3: whether `at` falls in the night window. Bedtime 20:00-04:59 → 05:00, which crosses midnight
 * and the 04:00 planning-day turn (so 04:00-05:00 counts for neither day): 20:00, 22:00, 23:30 and the 01:30 default all
 * end at 05:00. Bedtime 05:00-19:59 → bedtime + 7 h: 08:00 → 15:00, 14:00 → 21:00, 19:59 → 02:59. The default bedtime
 * counts as set (b2, 7 Nov), so every phone has a window.
 */
export function inNightWindow(at: number, bedtime: string): boolean {
  const [hour = 0, minute = 0] = bedtime.split(':').map(Number);
  const start = hour * 60 + minute;
  const [endHour = 5, endMinute = 0] = NIGHT_WINDOW_END.split(':').map(Number);
  const wake = endHour * 60 + endMinute;
  const [fromHour = 20, fromMinute = 0] = NIGHT_BEDTIME_FROM.split(':').map(Number);
  const daytime = start >= wake && start < fromHour * 60 + fromMinute;
  const length = daytime ? SHIFT_NIGHT_HOURS * 60 : ((wake - start) % 1440 + 1440) % 1440;
  const date = new Date(at);
  const now = date.getHours() * 60 + date.getMinutes();
  return ((now - start) % 1440 + 1440) % 1440 < length;
}
