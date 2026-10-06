import { RULES } from '../rules.config';

function targetFor(daysInSeason: number): number {
  if (!Number.isInteger(daysInSeason) || daysInSeason < 1) throw new RangeError('Invalid season length');
  return RULES.season.targetPerDay * daysInSeason;
}

/** The rank is a position among the configured number of seats. */
export function seasonRank(sp: number, daysInSeason: number): number {
  if (!Number.isFinite(sp) || sp < 0) throw new RangeError('SP must be finite and nonnegative');
  const fraction = Math.min(1, sp / targetFor(daysInSeason));
  return RULES.season.seats - Math.floor((RULES.season.seats - 1) * fraction ** RULES.season.exponent);
}

/** Carry forward up to seedPct of last season's SP, capped by the new target. */
export function seasonSeed(lastSeasonSp: number, daysInSeason: number): number {
  if (!Number.isFinite(lastSeasonSp) || lastSeasonSp < 0) throw new RangeError('SP must be finite and nonnegative');
  const fraction = RULES.season.seedPct / 100;
  return Math.min(fraction * lastSeasonSp, fraction * targetFor(daysInSeason));
}
