import { describe, expect, it } from 'vitest';
import { recapCardContent, type WeeklyRecapData } from './recap';

const base: WeeklyRecapData = { from: '2026-10-12', to: '2026-10-19', tasks: 0, focusHours: 0, longestFocusMinutes: 0, workouts: 0, sideQuests: 0, concepts: 0, nights: 0 };

describe('weekly recap card content', () => {
  it('skips zeros and keeps at most four aggregate lines', () => {
    const content = recapCardContent({ ...base, tasks: 6, workouts: 3, concepts: 9, nights: 4, sideQuests: 2, focusHours: 1.5 });
    expect(content.lines).toEqual(['6 tasks finished', '3 workouts', '9 ideas learned', '4 nights back on plan']);
    expect(content.dates).toBe('12–18 Oct');
  });

  it('chooses a focus highlight, then a count-safe learning highlight', () => {
    expect(recapCardContent({ ...base, concepts: 1, longestFocusMinutes: 50 }).highlight).toBe('Longest focus: 50 min');
    expect(recapCardContent({ ...base, concepts: 1 }).highlight).toBe('Ideas made room to grow');
    expect(recapCardContent({ ...base, workouts: 1 }).highlight).toBe('Movement made its way in');
  });

  it('includes both month names when the week crosses a month', () => {
    expect(recapCardContent({ ...base, from: '2026-10-26', to: '2026-11-02' }).dates).toBe('26 Oct–1 Nov');
  });
});
