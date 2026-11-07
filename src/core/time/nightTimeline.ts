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

/** Spec 571 §0.20 rule 3: with no wake-time setting the night window ends at 05:00; a daytime bedtime (shift work) gets 7 h. */
export const NIGHT_WINDOW_END = '05:00';
export const SHIFT_NIGHT_HOURS = 7;

/**
 * Spec 571 §0.20 rule 3: whether `at` falls in the night window, bedtime → 05:00, which crosses midnight and the 04:00
 * planning-day turn (so 04:00-05:00 counts for neither day). A bedtime from 05:00 to before noon (shift work) gives a
 * window of bedtime + 7 h. The default bedtime counts as set (b2, 7 Nov), so every phone has a window.
 */
export function inNightWindow(at: number, bedtime: string): boolean {
  const [hour = 0, minute = 0] = bedtime.split(':').map(Number);
  const start = hour * 60 + minute;
  const [endHour = 5, endMinute = 0] = NIGHT_WINDOW_END.split(':').map(Number);
  const wake = endHour * 60 + endMinute;
  const end = start >= wake && start < 12 * 60 ? start + SHIFT_NIGHT_HOURS * 60 : wake;
  const length = ((end - start) % 1440 + 1440) % 1440;
  const date = new Date(at);
  const now = date.getHours() * 60 + date.getMinutes();
  return ((now - start) % 1440 + 1440) % 1440 < length;
}
