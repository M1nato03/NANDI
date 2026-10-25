import { describe, it, expect } from 'vitest';
import { audit } from './audit.test-helper';
import { generateLock, solveLock, lockFeedback } from './lock';

describe('lock', () => {
  it('checks 300 seeds', () => {
    audit('lock', generateLock, solveLock, (c, solution) =>
      solution === (c as ReturnType<typeof generateLock>).answer);
  }, 120_000);
  it('treats all unmentioned guessed digits as absent', () => {
    expect(lockFeedback('427', '409')).toBe('placed');
    expect(lockFeedback('427', '804')).toBe('misplaced');
    expect(lockFeedback('427', '815')).toBe('absent');
  });
});
