// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { createDb } from '../db';
import { exportBackup, importBackup } from '../backup';
import { createSettingsRepos } from './settings';
import { contentReviewKey } from '../../core/learn/contentReview';

it('round-trips theme and motion settings through the repo and backup', async () => {
  const db = createDb(`settings-round-trip-${crypto.randomUUID()}`);
  try {
    const settings = createSettingsRepos(db, 'device-a').settings;
    await settings.put({ key: 'theme', value: 'dark' }, 100);
    await settings.put({ key: 'motion', value: 'reduce' }, 101);
    expect(await settings.get('theme')).toMatchObject({ value: 'dark', updatedAt: 100, deleted: 0, deviceId: 'device-a' });
    expect(await settings.get('motion')).toMatchObject({ value: 'reduce', updatedAt: 101, deleted: 0, deviceId: 'device-a' });
    const backup = await exportBackup(db, 200);
    await db.settings.clear();
    await importBackup(db, backup);
    expect((await settings.get('theme'))?.value).toBe('dark');
    expect((await settings.get('motion'))?.value).toBe('reduce');
  } finally {
    await db.delete();
  }
});

it('round-trips a flagged content item and its note in backup', async () => {
  const db = createDb(`content-review-${crypto.randomUUID()}`);
  try {
    const key = contentReviewKey('item-1');
    await createSettingsRepos(db, 'device-a').settings.put({ key, value: { verdict: 'flag', note: 'Check the source year' } }, 100);
    const backup = await exportBackup(db, 200);
    await db.settings.clear();
    await importBackup(db, backup);
    expect((await db.settings.get(key))?.value).toEqual({ verdict: 'flag', note: 'Check the source year' });
  } finally { await db.delete(); }
});
