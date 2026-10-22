import { describe, expect, it } from 'vitest';
import type { LedgerRow, SettingRow } from '../../data/types';
import { deriveEconomy } from './deriveEconomy';
import { questPool } from './gamify';

// Economy review 32 (cj2 economy simulation), fixes that need no rule decision. Each counts from economy.v3From.
let serial = 0;
const row = (dayKey: string, mode: string, kind: string, inputs: Record<string, unknown> = {}): LedgerRow => ({
  id: `${kind}:${++serial}`, dayKey, mode, kind, refId: String(serial), inputs, updatedAt: serial, deleted: 0, deviceId: 'test' });
const setting = (key: string, value: unknown): SettingRow => ({ key, value, updatedAt: 1, deleted: 0, deviceId: 'test' });
const task = (day: string) => row(day, 'tasks', 'done', { plannedSize: 'M', isFirstDay: true, wasPlanned: true, postpones: 0 });
const full = (day: string) => row(day, 'train', 'session', { plannedExercises: 2, touchedExercises: 2, plannedSets: 6, workingSets: 6 });
const board = (day: string) => row(day, 'mind', 'board', { daily: true });
const hatTrick = (day: string) => [task(day), full(day), board(day)];
const v3 = [setting('economy.v2From', '2026-10-01'), setting('economy.v3From', '2026-10-01')];
// Nov 2026: the 2nd is a Monday. Four unmarked days spend the four rest days granted on the 1st.
const spentBank = () => [...hatTrick('2026-11-02')];

describe('economy review 32', () => {
  it('A1: a short session after a walk check never lowers the day', () => {
    const day = '2026-11-03';
    const walk = row(day, 'train', 'rest', { minutes: 15 });
    const oneSet = row(day, 'train', 'session', { plannedExercises: 5, touchedExercises: 1, plannedSets: 15, workingSets: 1 });
    const walkOnly = deriveEconomy([task(day), walk], undefined, v3, day).days.at(-1)!.train;
    const both = deriveEconomy([task(day), walk, oneSet], undefined, v3, day).days.at(-1)!.train;
    expect(walkOnly).toBeGreaterThan(0);
    expect(both).toBeGreaterThanOrEqual(walkOnly);
    // Before the fixes the same day kept its old score (forward-only).
    const before = [setting('economy.v2From', '2026-10-01'), setting('economy.v3From', '2026-12-01')];
    expect(deriveEconomy([task(day), walk, oneSet], undefined, before, day).days.at(-1)!.train).toBeLessThan(walkOnly);
  });

  it('A2: a rest-day purchase the shop never wrote as paid adds nothing and costs nothing', () => {
    const day = '2026-11-03';
    const base = [...hatTrick(day)];
    const plain = deriveEconomy(base, undefined, v3, day);
    const unpaid = deriveEconomy([...base, row(day, 'economy', 'purchase', { itemId: 'freeze', price: 50 })], undefined, v3, day);
    expect(unpaid.streak.restDays).toBe(plain.streak.restDays);
    expect(unpaid.shards).toBe(plain.shards);
    const paid = deriveEconomy([...base, row(day, 'economy', 'purchase', { itemId: 'freeze', price: 50, accepted: true })], undefined, v3, day);
    expect(paid.streak.restDays).toBe(plain.streak.restDays + 1);
  });

  it('B3: the repair offer goes away once no Hat-trick day is left in the window', () => {
    // Bank spent on 3-6 Nov, Saturday the 7th missed, Sunday marked without a Hat-trick, Monday a Hat-trick.
    const facts = [...spentBank(), task('2026-11-08'), ...hatTrick('2026-11-09')];
    const monday = deriveEconomy(facts, undefined, v3, '2026-11-09').streak;
    expect(monday.paused).toBe(true);
    expect(monday.canRepair).toBe(false);
    // On Sunday, with one Hat-trick in, Monday is still ahead, so the offer stands.
    expect(deriveEconomy([...spentBank(), ...hatTrick('2026-11-08')], undefined, v3, '2026-11-08').streak.canRepair).toBe(true);
  });

  it('B4 + B6: a standing Sunday rest day does not use up the repair window, and holds in later weeks', () => {
    const standing = [...v3, setting('economy.restWeekday', { weekday: 0, from: '2026-11-02' })];
    // Saturday the 7th missed; Sunday the 8th is the rest day; Hat-tricks Monday and Tuesday repair the run.
    const facts = [...spentBank(), ...hatTrick('2026-11-09'), ...hatTrick('2026-11-10')];
    const view = deriveEconomy(facts, undefined, standing, '2026-11-11').streak;
    expect(view.paused).toBe(false);
    expect(view.restored).toBe(true);
    // The standing pick also covers the next week's Sunday without a new pick.
    const later = [...facts, ...hatTrick('2026-11-11'), ...hatTrick('2026-11-12'), ...hatTrick('2026-11-13'), ...hatTrick('2026-11-14'), ...hatTrick('2026-11-16')];
    expect(deriveEconomy(later, undefined, standing, '2026-11-17').streak.paused).toBe(false);
    // A week before the pick was made is not covered.
    expect(deriveEconomy(facts, undefined, [...v3, setting('economy.restWeekday', { weekday: 0, from: '2026-11-09' })], '2026-11-11').streak.restored).toBe(false);
  });

  it('C10: Mind done after bedtime fills no quest', () => {
    const day = '2026-11-03';
    const late = Array.from({ length: 3 }, () => row(day, 'mind', 'learn-answer', { afterBedtime: true, correct: true }));
    const quest = questPool.find(item => item.id === 'learn-three')!;
    expect(quest.count(late, day)).toBe(0);
    expect(quest.count(late.map(fact => ({ ...fact, inputs: { ...fact.inputs, afterBedtime: false } })), day)).toBe(3);
    expect(questPool.find(item => item.id === 'board')!.count([row(day, 'mind', 'board', { daily: true, afterBedtime: true })], day)).toBe(0);
  });

  it('a season that ended before the first day here pays no Shards', () => {
    // Season 1 runs 2 Nov to 6 Dec; this person starts on 10 Dec.
    const facts = [task('2026-12-10')];
    const view = deriveEconomy(facts, undefined, v3, '2026-12-12');
    expect(view.shards).toBeLessThan(50);
    // Someone already here on an older build (first day before the cutoff) keeps the Shards they were shown (Codex #4).
    const upgraded = [setting('economy.v2From', '2026-10-01'), setting('economy.v3From', '2027-01-01')];
    expect(deriveEconomy(facts, undefined, upgraded, '2026-12-12').shards).toBeGreaterThan(view.shards);
    // Item 37: before the first reconcile writes the cutoff, a fresh install (first day = today) is already skipped,
    // and someone with earlier days still keeps the award.
    const cutoffOnlyV2 = [setting('economy.v2From', '2026-10-01')];
    expect(deriveEconomy([task('2026-12-12')], undefined, cutoffOnlyV2, '2026-12-12').shards).toBe(deriveEconomy([task('2026-12-12')], undefined, v3, '2026-12-12').shards);
    expect(deriveEconomy(facts, undefined, cutoffOnlyV2, '2026-12-12').shards).toBeGreaterThan(view.shards);
  });

  it('Codex #2: a rest day an older build sold on the upgrade day still counts; from the next day only paid ones do', () => {
    const upgrade = [setting('economy.v2From', '2026-10-01'), setting('economy.v3From', '2026-11-03')];
    const base = [...hatTrick('2026-11-03'), ...hatTrick('2026-11-04')];
    const plain = deriveEconomy(base, undefined, upgrade, '2026-11-04').streak.restDays;
    const sale = (day: string) => row(day, 'economy', 'purchase', { itemId: 'freeze', price: 50 });
    expect(deriveEconomy([...base, sale('2026-11-03')], undefined, upgrade, '2026-11-04').streak.restDays).toBe(plain + 1);
    expect(deriveEconomy([...base, sale('2026-11-04')], undefined, upgrade, '2026-11-04').streak.restDays).toBe(plain);
  });

  it('Codex #3: with no cutoff on record every day keeps the old rules', () => {
    const day = '2026-11-03';
    const walk = row(day, 'train', 'rest', { minutes: 15 });
    const oneSet = row(day, 'train', 'session', { plannedExercises: 5, touchedExercises: 1, plannedSets: 15, workingSets: 1 });
    const later = [setting('economy.v2From', '2026-10-01'), setting('economy.v3From', '2026-12-01')];
    expect(deriveEconomy([task(day), walk, oneSet], undefined, [setting('economy.v2From', '2026-10-01')], day).days.at(-1)!.train)
      .toBe(deriveEconomy([task(day), walk, oneSet], undefined, later, day).days.at(-1)!.train);
  });

  it('B6: a pick for one week wins over the standing pick', () => {
    const standing = setting('economy.restWeekday', { weekday: 0, from: '2026-11-02' });
    // Bank spent on 3-6 Nov; Saturday the 7th unmarked; a Hat-trick on Sunday the 8th.
    const facts = [...spentBank(), ...hatTrick('2026-11-08')];
    expect(deriveEconomy(facts, undefined, [...v3, standing], '2026-11-08').streak.paused).toBe(true);
    // That week moved its rest day to Saturday: the 7th is the rest day and the run holds.
    const moved = [...v3, standing, setting('economy.restWeekday:2026-11-02', 6)];
    expect(deriveEconomy(facts, undefined, moved, '2026-11-08').streak.paused).toBe(false);
  });
});

describe('clock moved back (cj2 test gaps 3.5)', () => {
  it('never shows less XP, level or Shards after the phone clock is set back', () => {
    // The clock ran ahead to 23 Oct, a task was finished there, then the clock was set back to 20 Oct.
    const facts = [task('2026-10-20'), task('2026-10-23')];
    const ahead = deriveEconomy(facts, undefined, v3, '2026-10-23');
    const back = deriveEconomy(facts, undefined, v3, '2026-10-20');
    expect(back.totalXp).toBeGreaterThanOrEqual(ahead.totalXp);
    expect(back.level).toBeGreaterThanOrEqual(ahead.level);
    expect(back.shards).toBeGreaterThanOrEqual(ahead.shards);
  });
  it('a stray fact years ahead does not make the replay walk years of days', () => {
    const facts = [task('2026-10-20'), task('2031-01-01')];
    expect(deriveEconomy(facts, undefined, v3, '2026-10-20').days.length).toBeLessThanOrEqual(122);
  });
});
