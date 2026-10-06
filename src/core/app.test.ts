import { describe, expect, it } from 'vitest';
import { APP_ID } from './app';

describe('app identity', () => {
  it('uses the NANDI identifier', () => {
    expect(APP_ID).toBe('nandi');
  });
});
