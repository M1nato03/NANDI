import { describe, expect, it } from 'vitest';
import { macroKindOf } from './EconomyFeedback';

describe('macroKindOf (660 §3.2, B6)', () => {
  it('season points crossing a tier line give no dialog; only a level rise does', () => {
    const before = { level: 4, season: { rank: 3, tier: 'Bronze' } };
    const tierUp = { level: 4, season: { rank: 2, tier: 'Silver' } };
    expect(macroKindOf(tierUp, before)).toBe('');
    const levelUp = { level: 5, season: { rank: 2, tier: 'Silver' } };
    expect(macroKindOf(levelUp, before)).toBe('Level 5');
    expect(macroKindOf(before, before)).toBe('');
  });
});
