import { nextRepeatDay, sameTimeOn } from '../../core/tasks/repeat';
import { ulid } from 'ulidx';
import type { NandiDb } from '../db';
import { db as appDb } from '../db';
import { effectiveBedtime } from './night';
import { entityRepo } from './base';
import type { TaskRow, FocusRow, TaskEventRow } from '../types';
import { dayKey, lightsOutNightKey } from '../../core/time/dayKey';
import { RULES } from '../../core/rules.config';
import { baselineBudget, nextBudget, postponeWeekKey } from '../../core/tasks/budget';
import { nextBedtimeTarget, shutdownAt, stepDownOffer } from '../../core/tasks/planner';
import { respaceCheckpoints } from '../../core/tasks/complete';
import {
  postponeGate,
  type PostponeAttempt,
  type PostponeReason,
} from '../../core/tasks/postponeGate';
import {
  checkDayBoundary,
  check14DayRule,
  doRealReasonMove,
  postponeTask,
  canAddMust,
  type CoreTask,
  type TaskSize,
  type TaskStatus,
} from '../../core/tasks/task-machine';
import { splitTask } from '../../core/tasks/split';
import { trackWrite } from '../../core/pendingWrites';
import type { DailyLogRow } from '../types';

type BudgetState = { baselineStart: string; baselineComplete: boolean; enforcementFromWeek?: string; budget: number; lastWeek: string; countsSinceRaise: number[]; raisedAtWeek?: string; steppedDownAtWeek?: string };
import {
  focusPhase,
  isFocusRunning,
  startFocus as coreStartFocus,
  pauseFocus as corePauseFocus,
  resumeFocus as coreResumeFocus,
  finishFocus as coreFinishFocus,
  focusElapsedMs,
} from '../../core/tasks/focus';

/** Spec 27: where a task can be moved to from Mor's list. A day key moves it to that day, with an optional clock time. */
export type MoveTarget = 'today' | 'tomorrow' | 'later' | { day: string; start?: number };
/** The fields a move changes, kept so Undo can put them back exactly. */
export type MoveSnapshot = Pick<TaskRow, 'status' | 'dayKey' | 'scheduledStart' | 'scheduledEnd' | 'postponeCount' | 'lastPlannedDayKey'>;

export function coreTask(row: TaskRow): CoreTask {
  if (
    (row.size !== 'S' && row.size !== 'M' && row.size !== 'L') ||
    row.estimateMin == null ||
    row.plannedSize == null ||
    (row.plannedSize !== 'S' &&
      row.plannedSize !== 'M' &&
      row.plannedSize !== 'L') ||
    row.postponeCount == null ||
    !['planned', 'unplaced', 'done', 'someday', 'dropped'].includes(row.status)
  ) {
    throw new Error('Incomplete task row');
  }
  return {
    ...row,
    size: row.size as TaskSize,
    plannedSize: row.plannedSize as TaskSize,
    estimateMin: row.estimateMin,
    postponeCount: row.postponeCount,
    status: row.status as TaskStatus,
  };
}

/** Used by reload guards; a paused or finished focus is safe to reload. */
export async function isFocusActive(): Promise<boolean> {
  return (await appDb.focus.filter((row) => row.deleted === 0 && isFocusRunning(row)).count()) > 0;
}

export function createTaskRepos(db: NandiDb, deviceId: string) {
  const repos = {
    tasks: entityRepo(db.tasks, deviceId),
    taskEvents: entityRepo(db.taskEvents, deviceId),
    focus: entityRepo(db.focus, deviceId),
    reminders: entityRepo(db.reminders, deviceId),
    plans: entityRepo(db.plans, deviceId),
  };
  const mutation = <T>(fn: () => Promise<T>): Promise<T> =>
    trackWrite(() => db.transaction('rw', [db.tasks, db.taskEvents, db.focus, db.ledger, db.settings, db.dailyLog], fn));
  async function mustCount(key: string): Promise<number> {
    const rows = await db.tasks.where('dayKey').equals(key).filter((row) => row.deleted === 0 && row.mustOrCould === 'must' && row.status !== 'dropped').toArray();
    return new Set(rows.map((row) => row.parentId ?? row.id)).size;
  }
  const saveBudget = (value: BudgetState, now: number) => db.settings.put({ key: 'planner.budget', value, updatedAt: now, deleted: 0, deviceId });
  /** This week's counted postpones against the budget, shared by postpone and the split choice. */
  async function weeklyBudget(now: number) {
    const policy = await budgetState(now);
    const weekStart = postponeWeekKey(now);
    const counted = await db.taskEvents
      .filter((e) => e.kind === 'postponed' && e.budgetCounted === true && postponeWeekKey(e.at) === weekStart)
      .count();
    return { policy, weekStart, counted, baselineWeek: !policy.baselineComplete || weekStart < (policy.enforcementFromWeek ?? weekStart) };
  }
  async function budgetState(now: number): Promise<BudgetState> {
    const week = postponeWeekKey(now);
    const stored = (await db.settings.get('planner.budget'))?.value as BudgetState | undefined;
    const state: BudgetState = stored?.baselineStart ? { ...stored, countsSinceRaise: [...stored.countsSinceRaise] } : { baselineStart: dayKey(now), baselineComplete: false, budget: RULES.tasks.postpone.weeklyBudget, lastWeek: week, countsSinceRaise: [] };
    const shift = (key: string, days: number) => { const date = new Date(`${key}T12:00:00`); date.setDate(date.getDate() + days); return dayKey(date); };
    const nextWeek = (key: string) => shift(key, 7);
    const baselineEnd = shift(state.baselineStart, 7);
    if (!state.baselineComplete && dayKey(now) >= baselineEnd) {
      const from = new Date(`${state.baselineStart}T04:00:00`).getTime();
      const to = new Date(`${baselineEnd}T04:00:00`).getTime();
      const count = await db.taskEvents.filter((row) => row.deleted === 0 && row.kind === 'postponed' && row.budgetCounted === true && row.at >= from && row.at < to).count();
      state.budget = baselineBudget(count);
      state.baselineComplete = true;
      state.lastWeek = baselineEnd === week ? week : nextWeek(week);
      state.enforcementFromWeek = state.lastWeek;
    }
    while (state.baselineComplete && state.lastWeek < week) {
      const from = new Date(`${state.lastWeek}T04:00:00`).getTime();
      const to = new Date(`${nextWeek(state.lastWeek)}T04:00:00`).getTime();
      const count = await db.taskEvents.filter((row) => row.deleted === 0 && row.kind === 'postponed' && row.budgetCounted === true && row.at >= from && row.at < to).count();
      const adjusted = nextBudget(state.budget, [...state.countsSinceRaise, count]);
      state.budget = adjusted.budget;
      state.countsSinceRaise = adjusted.countsSinceRaise;
      if (adjusted.raised) state.raisedAtWeek = nextWeek(state.lastWeek);
      state.lastWeek = nextWeek(state.lastWeek);
    }
    if (!stored || JSON.stringify(state) !== JSON.stringify(stored)) await saveBudget(state, now);
    return state;
  }
  // Ending a focus adds the minutes worked to the task (spec 27: the only source of real times).
  const endFocus = async (focus: FocusRow, now: number): Promise<FocusRow> => {
    const ended = await repos.focus.put(coreFinishFocus(focus, now), now);
    const minutes = Math.round(focusElapsedMs(focus, now) / 60_000);
    const task = minutes > 0 ? await repos.tasks.get(focus.taskId) : undefined;
    if (task) await repos.tasks.put({ ...task, actualMinutes: (task.actualMinutes ?? 0) + minutes }, now);
    return ended;
  };
  const event = (
    taskId: string,
    kind: TaskEventRow['kind'],
    at: number,
    extra: Partial<TaskEventRow> = {},
  ) => repos.taskEvents.put({ taskId, kind, at, ...extra }, at);

  return {
    ...repos,
    async plannerBudget(now: number): Promise<BudgetState> { return mutation(() => budgetState(now)); },
    async lowerBudget(now: number): Promise<BudgetState> {
      return mutation(async () => {
        const state = await budgetState(now);
        const week = postponeWeekKey(now);
        const firstMonday = new Date(`${week}T12:00:00`).getDate() <= 7;
        const starts = Array.from({ length: 4 }, (_, index) => { const date = new Date(`${week}T12:00:00`); date.setDate(date.getDate() - (4 - index) * 7); return dayKey(date); });
        const counts = await Promise.all(starts.map((start) => db.taskEvents.filter((row) => row.deleted === 0 && row.kind === 'postponed' && row.budgetCounted === true && postponeWeekKey(row.at) === start).count()));
        const lowered = stepDownOffer(state.budget, counts);
        if (!firstMonday || state.steppedDownAtWeek === week || lowered == null) throw new Error('No budget adjustment available now');
        state.budget = lowered;
        state.steppedDownAtWeek = week;
        state.countsSinceRaise = [];
        await saveBudget(state, now);
        return state;
      });
    },
    async markRitual(kind: 'planDone' | 'shutdownDone' | 'reviewDone', now: number, ifThen?: string): Promise<DailyLogRow> {
      return mutation(async () => {
        const key = dayKey(now);
        const previous = await db.dailyLog.get(key);
        const row: DailyLogRow = { ...previous, dayKey: key, [kind]: true, ...(kind === 'shutdownDone' ? { windDownAt: now, shutdownIfThen: ifThen?.trim() || undefined } : {}), updatedAt: now, deleted: 0, deviceId };
        await db.dailyLog.put(row);
        return row;
      });
    },
    async recordLightsOut(now: number): Promise<DailyLogRow> {
      return mutation(async () => {
        // A check-in after 04:00 but before noon still belongs to the night just gone, not to tonight
        // (otherwise a 04:05 lights-out is compared with tomorrow's bedtime and counts as early).
        const hour = new Date(now).getHours();
        const nightAt = hour >= 4 && hour < 12 ? now - 12 * 3_600_000 : now;
        const key = lightsOutNightKey(now);
        const previous = await db.dailyLog.get(key);
        const factId = `lightsout:${key}`;
        if (previous?.lightsOutAt != null) {
          if (!(await db.ledger.get(factId))) await db.ledger.add({ id: factId, dayKey: key, mode: 'bonuses', kind: 'lightsout', refId: key, inputs: { lightsOutAt: previous.lightsOutAt, bedtimeTarget: previous.bedtimeTarget, metTarget: previous.bedtimeTarget != null && previous.lightsOutAt <= previous.bedtimeTarget }, updatedAt: now, deleted: 0, deviceId });
          return previous;
        }
        const targetRow = await db.settings.get('planner.bedtime');
        const goalRow = await db.settings.get('planner.goalBedtime');
        let target = typeof targetRow?.value === 'string' ? targetRow.value : RULES.night.defaultBedtime;
        const goal = typeof goalRow?.value === 'string' ? goalRow.value : RULES.night.goalBedtime;
        const row: DailyLogRow = { ...previous, dayKey: key, lightsOutAt: now, bedtimeTarget: shutdownAt(nightAt, target), updatedAt: now, deleted: 0, deviceId };
        await db.dailyLog.put(row);
        // A busy day's later night (the bedtime the app showed) counts as on plan; the stepping target below stays the usual one.
        const tonight = Math.max(row.bedtimeTarget!, shutdownAt(nightAt, await effectiveBedtime(db, nightAt)));
        await db.ledger.add({ id: factId, dayKey: key, mode: 'bonuses', kind: 'lightsout', refId: key, inputs: { lightsOutAt: now, bedtimeTarget: row.bedtimeTarget, metTarget: now <= tonight }, updatedAt: now, deleted: 0, deviceId });
        const shift = (from: string, days: number) => { const date = new Date(`${from}T12:00:00`); date.setDate(date.getDate() + days); return dayKey(date); };
        const windowRow = await db.settings.get('planner.bedtimeWindowStart');
        let windowStart = typeof windowRow?.value === 'string' ? windowRow.value : key;
        while (shift(windowStart, 2) <= key) {
          const nights = await Promise.all([0, 1, 2].map((offset) => db.dailyLog.get(shift(windowStart, offset))));
          const outcomes = nights.map((log) => log?.lightsOutAt != null && log.bedtimeTarget != null && log.lightsOutAt <= log.bedtimeTarget);
          target = nextBedtimeTarget(target, goal, outcomes, 3);
          windowStart = shift(windowStart, 3);
        }
        await db.settings.put({ key: 'planner.bedtimeWindowStart', value: windowStart, updatedAt: now, deleted: 0, deviceId });
        await db.settings.put({ key: 'planner.bedtimeDays', value: key < windowStart ? 0 : [0, 1, 2].find((offset) => shift(windowStart, offset) === key)! + 1, updatedAt: now, deleted: 0, deviceId });
        if (target !== (typeof targetRow?.value === 'string' ? targetRow.value : RULES.night.defaultBedtime)) await db.settings.put({ key: 'planner.bedtime', value: target, updatedAt: now, deleted: 0, deviceId });
        return row;
      });
    },
    async setPriority(taskId: string, priority: 'must' | 'could', now: number): Promise<TaskRow> {
      return mutation(async () => {
        const task = await repos.tasks.get(taskId);
        if (!task) throw new Error('Task not found');
        if (priority === 'must') {
          if (task.status !== 'planned' || task.scheduledStart == null) throw new Error('Give this Must a start time first');
          const count = await db.tasks.where('dayKey').equals(task.dayKey).filter((row) => row.deleted === 0 && row.id !== taskId && row.status === 'planned' && row.mustOrCould === 'must').count();
          if (!canAddMust(count)) throw new Error('Maximum Musts for this day; make it a Could');
        }
        return repos.tasks.put({ ...task, mustOrCould: priority }, now);
      });
    },
    async setPlace(taskId: string, place: string, now: number): Promise<TaskRow> {
      return mutation(async () => {
        const task = await repos.tasks.get(taskId);
        if (!task) throw new Error('Task not found');
        return repos.tasks.put({ ...task, place: place.trim() }, now);
      });
    },
    async setFirstStep(taskId: string, firstStep: string, now: number): Promise<TaskRow> {
      return mutation(async () => {
        const task = await repos.tasks.get(taskId);
        const trimmed = firstStep.trim();
        if (!task || !trimmed || trimmed.length > RULES.tasks.firstStepMaxChars) throw new Error('Add a short first step');
        return repos.tasks.put({ ...task, firstStep: trimmed }, now);
      });
    },
    async editTask(taskId: string, changes: Pick<TaskRow, 'title' | 'estimateMin' | 'mustOrCould' | 'category' | 'place' | 'firstStep'>, now: number): Promise<TaskRow> {
      return mutation(async () => {
        const task = await repos.tasks.get(taskId);
        if (!task) throw new Error('Task not found');
        const title = changes.title?.trim();
        const estimate = changes.estimateMin;
        if (!title || !Number.isInteger(estimate) || estimate! < 1 || estimate! > RULES.tasks.maxEstimateMin) throw new Error('Add a title and an estimate up to 90 min.');
        if ((changes.firstStep?.length ?? 0) > RULES.tasks.firstStepMaxChars) throw new Error('Keep the first step short.');
        if (changes.mustOrCould === 'must' && task.mustOrCould !== 'must') {
          if (task.status !== 'planned') throw new Error('Give this Must a start time first.');
          if (!canAddMust(await mustCount(task.dayKey))) throw new Error('Three Musts already. Make it a Could.');
        }
        return repos.tasks.put({ ...task, ...changes, title, estimateMin: estimate, category: changes.category?.trim() || 'general', place: changes.place?.trim(), firstStep: changes.firstStep?.trim() }, now);
      });
    },
    async addCheckpoints(taskId: string, proposals: { title: string; scheduledStart: number; estimateMin: number }[], now: number): Promise<TaskRow[]> {
      return mutation(async () => {
        const parent = await repos.tasks.get(taskId);
        if (!parent || parent.scheduledStart == null || await db.tasks.filter(row => row.checkpointOf === taskId && row.deleted === 0).count()) throw new Error('Checkpoints are already set.');
        const rows: TaskRow[] = [];
        for (const proposal of proposals) {
          if (proposal.scheduledStart <= now || proposal.scheduledStart >= parent.scheduledStart) throw new Error('Pick times before the due date.');
          const id = ulid(now + rows.length);
          const key = dayKey(proposal.scheduledStart);
          const size = proposal.estimateMin <= 15 ? 'S' : proposal.estimateMin <= 45 ? 'M' : 'L';
          rows.push(await repos.tasks.put({ id, title: proposal.title, status: 'planned', dayKey: key, scheduledStart: proposal.scheduledStart, size, plannedSize: size, estimateMin: proposal.estimateMin, mustOrCould: 'could', category: parent.category, checkpointOf: taskId, postponeCount: 0, firstScheduledDayKey: key, lastPlannedDayKey: key }, now));
          await event(id, 'created', now);
        }
        return rows;
      });
    },
    async respaceRemainingCheckpoints(checkpointId: string, movedAt: number, now: number): Promise<void> {
      return mutation(async () => {
        const checkpoint = await repos.tasks.get(checkpointId);
        const parent = checkpoint?.checkpointOf ? await repos.tasks.get(checkpoint.checkpointOf) : undefined;
        if (!checkpoint || !parent?.scheduledStart) throw new Error('Checkpoint due date is missing.');
        const remaining = await db.tasks.filter(row => row.checkpointOf === parent.id && row.id !== checkpointId && row.deleted === 0 && row.status === 'planned' && (row.scheduledStart ?? 0) > movedAt).toArray();
        for (const item of respaceCheckpoints(remaining, movedAt, parent.scheduledStart)) {
          const row = remaining.find(candidate => candidate.id === item.id)!;
          await repos.tasks.put({ ...row, scheduledStart: item.scheduledStart, dayKey: dayKey(item.scheduledStart) }, now);
        }
      });
    },
    async dropTask(taskId: string, now: number): Promise<TaskRow> {
      return mutation(async () => {
        const task = await repos.tasks.get(taskId);
        if (!task || task.status === 'done') throw new Error('Task cannot be dropped');
        const children = await db.tasks.where('parentId').equals(taskId).filter((row) => row.deleted === 0).toArray();
        for (const child of children.filter((row) => row.status !== 'done' && row.status !== 'dropped')) {
          await repos.tasks.put({ ...child, status: 'dropped', scheduledStart: null, scheduledEnd: null }, now);
          await event(child.id, 'dropped', now);
        }
        const row = await repos.tasks.put({ ...task, status: 'dropped', scheduledStart: null, scheduledEnd: null }, now);
        await event(taskId, 'dropped', now);
        if (task.parentId) {
          const siblings = await db.tasks.where('parentId').equals(task.parentId).toArray();
          if (siblings.every((step) => step.status === 'done' || step.status === 'dropped')) {
            const parent = await repos.tasks.get(task.parentId);
            if (parent && parent.status !== 'dropped') await repos.tasks.put({ ...parent, status: 'done', doneAt: now }, now);
          }
        }
        return row;
      });
    },
    async createTask(
      input: Omit<
        TaskRow,
        | 'id'
        | 'updatedAt'
        | 'deleted'
        | 'deviceId'
        | 'postponeCount'
        | 'status'
        | 'size'
        | 'estimateMin'
      > & { id?: string; size: TaskSize; estimateMin: number },
      now: number,
    ): Promise<TaskRow> {
      return mutation(async () => {
        if (
          input.estimateMin == null ||
          input.estimateMin <= 0 ||
          input.estimateMin > RULES.tasks.maxEstimateMin
        )
          throw new RangeError('Estimate requires a split');
        if (input.mustOrCould === 'must') {
          const key = dayKey(input.scheduledStart ?? now);
          const existing = await mustCount(key);
          if (!canAddMust(existing))
            throw new RangeError('Maximum Musts for this day; make it a Could');
        }
        const id = input.id ?? ulid(now);
        if (await db.tasks.get(id)) throw new Error('Task already exists');
        const key = dayKey(input.scheduledStart ?? now);
        const task = await repos.tasks.put(
          {
            ...input,
            id,
            dayKey: key,
            plannedSize: input.size,
            firstScheduledDayKey:
              input.scheduledStart != null ? key : undefined,
            lastPlannedDayKey: input.scheduledStart != null ? key : undefined,
            status: input.scheduledStart != null ? 'planned' : 'unplaced',
            postponeCount: 0,
          },
          now,
        );
        await event(id, 'created', now);
        return task;
      });
    },
    async createSplitTask(
      title: string,
      estimates: number[],
      now: number,
      scheduledStart?: number,
      options: { titles?: string[]; priority?: 'must' | 'could'; placement?: 'today' | 'unplaced' | 'someday'; category?: string } = {},
    ): Promise<TaskRow[]> {
      return mutation(async () => {
        const total = estimates.reduce((sum, value) => sum + value, 0);
        if (total <= RULES.tasks.maxEstimateMin)
          throw new RangeError(
            'Creation split is for estimates over 90 minutes',
          );
        const id = ulid(now);
        const key = dayKey(scheduledStart ?? now);
        if (options.priority === 'must' && !canAddMust(await mustCount(key))) throw new RangeError('Maximum Musts for this day; make it a Could');
        const parentCore: CoreTask = {
          id,
          status: scheduledStart == null ? 'unplaced' : 'planned',
          dayKey: key,
          size: 'L',
          plannedSize: 'L',
          estimateMin: total,
          postponeCount: 0,
          scheduledStart,
          firstScheduledDayKey: scheduledStart == null ? undefined : key,
        };
        const children = splitTask(
          parentCore,
          estimates.length,
          estimates,
          RULES,
          now,
        );
        if (options.titles && (options.titles.length !== estimates.length || options.titles.some((name) => !name.trim() || name.trim().length > 200))) throw new Error('Name every step');
        await repos.tasks.put(
          {
            id,
            title,
            status: 'unplaced',
            dayKey: key,
            size: 'L',
            plannedSize: 'L',
            estimateMin: total,
            postponeCount: 0,
            mustOrCould: options.priority,
            category: options.category,
            firstScheduledDayKey: parentCore.firstScheduledDayKey,
          },
          now,
        );
        await event(id, 'created', now);
        await event(id, 'split', now);
        const rows: TaskRow[] = [];
        for (const child of children) {
          const index = rows.length;
          const firstTimed = index === 0 && scheduledStart != null && options.placement !== 'someday' && options.placement !== 'unplaced';
          rows.push(
            await repos.tasks.put(
              { ...child, title: options.titles?.[index]?.trim() ?? `${title} — step ${index + 1} of ${children.length}`, mustOrCould: options.priority ?? 'could', category: options.category, status: options.placement === 'someday' ? 'someday' : firstTimed ? 'planned' : 'unplaced', dayKey: firstTimed ? key : dayKey(now), scheduledStart: firstTimed ? scheduledStart : null, scheduledEnd: null, firstScheduledDayKey: firstTimed ? key : undefined, lastPlannedDayKey: firstTimed ? key : undefined },
              now,
            ),
          );
          await event(child.id, 'created', now);
        }
        return rows;
      });
    },
    async completeTask(taskId: string, now: number): Promise<TaskRow> {
      return mutation(async () => {
        const task = await repos.tasks.get(taskId);
        if (!task) throw new Error('Task not found');
        if (task.status === 'done') return task;
        if (
          task.status === 'dropped' ||
          (await db.tasks.where('parentId').equals(taskId).count()) > 0
        )
          throw new Error('Container or dropped task cannot earn XP');
        const updated = await repos.tasks.put(
          { ...task, status: 'done', doneAt: now },
          now,
        );
        await event(taskId, 'done', now);
        if (task.repeat && !task.parentId && !(await db.tasks.filter((row) => row.repeatOf === taskId && !row.deleted).count())) {
          // Finishing a repeating task plans the next one, same time of day, never on a past day.
          const nextDay = nextRepeatDay(task.repeat, task.dayKey, dayKey(now));
          const nextStart = task.scheduledStart != null ? sameTimeOn(task.scheduledStart, nextDay) : null;
          const nextId = ulid(now + 1);
          await repos.tasks.put({ id: nextId, title: task.title, status: 'planned', dayKey: nextDay, size: task.size, estimateMin: task.estimateMin, plannedSize: task.plannedSize ?? task.size,
            category: task.category, mustOrCould: 'could', scheduledStart: nextStart, scheduledEnd: nextStart != null && task.estimateMin ? nextStart + task.estimateMin * 60_000 : null,
            firstStep: task.firstStep, place: task.place, postponeCount: 0, firstScheduledDayKey: nextDay, lastPlannedDayKey: nextDay, repeat: task.repeat, repeatOf: taskId }, now);
          await event(nextId, 'created', now);
        }
        const created = await db.taskEvents
          .where('taskId')
          .equals(taskId)
          .filter((e) => e.kind === 'created')
          .first();
        const key = dayKey(now);
        const inputs = {
          plannedSize: task.plannedSize ?? task.size,
            wasPlanned: task.firstScheduledDayKey != null || task.scheduledStart != null || task.mustOrCould === 'must',
          isFirstDay:
            task.postponeCount === 0 && task.firstScheduledDayKey === key,
          postpones: task.postponeCount ?? 0,
          clutchStamp:
            (task.postponeCount ?? 0) >= RULES.tasks.clutch.minPostpones,
          createdToDoneMin: created ? (now - created.at) / 60_000 : undefined,
          xpShare: task.xpShare,
        };
        const id = `done:${taskId}`;
        if (!(await db.ledger.get(id)))
          await db.ledger.add({
            id,
            mode: 'tasks',
            kind: 'done',
            refId: taskId,
            dayKey: key,
            inputs,
            updatedAt: now,
            deleted: 0,
            deviceId,
          });
        if (task.parentId) {
          const siblings = await db.tasks
            .where('parentId')
            .equals(task.parentId)
            .toArray();
          if (
            siblings.every(
              (s) =>
                s.id === taskId ||
                s.status === 'done' ||
                s.status === 'dropped',
            )
          ) {
            const parent = await db.tasks.get(task.parentId);
            if (parent)
              await repos.tasks.put(
                { ...parent, status: 'done', doneAt: now },
                now,
              );
          }
        }
        return updated;
      });
    },
    async postpone(
      taskId: string,
      now: number,
      attempt: Omit<PostponeAttempt, 'task' | 'now'>,
    ): Promise<TaskRow> {
      return mutation(async () => {
        const row = await repos.tasks.get(taskId);
        if (!row) throw new Error('Task not found');
        if (row.status === 'done' || row.status === 'dropped')
          throw new Error('Task is closed');
        const task = checkDayBoundary(coreTask(row), now);
        const { policy, weekStart, counted, baselineWeek } = await weeklyBudget(now);
        const realMoves = await db.taskEvents
          .filter(
            (e) =>
              e.kind === 'realReasonMove' &&
              postponeWeekKey(e.at) === weekStart,
          )
          .count();
        const gate = postponeGate(
          { ...attempt, task, now, baselineWeek, realReasonMovesThisWeek: realMoves },
          counted,
          { ...RULES, tasks: { ...RULES.tasks, postpone: { ...RULES.tasks.postpone, weeklyBudget: policy.budget } } },
        );
        if (!gate.ok) throw new Error(gate.error);
        if (gate.action === 'split')
          throw new Error('Use split with the choice sheet');
        if (gate.action === 'do10') {
          const open = await db.focus
            .filter((f) => f.deleted === 0 && isFocusRunning(f))
            .toArray();
          for (const focus of open) {
            await repos.focus.put(
              {
                ...corePauseFocus(focus, now),
                switches: (focus.switches ?? 0) + 1,
              },
              now,
            );
            await event(focus.taskId, 'switched', now);
          }
          const { newFocus } = coreStartFocus(taskId, now);
          await repos.focus.put({ ...newFocus, id: ulid(now) }, now);
          await event(taskId, 'started', now);
          return row;
        }
        let next: CoreTask;
        if (gate.action === 'real_reason_move') {
          if (attempt.newStart == null) throw new Error('Missing slot');
          next = doRealReasonMove(task, attempt.newStart);
          await event(taskId, 'realReasonMove', now, {
            reason: attempt.realReason,
          });
        } else if (gate.action === 'someday' && task.postponeCount < 3) {
          next = {
            ...task,
            status: 'someday',
            scheduledStart: null,
            scheduledEnd: null,
          };
          await event(taskId, 'someday', now);
        } else {
          next = postponeTask(task, attempt.newStart, now);
          if (
            gate.action === 'postpone' ||
            (gate.action === 'someday' &&
              next.postponeCount > task.postponeCount)
          ) {
            await event(taskId, 'postponed', now, {
              reason: attempt.reason,
              budgetCounted: true,
            });
          }
          if (next.status === 'someday') await event(taskId, 'someday', now);
        }
        if (attempt.firstStep) {
          next.firstStep = attempt.firstStep;
          await event(taskId, 'shrunk', now);
        }
        // Item 83: a task moved off today stops its focus here, keeping the minutes already worked, so the Now card
        // and Focus no longer hold on to it.
        if (next.status !== 'planned' || next.dayKey !== dayKey(now)) {
          const open = await db.focus.filter((f) => f.deleted === 0 && f.taskId === taskId && f.endedAt == null).toArray();
          for (const focus of open) await endFocus(focus, now);
        }
        return repos.tasks.put({ ...row, ...next }, now);
      });
    },
    async startFocus(taskId: string, now: number, cyclePreset: '25/5' | '50/10' = '25/5'): Promise<FocusRow> {
      return mutation(async () => {
        const task = await repos.tasks.get(taskId);
        if (!task) throw new Error('Task not found');
        const open = await db.focus
          .filter((f) => f.deleted === 0 && f.endedAt == null)
          .toArray();
        const existing = open.find(
          (f) => f.taskId === taskId && isFocusRunning(f),
        );
        if (existing) return existing;
        for (const focus of open.filter(isFocusRunning)) {
          const paused = corePauseFocus(focus, now);
          await repos.focus.put(
            { ...paused, switches: (focus.switches ?? 0) + 1 },
            now,
          );
          await event(focus.taskId, 'switched', now);
        }
        const { newFocus } = coreStartFocus(taskId, now);
        const saved = await repos.focus.put(
          { ...newFocus, id: ulid(now), cyclePreset, plannedMs: (cyclePreset === '50/10' ? 50 : 25) * 60_000 },
          now,
        );
        await event(taskId, 'started', now);
        return saved;
      });
    },
    async pauseFocus(focusId: string, now: number): Promise<FocusRow> {
      return mutation(async () => {
        const focus = await repos.focus.get(focusId);
        if (!focus) throw new Error('Focus not found');
        return repos.focus.put(corePauseFocus(focus, now), now);
      });
    },
    async extendFocus(focusId: string, now: number): Promise<FocusRow> {
      return mutation(async () => {
        const focus = await repos.focus.get(focusId);
        if (!focus) throw new Error('Focus not found');
        const cycle = focusPhase(focus, now);
        if (cycle.phase !== 'work') throw new Error('Extend is available during focus.');
        const key = String(cycle.cycle);
        return repos.focus.put({ ...focus, cycleExtensions: { ...focus.cycleExtensions, [key]: (focus.cycleExtensions?.[key] ?? 0) + RULES.tasks.focus.extendMin * 60_000 } }, now);
      });
    },
    async resumeFocus(focusId: string, now: number): Promise<FocusRow> {
      return mutation(async () => {
        const focus = await repos.focus.get(focusId);
        if (!focus) throw new Error('Focus not found');
        const open = await db.focus
          .filter(
            (f) => f.id !== focusId && f.deleted === 0 && isFocusRunning(f),
          )
          .toArray();
        for (const other of open) {
          await repos.focus.put(
            {
              ...corePauseFocus(other, now),
              switches: (other.switches ?? 0) + 1,
            },
            now,
          );
          await event(other.taskId, 'switched', now);
        }
        return repos.focus.put(coreResumeFocus(focus, now), now);
      });
    },
    async finishFocus(focusId: string, now: number): Promise<FocusRow> {
      return mutation(async () => {
        const focus = await repos.focus.get(focusId);
        if (!focus) throw new Error('Focus not found');
        return endFocus(focus, now);
      });
    },
    /** Spec 27: Mor's list adds to Today with no time unless one was picked. A Today task counts as planned, as before. */
    async addToList(title: string, now: number, minutes?: number): Promise<TaskRow> {
      return mutation(async () => {
        const estimateMin = minutes ?? 30;
        if (estimateMin <= 0 || estimateMin > RULES.tasks.maxEstimateMin) throw new RangeError('Estimate requires a split');
        const size: TaskSize = estimateMin <= 15 ? 'S' : estimateMin <= 30 ? 'M' : 'L';
        const key = dayKey(now);
        const id = ulid(now);
        const task = await repos.tasks.put({ id, title, status: 'planned', dayKey: key, size, plannedSize: size, estimateMin, timeSet: minutes != null || undefined,
          scheduledStart: null, scheduledEnd: null, postponeCount: 0, firstScheduledDayKey: key, lastPlannedDayKey: key, mustOrCould: 'could', category: 'general' }, now);
        await event(id, 'created', now);
        return task;
      });
    },
    /**
     * Spec 27: a move is never refused. Moving to a later day counts as a move (the clutch stamp and the "Make it
     * smaller?" offer read that count, as before); moving earlier does not. A task leaving today stops its focus.
     * Returns the fields before the move, for Undo.
     */
    async moveTask(taskId: string, now: number, target: MoveTarget): Promise<MoveSnapshot> {
      return mutation(async () => {
        const row = await repos.tasks.get(taskId);
        if (!row) throw new Error('Task not found');
        if (row.status === 'done' || row.status === 'dropped') throw new Error('Task is closed');
        const before: MoveSnapshot = { status: row.status, dayKey: row.dayKey, scheduledStart: row.scheduledStart ?? null, scheduledEnd: row.scheduledEnd ?? null, postponeCount: row.postponeCount ?? 0, lastPlannedDayKey: row.lastPlannedDayKey };
        const today = dayKey(now);
        const tomorrow = dayKey(new Date(`${today}T12:00:00`).getTime() + 86_400_000);
        const from = row.status === 'someday' ? '9999-12-31' : row.dayKey < today ? today : row.dayKey;
        let next: Partial<TaskRow>;
        if (target === 'later') next = { status: 'someday', scheduledStart: null, scheduledEnd: null };
        else {
          const day = target === 'today' ? today : target === 'tomorrow' ? tomorrow : target.day;
          const start = typeof target === 'object' ? target.start ?? null : null;
          next = { status: 'planned', dayKey: day, scheduledStart: start, scheduledEnd: start != null ? start + (row.estimateMin ?? 30) * 60_000 : null, lastPlannedDayKey: day, firstScheduledDayKey: row.firstScheduledDayKey ?? day };
        }
        const later = next.status === 'someday' ? row.status !== 'someday' : (next.dayKey ?? from) > from;
        if (later) {
          next.postponeCount = (row.postponeCount ?? 0) + 1;
          await event(taskId, next.status === 'someday' ? 'someday' : 'postponed', now, { budgetCounted: false });
        } else await event(taskId, 'scheduled', now);
        if (next.status !== 'planned' || next.dayKey !== today) {
          const open = await db.focus.filter((f) => f.deleted === 0 && f.taskId === taskId && f.endedAt == null).toArray();
          for (const focus of open) await endFocus(focus, now);
        }
        // Re-read: ending a focus just added its minutes to the task.
        const latest = (await repos.tasks.get(taskId)) ?? row;
        await repos.tasks.put({ ...latest, ...next }, now);
        return before;
      });
    },
    /** Undo for a move: puts the moved fields back as they were. */
    async undoMove(taskId: string, now: number, before: MoveSnapshot): Promise<TaskRow> {
      return mutation(async () => {
        const row = await repos.tasks.get(taskId);
        if (!row) throw new Error('Task not found');
        return repos.tasks.put({ ...row, ...before }, now);
      });
    },
    async listForDay(key: string): Promise<TaskRow[]> {
      return db.tasks
        .where('dayKey')
        .equals(key)
        .filter((t) => t.deleted === 0)
        .toArray();
    },
    async reconcile(now: number): Promise<void> {
      await mutation(async () => {
        const open = await db.tasks
          .filter(
            (task) =>
              task.deleted === 0 &&
              (task.status === 'planned' || task.status === 'unplaced'),
          )
          .toArray();
        const parents = new Set((await db.tasks.filter((task) => task.deleted === 0 && !!task.parentId).toArray()).map((task) => task.parentId));
        for (const row of open) {
          if (parents.has(row.id)) continue;
          const atBoundary = checkDayBoundary(coreTask(row), now);
          const lastEvent = await db.taskEvents
            .where('taskId')
            .equals(row.id)
            .sortBy('at');
          // The 14-day clock starts when the slot was missed, not when the task was created (Tasks audit 4).
          const missedDay = row.lastPlannedDayKey ? new Date(`${row.lastPlannedDayKey}T12:00:00`).getTime() : 0;
          const lastTouched = Math.max(lastEvent.at(-1)?.at ?? row.updatedAt, row.scheduledStart ?? 0, Number.isFinite(missedDay) ? missedDay : 0);
          const next = check14DayRule(atBoundary, now, lastTouched);
          if (next.status === 'someday') await event(row.id, 'someday', now);
          if (next.status !== row.status || next.dayKey !== row.dayKey)
            await repos.tasks.put({ ...row, ...next }, now);
        }
      });
    },
    async split(
      taskId: string,
      now: number,
      numSubtasks: number,
      estimates: number[],
      reason?: PostponeReason,
    ): Promise<TaskRow[]> {
      return mutation(async () => {
        const parent = await repos.tasks.get(taskId);
        if (!parent) throw new Error('Task not found');
        if (parent.status === 'done' || parent.status === 'dropped')
          throw new Error('Task is closed');
        if ((await db.tasks.where('parentId').equals(taskId).count()) > 0)
          throw new Error('Task already split');
        const atChoiceSheet = parent.postponeCount === 2;
        // Splitting on the third move counts as a postpone, so a full weekly budget still asks for the quick reason (Tasks audit 2).
        if (atChoiceSheet) {
          const budget = await weeklyBudget(now);
          if (!budget.baselineWeek && budget.counted >= budget.policy.budget && !reason) throw new Error('reason_required');
        }
        const forSplit = atChoiceSheet
          ? { ...coreTask(parent), postponeCount: 3 }
          : coreTask(parent);
        const children = splitTask(
          forSplit,
          numSubtasks,
          estimates,
          RULES,
          now,
        );
        const rows: TaskRow[] = [];
        for (const child of children) {
          rows.push(
            await repos.tasks.put(
              { ...parent, ...child, title: `${parent.title} (${rows.length + 1})`, doneAt: undefined },
              now,
            ),
          );
          await event(child.id, 'created', now);
        }
        await event(taskId, 'split', now);
        if (atChoiceSheet)
          await event(taskId, 'postponed', now, { reason, budgetCounted: true });
        await repos.tasks.put(
          {
            ...parent,
            status: 'unplaced',
            scheduledStart: null,
            scheduledEnd: null,
            postponeCount: forSplit.postponeCount,
          },
          now,
        );
        return rows;
      });
    },
  };
}
