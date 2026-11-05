import { describe, expect, it } from 'vitest';
import { payoutContent } from './JarPlan';
import { receiptLayout, type Measure } from '../screens/recapCard';

const measure: Measure = (text, size) => text.length * size * 0.6;

describe('spec 54: the payout card', () => {
  it('draws only the camp and the person\'s own line on the receipt paper', () => {
    const texts = receiptLayout(payoutContent('Chika', 'movie night with Dev'), measure, true).texts.map(text => text.text);
    expect(texts).toEqual(['NANDI · TRAIL', 'a camp reached', 'Reached', 'Chika', '“movie night with Dev”', 'Paid in real life.', 'nandi.nandi11.workers.dev']);
  });
  it('wraps a 60-character line onto two lines inside the print area', () => {
    const words = 'a long weekend with the whole family at the lake house again';
    expect(words.length).toBeLessThanOrEqual(60);
    const layout = receiptLayout(payoutContent('Balu ka Ghera', words), measure, true);
    const lines = layout.texts.filter(text => text.color === 'muted' && text.text !== 'a camp reached' && !text.text.includes('workers.dev'));
    expect(lines.length).toBe(2);
    for (const line of lines) expect(measure(line.text, line.size, 'body', 500)).toBeLessThanOrEqual(660);
    expect(lines.map(line => line.text).join(' ')).toBe(`“${words}”`);
  });
});
