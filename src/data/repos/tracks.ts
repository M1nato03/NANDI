import { dayKey } from '../../core/time';
import { RULES } from '../../core/rules.config';
import { soonerWeakCards } from '../../core/learn/tracks';
import { trackWrite } from '../../core/pendingWrites';
import { getOrCreateDeviceId } from '../device';
import type { NandiDb } from '../db';
import type { TrackPack } from '../packs/schemas';

export type TrackDraft = { packId: string; unitId: string; day: string; step: 'points' | 'check' | 'cards'; watched: boolean; answers: number[]; confidence: number[]; explain?: string };
const draftKey = 'mind.trackDraft';
const activeKey = 'mind.activeTrack';
export const trackUnitId = (pack: TrackPack, unitId: string) => `track:${pack.body.track.id}:${unitId}`;
export const trackCardId = (pack: TrackPack, unitId: string, index: number) => `${trackUnitId(pack, unitId)}:${index + 1}`;

export async function saveTrackDraft(db: NandiDb, draft: TrackDraft | null, now = Date.now()): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key: draftKey, value: draft, updatedAt: now, deleted: 0, deviceId }));
}
export async function selectTrack(db: NandiDb, packId: string | null, now = Date.now()): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key: activeKey, value: packId, updatedAt: now, deleted: 0, deviceId }));
}
export async function loadTrackDraft(db: NandiDb): Promise<TrackDraft | null> {
  const value = (await db.settings.get(draftKey))?.value;
  return value && typeof value === 'object' && 'unitId' in value ? value as TrackDraft : null;
}

/** Fill unfinished card introductions as daily capacity permits, including after a reload. */
export async function introduceTrackCards(db: NandiDb, packs: TrackPack[], now = Date.now()): Promise<number> {
  const deviceId = await getOrCreateDeviceId(db, now), day = dayKey(now);
  return trackWrite(() => db.transaction('rw', [db.cards, db.lessonProg], async () => {
    const existing = await db.cards.toArray();
    const introduced = existing.filter(row => !row.deleted && row.deckId !== 'greene' && (row.reviews ?? 0) === 0 && dayKey(row.updatedAt) === day).length;
    let room = Math.max(0, RULES.learningTracks.newCardsPerDay - introduced), added = 0;
    for (const pack of packs) for (const module of pack.body.modules) for (const unit of module.units) {
      if (!(await db.lessonProg.get(trackUnitId(pack, unit.id)))?.doneDayKey) continue;
      for (let index = 0; index < unit.cards.length && room > 0; index++) {
        const id = trackCardId(pack, unit.id, index);
        if (await db.cards.get(id)) continue;
        await db.cards.add({ id, deckId: pack.body.track.id, packId: pack.id, itemId: unit.id, topic: module.title, box: 0, reviews: 0, due: day, updatedAt: now, deleted: 0, deviceId });
        room--; added++;
      }
    }
    return added;
  }));
}

export async function completeTrackUnit(db: NandiDb, pack: TrackPack, draft: TrackDraft, afterBedtime: boolean, now = Date.now()): Promise<void> {
  const unit = pack.body.modules.flatMap(module => module.units).find(row => row.id === draft.unitId);
  if (!unit || draft.answers.length !== 3 || draft.confidence.length !== 3 || draft.answers.some((answer, i) => answer < 0 || answer > 2 || draft.confidence[i]! < 0 || draft.confidence[i]! > 100)) throw new Error('Finish the three checks first.');
  const deviceId = await getOrCreateDeviceId(db, now), day = dayKey(now), id = trackUnitId(pack, unit.id);
  await trackWrite(() => db.transaction('rw', [db.lessonProg, db.ledger, db.settings], async () => {
    if ((await db.lessonProg.get(id))?.doneDayKey) return;
    await db.lessonProg.put({ id, packId: pack.id, doneDayKey: day, guessOk: draft.answers.every((answer, i) => answer === unit.check[i]!.answer), conf: Math.round(draft.confidence.reduce((sum, value) => sum + value, 0) / 3), updatedAt: now, deleted: 0, deviceId });
    await db.ledger.add({ id: `lesson:${id}`, dayKey: day, mode: 'mind', kind: 'lesson', refId: id, inputs: { courseId: pack.body.track.id, afterBedtime }, updatedAt: now, deleted: 0, deviceId });
    await db.settings.put({ key: draftKey, value: null, updatedAt: now, deleted: 0, deviceId });
    await db.settings.put({ key: `mind.trackMinutes:${day}`, value: unit.minutes + 3, updatedAt: now, deleted: 0, deviceId });
  }));
  await introduceTrackCards(db, [pack], now);
}

/** A failed test advances weak cards' due dates; boxes and review counts survive. */
export async function recordModuleTest(db: NandiDb, pack: TrackPack, moduleId: string, answers: number[], now = Date.now()): Promise<{ score: number; passed: boolean }> {
  const module = pack.body.modules.find(row => row.id === moduleId);
  if (!module) throw new Error('Module unavailable');
  const questions = module.units.flatMap(unit => unit.check.map(question => ({ unit, question }))).slice(0, 10);
  if (answers.length !== questions.length) throw new Error('Complete the module test');
  const score = Math.round(100 * questions.filter((row, i) => row.question.answer === answers[i]).length / questions.length);
  const passed = score >= RULES.learningTracks.modulePassPercent;
  const weakUnits = new Set(questions.filter((row, i) => row.question.answer !== answers[i]).map(row => row.unit.id));
  const weakIds = new Set([...weakUnits].flatMap(unitId => [0, 1, 2].map(i => trackCardId(pack, unitId, i))));
  const deviceId = await getOrCreateDeviceId(db, now), day = dayKey(now);
  await trackWrite(() => db.transaction('rw', [db.cards, db.lessonProg], async () => {
    if (passed) await db.lessonProg.put({ id: `track-module:${pack.body.track.id}:${moduleId}`, packId: pack.id, doneDayKey: day, updatedAt: now, deleted: 0, deviceId });
    else for (const row of soonerWeakCards(await db.cards.toArray(), weakIds, day)) if (weakIds.has(row.id)) await db.cards.put({ ...row, updatedAt: now });
  }));
  return { score, passed };
}
