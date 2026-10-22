import type { Rules } from '../rules.config';
import { creationSplitPool } from '../economy/creationSplit';
import type { CoreTask, TaskSize } from './task-machine';

/** Largest-remainder allocation keeps the exact pool while respecting estimate proportions. */
export function splitTask(
  parent: CoreTask,
  numSubtasks: number,
  estimates: number[],
  rules: Rules,
  at: number,
): CoreTask[] {
  if (!Number.isFinite(at)) throw new RangeError('Split requires a timestamp');
  if (
    numSubtasks < 2 ||
    numSubtasks !== estimates.length ||
    estimates.some(
      (est) =>
        !Number.isFinite(est) ||
        est < rules.tasks.subtaskMin ||
        est > rules.tasks.subtaskMax,
    )
  ) {
    throw new RangeError('Split requires 2 or more subtasks of 25–60 minutes');
  }
  const totalEstimate = estimates.reduce((sum, est) => sum + est, 0);
  if (totalEstimate !== parent.estimateMin)
    throw new RangeError('Subtask estimates must sum to parent estimate');
  const pool =
    parent.xpShare ??
    (parent.estimateMin > rules.tasks.maxEstimateMin
      ? creationSplitPool(parent.estimateMin)
      : rules.tasks.xpBySize[parent.plannedSize]);
  const exact = estimates.map((est) => (pool * est) / totalEstimate);
  const shares = exact.map((value) => Math.floor(value));
  const remainder = pool - shares.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const { index } of order.slice(0, remainder))
    shares[index] = (shares[index] ?? 0) + 1;
  // Steps of a placed task run back to back inside its block, never all at its start time (Tasks audit 5).
  const keepSlot = parent.postponeCount !== 3 && parent.scheduledStart != null;
  const offsets = estimates.map((_, index) => estimates.slice(0, index).reduce((sum, est) => sum + est, 0) * 60_000);
  return estimates.map((estimateMin, index) => {
    const size: TaskSize =
      estimateMin <= rules.tasks.sizeMinutes.S[1]
        ? 'S'
        : estimateMin <= rules.tasks.sizeMinutes.M[1]
          ? 'M'
          : 'L';
    return {
      id: `${parent.id}-sub-${index}-${at}`,
      status:
        parent.postponeCount === 3
          ? 'unplaced'
          : parent.status === 'planned'
            ? 'planned'
            : 'unplaced',
      dayKey: parent.dayKey,
      size,
      estimateMin,
      plannedSize: size,
      parentId: parent.id,
      scheduledStart: keepSlot ? parent.scheduledStart! + offsets[index]! : parent.postponeCount === 3 ? null : parent.scheduledStart,
      scheduledEnd: keepSlot ? parent.scheduledStart! + offsets[index]! + estimateMin * 60_000 : parent.postponeCount === 3 ? null : parent.scheduledEnd,
      firstScheduledDayKey: parent.firstScheduledDayKey,
      category: parent.category,
      mustOrCould: parent.mustOrCould,
      postponeCount: parent.postponeCount === 3 ? 2 : parent.postponeCount,
      xpShare: shares[index] ?? 0,
    };
  });
}
