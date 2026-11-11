import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time';
import { QUEST_KIND, QUEST_MODE, questDoneId, SAFETY_ASKED_KEY, SAFETY_KEY, type BoardQuest, type Learned, type Outcome, type Prediction, type QuestMinutes, type QuestSafety, type QuestWhere } from '../../core/quests660/quests';
import { getOrCreateDeviceId } from '../device';
import type { NandiDb } from '../db';
import type { LedgerRow } from '../types';
import { nightStamp } from './night';

/**
 * Spec 660 §2.2: the Quests board writes only ledger facts in mode `quests660` (and two settings), never the `quests`
 * table that Plan's weekly side quests use. Every write is idempotent by id, so a double tap or a replay changes nothing.
 */
type Source = 'board' | 'pause' | 'plan';

async function putFact(db: NandiDb, row: Omit<LedgerRow, 'updatedAt' | 'deleted' | 'deviceId' | 'mode'>, now: number, replace = false): Promise<LedgerRow> {
  const deviceId = await getOrCreateDeviceId(db, now);
  const existing = await db.ledger.get(row.id);
  if (existing && !existing.deleted && !replace) return existing;
  const fact: LedgerRow = { ...row, mode: QUEST_MODE, updatedAt: now, deleted: 0, deviceId };
  await db.ledger.put(fact);
  return fact;
}

/** The person takes a quest on (from the board, the Pause card or Plan's "+ quest"). */
export async function acceptQuest(db: NandiDb, quest: Pick<BoardQuest, 'id' | 'minutes'>, source: Source, now = Date.now()): Promise<LedgerRow> {
  const day = dayKey(now);
  let fact!: LedgerRow;
  await trackWrite(async () => { fact = await putFact(db, { id: `quest660-accept:${quest.id}:${day}`, kind: QUEST_KIND.accept, refId: quest.id, dayKey: day, inputs: { source, minutes: quest.minutes } }, now); });
  return fact;
}

/** "Swap one": the quest leaves today's board and does not come back today. */
export async function swapQuest(db: NandiDb, questId: string, now = Date.now()): Promise<void> {
  const day = dayKey(now);
  await trackWrite(async () => { await putFact(db, { id: `quest660-swap:${questId}:${day}`, kind: QUEST_KIND.swap, refId: questId, dayKey: day, inputs: {} }, now); });
}

/** "Skip, no cost": recorded for the board's rotation only; never shown, never costs anything. */
export async function skipQuest(db: NandiDb, questId: string, now = Date.now()): Promise<void> {
  const day = dayKey(now);
  await trackWrite(async () => { await putFact(db, { id: `quest660-skip:${questId}:${day}`, kind: QUEST_KIND.skip, refId: questId, dayKey: day, inputs: {} }, now); });
}

/** "Write your own": a quest of the person's own, stored as a fact (not in Plan's side quests). Its fact id is its quest id. */
export async function writeOwnQuest(db: NandiDb, own: { text: string; minutes: QuestMinutes; where: QuestWhere }, now = Date.now()): Promise<LedgerRow> {
  const text = own.text.trim().slice(0, 80);
  if (!text) throw new Error('A quest needs a few words.');
  const day = dayKey(now);
  let fact!: LedgerRow;
  await trackWrite(async () => { fact = await putFact(db, { id: `own-${now.toString(36)}`, kind: QUEST_KIND.own, refId: `own-${now.toString(36)}`, dayKey: day, inputs: { text, minutes: own.minutes, where: own.where } }, now); });
  return fact;
}

/** The person's own quests, newest first, as board quests (no predictions, no safety tags, any friend: Mor's). */
export function ownQuests(facts: readonly LedgerRow[]): BoardQuest[] {
  return facts.filter(row => !row.deleted && row.mode === QUEST_MODE && row.kind === QUEST_KIND.own)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(row => ({ id: row.id, friend: 'Mor', minutes: (row.inputs.minutes as QuestMinutes) ?? 15, where: [(row.inputs.where as QuestWhere) ?? 'home'], predicts: false, gentle: true,
      safety: { strangers: false, transit: false, afterDark: false }, text: { en: String(row.inputs.text ?? ''), hinglish: String(row.inputs.text ?? '') } }));
}

export interface QuestFinish {
  fear?: number; prediction?: Prediction; outcome: Outcome; felt?: number; learned?: Learned; line?: string; photoId?: string;
}

/**
 * The quest is done (or honestly not done this time). One fact per quest per day (`quest660:<id>:<day>`): finishing
 * again the same day only updates its answers. A night finish carries the night stamp (it pays nothing). A quest that
 * wraps a door (Chiku's 10 pages) names today's newest read fact no other quest wraps, so the jar pays the pair once.
 */
export async function finishQuest(db: NandiDb, quest: Pick<BoardQuest, 'id' | 'minutes' | 'door'>, finish: QuestFinish, now = Date.now()): Promise<LedgerRow> {
  const day = dayKey(now);
  const night = await nightStamp(db, now);
  let fact!: LedgerRow;
  await trackWrite(() => db.transaction('rw', [db.ledger, db.settings], async () => {
    const id = questDoneId(quest.id, day);
    const before = await db.ledger.get(id);
    let wraps: string | undefined = typeof before?.inputs.wraps === 'string' ? before.inputs.wraps : undefined;
    if (!wraps && quest.door === 'read' && finish.outcome !== 'not-done') {
      const todays = await db.ledger.where('dayKey').equals(day).toArray();
      const taken = new Set(todays.filter(row => !row.deleted && row.mode === QUEST_MODE && row.kind === QUEST_KIND.done && typeof row.inputs.wraps === 'string').map(row => row.inputs.wraps as string));
      wraps = todays.filter(row => !row.deleted && row.mode === 'read' && (row.kind === 'chapter' || row.kind === 'idea') && !taken.has(row.id)).sort((a, b) => b.updatedAt - a.updatedAt)[0]?.id;
    }
    const line = finish.line?.trim().slice(0, 140);
    const inputs: Record<string, unknown> = {
      minutes: quest.minutes, outcome: finish.outcome,
      ...(finish.fear ? { fear: finish.fear } : {}), ...(finish.prediction ? { prediction: finish.prediction } : {}),
      ...(finish.felt ? { felt: finish.felt } : {}), ...(finish.learned ? { learned: finish.learned } : {}),
      ...(line ? { line } : {}), ...(finish.photoId ? { photoId: finish.photoId } : {}), ...(wraps ? { wraps } : {}),
      // The night stamp of the first finish is kept, so moving bedtime later never re-pays an old night quest.
      ...(before ? (before.inputs.night === true ? { night: true } : {}) : night),
    };
    fact = await putFact(db, { id, kind: QUEST_KIND.done, refId: quest.id, dayKey: day, inputs }, before?.updatedAt ?? now, true);
  }));
  return fact;
}

/** The safety answer: three switches only (no gender or hostel field is ever stored), and that the question was shown. */
export async function saveSafety(db: NandiDb, safety: QuestSafety, now = Date.now()): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  const value = { strangers: safety.strangers === true, transit: safety.transit === true, afterDark: safety.afterDark === true };
  await trackWrite(() => db.transaction('rw', [db.settings], async () => {
    await db.settings.put({ key: SAFETY_KEY, value, updatedAt: now, deleted: 0, deviceId });
    await db.settings.put({ key: SAFETY_ASKED_KEY, value: true, updatedAt: now, deleted: 0, deviceId });
  }));
}
