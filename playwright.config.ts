import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
/** Spec 52 gate 5: the timed landings (two-to-start.spec.ts), run alone in their own projects below. */
const TIMING = /lands in the thing in 2 s or less/;
/**
 * Playwright applies --repeat-each only to the projects nothing depends on; a project another one depends on runs its
 * own repeatEach (1 by default). The local gate sets PW_REPEAT_EACH=2 so every project repeats as before; CI sets
 * nothing and runs each test once, as it always has.
 */
const REPEAT = Number(process.env.PW_REPEAT_EACH ?? 1);

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: `http://localhost:${port}`,
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL as 'msedge' | undefined,
    // Spec 29: every board starts with its how-to the first time. Specs about other things start with them seen (the
    // e2e build reads this flag); tests/e2e/kapi-shelf.spec.ts clears it to test the real first open.
    storageState: { cookies: [], origins: [{ origin: `http://localhost:${port}`, localStorage: [{ name: 'nandi.e2e.tutorialsSeen', value: '1' }] }] },
    // CI only (Jenil 13 Nov, via b2): a failed test leaves its screenshot and trace in test-results/, which ci.yml uploads.
    // The local gate leaves this unset, so its runs stay as they are.
    ...(process.env.PW_FAILURE_ARTIFACTS === '1' ? { screenshot: 'only-on-failure' as const, trace: 'retain-on-failure' as const } : {}),
  },
  projects: [
    {
      name: 'mobile-390x844',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
      grepInvert: TIMING,
      repeatEach: REPEAT,
    },
    {
      name: 'mobile-360x800',
      use: { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true },
      grepInvert: TIMING,
      repeatEach: REPEAT,
    },
    // b2 13 Nov (spec 52 gate 5): the 2 s landing timings run alone, after every other test has finished (the same
    // `playwright test` in the gate and in CI), and one size after the other, so no other browser shares the CPU.
    {
      name: 'timing-390x844',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
      grep: TIMING,
      // One worker for the project, so the gate's two repeats run one after the other too.
      workers: 1,
      repeatEach: REPEAT,
      dependencies: ['mobile-390x844', 'mobile-360x800'],
    },
    {
      name: 'timing-360x800',
      use: { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true },
      grep: TIMING,
      workers: 1,
      dependencies: ['timing-390x844'],
    },
  ],
  webServer: {
    // Separate e2e build: only it compiles in the ?e2e test hook (VITE_E2E), never the deployed dist/.
    command: `npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${port} --strictPort`,
    env: { VITE_E2E: '1' },
    url: `http://localhost:${port}`,
    reuseExistingServer: false, // never test another worktree's server on the same port
  },
});
