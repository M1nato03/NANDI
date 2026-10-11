// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { createDb } from './db';
import { getOrCreateDeviceId } from './device';
import { pendingWrites } from '../core/pendingWrites';

it('tracks creation of the device id as a pending write', async () => {
  const db = createDb(`device-track-${Date.now()}`);
  const seen: number[] = [];
  const unsubscribe = pendingWrites.subscribe(count => seen.push(count));
  try {
    await getOrCreateDeviceId(db, 1000);
    expect(seen).toContain(1);
    expect(pendingWrites.count).toBe(0);
  } finally { unsubscribe(); await db.delete(); }
});
