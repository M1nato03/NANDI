import { describe, expect, it } from 'vitest';
import { receiptContent, type WeeklyRecapData } from '../../core/recap';
import { RECAP_HEIGHT, RECAP_WIDTH, RECEIPT_INK, receiptLayout, type Measure, type ReceiptText } from './recapCard';

// A wide estimate of the bundled fonts (the e2e checks the same layout with the real ones).
const measure: Measure = (text, size, font, weight) => text.length * size * (font === 'display' ? 0.6 : 0.55) * (weight >= 700 ? 1.06 : 1);
const base: WeeklyRecapData = { from: '2026-11-02', to: '2026-11-09', tasks: 0, focusMinutes: 0, longestFocusMinutes: 0, workouts: 0, sideQuests: 0, concepts: 0, nights: 0, chapters: 0, realMs: 0 };
const weeks: Record<string, WeeklyRecapData> = {
  full: { ...base, chapters: 2, concepts: 9, workouts: 3, focusMinutes: 250, tasks: 11, nights: 4, sideQuests: 1, longestFocusMinutes: 52, realMs: 400 * 60_000 },
  two: { ...base, tasks: 2, workouts: 1, realMs: 20 * 60_000 },
  long: { ...base, chapters: 14, concepts: 128, workouts: 12, focusMinutes: 750, tasks: 312, nights: 7, longestFocusMinutes: 185, realMs: 9_999 * 60_000 },
};
const box = (text: ReceiptText) => {
  const width = measure(text.text, text.size, text.font, text.weight);
  const left = text.align === 'left' ? text.x : text.align === 'right' ? text.x - width : text.x - width / 2;
  return { left, right: left + width, top: text.y - text.size, bottom: text.y + text.size * 0.25 };
};

describe('spec 53: the receipt layout', () => {
  for (const [name, week] of Object.entries(weeks)) it(`${name} week: nothing clipped, nothing overlapping, all on the paper`, () => {
    for (const logo of [true, false]) {
      // The open-week subline (" · so far") is the longest one, so the layout is checked with it.
      const layout = receiptLayout(receiptContent(week, new Date('2026-11-05T12:00:00').getTime()), measure, logo);
      expect(layout.paperTop).toBeGreaterThanOrEqual(0);
      expect(layout.paperBottom + 40).toBeLessThanOrEqual(RECAP_HEIGHT);
      const boxes = layout.texts.map(box);
      for (const item of boxes) {
        expect(item.left).toBeGreaterThanOrEqual(RECEIPT_INK.left - 0.5);
        expect(item.right).toBeLessThanOrEqual(RECEIPT_INK.right + 0.5);
        expect(item.top).toBeGreaterThan(layout.paperTop);
        expect(item.bottom).toBeLessThan(layout.paperBottom);
      }
      boxes.forEach((a, i) => boxes.slice(i + 1).forEach(b => {
        const apart = a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
        expect(apart, `${layout.texts[i]!.text} / ${layout.texts[boxes.indexOf(b)]!.text}`).toBe(true);
      }));
      for (const leader of layout.leaders) expect(leader.to - leader.from).toBeGreaterThanOrEqual(16);
      if (logo) expect(layout.logo!.y + layout.logo!.size).toBeLessThan(Math.min(...boxes.map(item => item.top)));
      expect(RECAP_WIDTH).toBe(1080);
    }
  });
  it('the long week keeps its numbers whole: "Focus 12 h 30 m" and three-digit tasks', () => {
    const texts = receiptLayout(receiptContent(weeks.long!), measure, true).texts.map(text => text.text);
    expect(texts).toEqual(expect.arrayContaining(['12 h 30 m', '312', '128']));
  });
});
