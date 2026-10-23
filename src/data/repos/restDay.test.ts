// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { deriveEconomy } from '../../core/economy/deriveEconomy';
import { readRestPick, readRestWeekday, setRestWeekday } from './economy';
import { createTrainRepos } from './train';

let serial = 0;
const opened: NandiDb[] = [];
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const fresh = () => { const db = createDb(`rest-day-${++serial}`); opened.push(db); return db; };
const at = (day: string, time = '12:00') => new Date(`${day}T${time}:00`).getTime();
const value = async (db: NandiDb, key: string) => (await db.settings.get(key))?.value;
const equipment = { gymAccess: false, dumbbells: false, barbell: null, smallestPlate: null, resistanceBand: false, pullUpBar: false, sturdyAnchor: false };

it('a new rest-day pick counts from next week and never moves this week or a past one (batch 5, items 51 and 53)', async () => {
  const db = fresh();
  await setRestWeekday(db, 0, at('2026-10-14')); // Sunday, picked in the week of Mon 12 Oct
  expect(await value(db, 'economy.restWeekday')).toEqual({ weekday: 0, from: '2026-10-19' });
  expect(readRestWeekday(await db.settings.toArray(), '2026-10-12')).toBeUndefined();
  // On Wednesday 4 Nov: Wednesday from next week; this week and the weeks before keep Sunday in rows of their own.
  await setRestWeekday(db, 3, at('2026-11-04'));
  expect(await value(db, 'economy.restWeekday')).toEqual({ weekday: 3, from: '2026-11-09' });
  for (const week of ['2026-10-19', '2026-10-26', '2026-11-02']) expect(await value(db, `economy.restWeekday:${week}`)).toBe(0);
  const settings = await db.settings.toArray();
  expect(readRestWeekday(settings, '2026-11-02')).toBe(0);
  expect(readRestWeekday(settings, '2026-11-09')).toBe(3);
  expect(readRestPick(settings)).toEqual({ weekday: 3, from: '2026-11-09' });
});

it('after a clock set ahead, every week this phone has shown keeps its rest day (item 53)', async () => {
  const db = fresh();
  await setRestWeekday(db, 0, at('2026-10-14'));
  await db.settings.put({ key: 'economy.seenUpTo', value: '2026-11-25', updatedAt: 1, deleted: 0, deviceId: 'test' });
  await setRestWeekday(db, 3, at('2026-11-04'));
  for (const week of ['2026-11-09', '2026-11-16', '2026-11-23']) expect(await value(db, `economy.restWeekday:${week}`)).toBe(0);
  expect(await value(db, 'economy.restWeekday')).toEqual({ weekday: 3, from: '2026-11-30' });
});

it('the Train rest day is the streak rest day: onboarding and Train settings write the one pick', async () => {
  const db = fresh(), train = createTrainRepos(db, 'test');
  await train.completeOnboarding({ track: 'bodyweight', days: [1, 3, 5], weeklyTarget: 3, restDay: 0, equipment, heatModeEnabled: false, placement: {} }, at('2026-11-03'));
  expect(await value(db, 'economy.restWeekday')).toEqual({ weekday: 0, from: '2026-11-09' });
  const program = await train.updateProgram({ restDay: 6 }, at('2026-11-10'));
  expect(program.restDay).toBe(6);
  expect(await value(db, 'economy.restWeekday')).toEqual({ weekday: 6, from: '2026-11-16' });
  expect(await value(db, 'economy.restWeekday:2026-11-09')).toBe(0);
  // Sunday 15 Nov stays that week's rest day: Saturday's run carries over it to Monday without a banked day.
  const done = (day: string) => ({ id: `done:${day}`, mode: 'tasks', kind: 'done', refId: day, dayKey: day, inputs: { plannedSize: 'M', isFirstDay: true, wasPlanned: true, postpones: 0 }, updatedAt: at(day), deleted: 0 as const, deviceId: 'test' });
  for (const day of ['2026-11-13', '2026-11-14', '2026-11-16']) await db.ledger.add(done(day));
  const facts = await db.ledger.toArray(), settings = await db.settings.toArray();
  const withPick = deriveEconomy(facts, undefined, settings, '2026-11-16').streak;
  const noPick = deriveEconomy(facts, undefined, settings.filter(row => !row.key.startsWith('economy.restWeekday')), '2026-11-16').streak;
  expect(withPick.restDaysUsed).toBe(0);
  expect(noPick.restDaysUsed).toBe(1);
});

it('a started session that never finished no longer blocks the walk check (batch 5)', async () => {
  const db = fresh(), train = createTrainRepos(db, 'test');
  await train.completeOnboarding({ track: 'bodyweight', days: [1, 3, 5], weeklyTarget: 3, restDay: 0, equipment, heatModeEnabled: false, placement: {} }, at('2026-11-03', '08:00'));
  await train.startSession(at('2026-11-03', '09:00'));
  await train.restDayCheck(at('2026-11-03', '18:00'), 10);
  expect(await db.ledger.get('train-rest:2026-11-03')).toBeDefined();
});
