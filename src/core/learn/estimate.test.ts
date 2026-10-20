import { describe, expect, it } from 'vitest';
import { bundledTopicPacks } from '../../data/packs/seed';
import { estimateFeedback, formatEstimate, sliderScale, type EstimateItem } from './estimate';

const items = bundledTopicPacks.flatMap(pack => pack.body.modules).flatMap(module => module.concepts.flatMap(concept => concept.items))
  .flatMap(item => item.type === 'estimate' ? [item as EstimateItem] : []);

describe('drag-to-guess', () => {
  it('puts every answer on its slider, off the ends, on a reachable step', () => {
    expect(items.length).toBeGreaterThan(40);
    for (const item of items) {
      const { lo, hi, step, start } = sliderScale(item);
      const { value, min, max } = item.answer;
      expect(lo, item.id).toBeLessThanOrEqual(value);
      expect(hi, item.id).toBeGreaterThan(value);
      const steps = (value - lo) / step;
      expect(Math.abs(steps - Math.round(steps)), item.id).toBeLessThan(1e-6);
      expect((hi - lo) / step, item.id).toBeGreaterThanOrEqual(10);
      // Starting in the middle never lands inside the right band, so nobody passes without moving it.
      expect(start >= min && start <= max, item.id).toBe(false);
    }
  });
  it('does not always hide the answer in the same place', () => {
    const spots = new Set(items.map(item => { const { lo, hi } = sliderScale(item); return Math.round((item.answer.value - lo) / (hi - lo) * 10); }));
    expect(spots.size).toBeGreaterThan(3);
  });
  it('words a miss with both numbers', () => {
    const item: EstimateItem = { id: 'x', answer: { value: 1765, min: 1764.5, max: 1765.5, unit: 'year CE' }, options: [{ id: 'a', feedback: 'The diwani came in 1765.', correct: true }] };
    expect(estimateFeedback(item, 1800, false).text).toBe('You said 1800 CE. The answer is about 1765 CE. The diwani came in 1765.');
    expect(estimateFeedback(item, 1765, true)).toEqual({ optionId: 'a', text: 'The diwani came in 1765.' });
    expect(formatEstimate(1500, 'rupees')).toBe('₹1,500');
    expect(formatEstimate(-5, 'rupees')).toBe('−₹5');
    expect(formatEstimate(45, 'percent')).toBe('45%');
  });
});
