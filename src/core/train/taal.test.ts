import { describe, expect, it } from 'vitest';
import { nextRestBeat, planForWeek, readBeatChanges, rhythmSheet, taalWeek, weekLine } from './taal';
import type { LedgerRow } from '../../data/types';

// Mon 2 Nov 2026 starts the week; program days Mon, Wed, Fri (1, 3, 5).
const stamp = { updatedAt: 1, deleted: 0 as const, deviceId: 'd' };
const session = (dayKey: string, xp = 60): LedgerRow => ({ id: `train-session:${dayKey}`, mode: 'train', kind: 'session', refId: dayKey, dayKey, inputs: { xp }, ...stamp });
const walk = (dayKey: string): LedgerRow => ({ id: `train-rest:${dayKey}`, mode: 'train', kind: 'rest', refId: dayKey, dayKey, inputs: { minutes: 10 }, ...stamp });
const base = { programDays: [1, 3, 5], target: 3 };

describe('Taal week (spec 24 #3, cj5-train §7 #1)', () => {
  it('program days are claps, the rest are rest beats, and a rest beat fills once its day has ended', () => {
    const week = taalWeek({ ...base, today: '2026-11-04', ledger: [session('2026-11-02'), walk('2026-11-03')] });
    expect(week.weekStart).toBe('2026-11-02');
    expect(week.beats.map(beat => beat.plan)).toEqual(['clap', 'rest', 'clap', 'rest', 'clap', 'rest', 'rest']);
    expect(week.beats.map(beat => beat.filled)).toEqual([true, true, false, false, false, false, false]);
    expect(week.beats[1]!.walked).toBe(true);
    expect(week.beats[2]!.today).toBe(true);
    expect(weekLine(week)).toBe('1 of 3 sessions this week.');
  });
  it('a session with no XP fills nothing; training on a rest beat fills it as a clap, shown as extra', () => {
    const week = taalWeek({ ...base, today: '2026-11-08', ledger: [session('2026-11-02', 0), session('2026-11-03')] });
    expect(week.beats[0]!.filled).toBe(false);
    expect(week.beats[1]).toMatchObject({ plan: 'clap', filled: true, extra: true });
  });
  it('closes when the target is reached, and a short week closes without a loss', () => {
    const full = taalWeek({ ...base, today: '2026-11-06', ledger: ['2026-11-02', '2026-11-04', '2026-11-06'].map(day => session(day)) });
    expect(full.closed).toBe(true);
    expect(weekLine(full)).toBe('This week’s cycle is closed.');
    const short = taalWeek({ ...base, today: '2026-11-09', week: '2026-11-02', ledger: ['2026-11-02', '2026-11-04'].map(day => session(day)) });
    expect(short.ended && !short.closed).toBe(true);
    expect(weekLine(short)).toBe('This week closed at 2. That counts.');
    expect(weekLine(taalWeek({ ...base, today: '2026-11-09', week: '2026-11-02', ledger: [] }))).toBe('This week closed at 0. That counts.');
  });
  it("readiness can move today's clap to the next rest beat, once a week, or make today a rest beat", () => {
    const before = taalWeek({ ...base, today: '2026-11-04', ledger: [] });
    expect(nextRestBeat(before)?.dayKey).toBe('2026-11-05');
    const moved = taalWeek({ ...base, today: '2026-11-04', ledger: [], changes: { moves: [{ from: '2026-11-04', to: '2026-11-05' }], restToday: [] } });
    expect(moved.beats[2]!.plan).toBe('rest');
    expect(moved.beats[3]!.plan).toBe('clap');
    expect(moved.movesLeft).toBe(0);
    // A second move is ignored, and no more moves are offered.
    const twice = taalWeek({ ...base, today: '2026-11-06', ledger: [], changes: { moves: [{ from: '2026-11-04', to: '2026-11-05' }, { from: '2026-11-06', to: '2026-11-07' }], restToday: [] } });
    expect(twice.beats[4]!.plan).toBe('clap');
    expect(nextRestBeat(twice)).toBeUndefined();
    const rest = taalWeek({ ...base, today: '2026-11-04', ledger: [], changes: { moves: [], restToday: ['2026-11-04'] } });
    expect(rest.beats[2]!.plan).toBe('rest');
    expect(rest.claps).toBe(2);
  });
  it('never offers a move once today is filled or on a rest beat', () => {
    expect(nextRestBeat(taalWeek({ ...base, today: '2026-11-04', ledger: [session('2026-11-04')] }))).toBeUndefined();
    expect(nextRestBeat(taalWeek({ ...base, today: '2026-11-05', ledger: [] }))).toBeUndefined();
  });
  it('reads a stored change row defensively', () => {
    expect(readBeatChanges(undefined)).toEqual({ moves: [], restToday: [] });
    expect(readBeatChanges({ moves: [{ from: '2026-11-04', to: 'x' }, { from: '2026-11-04', to: '2026-11-05' }], restToday: ['2026-11-04', 3] }))
      .toEqual({ moves: [{ from: '2026-11-04', to: '2026-11-05' }], restToday: ['2026-11-04'] });
  });
  it('the rhythm sheet lists past weeks since the program began, newest first, and the current week is not on it', () => {
    const sheet = rhythmSheet({ ...base, today: '2026-11-18', since: '2026-10-28', ledger: [session('2026-11-02')], changesFor: () => ({ moves: [], restToday: [] }) });
    expect(sheet.map(week => week.weekStart)).toEqual(['2026-11-09', '2026-11-02', '2026-10-26']);
    expect(sheet[1]!.filled).toBe(1);
    expect(sheet.every(week => week.ended)).toBe(true);
  });
  it('the rhythm sheet only grows: a 20th week keeps the first one (Codex B item 100)', () => {
    const sheet = rhythmSheet({ ...base, today: '2027-03-24', since: '2026-11-02', ledger: [], changesFor: () => ({ moves: [], restToday: [] }) });
    expect(sheet).toHaveLength(20);
    expect(sheet.at(-1)!.weekStart).toBe('2026-11-02');
  });
  it('past weeks keep the target and days they were planned with after a change (Codex B item 100)', () => {
    const history = [{ from: '0000-01-01', days: [1, 4], target: 2 }, { from: '2026-11-16', days: [1, 3, 5], target: 3 }];
    expect(planForWeek(history, '2026-11-09', { days: [1, 3, 5], target: 3 })).toEqual({ days: [1, 4], target: 2 });
    expect(planForWeek(history, '2026-11-16', { days: [1, 3, 5], target: 3 })).toEqual({ days: [1, 3, 5], target: 3 });
    expect(planForWeek(undefined, '2026-11-09', { days: [1, 3, 5], target: 3 })).toEqual({ days: [1, 3, 5], target: 3 });
    const sheet = rhythmSheet({ ...base, today: '2026-11-18', since: '2026-11-09', ledger: [session('2026-11-09'), session('2026-11-12')], changesFor: () => ({ moves: [], restToday: [] }), history });
    expect(sheet[0]).toMatchObject({ weekStart: '2026-11-09', target: 2, filled: 2, closed: true });
    expect(weekLine(sheet[0]!)).toBe('This week’s cycle is closed.');
  });
});
