import { describe, expect, it } from 'vitest';
import { firstAction } from './welcome';

describe('first run (spec 18)', () => {
  it('sends each single pick straight to its first win', () => {
    // Spec 33: Learn something opens Read; Sharpen my mind opens Read's Games.
    expect(firstAction('learn').route).toBe('read');
    expect(firstAction('mind').route).toBe('read/games/board/daily');
    expect(firstAction('train').route).toBe('train/easy');
    expect(firstAction('plan').route).toBe('plan');
    expect(firstAction('sleep').route).toBe('you/tonight');
    expect(firstAction(undefined).route).toBe('read');
  });
  it('offers the night routine after bedtime, whatever was picked', () => {
    expect(firstAction('mind', true)).toEqual({ route: 'night', label: 'Start my night routine' });
  });
});
