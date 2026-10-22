/** Repeating tasks (audit 10-21): finishing one plans the next, at the same time of day. */
export type Repeat = 'daily' | 'weekdays' | 'weekly';
export const REPEATS: readonly { id: Repeat; label: string }[] = [
  { id: 'daily', label: 'Every day' }, { id: 'weekdays', label: 'Weekdays' }, { id: 'weekly', label: 'Every week' },
];

const shift = (key: string, days: number) => new Date(Date.parse(`${key}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
const weekday = (key: string) => new Date(`${key}T12:00:00Z`).getUTCDay();

/** The next day for a repeat, never today or earlier, even when the last one was finished late. */
export function nextRepeatDay(repeat: Repeat, taskDay: string, today: string): string {
  if (repeat === 'weekly') { let next = shift(taskDay, 7); while (next <= today) next = shift(next, 7); return next; }
  let next = shift(taskDay > today ? taskDay : today, 1);
  if (repeat === 'weekdays') while (weekday(next) === 0 || weekday(next) === 6) next = shift(next, 1);
  return next;
}

/** Moves a start time to the same local clock on another planning day. The planning day runs 04:00 to 04:00,
 * so a 00:30 start belongs to the night after `day` and lands on the next calendar date. */
export function sameTimeOn(start: number, day: string): number {
  const from = new Date(start);
  const to = new Date(`${day}T00:00:00`);
  to.setHours(from.getHours(), from.getMinutes(), 0, 0);
  if (from.getHours() < 4) to.setDate(to.getDate() + 1);
  return to.getTime();
}
