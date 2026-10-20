import { describe, expect, it } from 'vitest';
import { shouldNudgeBackup } from './backupNudge';

const now = Date.parse('2026-10-28T12:00:00');
describe('weekly backup copy', () => {
  it('waits for a first week of use, then asks once a week until a fresh copy exists', () => {
    expect(shouldNudgeBackup('2026-10-28', undefined, undefined, undefined, now)).toBe(false);
    expect(shouldNudgeBackup('2026-10-28', '2026-10-23', undefined, undefined, now)).toBe(false);
    expect(shouldNudgeBackup('2026-10-28', '2026-10-21', undefined, undefined, now)).toBe(true);
    expect(shouldNudgeBackup('2026-10-28', '2026-10-21', now - 2 * 86_400_000, undefined, now)).toBe(false);
    expect(shouldNudgeBackup('2026-10-28', '2026-10-21', now - 8 * 86_400_000, undefined, now)).toBe(true);
    expect(shouldNudgeBackup('2026-10-28', '2026-10-21', undefined, '2026-10-26', now)).toBe(false);
    expect(shouldNudgeBackup('2026-11-02', '2026-10-21', undefined, '2026-10-26', now + 5 * 86_400_000)).toBe(true);
  });
});
