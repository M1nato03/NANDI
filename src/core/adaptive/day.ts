import { RULES } from '../rules.config';
import type { SettingRow, TaskRow } from '../../data/types';

export const INTERESTS_KEY = 'adaptive.interests';
export const BUSY_SHIFT_KEY = 'adaptive.busyShift';
export const shiftOffKey = (day: string) => `adaptive.shiftOff:${day}`;

/** Things people enjoy, each with a version that has a clear end, so it cannot become an endless feed. */
export const INTERESTS = [
  { id: 'gym', label: 'Gym', bounded: 'One gym session', night: false },
  { id: 'walk', label: 'Walking', bounded: 'A 15-minute walk', night: false },
  { id: 'movie', label: 'Movies', bounded: 'One film, then bed', night: false },
  { id: 'anime', label: 'Anime and shows', bounded: 'Watch one episode, then stop', night: false },
  { id: 'music', label: 'Music', bounded: 'Play one album', night: true },
  { id: 'reading', label: 'Reading', bounded: 'Read one chapter', night: true },
  { id: 'cooking', label: 'Cooking', bounded: 'Cook one dish', night: false },
  { id: 'gaming', label: 'Gaming', bounded: 'Play one match', night: false },
  { id: 'art', label: 'Drawing and art', bounded: 'Sketch for 20 minutes', night: true },
  { id: 'friends', label: 'Friends and family', bounded: 'Call someone you like', night: false },
] as const;
export type InterestId = typeof INTERESTS[number]['id'];

const value = (settings: readonly SettingRow[], key: string) => settings.find(row => row.key === key && !row.deleted)?.value;

export function readInterests(settings: readonly SettingRow[]): InterestId[] {
  const stored = value(settings, INTERESTS_KEY);
  return Array.isArray(stored) ? INTERESTS.map(item => item.id).filter(id => stored.includes(id)) : [];
}

/** One bounded idea from the chosen interests, rotating by day so it does not repeat every time. */
export function boundedSuggestion(interests: readonly InterestId[], day: string, night: boolean): string | null {
  const pool = INTERESTS.filter(item => interests.includes(item.id) && (!night || item.night));
  if (!pool.length) return null;
  const seed = [...day].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return pool[seed % pool.length]!.bounded;
}

/** Minutes planned for the day: the estimate when there is one, otherwise the middle of the task's size. */
export function plannedMinutes(tasks: readonly TaskRow[], day: string): number {
  const sizes = RULES.tasks.sizeMinutes as Record<string, readonly [number, number]>;
  return tasks.filter(task => !task.deleted && task.dayKey === day && task.status !== 'dropped' && task.status !== 'someday')
    .reduce((sum, task) => {
      if ((task.estimateMin ?? 0) > 0) return sum + task.estimateMin!;
      const range = sizes[task.size ?? 'M'] ?? sizes.M!;
      return sum + Math.round((range[0] + range[1]) / 2);
    }, 0);
}

/** A busy day moves the night later: +30 min from 4 h planned, +60 min from 6 h (spec 11 W5). */
export function busyShiftMinutes(minutes: number): number {
  const rules = RULES.adaptive;
  if (minutes >= rules.veryBusyMinutes) return rules.veryBusyShiftMin;
  if (minutes >= rules.busyMinutes) return rules.busyShiftMin;
  return 0;
}

export function shiftClock(clock: string, minutes: number): string {
  const [hour = 0, minute = 0] = clock.split(':').map(Number);
  const total = ((hour * 60 + minute + minutes) % 1440 + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export interface AdaptiveNight { shift: number; plannedMinutes: number; bedtime: string; undone: boolean }

/** The bedtime the night features use today, after a busy-day shift the person has not undone. */
export function adaptiveNight(settings: readonly SettingRow[], tasks: readonly TaskRow[], day: string): AdaptiveNight {
  const stored = value(settings, 'planner.bedtime');
  const base = typeof stored === 'string' ? stored : RULES.night.defaultBedtime;
  const minutes = plannedMinutes(tasks, day);
  const enabled = value(settings, BUSY_SHIFT_KEY) !== false;
  const undone = value(settings, shiftOffKey(day)) === true;
  const shift = enabled && !undone ? busyShiftMinutes(minutes) : 0;
  return { shift, plannedMinutes: minutes, bedtime: shift ? shiftClock(base, shift) : base, undone };
}
