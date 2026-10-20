import { describe, expect, it } from 'vitest';
import { addOpen, hashPin, ownerMetrics, readOpens, validPin, OWNER_OPENS_KEY } from './metrics';
import type { LedgerRow, SettingRow } from '../../data/types';

const setting = (key: string, value: unknown): SettingRow => ({ key, value, updatedAt: 1, deleted: 0, deviceId: 'd' });
const fact = (dayKey: string, mode: string, kind: string, inputs: Record<string, unknown> = {}, updatedAt = 1): LedgerRow =>
  ({ id: `${mode}:${kind}:${dayKey}:${Math.random()}`, dayKey, mode, kind, refId: 'r', inputs, updatedAt, deleted: 0, deviceId: 'd' });

describe('owner metrics', () => {
  it('counts opens per day and keeps 60 days', () => {
    let opens = addOpen({ '2026-08-01': 3 }, '2026-10-20');
    opens = addOpen(opens, '2026-10-20');
    expect(opens).toEqual({ '2026-10-20': 2 });
    expect(readOpens([setting(OWNER_OPENS_KEY, { '2026-10-19': 4, bad: 2, '2026-10-18': -1 })])).toEqual({ '2026-10-19': 4 });
  });

  it('sums the last 7 days and computes Learn accuracy', () => {
    const ledger = [
      fact('2026-10-20', 'tasks', 'done'), fact('2026-10-19', 'tasks', 'done'), fact('2026-10-01', 'tasks', 'done'),
      fact('2026-10-20', 'train', 'session'), fact('2026-10-18', 'mind', 'board'), fact('2026-10-18', 'mind', 'mystery'),
      fact('2026-10-20', 'learn', 'learn-answer', { correct: true }), fact('2026-10-20', 'learn', 'learn-answer', { correct: false }),
      fact('2026-10-20', 'learn', 'learn-answer', { correct: true }), fact('2026-10-20', 'learn', 'learn-answer', { correct: true }),
    ];
    const settings = [setting(OWNER_OPENS_KEY, { '2026-10-20': 3, '2026-10-19': 4 }), setting('night.pause.openings', 5), setting('night.pause.dismissals', 2), setting('errorRing', [{}, {}])];
    const m = ownerMetrics({ ledger, settings, today: '2026-10-20', now: Date.parse('2026-10-20T12:00:00') });
    expect(m.days).toHaveLength(30);
    expect(m.opensToday).toBe(3);
    expect(m.opensAvg7).toBe(1);
    expect(m.tasksDone7).toBe(2);
    expect(m.workouts7).toBe(1);
    expect(m.boards7).toBe(1);
    expect(m.cases7).toBe(1);
    expect(m.answers7).toBe(4);
    expect(m.accuracy7).toBe(75);
    expect(m.activeDays7).toBe(3);
    expect([m.pauseOpenings, m.pauseWentAnyway, m.errors]).toEqual([5, 2, 2]);
  });

  it('hashes the PIN the same way every time and checks its shape', async () => {
    expect(await hashPin('1234')).toBe(await hashPin('1234'));
    expect(await hashPin('1234')).not.toBe(await hashPin('4321'));
    expect([validPin('123'), validPin('1234'), validPin('123456'), validPin('12a4')]).toEqual([false, true, true, false]);
  });
});
