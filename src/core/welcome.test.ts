import { describe, expect, it } from 'vitest';
import { firstAction } from './welcome';

describe('first run (spec 18)', () => {
  it('sends each single pick straight to its first win', () => {
    expect(firstAction('learn').route).toBe('learn/drop');
    expect(firstAction('mind').route).toBe('mind/board/daily');
    expect(firstAction('train').route).toBe('train/easy');
    expect(firstAction('plan').route).toBe('plan');
    expect(firstAction('sleep').route).toBe('you/night');
    expect(firstAction(undefined).route).toBe('learn/drop');
  });
  it('offers the night routine after bedtime, whatever was picked', () => {
    expect(firstAction('mind', true)).toEqual({ route: 'night', label: 'Start my night routine' });
  });
});
