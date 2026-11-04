import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Spec 53 + spec 46: the receipt is built only from things done in NANDI; nothing on it, in its share text or in its
// sheet reads the phone-minutes record.
describe('spec 53: the receipt never reads phone usage', () => {
  it('no receipt file names the phone-usage record', () => {
    for (const file of ['src/core/recap.ts', 'src/ui/screens/recapCard.ts', 'src/ui/screens/RecapShare.tsx', 'src/ui/screens/WeekEndShare.tsx', 'src/ui/screens/WeeklyRecap.tsx', 'src/core/puzzles/share.ts']) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/phoneUsage|PhoneUsage|phone-usage|phoneMinutes/);
    }
  });
});
