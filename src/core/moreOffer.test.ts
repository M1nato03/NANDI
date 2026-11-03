import { describe, expect, it } from 'vitest';
import { moreOffer } from './moreOffer';
import type { Picks } from './welcome';

const two: Picks = { goals: ['learn', 'mind'], size: 'two' };
const fact = (mode: string, kind: string, deleted = 0) => ({ mode, kind, deleted });
const offer = (extra: Partial<Parameters<typeof moreOffer>[0]> = {}) => moreOffer({ picks: two, answered: false, usefulDays: 10, facts: [], ...extra });

describe('spec 52: the ten-day offer', () => {
  it('comes on the tenth useful day, not the ninth, and never once answered', () => {
    expect(offer({ usefulDays: 9 })).toBeNull();
    expect(offer()).not.toBeNull();
    expect(offer({ usefulDays: 11, answered: true })).toBeNull();
    expect(offer({ usefulDays: 20, answered: true })).toBeNull();
  });
  it('names the unpicked area used most over those days', () => {
    const facts = [fact('train', 'session'), fact('tasks', 'done'), fact('tasks', 'done'), fact('tasks', 'focus-time'), fact('train', 'rest'), fact('tasks', 'done', 1)];
    expect(offer({ facts })).toEqual({ add: 'plan' });
    // Picked areas and facts that belong to no area do not count.
    expect(offer({ facts: [fact('read', 'chapter'), fact('mind', 'board'), fact('calm', 'session'), fact('bonuses', 'lightsout')] })).toEqual({ add: 'sleep' });
  });
  it('with nothing used, the next area in GOALS order; at four picks, Everything; at all, nothing', () => {
    expect(offer()).toEqual({ add: 'sleep' });
    expect(offer({ picks: { goals: ['sleep', 'learn'], size: 'two' } })).toEqual({ add: 'train' });
    expect(offer({ picks: { goals: ['sleep', 'learn', 'train', 'mind'], size: 'more' } })).toEqual({ add: 'all' });
    expect(offer({ picks: { goals: ['sleep', 'learn', 'train', 'mind', 'plan'], size: 'all' } })).toBeNull();
  });
});
