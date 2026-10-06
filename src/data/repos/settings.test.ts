// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { createDb } from '../db';
import { exportBackup, importBackup } from '../backup';
import { createSettingsRepos } from './settings';

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
