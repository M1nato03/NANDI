import { RULES } from '../rules.config';

/** Level L starts at stepBase × L × (L − 1) / 2 cumulative XP. */
export function levelForXp(totalXp: number): number {
  if (!Number.isFinite(totalXp) || totalXp < 0) throw new RangeError('XP must be finite and nonnegative');
  return Math.floor((1 + Math.sqrt(1 + (8 * totalXp) / RULES.level.stepBase)) / 2);
}
