import { describe, expect, it } from 'vitest';
import { autoBackupDue, autoBackupFileName, autoBackupFilesToPrune, nextFailureStreak } from './autoBackup';

describe('automatic backup decisions', () => {
  const at = (day: number, hour: number) => new Date(2026, 9, day, hour).getTime();

  it('starts after 04:00 once per planning day when writes are idle', () => {
    expect(autoBackupDue(at(17, 3), null, true, 0)).toBe(false);
    expect(autoBackupDue(at(17, 4), null, true, 0)).toBe(true);
    expect(autoBackupDue(at(17, 9), '2026-10-17', true, 0)).toBe(false);
    expect(autoBackupDue(at(18, 9), '2026-10-17', true, 1)).toBe(false);
    expect(autoBackupDue(at(18, 9), '2026-10-17', false, 0)).toBe(false);
    expect(autoBackupDue(at(18, 9), '2026-10-17', true, 0)).toBe(true);
  });

  it('prunes only old auto files and keeps the newest seven dates', () => {
    const names = Array.from({ length: 9 }, (_, i) => autoBackupFileName(`2026-10-${String(i + 1).padStart(2, '0')}`));
    expect(autoBackupFilesToPrune([...names].reverse().concat(['nandi-backup-2026-10-01.json', 'nandi-auto-wrong.json']))).toEqual(names.slice(0, 2).reverse());
  });

  it('counts one failure per calendar day and resets after a gap', () => {
    expect(nextFailureStreak(null, 0, '2026-10-17')).toBe(1);
    expect(nextFailureStreak('2026-10-17', 1, '2026-10-17')).toBe(1);
    expect(nextFailureStreak('2026-10-17', 1, '2026-10-18')).toBe(2);
    expect(nextFailureStreak('2026-10-17', 2, '2026-10-19')).toBe(1);
  });
});
