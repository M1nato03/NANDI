import { RULES } from '../rules.config';

/** XP shared pro rata by subtasks split from one large estimate at creation. */
export function creationSplitPool(estimateMin: number): number {
  if (!Number.isFinite(estimateMin) || estimateMin < 0) throw new RangeError('Estimate must be finite and nonnegative');
  return Math.round(RULES.tasks.xpBySize.L * estimateMin / RULES.tasks.maxEstimateMin);
}
