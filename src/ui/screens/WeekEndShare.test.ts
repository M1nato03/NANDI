import { describe, expect, it } from 'vitest';
import { weekEndRecapAt } from './WeekEndShare';

const at = (text: string) => new Date(text).getTime();
describe('spec 53: when Home offers the week\'s receipt', () => {
  it('from Sunday 18:00 through Monday, and the small hours after Sunday', () => {
    expect(weekEndRecapAt(at('2026-11-08T17:59:00'))).toBeNull();
    expect(weekEndRecapAt(at('2026-11-08T18:05:00'))).toBe(at('2026-11-08T18:05:00') + 7 * 86_400_000);
    expect(weekEndRecapAt(at('2026-11-09T02:00:00'))).toBe(at('2026-11-09T02:00:00') + 7 * 86_400_000);
    expect(weekEndRecapAt(at('2026-11-09T23:59:00'))).toBe(at('2026-11-09T23:59:00'));
    expect(weekEndRecapAt(at('2026-11-10T04:00:00'))).toBeNull();
    expect(weekEndRecapAt(at('2026-11-11T12:00:00'))).toBeNull();
  });
});
