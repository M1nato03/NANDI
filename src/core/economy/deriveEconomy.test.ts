import { describe, expect, it } from 'vitest';
import { RULES, type Rules } from '../rules.config';
import type { LedgerRow, SettingRow } from '../../data/types';
import { deriveEconomy, seasonFor, seasonIndex } from './deriveEconomy';
import { boardSeats, seatThreshold } from './ladder';
import { seasonRank } from './seasonRank';
import { purchaseDecision, PUZZLE_PACKS } from './shop';
import PZ from '../puzzles';

let serial = 0;
const row = (dayKey: string, mode: string, kind: string, inputs: Record<string, unknown> = {}): LedgerRow => ({
  id: `${kind}:${++serial}`, dayKey, mode, kind, refId: String(serial), inputs, updatedAt: serial, deleted: 0, deviceId: 'test',
});
const task = (day: string, size: 'S' | 'M' | 'L', first = false) => row(day, 'tasks', 'done', { plannedSize: size, isFirstDay: first, wasPlanned: true, postpones: first ? 0 : 1 });
const full = (day: string) => row(day, 'train', 'session', { plannedExercises: 2, touchedExercises: 2, plannedSets: 6, workingSets: 6 });
const caseFact = (day: string) => row(day, 'mind', 'mystery', { result: 'solved', afterBedtime: false });
// The current rules: both cutoffs on record before the test days (a missing cutoff means the old rules).
const cutoffs: SettingRow[] = ['economy.v2From', 'economy.v3From'].map(key => ({ key, value: '2026-10-01', updatedAt: 1, deleted: 0, deviceId: 'test' }));
const view = (facts: LedgerRow[], today = '2026-11-03') => deriveEconomy(facts, undefined, cutoffs, today);

describe('economy replay', () => {
  it('uses the first Monday dates and exposes the Arc index', () => {
    expect(seasonFor('2026-11-02')).toMatchObject({ index: 0, start: '2026-11-02', end: '2026-12-06', days: 35 });
    expect(seasonIndex('2026-12-07')).toBe(1);
    expect(view([task('2026-10-19', 'M', true)], '2026-10-19').season).toMatchObject({ active: false, sp: 0 });
  });
  it('scores the worked 245 XP day and its Hat-trick', () => {
    const day = '2026-11-03';
    const facts = [task(day, 'M', true), task(day, 'S', true), task(day, 'L'), full(day), caseFact(day),
      row(day, 'mind', 'board', { daily: true }), row(day, 'mind', 'lesson'),
      ...Array.from({ length: 10 }, () => row(day, 'mind', 'card')),
      row(day, 'bonuses', 'lightsout', { metTarget: true })];
    expect(view(facts).days.at(-1)).toMatchObject({ tasks: 80, train: 60, mind: 60, hatTrick: true, lightsOut: 15, total: 245 });
  });
  it('caps adversarial tasks, Mind, lessons and sessions; a maximum day is 425', () => {
    const day = '2026-11-03';
    expect(view(Array.from({ length: 50 }, () => task(day, 'S'))).days[0]!.tasks).toBeLessThanOrEqual(200);
    const mind = [caseFact(day), row(day, 'mind', 'board', { daily: true }), ...Array.from({ length: 30 }, () => row(day, 'mind', 'board', { daily: false })),
      ...Array.from({ length: 2 }, () => row(day, 'mind', 'lesson')), ...Array.from({ length: 30 }, () => row(day, 'mind', 'card')),
      row(day, 'mind', 'learn-drop')];
    expect(view(mind).days[0]!.mind).toBe(80);
    expect(view([row(day, 'mind', 'lesson'), row(day, 'mind', 'lesson')]).days[0]!.mind).toBe(15);
    const sessions = [row(day, 'train', 'session', { xp: 40 }), row(day, 'train', 'session', { xp: 60 })];
    expect(view(sessions).days[0]!.train).toBe(60);
    const maximum = [...Array.from({ length: 20 }, () => task(day, 'L')), ...mind,
      row(day, 'train', 'session', { xp: 100 }), row(day, 'bonuses', 'lightsout', { metTarget: true })];
    expect(view(maximum).days[0]!.total).toBe(425);
  });
  it('deduplicates facts and keeps earlier scores under forward-only rules', () => {
    const old = task('2026-10-11', 'L');
    const after = task('2026-10-12', 'L');
    const newer: Rules = { ...RULES, tasks: { ...RULES.tasks, dailyCap: 100, xpBySize: { ...RULES.tasks.xpBySize, L: 10 } } };
    const history = [{ effectiveFrom: '2026-10-05', rules: RULES }, { effectiveFrom: '2026-10-12', rules: newer }];
    const result = deriveEconomy([old, old, after], history, [], '2026-10-12');
    expect(result.days.map(day => day.tasks)).toEqual([35, 10]);
    expect(result).toEqual(deriveEconomy([after, old, old], history, [], '2026-10-12'));
  });
  it('gives Mind zero after bedtime while tasks still count', () => {
    const day = '2026-11-03';
    const result = view([task(day, 'M'), full(day), row(day, 'mind', 'mystery', { afterBedtime: true })]);
    expect(result.days[0]).toMatchObject({ tasks: 20, mind: 0, hatTrick: false, mark: true });
  });
  it('credits the completed five-item Learn drop once, before bedtime', () => {
    const day = '2026-11-03';
    const answers = Array.from({ length: 5 }, () => row(day, 'mind', 'learn-answer', { dropId: `drop:daily:${day}`, afterBedtime: false }));
    expect(view(answers).days[0]).toMatchObject({ mind: 15, mindSlot: true });
    answers[4]!.inputs.afterBedtime = true;
    expect(view(answers).days[0]).toMatchObject({ mind: 0, mindSlot: false });
  });
  it('credits a finished teach-first drop with only two scored answers', () => {
    const day = '2026-11-03';
    const answers = Array.from({ length: 2 }, () => row(day, 'mind', 'learn-answer', { dropId: `drop:daily:${day}`, afterBedtime: false }));
    expect(view(answers).days[0]).toMatchObject({ mind: 0, mindSlot: false });
    const finished = { ...row(day, 'gamify', 'learn-drop'), refId: day };
    expect(view([...answers, finished]).days[0]).toMatchObject({ mind: 15, mindSlot: true });
    for (const answer of answers) answer.inputs.afterBedtime = true;
    expect(view([...answers, finished]).days[0]).toMatchObject({ mind: 0, mindSlot: false });
    // A brand-new learner's drop can be the lesson alone.
    const lesson = (afterBedtime: boolean) => row(day, 'learn', 'learn-lesson', { dropId: `drop:daily:${day}`, afterBedtime });
    expect(view([lesson(false), finished]).days[0]).toMatchObject({ mind: 15, mindSlot: true });
    expect(view([lesson(false)]).days[0]).toMatchObject({ mindSlot: false });
    // A lesson finished after bedtime earns nothing (second opinion 3).
    expect(view([lesson(true), finished]).days[0]).toMatchObject({ mind: 0, mindSlot: false });
  });
  it('never lowers past XP when an earlier fact arrives later (forward-only)', () => {
    const day = '2026-11-03';
    // Seven S tasks, then an L task: an S imported with an earlier time must not push the L to half rate.
    const base = [...Array.from({ length: 7 }, () => task(day, 'S')), task(day, 'L')];
    const before = view(base).days[0]!.total;
    const imported = { ...task(day, 'S'), updatedAt: -1 };
    expect(view([imported, ...base]).days[0]!.total).toBeGreaterThanOrEqual(before);
    // A recorded welcome-back gift stays when the missed day before it later gains a fact.
    const gift = (mon: string) => [task('2026-11-02', 'M'), task(mon, 'M'), { ...row(mon, 'gamify', 'welcome-back'), refId: mon }];
    const shown = view(gift('2026-11-04'), '2026-11-04').totalXp;
    expect(view([...gift('2026-11-04'), task('2026-11-03', 'S')], '2026-11-04').totalXp).toBeGreaterThanOrEqual(shown);
  });
  it('keeps the old streak and Focus maths on days before this build first ran', () => {
    const mon = '2026-11-02';
    const facts = [task(mon, 'M'), task('2026-11-08', 'M'), full('2026-11-08'), caseFact('2026-11-08'), task('2026-11-09', 'M'), full('2026-11-09'), caseFact('2026-11-09')];
    const after = deriveEconomy(facts, undefined, [{ key: 'economy.v2From', value: '2026-11-01', updatedAt: 1, deleted: 0, deviceId: 'test' }], '2026-11-09');
    const before = deriveEconomy(facts, undefined, [{ key: 'economy.v2From', value: '2026-11-20', updatedAt: 1, deleted: 0, deviceId: 'test' }], '2026-11-09');
    expect(after.streak.days).toBe(3);
    expect(before.streak.days).toBe(4);
  });
  it('holds a streak on a banked rest day and leaves the weekly rest weekday untouched', () => {
    const mon = '2026-11-02';
    const keeping = deriveEconomy([task(mon, 'M'), row('2026-11-04', 'mind', 'board', { daily: false })], undefined, [...cutoffs, { key: 'economy.restWeekday', value: 3, updatedAt: 1, deleted: 0, deviceId: 'test' }], '2026-11-04');
    expect(keeping.streak).toMatchObject({ restDays: 3, restDaysUsed: 1, restUsedYesterday: true, days: 2, paused: false });
    expect(keeping.days[2]!.mark).toBe(false);
    const paused = view([task(mon, 'M')], '2026-11-08');
    expect(paused.streak.paused).toBe(true);
    const repaired = view([task(mon, 'M'), task('2026-11-08', 'M'), full('2026-11-08'), caseFact('2026-11-08'),
      task('2026-11-09', 'M'), full('2026-11-09'), caseFact('2026-11-09')], '2026-11-09');
    expect(repaired.streak.restored).toBe(true);
    expect(repaired.streak.paused).toBe(false);
    // The missed day is held, not counted: 1 marked day + 2 repair days (audit 16.11).
    expect(repaired.streak.days).toBe(3);
  });
  it('offers repair only while two Hat-trick days can still fit in the window', () => {
    const mon = '2026-11-02'; // 4 rest days cover 3-6 Nov, so 7 Nov pauses the streak.
    expect(view([task(mon, 'M')], '2026-11-08').streak).toMatchObject({ paused: true, canRepair: true });
    expect(view([task(mon, 'M')], '2026-11-09').streak).toMatchObject({ paused: true, canRepair: false });
    const halfway = [task(mon, 'M'), task('2026-11-08', 'M'), full('2026-11-08'), caseFact('2026-11-08')];
    expect(view(halfway, '2026-11-09').streak).toMatchObject({ paused: true, canRepair: true });
  });
  it('needs a fresh run for Gold after a break', () => {
    const hat = (day: string) => [task(day, 'M'), full(day), caseFact(day)];
    // 2 Nov marked, 3-6 Nov empty the rest bank, 7-12 Nov marked (6 days), 13 Nov breaks,
    // 14-15 Nov repair, 16 Nov marked: 7 marked days in all but only 3 since the break.
    const marked = ['2026-11-02', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12'];
    const facts = [...marked.map(day => task(day, 'M')), ...['2026-11-14', '2026-11-15'].flatMap(hat), task('2026-11-16', 'M')];
    const result = view(facts, '2026-11-16').streak;
    expect(result).toMatchObject({ restored: true, gold: false });
    expect(view([...marked.map(day => task(day, 'M'))], '2026-11-08').streak.gold).toBe(false);
  });
  it('pays a perfect drop only when its answers came before bedtime', () => {
    const day = '2026-11-03';
    const answers = Array.from({ length: 5 }, () => row(day, 'mind', 'learn-answer', { dropId: `drop:daily:${day}`, afterBedtime: true, correct: true }));
    expect(view([...answers, row(day, 'gamify', 'perfect-drop')]).days[0]!.mind).toBe(0);
  });
  it('boosts only what the boosted minutes earned after caps', () => {
    const day = '2026-11-03';
    const boost = row(day, 'gamify', 'focus-boost');
    const [one, two] = [full(day), full(day)];
    const result = view([boost, one, two]).days[0]!;
    // Train pays the best session once, so Focus adds one session's worth, not two.
    expect(result.focus).toBe(result.train * (RULES.gamify.focusMultiplier - 1));
  });
  it('starts a fresh streak once the earn-back window has passed', () => {
    const facts = [task('2026-11-02', 'M'), task('2026-11-11', 'M'), task('2026-11-12', 'M'), task('2026-11-13', 'M')];
    expect(view(facts, '2026-11-13').streak).toMatchObject({ paused: false, restored: false, days: 3 });
  });
  it('grants four rest days in the first month and carries up to twelve across months', () => {
    expect(view([], '2026-10-20').streak.restDays).toBe(4);
    expect(deriveEconomy([], undefined, [{ key: 'economyVisibleFrom', value: '2026-10-31', updatedAt: 1, deleted: 0, deviceId: 'test' }], '2026-11-01').streak)
      .toMatchObject({ restDays: 7, restDaysUsed: 1 });
    const facts = Array.from({ length: 95 }, (_, i) => task(new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10), 'S'));
    expect(view(facts, '2026-11-01').streak.restDays).toBe(8);
    expect(view(facts, '2026-12-01').streak.restDays).toBe(12);
    expect(view(facts, '2027-01-03').streak.restDays).toBe(12);
  });
  it('uses one day without growing the streak, then leaves today untouched', () => {
    const facts = [task('2026-10-20', 'M')];
    expect(view(facts, '2026-10-21').streak).toMatchObject({ days: 1, restDays: 4, restDaysUsed: 0 });
    expect(view(facts, '2026-10-22').streak).toMatchObject({ days: 1, restDays: 3, restDaysUsed: 1, restUsedYesterday: true });
  });
  it('adds a purchased rest day using the legacy freeze item id', () => {
    const facts = [task('2026-10-20', 'L'), row('2026-10-20', 'economy', 'purchase', { itemId: 'freeze', price: 50, accepted: true })];
    expect(view(facts, '2026-10-20').streak.restDays).toBe(5);
  });
  it('makes a Clean Week with three workouts and one rest check', () => {
    const facts: LedgerRow[] = [];
    for (const day of ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05']) {
      facts.push(task(day, 'M'), caseFact(day));
      facts.push(day === '2026-11-05' ? row(day, 'train', 'rest', { minutes: 10 }) : full(day));
    }
    expect(view(facts, '2026-11-08').cleanWeek).toMatchObject({ count: 4, complete: true, streak: 1 });
  });
  it('keeps Shards nonnegative and refuses short or unknown purchases', () => {
    const day = '2026-11-03';
    const facts = [task(day, 'S'), row(day, 'economy', 'purchase', { itemId: 'theme:linen', price: 400 })];
    expect(view(facts).shards).toBeGreaterThanOrEqual(0);
    expect(purchaseDecision('theme:linen', facts, [], day).ok).toBe(false);
    expect(purchaseDecision('random', facts, [], day).ok).toBe(false);
  });
  it('adds the tier award after Season 1 and carries a capped seed', () => {
    const facts = [task('2026-11-02', 'L')];
    const before = view(facts, '2026-12-06');
    const after = view(facts, '2026-12-07');
    expect(after.shards - before.shards).toBe(RULES.shards.seasonEnd.Bench);
    expect(after.season.seed).toBeLessThanOrEqual(after.season.target * RULES.season.seedPct / 100);
    expect(after.season.seed).toBeGreaterThan(0);
  });
  it('uses inverse seat thresholds that agree with every rank', () => {
    const target = 7000;
    for (const seat of boardSeats(452)) expect(seasonRank(seatThreshold(seat, target), 28)).toBeLessThanOrEqual(seat);
  });
  it('bundles playable fixed puzzle boards', () => {
    for (const pack of PUZZLE_PACKS) for (const spec of pack.boards) {
      const board = PZ.generate(spec.type, { seed: spec.seed, diff: spec.diff });
      expect(board).toBeTruthy();
      expect(board?.solution.length).toBeGreaterThan(0);
    }
  });
});
