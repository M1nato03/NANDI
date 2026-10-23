// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb } from '../db';
import { createTrainRepos } from './train';
import { trainingWeek } from './train';
import { exportBackup, importBackup } from '../backup';
import { dayKey } from '../../core/time';
import { nordicCardDue, nordicState, nordicSwitchShown } from '../../core/train';
import type { ProgramRow } from '../types';

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

describe('spec 17: slow SL-RDL, the Nordic ready card and the Nordic switch', () => {
  const day = (date: number) => new Date(2026, 9, date, 12).getTime();
  const onboarding = (hinge: number) => ({ track: 'bodyweight' as const, days: [1, 3, 5], weeklyTarget: 3 as const, restDay: 0, equipment: { gymAccess: false, dumbbells: false, barbell: null, smallestPlate: null, resistanceBand: true, pullUpBar: false, sturdyAnchor: true }, heatModeEnabled: false, placement: { hinge } });
  async function hingeSession(train: ReturnType<typeof createTrainRepos>, at: number, reps: number[]) {
    const session = await train.startSession(at, { confirmVolume: true });
    const hinge = session.planned!.find(ex => ex.isBodyweightLadder === 'hinge')!;
    for (const [slot, count] of reps.entries()) await train.logSet(session.id, hinge.exerciseId, slot, { reps: count, loadKg: 0 }, at + 1000 + slot);
    await train.finishSession(session.id, at + 5000);
    return hinge;
  }
  const planHinge = async (train: ReturnType<typeof createTrainRepos>, at: number) => (await train.getPlan(at))!.exercises.find(ex => ex.isBodyweightLadder === 'hinge')!;
  const due = (program: ProgramRow, at: number) => nordicCardDue(nordicState(program.nordic, program.placement?.hinge), { rank: program.placement?.hinge ?? 1, today: dayKey(at), softDay: false, afterBedtime: false, heatMode: false });

  it('SL-RDL 3x8 turns on slow, slow 3x8 brings the card, and ready gives one 2x3 banded Nordic that leaves the rank alone', async () => {
    const db = fresh();
    const train = createTrainRepos(db, 'test');
    await train.completeOnboarding(onboarding(2), day(5));
    expect(await hingeSession(train, day(6), [8, 8, 8])).toEqual({ exerciseId: 'sl-rdl', sets: 3, repMin: 5, repMax: 8, isBodyweightLadder: 'hinge' });
    let program = (await train.getProgram())!;
    expect(program.placement?.hinge).toBe(2);
    expect(program.nordic).toEqual({ slow: true });
    expect(due(program, day(8))).toBe(false);
    expect(await hingeSession(train, day(8), [8, 8, 8])).toMatchObject({ exerciseId: 'sl-rdl', variant: 'slow' });
    program = (await train.getProgram())!;
    expect(program.placement?.hinge).toBe(2);
    expect(due(program, day(8))).toBe(true);
    const facts = await db.ledger.count();
    await train.answerNordicCard('ready', day(8) + 10_000);
    expect(await db.ledger.count()).toBe(facts);
    program = (await train.getProgram())!;
    expect(program.nordic?.ready).toBe(true);
    expect(due(program, day(8))).toBe(false);
    expect(await hingeSession(train, day(10), [3, 3])).toMatchObject({ exerciseId: 'banded-nordic', sets: 2, repMin: 3, repMax: 3, variant: 'nordic-intro' });
    program = (await train.getProgram())!;
    expect(program.placement?.hinge).toBe(3);
    expect(program.nordic?.introDone).toBe(true);
    expect(await planHinge(train, day(12))).toEqual({ exerciseId: 'banded-nordic', sets: 3, repMin: 5, repMax: 8, isBodyweightLadder: 'hinge' });

    const backup = await exportBackup(db, day(12));
    const other = fresh();
    await importBackup(other, backup);
    expect((await other.programs.get('train-program'))?.nordic).toEqual({ slow: true, slowMetDay: dayKey(day(8)), ready: true, introDone: true });
    expect(await other.programs.toArray()).toEqual(await db.programs.toArray());
  });

  it('"Not now" keeps slow SL-RDL and hides the card for 14 days', async () => {
    const db = fresh();
    const train = createTrainRepos(db, 'test');
    await train.completeOnboarding(onboarding(2), day(5));
    await hingeSession(train, day(6), [8, 8, 8]);
    await hingeSession(train, day(8), [8, 8, 8]);
    await train.answerNordicCard('not-now', day(8) + 10_000);
    expect(due((await train.getProgram())!, day(8))).toBe(false);
    expect(await planHinge(train, day(10))).toMatchObject({ exerciseId: 'sl-rdl', variant: 'slow' });
    await hingeSession(train, day(15), [8, 8, 8]);
    expect(due((await train.getProgram())!, day(15))).toBe(false);
    await hingeSession(train, day(22), [8, 8, 8]);
    expect(due((await train.getProgram())!, day(22))).toBe(true);
  });

  it('the switch off goes back to slow SL-RDL at rank 2; on again skips the card and still runs the 2x3 if it never ran', async () => {
    const db = fresh();
    const train = createTrainRepos(db, 'test');
    await train.completeOnboarding(onboarding(2), day(5));
    await hingeSession(train, day(6), [8, 8, 8]);
    await hingeSession(train, day(8), [8, 8, 8]);
    await train.answerNordicCard('ready', day(8) + 10_000);
    await train.setNordicCurls(false, day(9));
    let program = (await train.getProgram())!;
    expect(program.placement?.hinge).toBe(2);
    expect(program.nordic).toMatchObject({ ready: false, slow: true });
    expect(nordicSwitchShown(program.nordic!)).toBe(true);
    expect(await planHinge(train, day(10))).toMatchObject({ exerciseId: 'sl-rdl', variant: 'slow' });
    await hingeSession(train, day(10), [8, 8, 8]);
    expect((await train.getProgram())!.placement?.hinge).toBe(2);
    expect(due((await train.getProgram())!, day(10))).toBe(false);
    await train.setNordicCurls(true, day(11));
    program = (await train.getProgram())!;
    expect(program.placement?.hinge).toBe(3);
    expect(await planHinge(train, day(12))).toMatchObject({ exerciseId: 'banded-nordic', sets: 2, repMin: 3, variant: 'nordic-intro' });
  });

  it('someone already on a Nordic step from before the gate keeps the usual ladder and sees the switch on', async () => {
    const db = fresh();
    const train = createTrainRepos(db, 'test');
    await train.completeOnboarding(onboarding(3), day(5));
    expect(await planHinge(train, day(6))).toEqual({ exerciseId: 'banded-nordic', sets: 3, repMin: 5, repMax: 8, isBodyweightLadder: 'hinge' });
    expect(nordicSwitchShown(nordicState((await train.getProgram())!.nordic, 3))).toBe(true);
    await hingeSession(train, day(6), [8, 8, 8]);
    let program = (await train.getProgram())!;
    expect(program.placement?.hinge).toBe(4);
    expect(program.nordic).toEqual({ ready: true, introDone: true });
    await hingeSession(train, day(8), [3, 3, 3]);
    program = (await train.getProgram())!;
    expect(program.placement?.hinge).toBe(3);
    expect(await planHinge(train, day(10))).toEqual({ exerciseId: 'banded-nordic', sets: 3, repMin: 5, repMax: 8, isBodyweightLadder: 'hinge' });
  });
});
