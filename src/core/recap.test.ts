import { describe, expect, it } from 'vitest';
import { buildRecap, recapWindow, type RecapSources } from './recap';

describe('What your time became', () => {
  it('switches to the completed week at Monday 04:00 and counts done work only', () => {
    const before = new Date('2026-10-12T03:59:00').getTime();
    const after = new Date('2026-10-12T04:00:00').getTime();
    expect(recapWindow(before).from).toBe('2026-09-28');
    expect(recapWindow(after).from).toBe('2026-10-05');
    const source: RecapSources = {
      tasks: [{ id: 'a', title: 'Done', status: 'done', dayKey: '2026-10-11', doneAt: before, updatedAt: before, deleted: 0, deviceId: 'test' }],
      focus: [{ id: 'f', taskId: 'a', startedAt: before - 3_600_000, endedAt: before, updatedAt: before, deleted: 0, deviceId: 'test' }],
      sessions: [{ id: 's', dayKey: '2026-10-11', status: 'completed', endedAt: before, updatedAt: before, deleted: 0, deviceId: 'test' }],
      quests: [{ id: 'q', sourceId: 'q', week: '2026-W41', title: 'Walk', kind: 'once', target: 1, unit: 'walk', step: 1, progress: 1, tapIds: [], status: 'done', custom: false, updatedAt: before, deleted: 0, deviceId: 'test' }],
      concepts: [{ id: 'c', mastery: 1, attempts: 1, firstLearnedAt: before, activeMisconceptions: [], updatedAt: before, deleted: 0, deviceId: 'test' }],
      logs: [{ dayKey: '2026-10-11', lightsOutAt: before, bedtimeTarget: before, updatedAt: before, deleted: 0, deviceId: 'test' }],
    };
    expect(buildRecap(after, source)).toMatchObject({ tasks: 1, focusHours: 1, workouts: 1, sideQuests: 1, concepts: 1, nights: 1 });
    expect(buildRecap(before, source).tasks).toBe(0);
  });
});
