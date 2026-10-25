import { describe, expect, it } from 'vitest';
import { checkKolam } from './kolam';
import { dateSeed, layoutHash, NO_REPEAT_NIGHTS, selectClockKolam } from './clock';
import { fullMoonAt, isFullMoonNight } from './moon';

const at = (stamp: string) => new Date(stamp);

describe('clock kolam', () => {
  it('uses local clock bands and keeps the same night after midnight', () => {
    expect(selectClockKolam(at('2026-10-25T20:59:00')).size).toBe(5);
    expect(selectClockKolam(at('2026-10-25T21:00:00')).size).toBe(4);
    expect(selectClockKolam(at('2026-10-25T22:59:00')).size).toBe(4);
    expect(selectClockKolam(at('2026-10-25T23:00:00')).size).toBe(3);
    const late = selectClockKolam(at('2026-10-26T00:30:00'));
    expect(late.nightDate).toBe('2026-10-25');
    expect(late.size).toBe(3);
    expect(late.seed).toBe(selectClockKolam(at('2026-10-25T23:30:00')).seed);
    expect(selectClockKolam(at('2026-10-26T04:00:00')).nightDate).toBe('2026-10-26');
  });

  it('adds one size during Margazhi, with a cap of 5', () => {
    expect(selectClockKolam(at('2026-12-15T23:30:00')).size).toBe(3);
    expect(selectClockKolam(at('2026-12-16T23:30:00')).size).toBe(4);
    expect(selectClockKolam(at('2027-01-14T21:30:00')).size).toBe(5);
    expect(selectClockKolam(at('2027-01-15T21:30:00')).size).toBe(4);
    expect(selectClockKolam(at('2027-01-14T20:30:00')).size).toBe(5);
    expect(selectClockKolam(at('2027-01-14T20:30:00')).grew).toBe(false);
    expect(selectClockKolam(at('2026-12-16T23:30:00')).grew).toBe(true);
  });

  it('uses a supplied full-moon night for silver and keeps the checker valid', () => {
    const silver = selectClockKolam(at('2026-10-25T23:30:00'), { fullMoon: night => night === '2026-10-25' });
    expect(silver.lineColor).toBe('silver');
    expect(checkKolam(silver.size, silver.kolam.points)).toMatchObject({ ok: true, loops: 1, emptyRegions: 0 });
    expect(selectClockKolam(at('2026-10-25T23:30:00')).lineColor).toBe('warm-white');
    expect(dateSeed('2026-10-25')).not.toBe(dateSeed('2026-10-26'));
  });

  it('keeps an existing line when the clock band changes', () => {
    const started = selectClockKolam(at('2026-10-25T20:30:00'));
    const resumed = selectClockKolam(at('2026-10-25T23:30:00'), { fullMoon: night => night === '2026-10-25' }, started);
    expect(resumed).toBe(started);
    expect(resumed.size).toBe(5);
    expect(selectClockKolam(at('2026-10-26T20:30:00'), {}, started).nightDate).toBe('2026-10-26');
  });

  it('spec 26 3x3 variety: across 366 nights no layout repeats within 30 nights unless every candidate is used up', () => {
    const seen: string[] = [];
    let repeats = 0;
    const start = new Date('2026-10-26T23:30:00');
    for (let night = 0; night < 366; night++) {
      const at = new Date(start); at.setDate(start.getDate() + night);
      const kolam = selectClockKolam(at, { recent: seen.slice(-NO_REPEAT_NIGHTS) });
      expect(kolam.size).toBeLessThanOrEqual(4);
      if (kolam.size !== 3) { seen.push(layoutHash(kolam.kolam)); continue; }
      if (seen.slice(-NO_REPEAT_NIGHTS).includes(layoutHash(kolam.kolam))) repeats++;
      seen.push(layoutHash(kolam.kolam));
    }
    expect(repeats).toBe(0);
  });
});

describe('full-moon nights (Meeus)', () => {
  it('finds known full moons within an hour', () => {
    // 2024-04-23 23:49 UTC, 2024-09-18 02:34 UTC, 2025-01-13 22:27 UTC.
    for (const known of ['2024-04-23T23:49:00Z', '2024-09-18T02:34:00Z', '2025-01-13T22:27:00Z']) {
      const t = Date.parse(known);
      const k = Math.round((t / 86_400_000 + 2440587.5 - 2451550.09766) / 29.530588861 - 0.5);
      expect(Math.abs(fullMoonAt(k) - t), known).toBeLessThan(3_600_000);
    }
  });
  it('gives exactly one silver night per lunation over a year', () => {
    const silver: string[] = [];
    const day = new Date('2026-01-01T12:00:00');
    for (let i = 0; i < 365; i++) { const d = new Date(day); d.setDate(day.getDate() + i); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; if (isFullMoonNight(key)) silver.push(key); }
    expect(silver.length).toBeGreaterThanOrEqual(12);
    expect(silver.length).toBeLessThanOrEqual(13);
    for (let i = 1; i < silver.length; i++) expect((Date.parse(silver[i]!) - Date.parse(silver[i - 1]!)) / 86_400_000).toBeGreaterThanOrEqual(28);
  });
});

