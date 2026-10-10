// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { canReloadNow } from './canReloadNow';

beforeEach(async () => { await db.focus.clear(); await db.sessions.clear(); });
afterEach(async () => { await db.focus.clear(); await db.sessions.clear(); });

describe('canReloadNow', () => {
  it('waits for a running focus and allows reload after a pause', async () => {
    expect(await canReloadNow()).toBe(true);
    const focus = { id: 'focus', taskId: 'task', startedAt: 1, updatedAt: 1, deleted: 0 as const, deviceId: 'test' };
    await db.focus.put(focus);
    expect(await canReloadNow()).toBe(false);
    await db.focus.put({ ...focus, pauses: [{ at: 2 }] });
    expect(await canReloadNow()).toBe(true);
  });
  it('holds updates while a workout is active', async () => {
    await db.sessions.put({ id: 'session', dayKey: '2026-10-11', status: 'active', updatedAt: 1, deleted: 0, deviceId: 'test' });
    expect(await canReloadNow()).toBe(false);
    await db.sessions.update('session', { status: 'completed' });
    expect(await canReloadNow()).toBe(true);
  });
});
