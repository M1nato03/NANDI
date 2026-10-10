import { describe, it, expect } from 'vitest';
import { calculateTasksDayXp } from './awards';
import { RULES } from '../rules.config';
import { createTask } from '../tasks/task-machine';
import { splitTask } from '../tasks/split';

describe('Tasks Economy Awards', () => {
  it('Property 4: Clutch - Postponed finish never totals more XP than 0 postpones', () => {
    for (const size of ['S', 'M', 'L']) {
      for (const postpones of [0, 1, 2, 3, 4, 5]) {
        const factNoPostpones = {
          id: 'test',
          dayKey: '2026-10-05',
          mode: 'tasks',
          kind: 'done',
          refId: '1',
          updatedAt: 1,
          deleted: 0 as const,
          deviceId: 'device-a',
          inputs: { plannedSize: size, isFirstDay: true, postpones: 0 },
        };
        const xpNoPostpones = calculateTasksDayXp([factNoPostpones], RULES);

        const factPostpones = {
          id: 'test',
          dayKey: '2026-10-05',
          mode: 'tasks',
          kind: 'done',
          refId: '1',
          updatedAt: 1,
          deleted: 0 as const,
          deviceId: 'device-a',
          inputs: { plannedSize: size, isFirstDay: false, postpones },
        };
        const xpPostpones = calculateTasksDayXp([factPostpones], RULES);

        expect(xpPostpones).toBeLessThanOrEqual(xpNoPostpones);
      }
    }
  });

  it('postponed split subtasks never total more than their unpostponed counterparts', () => {
    const at = new Date(2026, 9, 4, 10).getTime();
    for (const estimates of [
      [45, 45],
      [30, 30, 30],
      [25, 25, 40],
    ]) {
      const parent = createTask('parent', at - 60_000, 'L', 90, {
        scheduledStart: at,
      });
      const children = splitTask(
        parent,
        estimates.length,
        estimates,
        RULES,
        at,
      );
      const facts = (postpones: number) =>
        children.map((child, index) => ({
          id: `done:child-${index}`,
          dayKey: '2026-10-04',
          mode: 'tasks',
          kind: 'done',
          refId: `child-${index}`,
          updatedAt: index,
          deleted: 0 as const,
          deviceId: 'test',
          inputs: {
            plannedSize: child.plannedSize,
            xpShare: child.xpShare,
            isFirstDay: postpones === 0,
            postpones,
          },
        }));
      const firstDay = calculateTasksDayXp(facts(0));
      for (let postpones = 1; postpones <= 9; postpones++) {
        expect(calculateTasksDayXp(facts(postpones))).toBeLessThanOrEqual(
          firstDay,
        );
      }
    }
  });
});
