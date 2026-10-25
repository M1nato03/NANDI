import { describe, expect, it } from 'vitest';
import { checkKolam } from './kolam';
import { dateSeed, selectClockKolam } from './clock';

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
  });

  it('uses a supplied full-moon night for silver and keeps the checker valid', () => {
    const silver = selectClockKolam(at('2026-10-25T23:30:00'), new Set(['2026-10-25']));
    expect(silver.lineColor).toBe('silver');
    expect(checkKolam(silver.size, silver.kolam.points)).toMatchObject({ ok: true, loops: 1, emptyRegions: 0 });
    expect(selectClockKolam(at('2026-10-25T23:30:00')).lineColor).toBe('warm-white');
    expect(dateSeed('2026-10-25')).not.toBe(dateSeed('2026-10-26'));
  });

  it('keeps an existing line when the clock band changes', () => {
    const started = selectClockKolam(at('2026-10-25T20:30:00'));
    const resumed = selectClockKolam(at('2026-10-25T23:30:00'), new Set(['2026-10-25']), started);
    expect(resumed).toBe(started);
    expect(resumed.size).toBe(5);
    expect(selectClockKolam(at('2026-10-26T20:30:00'), new Set(), started).nightDate).toBe('2026-10-26');
  });
});
