// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { createDb } from '../db';
import { createTrainRepos } from './train';
import { trainingWeek } from './train';
import { exportBackup, importBackup } from '../backup';

const opened: ReturnType<typeof createDb>[] = [];
function fresh() { const db = createDb(`train-${opened.length}-${Date.now()}`); opened.push(db); return db; }
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });

it('keeps Monday before 04:00 in the previous training week', () => {
  expect(trainingWeek(new Date(2026, 9, 12, 2).getTime())).toBe('2026-10-05');
  expect(trainingWeek(new Date(2026, 9, 12, 4).getTime())).toBe('2026-10-12');
});

it('persists onboarding, a safety session and its facts across backup', async () => {
  const db = fresh();
  const train = createTrainRepos(db, 'test');
  await train.completeOnboarding({ track: 'bodyweight', days: [1, 3, 5], weeklyTarget: 3, restDay: 0, equipment: { gymAccess: false, dumbbells: false, barbell: null, smallestPlate: null, resistanceBand: false, pullUpBar: false, sturdyAnchor: false }, heatModeEnabled: false, placement: { squat: 2 } }, 1000);
  const session = await train.startSession(2000);
  const exerciseId = session.planned![0]!.exerciseId;
  await train.logSet(session.id, exerciseId, 0, { reps: 5, loadKg: 0 }, 3000);
  await train.flagPain(session.id, exerciseId, 4000);
  await expect(train.logSet(session.id, exerciseId, 1, { reps: 5, loadKg: 0 }, 5000)).rejects.toThrow();
  const ended = await train.finishSession(session.id, 6000);
  expect(ended.status).toBe('safety');
  expect(ended.xp).toBe(40);
  expect((await db.ledger.toArray()).filter(row => row.mode === 'train')).toHaveLength(1);
  const backup = await exportBackup(db, 7000);
  const other = fresh();
  await importBackup(other, backup);
  expect(await other.programs.toArray()).toEqual(await db.programs.toArray());
  expect(await other.exercises.toArray()).toEqual(await db.exercises.toArray());
  expect(await other.ladders.toArray()).toEqual(await db.ladders.toArray());
  expect(await other.exState.toArray()).toEqual(await db.exState.toArray());
  expect(await other.sessions.toArray()).toEqual(await db.sessions.toArray());
  expect(await other.sets.toArray()).toEqual(await db.sets.toArray());
  expect(await other.prs.toArray()).toEqual(await db.prs.toArray());
  expect(await other.ledger.toArray()).toEqual(await db.ledger.toArray());
});

it('keeps warm-ups and pain-flagged sets out of PRs and confirms a load jump', async () => {
  const db = fresh();
  const train = createTrainRepos(db, 'test');
  await train.completeOnboarding({ track: 'gym', days: [1, 3, 5], weeklyTarget: 3, restDay: 0, equipment: { gymAccess: true, dumbbells: true, barbell: null, smallestPlate: null, resistanceBand: false, pullUpBar: false, sturdyAnchor: false }, heatModeEnabled: false, placement: {} }, 1000);
  const session = await train.startSession(2000);
  const exerciseId = session.planned![0]!.exerciseId;
  await db.prs.add({ id: 'prior', exerciseId, kind: 'load', value: 20, at: 1, updatedAt: 1, deleted: 0, deviceId: 'test' });
  await train.logSet(session.id, exerciseId, -2, { type: 'warmup', reps: 8, loadKg: 10 }, 3000);
  await expect(train.logSet(session.id, exerciseId, 0, { reps: 8, loadKg: 31 }, 4000)).rejects.toThrow('Confirm');
  await train.logSet(session.id, exerciseId, 0, { reps: 8, loadKg: 31, confirmedJump: true }, 5000);
  await train.flagPain(session.id, exerciseId, 6000);
  await train.finishSession(session.id, 7000);
  expect(await db.prs.where('exerciseId').equals(exerciseId).count()).toBe(1);
  expect((await db.sets.toArray()).filter(set => set.type === 'warmup')).toHaveLength(1);
});

it('saves recorded gym starting loads for the first session, skipping blanks', async () => {
  const db = fresh();
  const train = createTrainRepos(db, 'test');
  await train.completeOnboarding({ track: 'gym', days: [1, 3, 5], weeklyTarget: 3, restDay: 0, equipment: { gymAccess: true, dumbbells: true, barbell: null, smallestPlate: null, resistanceBand: false, pullUpBar: false, sturdyAnchor: false }, heatModeEnabled: false, placement: {}, startingLoads: { 'goblet-squat': 12.5, 'seated-cable-row': 25, 'db-rdl': 0 } }, 1000);
  expect((await db.exState.get('goblet-squat'))?.loadKg).toBe(12.5);
  expect((await db.exState.get('seated-cable-row'))?.loadKg).toBe(25);
  expect(await db.exState.get('db-rdl')).toBeUndefined();
  expect((await db.programs.toArray())[0]).not.toHaveProperty('startingLoads');
});
