import * as v from 'valibot';
import { topicPackSchema, type TopicPack } from './schemas';
import { validatePack } from './validate';
import { bundledTopicPacks } from './seed';
import { trackWrite } from '../../core/pendingWrites';
import type { NandiDb } from '../db';
import type { PrivatePackRow } from '../types';

/**
 * Spec 33 §7: a private book (a write-up of a printed book the owner has) is imported on this phone only. It is
 * checked with the same validator, must say `rights: 'private'`, and may not reuse an id the bundled books use
 * (concept, step and item ids are looked up across every book).
 */
export function checkPrivatePack(input: unknown): { pack?: TopicPack; errors: string[] } {
  const errors = validatePack(input);
  const parsed = v.safeParse(topicPackSchema, input);
  if (!parsed.success) return { errors: errors.length ? errors : ['This file is not a NANDI book.'] };
  const pack = parsed.output;
  if (pack.body.book?.rights !== 'private') errors.push('Only a book marked private can be imported here.');
  const bundled = new Set(bundledTopicPacks.flatMap(book => [`pack:${book.id}`, `book:${book.body.topic.id}`,
    ...book.body.modules.flatMap(module => module.concepts.flatMap(concept => [`concept:${concept.id}`, ...(concept.steps ?? []).map(step => `step:${step.id}`), ...concept.items.map(item => `item:${item.id}`)]))]));
  const own = [`pack:${pack.id}`, `book:${pack.body.topic.id}`, ...pack.body.modules.flatMap(module => module.concepts.flatMap(concept => [`concept:${concept.id}`, ...(concept.steps ?? []).map(step => `step:${step.id}`), ...concept.items.map(item => `item:${item.id}`)]))];
  const clash = own.find(id => bundled.has(id));
  if (clash) errors.push(`This book reuses an id the app already has (${clash.replace(':', ' ')}).`);
  return errors.length ? { errors } : { pack, errors };
}

/** The private books stored on this phone, parsed again on every read (a bad row is skipped, never shown). */
export function privateTopicPacks(rows: readonly PrivatePackRow[]): TopicPack[] {
  return rows.filter(row => !row.deleted).flatMap(row => {
    const parsed = v.safeParse(topicPackSchema, row.pack);
    return parsed.success && parsed.output.body.book?.rights === 'private' ? [parsed.output] : [];
  });
}

export async function savePrivatePack(db: NandiDb, pack: TopicPack, deviceId: string, now: number): Promise<void> {
  await trackWrite(() => db.privatePacks.put({ id: pack.id, pack, importedAt: now, private: true, updatedAt: now, deleted: 0, deviceId }));
}
/** Remove deletes the book itself; what was learned from it stays in the ledger like any other fact. */
export async function removePrivatePack(db: NandiDb, id: string): Promise<void> {
  await trackWrite(() => db.privatePacks.delete(id));
}
