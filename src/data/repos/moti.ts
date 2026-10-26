import type { NandiDb } from '../db';
import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time';
import { shutdownAt } from '../../core/tasks/planner';
import { HAVELI_FACT } from '../../core/moti/haveli';
import { matkaShift, type MatkaItem } from '../../core/moti/matka';
import { effectiveBedtime } from './night';
import { getOrCreateDeviceId } from '../device';

const afterBedtimeAt = async (db: NandiDb, now: number) => now >= shutdownAt(now, await effectiveBedtime(db, now));

/**
 * Spec 26 A1: a rebuilt idea lights its diya for today. It is a card review (rules.mind.cardXp under cardsMaxPerDay,
 * Moti's corner of the courtyard), so no rule changes. One per idea a day.
 */
export async function saveHaveliRebuilt(db: NandiDb, conceptId: string, now: number): Promise<void> {
  const day = dayKey(now), refId = HAVELI_FACT(day, conceptId), id = `card:${refId}`;
  const [afterBedtime, deviceId] = [await afterBedtimeAt(db, now), await getOrCreateDeviceId(db, now)];
  await trackWrite(() => db.transaction('rw', db.ledger, async () => {
    if (await db.ledger.get(id)) return;
    await db.ledger.add({ id, dayKey: day, mode: 'mind', kind: 'card', refId, inputs: { afterBedtime, correct: true, source: 'haveli' }, updatedAt: now, deleted: 0, deviceId });
  }));
}

/**
 * Spec 26 A2 (cj8 M3): a matka answer. The `matka` fact keeps the recall, the seal and the shift (never scored); a card
 * fact beside it pays the flat card XP for answering, whatever the result. Never after bedtime: the screen is not
 * offered then, and a late answer pays 0 like any card.
 */
export async function saveMatkaAnswer(db: NandiDb, input: { week: string; item: MatkaItem; recalled: number | string; now: number }): Promise<void> {
  const day = dayKey(input.now), refId = `${input.week}.${input.item.factId}`, id = `matka:${refId}`;
  const [afterBedtime, deviceId] = [await afterBedtimeAt(db, input.now), await getOrCreateDeviceId(db, input.now)];
  const shift = input.item.level === 2 && typeof input.recalled === 'number' ? matkaShift(input.item.sealed as number, input.recalled, input.item.answer!) : undefined;
  await trackWrite(() => db.transaction('rw', db.ledger, async () => {
    if (await db.ledger.get(id)) return;
    await db.ledger.add({ id, dayKey: day, mode: 'mind', kind: 'matka', refId, inputs: { sourceFactId: input.item.factId, level: input.item.level, recalled: input.recalled, sealed: input.item.sealed, answer: input.item.answer ?? null, shift: shift ?? null, afterBedtime }, updatedAt: input.now, deleted: 0, deviceId });
    const card = `${day}:matka:${refId}`;
    if (!(await db.ledger.get(`card:${card}`))) await db.ledger.add({ id: `card:${card}`, dayKey: day, mode: 'mind', kind: 'card', refId: card, inputs: { afterBedtime, correct: true, source: 'matka' }, updatedAt: input.now, deleted: 0, deviceId });
  }));
}
