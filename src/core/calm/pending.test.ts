import { describe, expect, it } from 'vitest';
import { settlePending } from './pending';

describe('K3: a pending Calm choice settles once saved', () => {
  it('drops a key once the stored value matches, keeps the rest', () => {
    expect(settlePending({ way: 'scan', minutes: 30 }, { way: 'scan', minutes: 5 })).toEqual({ minutes: 30 });
    expect(settlePending({ way: 'scan' }, { way: 'scan', minutes: 5 })).toEqual({});
  });

  it('returns the same object when nothing has settled (no extra render)', () => {
    const pending = { way: 'quiet' };
    expect(settlePending(pending, { way: 'scan' })).toBe(pending);
  });

  it('after it settles, a later stored change shows through', () => {
    const settled = settlePending({ way: 'scan' }, { way: 'scan' });
    expect({ ...{ way: 'paced' }, ...settled }.way).toBe('paced');
  });
});
