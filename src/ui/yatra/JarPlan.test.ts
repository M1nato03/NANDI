import { describe, expect, it } from 'vitest';
import { payoutContent } from './JarPlan';
import { receiptLayout, type Measure } from '../screens/recapCard';

const measure: Measure = (text, size) => text.length * size * 0.6;

describe('spec 54: the payout card', () => {
  it('draws only the camp on the receipt paper (no plan line)', () => {
    const texts = receiptLayout(payoutContent('Chika'), measure, true).texts.map(text => text.text);
    expect(texts).toEqual(['NANDI · TRAIL', 'a camp reached', 'Reached', 'Chika', 'Paid in real life.', 'nandi.nandi11.workers.dev']);
  });
});
