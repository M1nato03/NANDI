import { describe, expect, it } from 'vitest';
import { firstAction, toggleGoal } from './welcome';

describe('first run', () => {
  it('opens on the quickest finish among the picks', () => {
    expect(firstAction(['plan', 'learn']).route).toBe('learn/drop');
    expect(firstAction(['sleep', 'mind']).route).toBe('mind/board');
    expect(firstAction(['sleep', 'train']).route).toBe('train');
    expect(firstAction(['sleep', 'plan']).route).toBe('plan');
    expect(firstAction(['sleep']).route).toBe('you/night');
    expect(firstAction([]).route).toBe('learn/drop');
  });
  it('keeps at most two picks, dropping the oldest', () => {
    expect(toggleGoal([], 'learn')).toEqual(['learn']);
    expect(toggleGoal(['learn', 'train'], 'sleep')).toEqual(['train', 'sleep']);
    expect(toggleGoal(['learn', 'train'], 'learn')).toEqual(['train']);
  });
});
