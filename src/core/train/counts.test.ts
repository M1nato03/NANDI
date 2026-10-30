import { describe, expect, it } from 'vitest';
import { sessionCounts } from './counts';

describe('which sessions count (bug hunt 30 Oct)', () => {
  it('a session stopped with 0 working sets counts nowhere', () => {
    expect(sessionCounts({ status: 'partial', workingSets: 0, xp: 0 })).toBe(false);
    // A safety stop pays 40 even with no sets, but with no set logged it is still not a session.
    expect(sessionCounts({ status: 'safety', workingSets: 0, xp: 40 })).toBe(false);
  });
  it('one working set is enough, a safety stop included', () => {
    expect(sessionCounts({ status: 'partial', workingSets: 1, xp: 8 })).toBe(true);
    expect(sessionCounts({ status: 'safety', workingSets: 1, xp: 40 })).toBe(true);
    expect(sessionCounts({ status: 'completed', workingSets: 12 })).toBe(true);
  });
  it('an open or skipped session never counts', () => {
    expect(sessionCounts({ status: 'active', workingSets: 3 })).toBe(false);
    expect(sessionCounts({ status: 'skipped', workingSets: 3 })).toBe(false);
  });
  it('an older row with no set count falls back to whether it paid', () => {
    expect(sessionCounts({ status: 'partial', xp: 30 })).toBe(true);
    expect(sessionCounts({ status: 'partial', xp: 0 })).toBe(false);
    expect(sessionCounts({ xp: 50 })).toBe(true);
  });
});
