// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from 'vitest';
import { db } from '../data/db';
import { appendError, getErrorRing, installErrorListeners, type ErrorEntry } from './errorRing';

describe('error ring', () => {
  it('keeps only the latest 50 entries in order', () => {
    let ring: ErrorEntry[] = [];
    for (let i = 0; i < 55; i++) ring = appendError(ring, { at: i, source: 'window', message: String(i) });
    expect(ring).toHaveLength(50);
    expect(ring[0]?.message).toBe('5');
    expect(ring[49]?.message).toBe('54');
  });

  it('captures a window error and saves it in settings', async () => {
    const remove = installErrorListeners();
    try {
      window.dispatchEvent(new ErrorEvent('error', { error: new Error('window check') }));
      expect(getErrorRing().at(-1)).toMatchObject({ source: 'window', message: 'window check' });
      await vi.waitFor(async () => {
        const saved = (await db.settings.get('errorRing'))?.value as ErrorEntry[] | undefined;
        expect(saved?.at(-1)).toMatchObject({ source: 'window', message: 'window check' });
      });
    } finally { remove(); }
  });
});
