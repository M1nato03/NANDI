import { ulid } from 'ulidx';
import { trackWrite } from '../../core/pendingWrites';
import type { SoftChoice, SoftState } from '../../core/soft/soft';
import { dayKey } from '../../core/time';
import { getOrCreateDeviceId } from '../device';
import type { NandiDb } from '../db';

/** Spec 15: say what kind of day it is. Each tap adds a row (the ledger is never rewritten); the latest wins, and 'okay' switches back to the usual Home. */
export async function setSoftState(db: NandiDb, state: SoftState | 'okay', now: number): Promise<void> {
  const day = dayKey(now);
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.ledger.add({ id: `soft-start:${day}:${ulid(now)}`, mode: 'soft', kind: 'soft-start', refId: day, dayKey: day,
    inputs: { state }, updatedAt: now, deleted: 0, deviceId }).then(() => undefined));
}

/** The gentle thing is done: today is kept. The first one of the day is the one that counts; later ones add nothing. */
export async function doSoftThing(db: NandiDb, choice: SoftChoice, now: number, extra: { text?: string; inStory?: boolean } = {}): Promise<void> {
  const day = dayKey(now);
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', db.ledger, async () => {
    const id = `soft:${day}`;
    if (await db.ledger.get(id)) return;
    const start = (await db.ledger.where('dayKey').equals(day).filter(row => row.kind === 'soft-start' && !row.deleted).sortBy('updatedAt')).at(-1);
    await db.ledger.add({ id, mode: 'soft', kind: 'soft', refId: day, dayKey: day,
      inputs: { choice, state: start?.inputs.state ?? null, ...(extra.text ? { text: extra.text.slice(0, 140) } : {}), ...(extra.inStory ? { inStory: true } : {}) },
      updatedAt: now, deleted: 0, deviceId });
  }));
}
