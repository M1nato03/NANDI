import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

/** Builds the "version B" app once per Playwright run for the upgrade tests. */
export default function globalSetup(): void {
  execFileSync(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'build', '--outDir', 'dist-e2e-b'], {
    env: { ...process.env, VITE_E2E: '1', NANDI_VERSION: '0.1.0-b' },
    stdio: 'inherit',
  });
}
