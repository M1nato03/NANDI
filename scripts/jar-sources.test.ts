import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JAR } from '../src/core/yatra/jar';

// Spec 54 + spec 46: the jar is built only from things done in NANDI, and its words never mention scrolling or reels.
describe('spec 46 stays absolute in the jar', () => {
  it('no jar file names the phone-usage record', () => {
    for (const file of ['src/core/yatra/jar.ts', 'src/core/yatra/trek.ts', 'src/ui/yatra/JarPlan.tsx', 'src/core/pauseReasons.ts']) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/phoneUsage|PhoneUsage|phone-usage|phoneMinutes/);
    }
  });
  it('the finish line never says scroll or reels', () => {
    expect(JSON.stringify(JAR)).not.toMatch(/scroll|reel/i);
    expect(readFileSync('src/core/yatra/jar.ts', 'utf8')).not.toMatch(/'[^']*(scroll|reel)[^']*'/i);
  });
});
