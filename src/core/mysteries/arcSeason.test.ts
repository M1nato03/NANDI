import { describe, expect, it } from 'vitest';
import { RULES } from '../rules.config';
import { seasonFor as economySeason } from '../economy/deriveEconomy';
import { seasonFor } from './arc';

// The story's own season reading before batch 5, kept here as the reference it must still match.
function oldSeasonFor(day: string) {
  const firstMonday = (year: number, month: number) => { const first = new Date(Date.UTC(year, month, 1, 12)); first.setUTCDate(1 + (8 - first.getUTCDay()) % 7); return first; };
  const date = new Date(`${day}T12:00:00Z`);
  let year = date.getUTCFullYear(), month = date.getUTCMonth();
  let start = firstMonday(year, month);
  if (date < start) { month--; if (month < 0) { year--; month = 11; } start = firstMonday(year, month); }
  const index = Math.max(0, (year - 2026) * 12 + month - 10 + 1);
  const chapter = Math.min(RULES.mind.arcChapters - 1, Math.floor((date.getTime() - start.getTime()) / 604_800_000));
  return { index, start: start.toISOString().slice(0, 10), chapter, panel: (date.getUTCDay() + 6) % 7, arcIndex: index % RULES.mind.arcCount };
}

describe('one season numbering (batch 5, item 51)', () => {
  it('the story season reads the economy season and shows the same panels as before, across every boundary', () => {
    for (let t = Date.parse('2026-09-01T12:00:00Z'); t <= Date.parse('2028-03-31T12:00:00Z'); t += 86_400_000) {
      const day = new Date(t).toISOString().slice(0, 10);
      expect(seasonFor(day)).toEqual(oldSeasonFor(day));
      expect(seasonFor(day).start).toBe(economySeason(day).start);
      expect(seasonFor(day).index).toBe(Math.max(0, economySeason(day).index + 1));
    }
  });
});
