import { ulid } from 'ulidx';
import type { NandiDb } from '../db';
import type { NotebookPageRow, NotebookVersionRow } from '../types';
import { getOrCreateDeviceId } from '../device';
import { trackWrite } from '../../core/pendingWrites';

/**
 * Spec 43 (starter): the private notebook's data. A saved answer becomes a page with version 1, which stays the
 * baseline; a revision adds a version and never rewrites one. Deleting clears the words, not just a flag: the row is
 * kept only as an empty tombstone, so a later backup holds nothing of it. No screen shows these yet.
 */
export type NewVersion = Pick<NotebookVersionRow, 'answer' | 'checklist' | 'status'>;

export async function savePage(db: NandiDb, input: { trackId: string; lessonId: string; title: string; prompt: string } & NewVersion, now: number): Promise<{ pageId: string; versionId: string }> {
  const deviceId = await getOrCreateDeviceId(db, now);
  const pageId = ulid(now), versionId = ulid(now);
  const meta = { updatedAt: now, deleted: 0 as const, deviceId };
  await trackWrite(() => db.transaction('rw', db.notebookPages, db.notebookVersions, async () => {
    await db.notebookPages.add({ id: pageId, trackId: input.trackId, lessonId: input.lessonId, title: input.title, baselineVersionId: versionId, createdAt: now, ...meta });
    await db.notebookVersions.add({ id: versionId, pageId, version: 1, prompt: input.prompt, answer: input.answer, checklist: input.checklist, status: input.status, createdAt: now, ...meta });
  }));
  return { pageId, versionId };
}

/** A new version on top of the latest live one, with the same prompt snapshot. */
export async function revisePage(db: NandiDb, pageId: string, next: NewVersion, now: number): Promise<string> {
  const deviceId = await getOrCreateDeviceId(db, now);
  const versionId = ulid(now);
  await trackWrite(() => db.transaction('rw', db.notebookPages, db.notebookVersions, async () => {
    const page = await db.notebookPages.get(pageId);
    if (!page || page.deleted) throw new Error('This page is gone.');
    const versions = await db.notebookVersions.where('pageId').equals(pageId).toArray();
    const top = Math.max(0, ...versions.map(row => row.version));
    const prompt = versions.filter(row => !row.deleted).sort((a, b) => b.version - a.version)[0]?.prompt ?? '';
    await db.notebookVersions.add({ id: versionId, pageId, version: top + 1, prompt, ...next, createdAt: now, updatedAt: now, deleted: 0, deviceId });
    await db.notebookPages.update(pageId, { updatedAt: now });
  }));
  return versionId;
}

const emptied = (now: number) => ({ answer: '', prompt: '', checklist: [], deleted: 1 as const, updatedAt: now });

/** Deletes one version's words. Deleting the baseline leaves the comparison saying the baseline is unavailable. */
export async function deleteVersion(db: NandiDb, versionId: string, now: number): Promise<void> {
  await trackWrite(() => db.notebookVersions.update(versionId, emptied(now)));
}

/** Deletes a page in one step: the page, every version's words, and the practice runs saved to it. */
export async function deletePage(db: NandiDb, pageId: string, now: number): Promise<void> {
  await trackWrite(() => db.transaction('rw', db.notebookPages, db.notebookVersions, db.skillAttempts, async () => {
    await db.notebookPages.update(pageId, { title: '', deleted: 1, updatedAt: now });
    for (const version of await db.notebookVersions.where('pageId').equals(pageId).toArray()) await db.notebookVersions.update(version.id, emptied(now));
    for (const attempt of (await db.skillAttempts.toArray()).filter(row => row.pageId === pageId)) {
      await db.skillAttempts.update(attempt.id, { deleted: 1, change: undefined, fresh: undefined, retryDue: null, updatedAt: now });
    }
  }));
}

/** A live page with its live versions, newest first, and its baseline: the version, or 'unavailable' once deleted. */
export async function readPage(db: NandiDb, pageId: string): Promise<{ page: NotebookPageRow; versions: NotebookVersionRow[]; baseline: NotebookVersionRow | 'unavailable' } | null> {
  const page = await db.notebookPages.get(pageId);
  if (!page || page.deleted) return null;
  const all = await db.notebookVersions.where('pageId').equals(pageId).toArray();
  const versions = all.filter(row => !row.deleted).sort((a, b) => b.version - a.version);
  const baseline = all.find(row => row.id === page.baselineVersionId);
  return { page, versions, baseline: baseline && !baseline.deleted ? baseline : 'unavailable' };
}
