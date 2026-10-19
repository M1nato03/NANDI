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
