import { dayKey } from '../time/dayKey';
import { RULES, type Rules } from '../rules.config';

export type TaskStatus =
  'planned' | 'unplaced' | 'done' | 'someday' | 'dropped';
export type TaskSize = 'S' | 'M' | 'L';

export interface CoreTask {
  id: string;
  status: TaskStatus;
  dayKey: string;
  size: TaskSize;
  estimateMin: number;
  plannedSize: TaskSize;
  mustOrCould?: 'must' | 'could';
  category?: string;
  scheduledStart?: number | null;
  scheduledEnd?: number | null;
  firstStep?: string;
  postponeCount: number;
  firstScheduledDayKey?: string;
  lastPlannedDayKey?: string;
  parentId?: string;
  xpShare?: number;
}

export function createTask(
  id: string,
  now: number,
  size: TaskSize,
  estimateMin: number,
  options: Partial<CoreTask> = {},
): CoreTask {
  if (!canSaveUnsplit(estimateMin))
    throw new RangeError('Estimate requires a split');
  const scheduled = options.scheduledStart != null;
  const key = dayKey(scheduled ? (options.scheduledStart as number) : now);
  return {
    id,
    status: scheduled ? 'planned' : 'unplaced',
    dayKey: key,
    size,
    estimateMin,
    plannedSize: size,
    postponeCount: 0,
    ...options,
    firstScheduledDayKey:
      options.firstScheduledDayKey ?? (scheduled ? key : undefined),
    lastPlannedDayKey: options.lastPlannedDayKey ?? (scheduled ? key : undefined),
  };
}

export function isActualPostpone(
  task: CoreTask,
  newStart: number | null,
  now: number,
): boolean {
  if (task.status === 'unplaced')
    return !!task.firstScheduledDayKey && newStart != null;
  if (task.status !== 'planned' || task.scheduledStart == null) return false;
  if (newStart == null) return true;
  const oldDay = dayKey(task.scheduledStart);
  const nextDay = dayKey(newStart);
  return (
    nextDay > oldDay ||
    (nextDay === oldDay &&
      now >= task.scheduledStart &&
      newStart > task.scheduledStart)
  );
}

export function postponeTask(
  task: CoreTask,
  newStart: number | null,
  now: number,
): CoreTask {
  const counted = isActualPostpone(task, newStart, now);
  const count = task.postponeCount + (counted ? 1 : 0);
  // Only a counted move parks the task. Planning it again from Someday is never counted, so it always comes back
  // (Codex A item 87: a task parked by its 4th move could never leave Someday).
  if (counted && count >= RULES.tasks.postpone.autoSomedayAt)
    return {
      ...task,
      status: 'someday',
      postponeCount: count,
      scheduledStart: null,
      scheduledEnd: null,
    };
  if (newStart == null)
    return {
      ...task,
      status: 'unplaced',
      scheduledStart: null,
      scheduledEnd: null,
      dayKey: dayKey(now),
      postponeCount: count,
    };
  const nextDay = dayKey(newStart);
  return {
    ...task,
    status: 'planned',
    scheduledStart: newStart,
    scheduledEnd: movedEnd(task, newStart),
    dayKey: nextDay,
    postponeCount: count,
    firstScheduledDayKey: task.firstScheduledDayKey ?? nextDay,
    lastPlannedDayKey: nextDay,
  };
}

export function checkDayBoundary(task: CoreTask, now: number): CoreTask {
  if (
    task.status === 'planned' &&
    task.scheduledStart != null &&
    dayKey(now) > dayKey(task.scheduledStart)
  ) {
    return {
      ...task,
      status: 'unplaced',
      scheduledStart: null,
      scheduledEnd: null,
      dayKey: dayKey(now),
    };
  }
  return task;
}

export function check14DayRule(
  task: CoreTask,
  now: number,
  lastTouched: number,
  rules: Rules = RULES,
): CoreTask {
  if (
    task.status === 'unplaced' &&
    now - lastTouched >=
      rules.tasks.postpone.untouchedDaysToSomeday * 86_400_000
  ) {
    return { ...task, status: 'someday' };
  }
  return task;
}

export function canSaveUnsplit(
  estimateMin: number,
  rules: Rules = RULES,
): boolean {
  return (
    Number.isFinite(estimateMin) &&
    estimateMin > 0 &&
    estimateMin <= rules.tasks.maxEstimateMin
  );
}

export function canAddMust(
  existingMusts: number,
  rules: Rules = RULES,
): boolean {
  return existingMusts < rules.tasks.maxMustsPerDay;
}

/** A moved block keeps its length; an end left behind would corrupt the day's occupied slots (Tasks audit 6). */
function movedEnd(task: CoreTask, newStart: number): number | null {
  return task.scheduledStart != null && task.scheduledEnd != null ? newStart + (task.scheduledEnd - task.scheduledStart) : null;
}

export function doRealReasonMove(task: CoreTask, newStart: number): CoreTask {
  const nextDay = dayKey(newStart);
  return {
    ...task,
    status: 'planned',
    scheduledStart: newStart,
    scheduledEnd: movedEnd(task, newStart),
    dayKey: nextDay,
    firstScheduledDayKey: nextDay,
    lastPlannedDayKey: nextDay,
  };
}
