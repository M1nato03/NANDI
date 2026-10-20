import type { LedgerRow } from '../../data/types';

/**
 * Calm rewards (audit 10-21): day one shows level, streak and the week in words.
 * Every other meter appears the first time it means something.
 */
export interface MeterReveal { quests: boolean; season: boolean; cleanWeek: boolean; shards: boolean; badges: boolean; storybooks: boolean }

export const SEASON_TEASER_DAYS = 7;
const dayMs = 86_400_000;
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / dayMs);

export function revealMeters(facts: readonly LedgerRow[], today: string, season: { start: string; active: boolean }, shards: number): MeterReveal {
  const live = facts.filter(row => !row.deleted && row.dayKey <= today);
  const first = live.reduce<string | undefined>((min, row) => min === undefined || row.dayKey < min ? row.dayKey : min, undefined);
  const weekday = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7;
  return {
    quests: live.length > 0,
    season: season.active || daysBetween(today, season.start) <= SEASON_TEASER_DAYS,
    cleanWeek: first !== undefined && daysBetween(first, today) >= 7,
    shards: shards > 0 || live.some(row => row.kind === 'purchase'),
    badges: live.some(row => row.kind === 'badge-tier' || row.kind === 'monthly-challenge'),
    storybooks: first !== undefined && daysBetween(first, today) > weekday,
  };
}
