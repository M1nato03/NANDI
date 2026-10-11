import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { buildWeeklySummary, weeklySummarySchema } from './weeklySummary';

describe('weekly export', () => {
  it('contains all modes and validates at the Monday 04:00 boundary', () => {
    const mondayEarly = new Date('2026-10-12T03:59:00+05:30').getTime();
    const mondayNew = new Date('2026-10-12T04:00:00+05:30').getTime();
    const summary = buildWeeklySummary('2026-10-05', {
      tasks: [], events: [], focus: [], logs: [], sessions: [], prs: [], programs: [], puzzleRuns: [], lessonProg: [], plans: [], flags: [], ledger: [
        { id: 'card:old', dayKey: '2026-10-11', mode: 'mind', kind: 'card', refId: 'old', inputs: { correct: true }, updatedAt: mondayEarly, deleted: 0, deviceId: 'test' },
        { id: 'card:new', dayKey: '2026-10-12', mode: 'mind', kind: 'card', refId: 'new', inputs: { correct: true }, updatedAt: mondayNew, deleted: 0, deviceId: 'test' },
      ], quests: [], settings: [], exState: [],
    }, 6);
    expect(v.safeParse(weeklySummarySchema, summary).success).toBe(true);
    expect(summary.week).toEqual({ isoWeek: '2026-W41', from: '2026-10-05', to: '2026-10-11' });
    expect(summary.mind.cardsReviewed).toBe(1);
    expect(summary.tasks.planned).toBe(0);
    expect(summary.train.sessions).toBe(0);
    expect(summary.quests.completed).toBe(0);
    expect(v.safeParse(weeklySummarySchema, { ...summary, life: { ...summary.life, nightOverrides: -1 } }).success).toBe(false);
  });
});
