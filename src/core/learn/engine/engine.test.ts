// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { createDb } from '../../../data/db';
import { exportBackup, importBackup, validateBackup } from '../../../data/backup';
import { validatePack } from '../../../data/packs/validate';
import { saveDrop, saveEngineAnswer, loadDrop, loadEngineFacts } from '../../../data/repos/learn-engine';
import { fixtureTopic } from './fixtures/topic';
import { answerConcept, calibration, composeDrop, currentDropStep, DAY_MS, fsrsInterval, gradeItem, masteryMapState, predictedSuccess, retentionSummary, selectNextItem, updateMastery, updateMemory, type AnswerFact, type ConceptState, type ItemState } from '.';

const now = Date.UTC(2026, 9, 11, 12);
const concepts = fixtureTopic.body.modules[0]!.concepts;
const items = concepts.flatMap(concept => concept.items);
const catalog = { concepts };
const state = (id: string, mastery: number, dueAt = now - 1): ConceptState => ({ conceptId: id, mastery, attempts: 3, activeMisconceptions: [], memory: { stability: 5, difficulty: 5, interval: 5, lastReview: now - 5 * DAY_MS, dueAt } });
function fresh() { return createDb(`engine-${Math.random()}`); }

it('09 §9 test 1: correct raises, wrong lowers, and repeated recall converges', () => {
  const p = 0.2;
  expect(updateMastery(p, 'choose', true)).toBeGreaterThan(p);
  expect(updateMastery(p, 'choose', false)).toBeLessThan(p);
  let value = p;
  for (let i = 0; i < 8; i++) value = updateMastery(value, 'choose', true);
  expect(value).toBeGreaterThanOrEqual(0.95);
  expect(masteryMapState(answerConcept(undefined, items[0]!, true, 'guess', now))).toBe('Learning');
});
it('09 §9 test 2: locked prerequisites block new concepts', () => {
  const pick = selectNextItem({ catalog, concepts: { seed: state('seed', 0.79) }, items: {}, now, seed: 1, recentTypes: [], mode: 'new' });
  expect(pick).toBeNull();
  expect(selectNextItem({ catalog, concepts: { seed: state('seed', 0.8) }, items: {}, now, seed: 1, recentTypes: [], mode: 'new' })?.concept.id).toBe('sprout');
});
it('09 §9 test 3: target band wins when an item is in range', () => {
  const ratings: Record<string, ItemState> = { i1: { itemId: 'i1', rating: 500, attempts: 0 }, i2: { itemId: 'i2', rating: 650, attempts: 0 }, i3: { itemId: 'i3', rating: 800, attempts: 0 } };
  const current = { seed: state('seed', 0.8) };
  const pick = selectNextItem({ catalog, concepts: current, items: ratings, now, seed: 1, recentTypes: [], mode: 'review' });
  const inBand = items.some(item => item.conceptId === 'seed' && predictedSuccess(0.8, ratings[item.id]!.rating, current.seed.memory, now) >= 0.75 && predictedSuccess(0.8, ratings[item.id]!.rating, current.seed.memory, now) <= 0.85);
  expect(inBand).toBe(true);
  expect(pick!.predictedSuccess).toBeGreaterThanOrEqual(0.75);
  expect(pick!.predictedSuccess).toBeLessThanOrEqual(0.85);
});
it('09 §9 test 4: type streak and two-day repeat are excluded', () => {
  const pick = selectNextItem({ catalog, concepts: { seed: state('seed', 0.8) }, items: { i1: { itemId: 'i1', rating: 500, attempts: 1, lastSeen: now - DAY_MS } }, now, seed: 1, recentTypes: ['choose', 'choose'], mode: 'review' });
  expect(pick?.item.id).not.toBe('i1');
  expect(pick?.item.type).not.toBe('choose');
});
it('09 §9 test 5: a confident miss comes due sooner', () => {
  const prior = updateMemory(undefined, true, 'guess', now - 3 * DAY_MS);
  expect(updateMemory(prior, false, 'certain', now).dueAt).toBeLessThan(updateMemory(prior, false, 'guess', now).dueAt);
});
it('09 §9 test 6: a drop respects budget and ends at a stopping screen', () => {
  const drop = composeDrop({ catalog, concepts: { seed: state('seed', 0.8), sprout: state('sprout', 0.5) }, items: {}, now, seed: 3, spentMinutes: 24, answeredToday: 0, newToday: 0 });
  expect(drop.items.length).toBeLessThanOrEqual(1);
  expect(currentDropStep({ ...drop, cursor: drop.items.length })).toEqual({ kind: 'stopping-screen' });
  const capped = composeDrop({ catalog, concepts: { seed: state('seed', 0.8) }, items: {}, now, seed: 3, spentMinutes: 0, answeredToday: 0, newToday: 5 });
  expect(capped.items.every(item => item.mode === 'review')).toBe(true);
});
it('09 §9 test 7: night mode composes reviews only', () => {
  const drop = composeDrop({ catalog, concepts: { seed: state('seed', 0.8) }, items: {}, now, seed: 2, spentMinutes: 0, answeredToday: 0, newToday: 0, afterBedtime: true });
  expect(drop.items.every(item => item.mode === 'review')).toBe(true);
});
it('09 §9 test 8: FSRS intervals grow on recall and shrink on lapse', () => {
  const first = updateMemory(undefined, true, 'guess', now);
  const success = updateMemory(first, true, 'guess', now + 3 * DAY_MS);
  const lapse = updateMemory(success, false, 'guess', now + 8 * DAY_MS);
  expect(success.interval).toBeGreaterThan(first.interval);
  expect(lapse.interval).toBeLessThan(success.interval);
});
it('09 §9 test 9: unsourced claims, two correct options and bad verdicts fail', () => {
  expect(validatePack(fixtureTopic)).toEqual([]);
  const pack = structuredClone(fixtureTopic);
  pack.body.modules[0]!.concepts[0]!.claims[0]!.sourceRefs = ['missing'];
  pack.body.modules[0]!.concepts[0]!.items[0]!.options[1]!.correct = true;
  pack.body.modules[0]!.concepts[0]!.factCheck!.verdicts[0]!.verdict = 'unsupported';
  expect(validatePack(pack).join(' ')).toMatch(/unlisted source/);
  expect(validatePack(pack).join(' ')).toMatch(/exactly one correct/);
  expect(validatePack(pack).join(' ')).toMatch(/fact-check unsupported/);
  expect(validatePack({ ...pack, body: { ...pack.body, modules: [{ ...pack.body.modules[0]!, concepts: [{ ...pack.body.modules[0]!.concepts[0]!, factCheck: undefined }] }] } }, { allowUnchecked: true }).join(' ')).not.toMatch(/fact-check/);
});
it('09 §9 test 10: a saved mid-drop resumes at the same item and option order', async () => {
  const db = fresh();
  const drop = composeDrop({ catalog, concepts: {}, items: {}, now, seed: 7, spentMinutes: 0, answeredToday: 0, newToday: 0 });
  await saveDrop(db, drop, 'test', now);
  const current = currentDropStep(drop);
  expect(currentDropStep((await loadDrop(db, drop.id))!)).toEqual(current);
  expect(current).toHaveProperty('itemId');
  const picked = items.find(item => item.id === (current as { itemId: string }).itemId)!;
  await saveEngineAnswer(db, { answerId: 'a1', dropId: drop.id, item: picked, answer: 'a', confidence: 'guess', deviceId: 'test', now });
  await saveEngineAnswer(db, { answerId: 'a1', dropId: drop.id, item: picked, answer: 'a', confidence: 'guess', deviceId: 'test', now });
  expect(await db.ledger.count()).toBe(1);
  const resumed = await loadDrop(db, drop.id);
  expect(currentDropStep(resumed!)).toEqual(drop.items[1] ?? drop.ending);
  expect(resumed?.pendingFeedback).toEqual({ cursor: 0, answer: 'a', correct: gradeItem(picked, 'a').correct });
  const backup = await exportBackup(db, now);
  expect(validateBackup(backup).success).toBe(true);
  await db.learnDrops.clear();
  await importBackup(db, backup);
  expect(currentDropStep((await loadDrop(db, drop.id))!)).toEqual(drop.items[1] ?? drop.ending);
  expect((await loadDrop(db, drop.id))?.pendingFeedback?.cursor).toBe(0);
  await db.delete();
});
it('09 section 9 test 11: a drop interleaves started concepts and stays with one new concept', () => {
  const third = { ...concepts[1]!, id: 'leaf', prerequisites: [], items: concepts[1]!.items.map(item => ({ ...item, id: `leaf-${item.id}`, conceptId: 'leaf' })) };
  const openCatalog = { concepts: [{ ...concepts[0]!, prerequisites: [] }, { ...concepts[1]!, prerequisites: [] }, third] };
  const started = { seed: state('seed', 0.8) };
  const drop = composeDrop({ catalog: openCatalog, concepts: started, items: {}, now, seed: 4, spentMinutes: 0, answeredToday: 0, newToday: 0 });
  const newConcepts = new Set(drop.items.filter(item => item.mode === 'new').map(item => item.conceptId));
  expect(newConcepts.size).toBe(1);
  expect(drop.items.some(item => item.mode === 'review' && item.conceptId === 'seed')).toBe(true);
  expect(drop.items.filter(item => item.mode === 'review').every(item => item.conceptId === 'seed')).toBe(true);
  expect(selectNextItem({ catalog: openCatalog, concepts: { seed: { ...started.seed, attempts: 0 } }, items: {}, now, seed: 1, recentTypes: [], mode: 'review' })?.concept.id).toBe('seed');
});
it('09 section 9 test 12: 7 and 30 day checks ignore FSRS dates, cap at two, and record facts', async () => {
  const learnedAt = Date.UTC(2026, 0, 1, 12);
  const due7 = learnedAt + 7 * DAY_MS;
  const due30 = learnedAt + 30 * DAY_MS;
  const learned = { ...state('seed', 0.8, due30 + DAY_MS), firstLearnedAt: learnedAt };
  const context = { catalog, concepts: { seed: learned }, items: {}, seed: 2, spentMinutes: 0, answeredToday: 0, newToday: 5 };
  expect(composeDrop({ ...context, now: due7 - 1 }).items.some(item => item.mode === 'retention')).toBe(false);
  const day7 = composeDrop({ ...context, now: due7 });
  expect(day7.items.filter(item => item.mode === 'retention').map(item => item.retentionDay)).toEqual([7]);
  const db = fresh();
  await saveDrop(db, day7, 'test', due7);
  const check = day7.items[0]!;
  const checkItem = items.find(item => item.id === check.itemId)!;
  const correctAnswer = checkItem.type === 'estimate' ? 5 : checkItem.type === 'order' ? ['a', 'b'] : 'a';
  await saveEngineAnswer(db, { answerId: 'ret7', dropId: day7.id, item: checkItem, answer: correctAnswer, confidence: 'certain', deviceId: 'test', now: due7 });
  const facts = await loadEngineFacts(db);
  expect((await db.learnConcepts.get('seed'))?.retentionChecks?.[7]?.correct).toBe(true);
  expect((await db.ledger.get('learn-answer:ret7'))?.kind).toBe('learn-retention');
  expect(retentionSummary(facts, due7 - 1)).toEqual({ checked7: 0, recalled7: 0, checked30: 0, recalled30: 0 });
  expect(retentionSummary(facts, due7)).toEqual({ checked7: 1, recalled7: 1, checked30: 0, recalled30: 0 });
  const day30 = composeDrop({ ...context, now: due30, facts: facts.facts });
  expect(day30.items.filter(item => item.mode === 'retention').map(item => item.retentionDay)).toEqual([30]);
  expect(composeDrop({ ...context, now: due30 }).items.filter(item => item.mode === 'retention')).toHaveLength(2);
  const savedChecks = (await db.learnConcepts.get('seed'))?.retentionChecks;
  expect(composeDrop({ ...context, concepts: { seed: { ...learned, retentionChecks: savedChecks } }, now: due30 })
    .items.filter(item => item.mode === 'retention').map(item => item.retentionDay)).toEqual([30]);
  await saveDrop(db, day30, 'test', due30);
  await saveEngineAnswer(db, { answerId: 'ret30', dropId: day30.id, item: items.find(item => item.id === day30.items[0]!.itemId)!, answer: 'wrong', confidence: 'guess', deviceId: 'test', now: due30 });
  expect(retentionSummary(await loadEngineFacts(db), due30)).toEqual({ checked7: 1, recalled7: 1, checked30: 1, recalled30: 0 });
  await db.delete();
});
it('09 section 9 test 13: calibration separates certain and unsure answers', () => {
  const facts: AnswerFact[] = [
    { conceptId: 'seed', answeredAt: now, correct: false, confidence: 'certain', kind: 'practice' },
    { conceptId: 'seed', answeredAt: now + 1, correct: true, confidence: 'certain', kind: 'retention', retentionDay: 7 },
    { conceptId: 'seed', answeredAt: now + 2, correct: true, confidence: 'guess', kind: 'practice' },
    { conceptId: 'seed', answeredAt: now + 3, correct: false, confidence: 'fairly-sure', kind: 'practice' },
  ];
  expect(calibration({ facts })).toEqual({ confidentAnswers: 2, confidentCorrectRate: 0.5, unsureCorrectRate: 1 });
  expect(calibration({ facts: [] })).toEqual({ confidentAnswers: 0, confidentCorrectRate: 0, unsureCorrectRate: 0 });
  expect(retentionSummary({ facts }, now + 3)).toEqual({ checked7: 1, recalled7: 1, checked30: 0, recalled30: 0 });
});
it('FSRS-4.5 worked numbers use published weights and curve', () => {
  const first = updateMemory(undefined, true, 'guess', now);
  expect(first.stability).toBe(2.4);
  expect(first.difficulty).toBe(4.93);
  expect(fsrsInterval(2.4)).toBeCloseTo(2.4, 8);
  expect(updateMemory(undefined, false, 'guess', now).stability).toBe(0.4);
});
it('BKT worked numbers use explicit slip and guess', () => {
  // p=.2, slip=.1, guess=.2: posterior correct=.18/(.18+.16)=.5294118.
  expect(updateMastery(0.2, 'choose', true)).toBeCloseTo(0.5388235294, 8);
  // posterior wrong=.02/(.02+.64)=.030303; learning transition adds 2%.
  expect(updateMastery(0.2, 'choose', false)).toBeCloseTo(0.0496969697, 8);
});
it('grades choices, order and estimates by the declared answer', () => {
  expect(gradeItem(items[0]!, 'a')).toEqual({ correct: true, score: 1 });
  expect(gradeItem(items[2]!, 5)).toEqual({ correct: true, score: 1 });
  expect(gradeItem(items[2]!, 7).score).toBeGreaterThan(0);
  expect(gradeItem(items[4]!, ['b', 'a']).correct).toBe(false);
  expect(gradeItem(items[4]!, ['a', 'b']).correct).toBe(true);
});
it('migrates a v2 backup to the v3 adaptive tables', async () => {
  const db = fresh();
  const old = structuredClone(await exportBackup(db, now));
  old.dexie.data.databaseVersion = 2;
  old.dexie.data.tables = old.dexie.data.tables.filter(table => !table.name.startsWith('learn'));
  old.dexie.data.data = old.dexie.data.data.filter(table => !table.tableName.startsWith('learn'));
  const migrated = validateBackup(old);
  expect(migrated.success).toBe(true);
  expect(migrated.envelope!.dexie.data.tables.filter(table => table.name.startsWith('learn'))).toHaveLength(3);
  await importBackup(db, migrated.envelope!);
  expect(await db.learnConcepts.count()).toBe(0);
  await db.delete();
});
