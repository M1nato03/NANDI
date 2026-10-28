import { describe, expect, it } from 'vitest';
import type { FocusRow } from '../../data/types';
import { taskFocusMs } from './focus';

const MIN = 60_000;
const row = (id: string, taskId: string, startedAt: number, extra: Partial<FocusRow> = {}) => ({ id, taskId, startedAt, updatedAt: startedAt, deleted: 0, deviceId: 't', ...extra }) as FocusRow;

describe('item 214: a task keeps its whole time across focuses', () => {
  it('adds every focus of the task, ended or running, less its pauses, and nothing from other tasks or deleted rows', () => {
    const rows = [
      row('a1', 'a', 0, { endedAt: 10 * MIN }),
      row('b1', 'b', 10 * MIN, { endedAt: 12 * MIN }),
      row('a2', 'a', 20 * MIN, { pauses: [{ at: 23 * MIN, resumeAt: 28 * MIN }] }),
      row('a3', 'a', 0, { endedAt: 50 * MIN, deleted: 1 }),
    ];
    expect(taskFocusMs(rows, 'a', 29 * MIN)).toBe(10 * MIN + 4 * MIN);
    expect(taskFocusMs(rows, 'b', 29 * MIN)).toBe(2 * MIN);
    expect(taskFocusMs(rows, 'c', 29 * MIN)).toBe(0);
  });

  it('holds still while paused', () => {
    const rows = [row('a', 'a', 0, { pauses: [{ at: 3 * MIN }] })];
    expect(taskFocusMs(rows, 'a', 3 * MIN)).toBe(3 * MIN);
    expect(taskFocusMs(rows, 'a', 8 * MIN)).toBe(3 * MIN);
  });
});
