import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { buildRecap, realThingsMs, receiptContent, receiptDuration, receiptWeek, recapWindow, youWeekNumbers, type RecapSources, type WeeklyRecapData } from './recap';
import { createDb } from '../data/db';
import { saveChapterDone } from '../data/repos/books';
import type { FocusRow, LedgerRow, SessionRow } from '../data/types';

const meta = { updatedAt: 1, deleted: 0 as const, deviceId: 'test' };
const empty: RecapSources = { tasks: [], focus: [], sessions: [], quests: [], concepts: [], logs: [], ledger: [] };
const at = (text: string) => new Date(text).getTime();
// The week of Mon 2 Nov 04:00 to Mon 9 Nov 04:00, read on Tue 10 Nov.
const READ_AT = at('2026-11-10T12:00:00');
const week = recapWindow(READ_AT);
const focus = (id: string, startedAt: number, endedAt: number): FocusRow => ({ ...meta, id, taskId: 't', startedAt, endedAt });
const session = (id: string, startedAt: number | undefined, endedAt: number | undefined): SessionRow => ({ ...meta, id, dayKey: '2026-11-04', status: 'completed', workingSets: 6, startedAt, endedAt } as SessionRow);
const calm = (id: string, day: string, minutes: number): LedgerRow => ({ ...meta, id, mode: 'calm', kind: 'session', refId: id, dayKey: day, inputs: { minutes } });
const chapter = (id: string, day: string): LedgerRow => ({ ...meta, id, mode: 'read', kind: 'chapter', refId: id, dayKey: day, inputs: {} });

describe('What your time became', () => {
  it('switches to the completed week at Monday 04:00 and counts done work only', () => {
    const before = at('2026-10-12T03:59:00');
    const after = at('2026-10-12T04:00:00');
    expect(recapWindow(before).from).toBe('2026-09-28');
    expect(recapWindow(after).from).toBe('2026-10-05');
    const source: RecapSources = {
      tasks: [{ id: 'a', title: 'Done', status: 'done', dayKey: '2026-10-11', doneAt: before, updatedAt: before, deleted: 0, deviceId: 'test' }],
      focus: [{ id: 'f', taskId: 'a', startedAt: before - 3_600_000, endedAt: before, updatedAt: before, deleted: 0, deviceId: 'test' }],
      sessions: [{ id: 's', dayKey: '2026-10-11', status: 'completed', workingSets: 6, endedAt: before, updatedAt: before, deleted: 0, deviceId: 'test' }],
      quests: [{ id: 'q', sourceId: 'q', week: '2026-W41', title: 'Walk', kind: 'once', target: 1, unit: 'walk', step: 1, progress: 1, tapIds: [], status: 'done', custom: false, updatedAt: before, deleted: 0, deviceId: 'test' }],
      concepts: [{ id: 'c', mastery: 1, attempts: 1, firstLearnedAt: before, activeMisconceptions: [], updatedAt: before, deleted: 0, deviceId: 'test' }],
      logs: [{ dayKey: '2026-10-11', lightsOutAt: before, bedtimeTarget: before, updatedAt: before, deleted: 0, deviceId: 'test' }],
      ledger: [],
    };
    expect(buildRecap(after, source)).toMatchObject({ tasks: 1, focusMinutes: 60, workouts: 1, sideQuests: 1, concepts: 1, nights: 1 });
    expect(buildRecap(before, source).tasks).toBe(0);
  });
});

describe('spec 53: REAL THINGS, measured time only', () => {
  it('counts focus alone', () => {
    expect(realThingsMs(week, { ...empty, focus: [focus('f', at('2026-11-03T10:00:00'), at('2026-11-03T11:30:00'))] })).toBe(90 * 60_000);
  });
  it('clips a focus that spans Monday 04:00 to the week', () => {
    const spanning = focus('f', at('2026-11-09T03:00:00'), at('2026-11-09T05:00:00'));
    expect(realThingsMs(week, { ...empty, focus: [spanning] })).toBe(60 * 60_000);
  });
  it('leaves out a session missing a stamp and caps a long one at 3 h', () => {
    const sessions = [
      session('open', at('2026-11-04T07:00:00'), undefined),
      session('no-start', undefined, at('2026-11-04T08:00:00')),
      session('long', at('2026-11-05T06:00:00'), at('2026-11-05T11:00:00')),
      session('ok', at('2026-11-06T07:00:00'), at('2026-11-06T07:45:00')),
    ];
    expect(realThingsMs(week, { ...empty, sessions })).toBe(3 * 3_600_000 + 45 * 60_000);
    // The one without a start still counts as a workout; it adds no time.
    expect(buildRecap(READ_AT, { ...empty, sessions }).workouts).toBe(3);
  });
  it('counts Calm from the minutes sat', () => {
    expect(realThingsMs(week, { ...empty, ledger: [calm('c1', '2026-11-04', 12), calm('c2', '2026-11-10', 30)] })).toBe(12 * 60_000);
  });
  it('puts a session that ends at 02:00 Monday in the same week as that night\'s Calm (one week boundary for all)', () => {
    // 02:00 on Mon 9 Nov is still Sunday's planning day: both belong to the week of 2 Nov.
    const late = session('late', at('2026-11-09T01:00:00'), at('2026-11-09T02:00:00'));
    const night = calm('c', '2026-11-08', 10);
    expect(realThingsMs(week, { ...empty, sessions: [late], ledger: [night] })).toBe(70 * 60_000);
    const next = recapWindow(at('2026-11-17T12:00:00'));
    expect(realThingsMs(next, { ...empty, sessions: [late], ledger: [night] })).toBe(0);
  });
});

describe('spec 53: chapters read', () => {
  it('counts one row per finished chapter; a re-read writes nothing and adds nothing', async () => {
    const db = createDb(`recap-chapters-${Date.now()}`);
    const now = at('2026-11-04T12:00:00');
    await saveChapterDone(db, 'psychology', 'psychology-ch1', now);
    await saveChapterDone(db, 'psychology', 'psychology-ch1', now + 60_000);
    await saveChapterDone(db, 'psychology', 'psychology-ch2', now + 120_000);
    const ledger = await db.ledger.toArray();
    expect(buildRecap(READ_AT, { ...empty, ledger }).chapters).toBe(2);
    await db.delete();
  });
  it('counts only the week\'s chapters', () => {
    expect(buildRecap(READ_AT, { ...empty, ledger: [chapter('a', '2026-11-02'), chapter('b', '2026-11-08'), chapter('c', '2026-11-09'), chapter('d', '2026-11-01')] }).chapters).toBe(2);
  });
});

const base: WeeklyRecapData = { from: '2026-11-02', to: '2026-11-09', tasks: 0, focusMinutes: 0, longestFocusMinutes: 0, workouts: 0, sideQuests: 0, concepts: 0, nights: 0, chapters: 0, realMs: 0 };

describe('spec 53: the receipt', () => {
  it('keeps nonzero lines in order, at most six', () => {
    const content = receiptContent({ ...base, chapters: 2, concepts: 9, workouts: 3, focusMinutes: 250, tasks: 11, nights: 4, sideQuests: 2 });
    expect(content.lines).toEqual([
      { label: 'Chapters read', value: '2' }, { label: 'Ideas learned', value: '9' }, { label: 'Workouts', value: '3' },
      { label: 'Focus', value: '4 h 10 m' }, { label: 'Tasks done', value: '11' }, { label: 'Nights back on plan', value: '4' },
    ]);
    expect(receiptContent({ ...base, tasks: 3, sideQuests: 1 }).lines.map(line => line.label)).toEqual(['Tasks done', 'Side quests']);
    expect(content.dates).toBe('2–8 Nov');
  });
  it('rounds the total down to 10 min and hides it under 30 min', () => {
    expect(receiptContent({ ...base, realMs: 29 * 60_000 }).total).toBeUndefined();
    expect(receiptContent({ ...base, realMs: 30 * 60_000 }).total).toBe('30 m');
    expect(receiptContent({ ...base, realMs: (6 * 60 + 49) * 60_000 }).total).toBe('6 h 40 m');
    // 65 min rounds down to 60 (the 10-minute floor), and an exact hour reads "1 h", never "1 h 0 m".
    expect(receiptContent({ ...base, realMs: 65 * 60_000 }).total).toBe('1 h');
  });
  it('moves the longest focus under the total and drops the filler', () => {
    expect(receiptContent({ ...base, longestFocusMinutes: 52 }).highlight).toBe('Longest focus: 52 min');
    expect(receiptContent({ ...base, concepts: 3 }).highlight).toBeUndefined();
  });
  it('says "so far" until Sunday 18:00, and never from the Sunday receipt on', () => {
    const week = { ...base, tasks: 2, workouts: 1 };
    expect(receiptWeek(receiptContent(week, at('2026-11-05T12:00:00')))).toBe('week of 2–8 Nov · so far');
    expect(receiptWeek(receiptContent(week, at('2026-11-08T17:59:00')))).toBe('week of 2–8 Nov · so far');
    expect(receiptWeek(receiptContent(week, at('2026-11-08T18:05:00')))).toBe('week of 2–8 Nov');
    expect(receiptWeek(receiptContent(week, at('2026-11-09T03:59:00')))).toBe('week of 2–8 Nov');
    expect(receiptWeek(receiptContent(week, at('2026-11-09T04:00:00')))).toBe('week of 2–8 Nov');
    expect(receiptWeek(receiptContent(week))).toBe('week of 2–8 Nov');
  });
  it('names both months when the week crosses one', () => {
    expect(receiptContent({ ...base, from: '2026-10-26', to: '2026-11-02' }).dates).toBe('26 Oct–1 Nov');
  });
});

describe("You's week in words", () => {
  it('is singular at 1 and plural otherwise', () => {
    expect(youWeekNumbers({ ...base, tasks: 1, workouts: 1, concepts: 2, focusMinutes: 60 }).map(item => `${item.value} ${item.label}`))
      .toEqual(['1 task finished', '1 workout', '2 ideas learned', '1 focus hour']);
    expect(youWeekNumbers({ ...base, tasks: 2, workouts: 3, nights: 1 }).map(item => `${item.value} ${item.label}`)).toEqual(['2 tasks finished', '3 workouts', '1 night back on plan']);
  });
});

describe('the one duration format (receipt, Home, the jar\'s plan bar, the crew)', () => {
  it('drops zero parts: exact hours read "2 h", never "2 h 0 m"', () => {
    expect([240, 250, 45, 0, 120, 300, 65].map(receiptDuration)).toEqual(['4 h', '4 h 10 m', '45 m', '0 m', '2 h', '5 h', '1 h 5 m']);
  });
});
