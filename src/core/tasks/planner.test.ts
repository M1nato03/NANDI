import { describe, expect, it } from 'vitest';
import { RULES } from '../rules.config';
import { capacity, dayHorizon, effectiveShutdown, nextBedtimeTarget, nightWindow, suggestSlots, weeklySummary, stepDownOffer } from './planner';

const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute).getTime();

describe('planner rules', () => {
  it('uses the earlier night-time shutdown and formats the day horizon', () => {
    expect(effectiveShutdown('23:15', '01:30')).toBe('23:15');
    expect(effectiveShutdown('23:15', '23:15')).toBe('23:00');
    expect(dayHorizon(220, at(11, 20, 25), '23:15')).toBe('3h 40m planned · 2h 50m left before shutdown (23:15)');
    expect(dayHorizon(30, at(11, 23, 30), '23:15')).toContain('0h 0m left');
  });
  it('starts wind-down at shutdown or earlier completion and lights-out at bedtime', () => {
    expect(nightWindow(at(11, 20), '23:15', '01:30')).toBe('day');
    expect(nightWindow(at(11, 20), '23:15', '01:30', at(11, 19))).toBe('windDown');
    expect(nightWindow(at(11, 23, 15), '23:15', '01:30')).toBe('windDown');
    expect(nightWindow(at(12, 1, 30), '23:15', '01:30')).toBe('lightsOut');
    expect(nightWindow(at(12, 4), '23:15', '01:30')).toBe('day');
  });
  it('warns at calibrated capacity and offers genuinely free starts', () => {
    expect(capacity(210, 1.2, at(12, 9)).over).toBe(true); // class day: 252 > 240
    expect(capacity(210, 1.2, at(11, 9)).over).toBe(false); // Sunday: 252 < 360
    expect(suggestSlots(at(11, 9, 10), 30, [{ start: at(11, 10), end: at(11, 11) }])).toEqual([at(11, 9, 30), at(11, 11), at(11, 11, 30)]);
  });
  it('ramps bedtime after two of three met nights, never later or past goal', () => {
    expect(nextBedtimeTarget('01:30', '23:30', [true, false, true], 3)).toBe('01:15');
    expect(nextBedtimeTarget('01:30', '23:30', [true, false, false], 3)).toBe('01:30');
    expect(nextBedtimeTarget('23:30', '23:30', [true, true, true], 3)).toBe('23:30');
    expect(nextBedtimeTarget('01:30', '23:30', [true, true, true], 2)).toBe('01:30');
  });
  it('summarises adherence, first-day completion, reasons, estimates, switches and rituals', () => {
    const summary = weeklySummary({
      weekStart: '2026-10-05', budget: 5,
      tasks: [
        { id: 'a', status: 'done', dayKey: '2026-10-06', firstScheduledDayKey: '2026-10-06', doneAt: at(6, 11), category: 'study', estimateMin: 30, scheduledStart: at(6, 10) },
        { id: 'b', status: 'done', dayKey: '2026-10-07', firstScheduledDayKey: '2026-10-07', doneAt: at(8, 11), category: 'study', estimateMin: 30, scheduledStart: at(7, 10), postponeCount: 3 },
        { id: 'c', status: 'someday', title: 'Parked', dayKey: '2026-10-08' },
      ],
      events: [
        { taskId: 'b', kind: 'postponed', at: at(3, 9), budgetCounted: true },
        { taskId: 'b', kind: 'postponed', at: at(4, 9), budgetCounted: true },
        { taskId: 'a', kind: 'started', at: at(6, 10, 10) }, { taskId: 'b', kind: 'started', at: at(7, 10, 30) },
        { taskId: 'b', kind: 'postponed', at: at(8, 9), reason: 'blocked', budgetCounted: true },
        { taskId: 'c', kind: 'someday', at: at(8, 9) },
      ],
      focus: [{ taskId: 'a', startedAt: at(6, 10, 10), endedAt: at(6, 10, 55), switches: 1 }],
      logs: [{ planDone: true, shutdownDone: true, reviewDone: false }],
    });
    expect(summary.startAdherence).toEqual({ met: 1, total: 2 });
    expect(summary.firstDayDone).toEqual({ met: 1, total: 2 });
    expect(summary.postpones).toBe(1);
    expect(summary.reachedThree).toBe(1);
    expect(summary.reachedThreeShare).toBe(100);
    expect(summary.reasons).toEqual({ blocked: 1 });
    expect(summary.estimateRatio.study).toBe(1.5);
    expect(summary.switchesPerBlock).toBe(1);
    expect(summary.rituals).toEqual({ plan: 1, shutdown: 1, review: 0 });
    expect(summary.somedayMoved).toEqual(['c']);
    expect(summary.budgetRemaining).toBe(4);
  });
  it('only offers a season step-down after three under-budget weeks', () => {
    expect(stepDownOffer(7, [4, 6, 5, 8])).toBe(6);
    expect(stepDownOffer(7, [7, 6, 8, 5])).toBeNull();
    expect(RULES.tasks.postpone.autoBudgetMin).toBe(5);
  });
});
