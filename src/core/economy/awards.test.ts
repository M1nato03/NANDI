import { describe, it, expect } from 'vitest';
import { calculateTasksDayXp } from './awards';
import { RULES } from '../rules.config';

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
          inputs: { plannedSize: size, isFirstDay: true, postpones: 0 }
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
          inputs: { plannedSize: size, isFirstDay: false, postpones }
        };
        const xpPostpones = calculateTasksDayXp([factPostpones], RULES);

        expect(xpPostpones).toBeLessThanOrEqual(xpNoPostpones);
      }
    }
  });
});
