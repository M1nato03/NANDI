// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { deriveEconomy } from '../../core/economy/deriveEconomy';
import { readRestWeekday, setRestWeekday } from './economy';
import { createTrainRepos } from './train';

let serial = 0;
const opened: NandiDb[] = [];
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const fresh = () => { const db = createDb(`rest-day-${++serial}`); opened.push(db); return db; };
const at = (day: string, time = '12:00') => new Date(`${day}T${time}:00`).getTime();
const value = async (db: NandiDb, key: string) => (await db.settings.get(key))?.value;
const equipment = { gymAccess: false, dumbbells: false, barbell: null, smallestPlate: null, resistanceBand: false, pullUpBar: false, sturdyAnchor: false };

it('a new rest-day pick never moves a past week: each week the old pick covered keeps it (batch 5, item 51)', async () => {
  const db = fresh();
  await setRestWeekday(db, 0, at('2026-10-14')); // Sunday, from the week of Mon 12 Oct
  await setRestWeekday(db, 3, at('2026-11-04')); // Wednesday, from the week of Mon 2 Nov
  expect(await value(db, 'economy.restWeekday')).toEqual({ weekday: 3, from: '2026-11-02' });
  for (const week of ['2026-10-12', '2026-10-19', '2026-10-26']) expect(await value(db, `economy.restWeekday:${week}`)).toBe(0);
  expect(await value(db, 'economy.restWeekday:2026-11-02')).toBe(3);
  const settings = await db.settings.toArray();
  expect(readRestWeekday(settings, '2026-10-19')).toBe(0);
  expect(readRestWeekday(settings, '2026-11-09')).toBe(3);
  // Picking the same day again keeps the weeks in between covered too.
  await setRestWeekday(db, 3, at('2026-11-25'));
  for (const week of ['2026-11-09', '2026-11-16']) expect(await value(db, `economy.restWeekday:${week}`)).toBe(3);
});

it('the Train rest day is the streak rest day: onboarding and Train settings write the one pick', async () => {
  const db = fresh(), train = createTrainRepos(db, 'test');
  await train.completeOnboarding({ track: 'bodyweight', days: [1, 3, 5], weeklyTarget: 3, restDay: 0, equipment, heatModeEnabled: false, placement: {} }, at('2026-11-03'));
  expect(await value(db, 'economy.restWeekday')).toEqual({ weekday: 0, from: '2026-11-02' });
  const program = await train.updateProgram({ restDay: 6 }, at('2026-11-10'));
  expect(program.restDay).toBe(6);
  expect(await value(db, 'economy.restWeekday')).toEqual({ weekday: 6, from: '2026-11-09' });
  expect(await value(db, 'economy.restWeekday:2026-11-02')).toBe(0);
  // The streak sees the Sunday of the first week as a rest day: Saturday's work carries over it to Monday.
  const done = (day: string) => ({ id: `done:${day}`, mode: 'tasks', kind: 'done', refId: day, dayKey: day, inputs: { plannedSize: 'M', isFirstDay: true, wasPlanned: true, postpones: 0 }, updatedAt: at(day), deleted: 0 as const, deviceId: 'test' });
  for (const day of ['2026-11-06', '2026-11-07', '2026-11-09']) await db.ledger.add(done(day));
  // With the weekly pick, Sunday is the planned rest day; without it, that Sunday spends one banked rest day.
  const facts = await db.ledger.toArray(), settings = await db.settings.toArray();
  const withPick = deriveEconomy(facts, undefined, settings, '2026-11-09').streak;
  const noPick = deriveEconomy(facts, undefined, settings.filter(row => !row.key.startsWith('economy.restWeekday')), '2026-11-09').streak;
  expect(withPick).toMatchObject({ days: 4, restDaysUsed: 0 });
  expect(noPick).toMatchObject({ days: 3, restDaysUsed: 1 });
});

it('a started session that never finished no longer blocks the walk check (batch 5)', async () => {
  const db = fresh(), train = createTrainRepos(db, 'test');
  await train.completeOnboarding({ track: 'bodyweight', days: [1, 3, 5], weeklyTarget: 3, restDay: 0, equipment, heatModeEnabled: false, placement: {} }, at('2026-11-03', '08:00'));
  await train.startSession(at('2026-11-03', '09:00'));
  await train.restDayCheck(at('2026-11-03', '18:00'), 10);
  expect(await db.ledger.get('train-rest:2026-11-03')).toBeDefined();
});
