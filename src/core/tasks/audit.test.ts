import { describe, expect, it } from 'vitest';
import { RULES } from '../rules.config';
import { createTask, doRealReasonMove, postponeTask } from './task-machine';
import { splitTask } from './split';

const nine = new Date(2026, 9, 22, 9).getTime();
const hour = 3_600_000;

describe('Tasks audit fixes (idea engine, 22 Oct)', () => {
  it('a moved block keeps its length, for a normal move and a real-reason move', () => {
    const block = createTask('t', nine - hour, 'M', 30, { scheduledStart: nine, scheduledEnd: nine + hour / 2 });
    const later = nine + 5 * hour;
    expect(postponeTask(block, later, nine - hour)).toMatchObject({ scheduledStart: later, scheduledEnd: later + hour / 2 });
    expect(doRealReasonMove(block, later)).toMatchObject({ scheduledStart: later, scheduledEnd: later + hour / 2 });
  });

  it('splitting a placed task runs its steps back to back, never all at once', () => {
    const block = createTask('t', nine - hour, 'L', 90, { scheduledStart: nine, scheduledEnd: nine + 1.5 * hour });
    const steps = splitTask(block, 3, [30, 30, 30], RULES, nine - hour);
    expect(steps.map(step => [step.scheduledStart, step.scheduledEnd])).toEqual([
      [nine, nine + hour / 2], [nine + hour / 2, nine + hour], [nine + hour, nine + 1.5 * hour],
    ]);
  });

  it('a split step that starts after 04:00 lands on the new planning day', () => {
    const late = new Date(2026, 9, 23, 3, 30).getTime();
    const block = createTask('t', late - hour, 'L', 90, { scheduledStart: late, scheduledEnd: late + 1.5 * hour });
    expect(splitTask(block, 3, [30, 30, 30], RULES, late - hour).map(step => step.dayKey)).toEqual(['2026-10-22', '2026-10-23', '2026-10-23']);
  });
});
