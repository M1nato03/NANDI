import { RULES } from '../rules.config';
import { addEconomyDays } from './deriveEconomy';
import type { SettingRow } from '../../data/types';

export const AWAY_KEY = 'economy.away';
export type AwayRange = { start: string; end: string };
const validDay = (key: string) => /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(Date.parse(`${key}T12:00:00Z`)) && new Date(`${key}T12:00:00Z`).toISOString().slice(0, 10) === key;

export function awayRanges(settings: readonly SettingRow[]): AwayRange[] {
  const value = settings.find(row => row.key === AWAY_KEY && !row.deleted)?.value;
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is AwayRange => row && typeof row.start === 'string' && typeof row.end === 'string' && validDay(row.start) && validDay(row.end) && row.start <= row.end);
}

export const isAway = (settings: readonly SettingRow[], key: string): boolean => awayRanges(settings).some(row => row.start <= key && key <= row.end);

export function planAway(settings: readonly SettingRow[], start: string, end: string, today: string, bank: number): { ranges?: AwayRange[]; error?: string } {
  if (!validDay(start) || !validDay(end) || start < today || end < start) return { error: 'Choose today or later, with an end after the start.' };
  if (end >= addEconomyDays(start, RULES.streak.awayMaxDays)) return { error: `Plan up to ${RULES.streak.awayMaxDays} days at a time.` };
  const ranges = awayRanges(settings);
  if (ranges.some(row => start <= row.end && end >= row.start)) return { error: 'These dates overlap a trip already planned.' };
  const reserved = new Set(ranges.filter(row => row.end >= today).flatMap(row => {
    const days: string[] = [];
    for (let key = row.start < today ? today : row.start; key <= row.end; key = addEconomyDays(key, 1)) days.push(key);
    return days;
  }));
  let requested = 0;
  for (let key = start; key <= end; key = addEconomyDays(key, 1)) requested++;
  if (requested + reserved.size > bank) return { error: 'Choose dates that fit your rest bank.' };
  return { ranges: [...ranges, { start, end }].sort((a, b) => a.start.localeCompare(b.start)) };
}
