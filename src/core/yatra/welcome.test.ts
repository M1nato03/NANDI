import { describe, expect, it } from 'vitest';
import { dayBand, greeting, NIGHT_LINE, QUIET_LINES, quietLine } from './welcome';

describe('spec 37 welcome', () => {
  it('greets by the four time bands', () => {
    expect([4, 5, 11, 12, 16, 17, 20, 21, 0].map(dayBand)).toEqual(['night', 'morning', 'morning', 'afternoon', 'afternoon', 'evening', 'evening', 'night', 'night']);
    expect(greeting(8)).toBe('Good morning.');
    expect(greeting(14)).toBe('Good afternoon.');
    expect(greeting(19, 'Jenil')).toBe('Good evening, Jenil.');
    expect(greeting(23, '  ')).toBe('Good night.');
  });

  it('keeps one quiet line all day, and a new one comes on another day', () => {
    const line = quietLine('2026-10-28', 8);
    expect(QUIET_LINES).toContain(line);
    expect([9, 13, 18, 20].map(hour => quietLine('2026-10-28', hour))).toEqual([line, line, line, line]);
    // Every next day changes, across a month's end too.
    const days = ['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03'];
    const lines = days.map(key => quietLine(key, 10));
    expect(lines.every((today, i) => i === 0 || today !== lines[i - 1])).toBe(true);
    expect(new Set(lines).size).toBe(QUIET_LINES.length);
  });

  it('at night the line is the fire', () => {
    expect(quietLine('2026-10-28', 22)).toBe(NIGHT_LINE);
    expect(quietLine('2026-10-28', 2)).toBe(NIGHT_LINE);
  });
});
