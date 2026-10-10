import { describe, expect, it } from 'vitest';
import { dayKey } from '../time/dayKey';
import { RULES } from '../rules.config';
import { calculateTasksDayXp } from '../economy/awards';
import type { LedgerRow, FocusRow } from '../../data/types';
import { baselineBudget, calculateNewBudget, postponeWeekKey } from './budget';
import { focusElapsedMs, startFocus } from './focus';
import { postponeGate } from './postponeGate';
import { splitTask } from './split';
import {
  canAddMust,
  canSaveUnsplit,
  check14DayRule,
  checkDayBoundary,
  createTask,
  doRealReasonMove,
  isActualPostpone,
  postponeTask,
} from './task-machine';

const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 9, day, hour, minute).getTime();
const scheduled = () =>
  createTask('task', at(4, 9), 'L', 90, { scheduledStart: at(4, 10) });
const fact = (
  id: string,
  size: 'S' | 'M' | 'L',
  isFirstDay: boolean,
  postpones: number,
  xpShare?: number,
): LedgerRow => ({
  id: `done:${id}`,
  mode: 'tasks',
  kind: 'done',
  refId: id,
  dayKey: '2026-10-04',
  updatedAt: 1,
  deleted: 0,
  deviceId: 'test',
  inputs: { plannedSize: size, isFirstDay, postpones, xpShare },
});

describe('02-tasks §9', () => {
  it('§9 test 1: planning day changes at 04:00', () => {
    expect(dayKey(at(4, 0, 30))).toBe('2026-10-03');
    expect(dayKey(at(4, 4))).toBe('2026-10-04');
  });

  it('§9 test 2: boundary moves an undone plan to Unplaced without a postpone', () => {
    const before = { ...scheduled(), postponeCount: 2 };
    expect(checkDayBoundary(before, at(5, 3)).status).toBe('planned');
    expect(checkDayBoundary(before, at(5, 4))).toMatchObject({
      status: 'unplaced',
      scheduledStart: null,
      postponeCount: 2,
    });
  });

  it('§9 test 3: placement and free rescheduling are distinguished from postpones', () => {
    const task = scheduled();
    expect(
      isActualPostpone(checkDayBoundary(task, at(5, 4)), at(5, 10), at(5, 9)),
    ).toBe(true);
    expect(
      isActualPostpone(
        createTask('new', at(4, 9), 'S', 10),
        at(4, 10),
        at(4, 9),
      ),
    ).toBe(false);
    expect(isActualPostpone(task, at(4, 11), at(4, 9))).toBe(false);
    expect(isActualPostpone(task, at(4, 11), at(4, 10, 1))).toBe(true);
  });

  it('§9 test 4: first postpone needs a dated slot', () => {
    expect(
      postponeGate({ task: scheduled(), newStart: null, now: at(4, 9) }, 0),
    ).toMatchObject({ ok: false, error: 'missing_date_time' });
  });

  it('§9 test 5: second postpone requires a short first step', () => {
    const task = { ...scheduled(), postponeCount: 1 };
    expect(postponeGate({ task, newStart: at(5, 10) }, 0).error).toBe(
      'missing_first_step',
    );
    expect(
      postponeGate({ task, newStart: at(5, 10), firstStep: 'x'.repeat(121) }, 0)
        .error,
    ).toBe('first_step_too_long');
    expect(
      postponeGate(
        { task, newStart: at(5, 10), firstStep: 'Open the notes' },
        0,
      ).ok,
    ).toBe(true);
  });

  it('§9 test 6: third postpone shows choices and anyway needs a reason', () => {
    const task = { ...scheduled(), postponeCount: 2, firstStep: 'Open notes' };
    expect(postponeGate({ task, newStart: at(5, 10) }, 0).error).toBe(
      'choice_sheet_required',
    );
    expect(
      postponeGate({ task, newStart: at(5, 10), choice: 'anyway' }, 0).error,
    ).toBe('reason_required');
    expect(
      postponeGate(
        { task, newStart: at(5, 10), choice: 'anyway', reason: 'blocked' },
        0,
      ).action,
    ).toBe('postpone');
  });

  it('§9 test 7: fourth postpone goes to Someday', () => {
    const task = { ...scheduled(), postponeCount: 3 };
    expect(postponeGate({ task, newStart: at(5, 10) }, 0).action).toBe(
      'someday',
    );
    expect(postponeTask(task, at(5, 10), at(4, 11))).toMatchObject({
      status: 'someday',
      postponeCount: 4,
    });
  });

  it('§9 test 8: untouched Unplaced retires after 14 days; future plans stay', () => {
    const unplaced = createTask('u', at(4, 9), 'S', 10);
    expect(check14DayRule(unplaced, at(18, 9), at(4, 9)).status).toBe(
      'someday',
    );
    expect(check14DayRule(unplaced, at(18, 8), at(4, 9)).status).toBe(
      'unplaced',
    );
    expect(check14DayRule(scheduled(), at(25, 9), at(4, 9)).status).toBe(
      'planned',
    );
  });

  it('§9 test 9: weekly budget, real moves, Monday reset and baseline', () => {
    const task = scheduled();
    const move = { task, newStart: at(5, 10), firstStep: 'Open notes' };
    expect(postponeGate({ ...move }, 5).error).toBe('reason_required');
    expect(postponeGate({ ...move, reason: 'blocked' }, 5).ok).toBe(true);
    expect(
      postponeGate(
        { ...move, realReason: 'illness', realReasonMovesThisWeek: 1 },
        5,
      ).action,
    ).toBe('real_reason_move');
    expect(
      postponeGate(
        { ...move, realReason: 'illness', realReasonMovesThisWeek: 2 },
        5,
      ).error,
    ).toBe('real_reason_limit');
    expect(doRealReasonMove(task, at(5, 10))).toMatchObject({
      postponeCount: 0,
      firstScheduledDayKey: dayKey(at(5, 10)),
    });
    expect(postponeWeekKey(at(5, 3, 59))).not.toBe(postponeWeekKey(at(5, 4)));
    expect(postponeGate({ ...move, baselineWeek: true }, 5).ok).toBe(true);
    expect(baselineBudget(12)).toBe(8);
  });

  it('§9 test 10: auto raise needs three overruns and resets its lookback', () => {
    expect(calculateNewBudget(5, [true, true, false, true])).toMatchObject({
      newBudget: 7,
      didRaise: true,
      lookbackAfterRaise: [],
    });
    expect(calculateNewBudget(11, [true, true, true, true]).newBudget).toBe(12);
    expect(calculateNewBudget(5, [true, false, false, true]).didRaise).toBe(
      false,
    );
  });

  it('§9 test 11: estimates over 90 minutes require splitting', () => {
    expect(canSaveUnsplit(90)).toBe(true);
    expect(canSaveUnsplit(91)).toBe(false);
    expect(() => createTask('big', at(4, 9), 'L', 91)).toThrow();
  });

  it('§9 test 12: fourth Must is refused with Could available', () => {
    expect(canAddMust(2)).toBe(true);
    expect(canAddMust(3)).toBe(false);
  });

  it('§9 test 13: starting B pauses A and counts one switch using absolute timestamps', () => {
    const a: FocusRow = {
      id: 'a',
      taskId: 'A',
      startedAt: 1000,
      updatedAt: 1000,
      deleted: 0,
      deviceId: 'test',
    };
    const { pausedFocus, newFocus } = startFocus('B', 2000, a);
    expect(pausedFocus).toMatchObject({ switches: 1, pauses: [{ at: 2000 }] });
    expect(newFocus.taskId).toBe('B');
    if (!pausedFocus) throw new Error('Expected paused timer');
    expect(focusElapsedMs(pausedFocus, 9000)).toBe(1000);
  });

  it('§9 test 14: splits conserve XP and ladder state; choice alternatives do not count', () => {
    const parent = { ...scheduled(), postponeCount: 3 };
    const children = splitTask(parent, 3, [30, 30, 30], RULES, at(4, 11));
    expect(children.map((c) => c.xpShare)).toEqual([12, 12, 11]);
    expect(
      children.every(
        (c) =>
          c.firstScheduledDayKey === parent.firstScheduledDayKey &&
          c.postponeCount === 2,
      ),
    ).toBe(true);
    expect(
      calculateTasksDayXp(
        children.map((c, i) =>
          fact(String(i), c.plannedSize, false, c.postponeCount, c.xpShare),
        ),
      ),
    ).toBe(40);
    const creation100 = { ...parent, estimateMin: 100, postponeCount: 0 };
    const creation180 = { ...parent, estimateMin: 180, postponeCount: 0 };
    expect(
      splitTask(creation100, 2, [50, 50]).reduce(
        (sum, c) => sum + (c.xpShare ?? 0),
        0,
      ),
    ).toBe(39);
    expect(
      splitTask(creation180, 3, [60, 60, 60]).reduce(
        (sum, c) => sum + (c.xpShare ?? 0),
        0,
      ),
    ).toBe(70);
    expect(isActualPostpone(parent, at(4, 11), at(4, 10, 1))).toBe(true);
    expect(
      postponeGate({ task: parent, newStart: null, choice: 'do10' }, 0).action,
    ).toBe('do10');
    expect(
      postponeGate({ task: parent, newStart: null, choice: 'someday' }, 0)
        .action,
    ).toBe('someday');
  });

  it('§9 test 15: planned size and first scheduled day determine base XP', () => {
    expect(calculateTasksDayXp([fact('a', 'M', true, 0)])).toBe(30);
    expect(calculateTasksDayXp([fact('b', 'M', false, 1)])).toBe(20);
    expect(calculateTasksDayXp([fact('c', 'M', true, 1)])).toBe(20);
    expect(RULES.tasks.xpBySize.M).toBe(20);
  });

  it('§9 test 16: postpones never remove XP', () => {
    const base = calculateTasksDayXp([fact('a', 'L', false, 0)]);
    for (let count = 1; count <= 4; count++)
      expect(
        calculateTasksDayXp([fact('a', 'L', false, count)]),
      ).toBeGreaterThanOrEqual(base);
  });
});
