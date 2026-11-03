import { ulid } from 'ulidx';
import type { NandiDb } from '../db';
import type { SkillAttemptRow } from '../types';
import { getOrCreateDeviceId } from '../device';
import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time';
import { nextRetry, type Answer, type CheckResult } from '../../core/skillPractice';

/**
 * Spec 43 (starter): practice runs. A run starts when the learner opens a lesson, keeps its change-one-part check, and
 * finishes once with the fresh answer's result; finishing sets the retry day. A retry is a new run pointing at the one
 * before, and finishing it hands the schedule over. Nothing here pays XP (that comes with the first real pack).
 */
export async function startAttempt(db: NandiDb, input: { trackId: string; lessonId: string; variantId: string; retryOf?: string }, now: number): Promise<string> {
  const deviceId = await getOrCreateDeviceId(db, now);
  const id = ulid(now);
  const before = input.retryOf ? await db.skillAttempts.get(input.retryOf) : undefined;
  const row: SkillAttemptRow = { id, trackId: input.trackId, lessonId: input.lessonId, variantId: input.variantId, dayKey: dayKey(now), status: 'started',
    retryDue: null, rights: before && !before.deleted ? before.rights : 0, ...(input.retryOf ? { retryOf: input.retryOf } : {}), startedAt: now, updatedAt: now, deleted: 0, deviceId };
  await trackWrite(() => db.skillAttempts.add(row));
  return id;
}

export async function recordChange(db: NandiDb, id: string, answer: Answer, result: CheckResult, now: number): Promise<void> {
  await trackWrite(() => db.skillAttempts.update(id, { change: { answer, result }, updatedAt: now }));
}

/**
 * Finishes a run once (a second call changes nothing) with the fresh result and the saved page, and sets when the
 * lesson comes back. A self-checked answer keeps no words here: they live on the page.
 */
export async function finishAttempt(db: NandiDb, id: string, fresh: { answer?: Answer; result: CheckResult | 'self' }, pageId: string | undefined, now: number): Promise<SkillAttemptRow> {
  return trackWrite(() => db.transaction('rw', db.skillAttempts, async () => {
    const row = await db.skillAttempts.get(id);
    if (!row || row.deleted) throw new Error('This practice run is gone.');
    if (row.status === 'finished') return row;
    const { due, rights } = nextRetry(now, fresh.result, row.rights);
    const done: SkillAttemptRow = { ...row, status: 'finished', fresh: fresh.result === 'self' ? { result: 'self' } : fresh, retryDue: due, rights,
      ...(pageId ? { pageId } : {}), finishedAt: now, updatedAt: now };
    await db.skillAttempts.put(done);
    // The retry takes over the schedule: the run it repeats is no longer due.
    if (row.retryOf) await db.skillAttempts.update(row.retryOf, { retryDue: null, updatedAt: now });
    return done;
  }));
}

/** Finished runs whose lesson is due again on or before `today`, oldest due first. An overdue one simply waits. */
export async function dueRetries(db: NandiDb, trackId: string, today: string): Promise<SkillAttemptRow[]> {
  const rows = await db.skillAttempts.where('trackId').equals(trackId).toArray();
  return rows.filter(row => !row.deleted && row.status === 'finished' && row.retryDue !== null && row.retryDue <= today)
    .sort((a, b) => a.retryDue!.localeCompare(b.retryDue!));
}
