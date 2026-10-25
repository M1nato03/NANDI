import { describe, it, expect } from 'vitest';
import { audit } from './audit.test-helper';
import { generateSeating, solveSeating } from './seating';

describe('seating', () => {
  it('checks 300 seeds across rows and circles', () => {
    audit('seating', generateSeating, solveSeating, (c, solution) =>
      JSON.stringify(solution) === JSON.stringify((c as ReturnType<typeof generateSeating>).answer));
    expect(generateSeating(2, 'easy').shape).toBe('row');
    expect(generateSeating(3, 'hard').shape).toBe('circle');
  }, 120_000);
});
