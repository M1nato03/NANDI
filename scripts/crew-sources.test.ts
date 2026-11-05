import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Spec 55 + spec 46: crew links and screens carry jar minutes only; nothing reads the phone-minutes record.
describe('spec 55: the crew never reads phone usage', () => {
  it('no crew file names the phone-usage record', () => {
    for (const file of ['src/core/crew/links.ts', 'src/core/crew/crew.ts', 'src/data/repos/crew.ts', 'src/ui/yatra/Crew.tsx', 'src/platform/links.ts']) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/phoneUsage|PhoneUsage|phone-usage|phoneMinutes/);
    }
  });
});
