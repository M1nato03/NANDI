import type { LedgerRow, SettingRow } from '../../data/types';
import { RULES, rulesFor } from '../rules.config';
import { addEconomyDays, deriveEconomy, seasonFor } from './deriveEconomy';
import { SEASON_ONE, usefulDates } from './usefulDays';

/**
 * Spec 47c: a season's result, shown once on the first ordinary open after the season ends, and kept to read again.
 * Every number is the real one: the rank and tier the season ended on, the useful days in it, and the Shards its tier
 * paid (`shards.seasonEnd` of the rules in force on its last day, as the economy pays them). It pays nothing itself.
 * Spec 43/44 pages do not exist yet, so the result names none; it never prints a sample count.
 */
export const RESULT_SHOWN_PREFIX = 'useful.resultShown:';
export const resultShownKey = (seasonStart: string) => `${RESULT_SHOWN_PREFIX}${seasonStart}`;
const RANK_SHOWN_KEY = 'season.rankShown';

type Settings = readonly SettingRow[];
type Season = { index: number; start: string; end: string };
export type SeasonResult = Season & { rank: number; tier: string; shards: number; usefulDays: number; rankShown: boolean; next: Season };

const setting = (settings: Settings, key: string) => settings.find(row => row.key === key && !row.deleted)?.value;

/** Every season that has ended by `today`, oldest first (none before Season 1 ends on Sun 6 Dec 2026). */
export function finishedSeasons(today: string): Season[] {
  const out: Season[] = [];
  for (let start = SEASON_ONE; ; ) {
    const season = seasonFor(start);
    if (season.end >= today) break;
    out.push({ index: season.index, start: season.start, end: season.end });
    start = addEconomyDays(season.end, 1);
  }
  return out;
}

/** One finished season's result, from the ledger as it stood on its last day. */
export function seasonResult(facts: readonly LedgerRow[], settings: Settings, season: Season): SeasonResult {
  const view = deriveEconomy(facts, undefined, settings, season.end);
  const tier = view.season.tier as keyof typeof RULES.shards.seasonEnd;
  const rules = rulesFor(season.end)?.rules ?? RULES;
  const nextSeason = seasonFor(addEconomyDays(season.end, 1));
  return {
    ...season, rank: view.season.rank, tier, shards: rules.shards.seasonEnd[tier],
    usefulDays: usefulDates(view.days, settings, season.start, season.end).length,
    rankShown: setting(settings, RANK_SHOWN_KEY) !== false,
    next: { index: nextSeason.index, start: nextSeason.start, end: nextSeason.end },
  };
}

/** Was this season's result page ever shown here (or on the phone a backup came from)? */
export const resultShown = (settings: Settings, seasonStart: string) => !!setting(settings, resultShownKey(seasonStart));

/**
 * The result to show on this open, if any: the season that ended most recently, not shown before, and one this person
 * took part in (a phone first used after it ended has no result for it). Older unseen seasons are not stacked up.
 */
export function resultDue(facts: readonly LedgerRow[], settings: Settings, today: string): SeasonResult | undefined {
  const season = finishedSeasons(today).at(-1);
  if (!season || resultShown(settings, season.start)) return undefined;
  if (!facts.some(row => !row.deleted && row.dayKey <= season.end)) return undefined;
  return seasonResult(facts, settings, season);
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const onDate = (key: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${key}T12:00:00Z`));

/**
 * The season-end words (spec 47 L4 with the REVERSAL rank line): one headline by tier, then the real facts. Never
 * "failed", "fell", "dropped" or "lost". With "Keep rank tucked away" on, the rank is left out. A season with no useful
 * day says nothing about useful days.
 */
export function resultWords(result: SeasonResult, today: string): { eyebrow: string; headline: string; facts: string; closing: string } {
  const name = `Season ${result.index + 1}`;
  const rank = result.rankShown ? `#${result.rank} of 500 · ` : '';
  const days = plural(result.usefulDays, 'useful day', 'useful days');
  const shards = `${result.shards} Shards`;
  const show = (key: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${key}T12:00:00Z`));
  const eyebrow = `${name} · ${show(result.start)}–${show(result.end)} ${result.end.slice(0, 4)}`;
  const next = `Season ${result.next.index + 1}`;
  const fresh = today < result.next.start ? `${next} starts ${onDate(result.next.start)} with a fresh climb.`
    : today === result.next.start ? `${next} starts today with a fresh climb.` : `${next} is under way, a fresh climb.`;
  if (result.tier === 'Apex' || result.tier === 'Ace') {
    return { eyebrow, headline: `You reached ${result.tier}.`, facts: `${rank}${result.usefulDays ? `${days} · ` : ''}${shards}.`, closing: `Here's what you finished. ${fresh}` };
  }
  if (result.tier === 'Elite' || result.tier === 'Contender') {
    return { eyebrow, headline: `You reached ${result.tier}.`, facts: `${rank}${result.usefulDays ? `${days} moved your goal forward · ` : ''}${shards}.`, closing: fresh };
  }
  return { eyebrow, headline: `${name} is complete.`, facts: `${rank}${result.tier} · ${result.usefulDays ? `${days} toward your goal · ` : ''}${shards}.`, closing: fresh };
}
