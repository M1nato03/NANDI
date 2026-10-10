import { describe, it, expect } from 'vitest';
import { canReloadNow } from './canReloadNow';

describe('canReloadNow', () => {
  it('returns true by default (stub)', () => {
    expect(canReloadNow()).toBe(true);
  });
});
